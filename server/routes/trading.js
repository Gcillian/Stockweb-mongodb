const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Stock = require('../models/Stock');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');

// BUY: POST /api/buy { stockCode, lots }
router.post('/buy', auth, async (req, res) => {
  try {
    const { stockCode, lots } = req.body;
    const user = await User.findById(req.user.id);
    const stock = await Stock.findOne({ stockCode });
    
    if (!stock) return res.status(400).json({ message: 'Stock not found' });
    
    const shares = (parseInt(lots, 10) || 0) * 100;
    const total = stock.price * shares;
    const fee = total * 0.0015;
    const totalCost = total + fee;
    
    if (user.balance < totalCost) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    
    user.balance -= totalCost;
    await user.save();
    
    // Update portfolio
    const p = await Portfolio.findOne({ userId: user._id, stockCode });
    if (p) {
      p.quantity += shares;
      await p.save();
    } else {
      await Portfolio.create({ userId: user._id, stockCode, quantity: shares });
    }
    
    // Record transaction
    await Transaction.create({
      userId: user._id,
      stockCode,
      type: 'buy',
      quantity: shares,
      total: totalCost
    });
    
    res.json({ ok: true, balance: user.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Buy error' });
  }
});

// SELL: POST /api/sell { stockCode, lots }
router.post('/sell', auth, async (req, res) => {
  try {
    const { stockCode, lots } = req.body;
    const user = await User.findById(req.user.id);
    const stock = await Stock.findOne({ stockCode });
    
    if (!stock) return res.status(400).json({ message: 'Stock not found' });
    
    const shares = (parseInt(lots, 10) || 0) * 100;
    const total = stock.price * shares;
    
    const p = await Portfolio.findOne({ userId: user._id, stockCode });
    if (!p || p.quantity < shares) {
      return res.status(400).json({ message: 'Not enough holdings' });
    }
    
    p.quantity -= shares;
    if (p.quantity <= 0) {
      await Portfolio.deleteOne({ _id: p._id });
    } else {
      await p.save();
    }
    
    user.balance += total;
    await user.save();
    
    await Transaction.create({
      userId: user._id,
      stockCode,
      type: 'sell',
      quantity: shares,
      total
    });
    
    res.json({ ok: true, balance: user.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sell error' });
  }
});

// Get transaction history
router.get('/history', auth, async (req, res) => {
  try {
    const tx = await Transaction.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json(tx);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching history' });
  }
});

module.exports = router;
