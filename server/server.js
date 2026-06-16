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

// MongoDB Connection
const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nusatrade';
mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => console.error('✗ MongoDB error:', err));

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════╗
║  NusaTrade Server Running      ║
║  http://localhost:${PORT}      ║
║  Open: index.html              ║
╚════════════════════════════════╝
  `);
});
