const mongoose = require('mongoose');

const StockSchema = new mongoose.Schema({
  stockCode:   { type: String, required: true, unique: true },
  companyName: { type: String },
  price:       { type: Number, required: true },
  previousPrice: { type: Number, default: 0 }, // untuk menghitung % change
  volume:      { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Stock', StockSchema);
