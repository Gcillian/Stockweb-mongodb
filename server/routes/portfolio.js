const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Portfolio = require('../models/Portfolio');
const Stock = require('../models/Stock');

router.get('/portfolio', auth, async (req, res) => {
  try {
    const list = await Portfolio.find({ userId: req.user.id }).lean();
    
    // Attach stock prices
    const enriched = await Promise.all(list.map(async (p) => {
      const s = await Stock.findOne({ stockCode: p.stockCode }).lean();
      return { ...p, price: s ? s.price : 0 };
    }));
    
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching portfolio' });
  }
});

module.exports = router;
