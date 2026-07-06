const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');
const { auth, adminOnly } = require('../middleware/auth');

// Get all stocks — sertakan % change
router.get('/stocks', async (req, res) => {
  try {
    const list = await Stock.find().limit(100).lean();
    const result = list.map(s => ({
      ...s,
      changePercent: s.previousPrice > 0
        ? parseFloat((((s.price - s.previousPrice) / s.previousPrice) * 100).toFixed(2))
        : 0
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stocks' });
  }
});

// Create stock (admin only)
router.post('/stocks', auth, adminOnly, async (req, res) => {
  try {
    const { stockCode, companyName, price, volume } = req.body;
    const s = await Stock.create({ stockCode, companyName, price, previousPrice: price, volume });
    res.json(s);
  } catch (err) {
    res.status(500).json({ message: 'Error creating stock' });
  }
});

// Update stock (admin only) — simpan previousPrice sebelum update harga
router.put('/stocks/:id', auth, adminOnly, async (req, res) => {
  try {
    const current = await Stock.findById(req.params.id).lean();
    const updateData = { ...req.body };
    // Jika harga berubah, simpan harga lama sebagai previousPrice
    if (req.body.price !== undefined && current && req.body.price !== current.price) {
      updateData.previousPrice = current.price;
    }
    const s = await Stock.findByIdAndUpdate(req.params.id, updateData, { new: true });
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
