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

// Update user balance (admin only)
router.put('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const { balance } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { balance },
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
    const totalUsers = await User.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    const buyTransactions = await Transaction.countDocuments({ type: 'buy' });
    const sellTransactions = await Transaction.countDocuments({ type: 'sell' });
    
    const totalVolume = await Transaction.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    
    res.json({
      totalUsers,
      totalTransactions,
      buyTransactions,
      sellTransactions,
      totalVolume: totalVolume[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

module.exports = router;
