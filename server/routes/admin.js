const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Get all users (admin only)
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get all transactions (admin only)
router.get('/transactions', auth, adminOnly, async (req, res) => {
  try {
    const tx = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    res.json(tx);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

// Update user (admin only) — dapat update balance, name, email, role
router.put('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const { balance, name, email, role } = req.body;
    const update = {};
    if (balance !== undefined) update.balance = balance;
    if (name)  update.name  = name;
    if (email) update.email = email;
    if (role)  update.role  = role;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error updating user' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Transaction.deleteMany({ userId: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Get dashboard stats (admin only)
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const Stock = require('../models/Stock');
    const Portfolio = require('../models/Portfolio');

    const totalUsers = await User.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    const buyTransactions  = await Transaction.countDocuments({ type: 'buy' });
    const sellTransactions = await Transaction.countDocuments({ type: 'sell' });

    // Total volume dari semua transaksi
    const volAgg = await Transaction.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const totalVolume = volAgg[0]?.total || 0;

    // Revenue platform = 0.15% dari buy side
    const revAgg = await Transaction.aggregate([
      { $match: { type: 'buy' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const platformRevenue = Math.floor((revAgg[0]?.total || 0) * 0.0015);

    // Total saham yang di-list
    const totalStocks = await Stock.countDocuments();

    // Total portfolio holdings aktif
    const activePortfolios = await Portfolio.countDocuments({ quantity: { $gt: 0 } });

    // Top 5 gainers & losers berdasarkan % change (price vs previousPrice)
    const allStocks = await Stock.find({}).lean();
    const withChange = allStocks
      .filter(s => s.previousPrice > 0)
      .map(s => ({
        stockCode: s.stockCode,
        companyName: s.companyName,
        price: s.price,
        previousPrice: s.previousPrice,
        change: parseFloat((((s.price - s.previousPrice) / s.previousPrice) * 100).toFixed(2))
      }));

    const sorted = [...withChange].sort((a, b) => b.change - a.change);
    const gainers = sorted.slice(0, 5).filter(s => s.change >= 0);
    const losers  = sorted.slice(-5).reverse().filter(s => s.change < 0);

    res.json({
      totalUsers,
      totalTransactions,
      buyTransactions,
      sellTransactions,
      totalVolume,
      platformRevenue,
      totalStocks,
      activePortfolios,
      gainers,
      losers
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

module.exports = router;
