const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');
const { auth, adminOnly } = require('../middleware/auth');

// Get all stocks
router.get('/stocks', async (req, res) => {
  try {
    const list = await Stock.find().limit(100).lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stocks' });
  }
});

// Create stock (admin only)
router.post('/stocks', auth, adminOnly, async (req, res) => {
  try {
    const { stockCode, companyName, price, volume } = req.body;
    const s = await Stock.create({ stockCode, companyName, price, volume });
    res.json(s);
  } catch (err) {
    res.status(500).json({ message: 'Error creating stock' });
  }
});

// Update stock (admin only)
router.put('/stocks/:id', auth, adminOnly, async (req, res) => {
  try {
    const s = await Stock.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(s);
  } catch (err) {
    res.status(500).json({ message: 'Error updating stock' });
  }
});

// Delete stock (admin only)
router.delete('/stocks/:id', auth, adminOnly, async (req, res) => {
  try {
    await Stock.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting stock' });
  }
});

module.exports = router;
