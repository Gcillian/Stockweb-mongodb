const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Stock = require('./models/Stock');
require('dotenv').config();

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nusatrade';

async function seed() {
  try {
    await mongoose.connect(MONGO);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Stock.deleteMany({});
    console.log('Cleared old data');

    // Create admin user
    const admin = await User.create({
      name: 'Admin NusaTrade',
      email: 'admin@nusatrade.id',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
      balance: 100000000
    });
    console.log('✓ Admin created:', admin.email);

    // Create regular user
    const user = await User.create({
      name: 'User Test',
      email: 'user@nusatrade.id',
      password: await bcrypt.hash('user123', 10),
      role: 'user',
      balance: 10000000
    });
    console.log('✓ User created:', user.email);

    // Create stocks
    const stocks = [
      { stockCode: 'BBCA', companyName: 'Bank Central Asia Tbk.', price: 10250, volume: 1000000 },
      { stockCode: 'BBRI', companyName: 'Bank Rakyat Indonesia Tbk.', price: 4850, volume: 2000000 },
      { stockCode: 'BMRI', companyName: 'Bank Mandiri (Persero) Tbk.', price: 7025, volume: 1500000 },
      { stockCode: 'ASII', companyName: 'Astra International Tbk.', price: 5150, volume: 500000 },
      { stockCode: 'TLKM', companyName: 'Telkom Indonesia Tbk.', price: 3240, volume: 3000000 },
      { stockCode: 'GOTO', companyName: 'GoTo Gojek Tokopedia Tbk.', price: 5300, volume: 800000 }
    ];

    const created = await Stock.insertMany(stocks);
    console.log('✓ ' + created.length + ' stocks created');

    console.log(`
╔════════════════════════════════╗
║  ✓ Database Seeded!            ║
╠════════════════════════════════╣
║ Admin: admin@nusatrade.id      ║
║ Pass: admin123                 ║
╠════════════════════════════════╣
║ User: user@nusatrade.id        ║
║ Pass: user123                  ║
╚════════════════════════════════╝
    `);

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
