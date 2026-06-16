const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const stockRoutes = require('./routes/stocks');
const tradingRoutes = require('./routes/trading');
const portfolioRoutes = require('./routes/portfolio');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection with retry
const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nusatrade';

const connectWithRetry = (attempt = 1) => {
  mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('✓ MongoDB connected'))
    .catch(err => {
      console.error(`✗ MongoDB error (attempt ${attempt}):`, err.message);
      const delay = Math.min(attempt * 5000, 30000);
      console.log(`  Retrying in ${delay / 1000}s...`);
      setTimeout(() => connectWithRetry(attempt + 1), delay);
    });
};

connectWithRetry();

// Routes
app.use('/api', authRoutes);
app.use('/api', stockRoutes);
app.use('/api', tradingRoutes);
app.use('/api', portfolioRoutes);
app.use('/api', adminRoutes);

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '..')));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════╗
║  NusaTrade Server Running      ║
║  http://localhost:${PORT}      ║
║  Open: index.html              ║
╚════════════════════════════════╝
  `);
});
