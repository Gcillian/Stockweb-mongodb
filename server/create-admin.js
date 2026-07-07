const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nusatrade';

async function createAdmin() {
  try {
    await mongoose.connect(MONGO);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: 'admin@nusatrade.id' });
    if (existing) {
      if (existing.role !== 'admin') {
        await User.updateOne({ email: 'admin@nusatrade.id' }, { role: 'admin' });
        console.log('✓ Updated existing user to admin role');
      } else {
        console.log('✓ Admin user already exists');
      }
    } else {
      await User.create({
        name: 'Admin NusaTrade',
        email: 'admin@nusatrade.id',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        balance: 100000000
      });
      console.log('✓ Admin user created');
    }

    console.log('\n  Email : admin@nusatrade.id');
    console.log('  Password: admin123\n');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

createAdmin();
