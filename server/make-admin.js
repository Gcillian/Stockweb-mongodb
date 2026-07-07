/**
 * make-admin.js
 * Jadikan user tertentu sebagai admin TANPA menghapus data yang ada.
 * 
 * Cara pakai:
 *   node server/make-admin.js mamat@gmail.com
 * 
 * Jika tidak ada argumen, script akan menampilkan semua user dan
 * menawarkan pilihan.
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('./models/User');
require('dotenv').config();

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nusatrade';

async function run() {
  await mongoose.connect(MONGO);
  console.log('✓ Connected to MongoDB\n');

  const allUsers = await User.find({}, 'name email role balance').lean();
  if (allUsers.length === 0) {
    console.log('Tidak ada user di database. Jalankan seed.js terlebih dahulu.');
    process.exit(0);
  }

  console.log('=== Daftar User ===');
  allUsers.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.name} <${u.email}>  role: ${u.role}`);
  });
  console.log('');

  const targetEmail = process.argv[2];

  if (targetEmail) {
    // Mode argumen — langsung promote
    const user = await User.findOne({ email: targetEmail });
    if (!user) {
      console.error(`✗ User dengan email "${targetEmail}" tidak ditemukan.`);
      process.exit(1);
    }
    user.role = 'admin';
    await user.save();
    console.log(`✓ ${user.name} (${user.email}) sekarang adalah ADMIN.`);
    console.log('\nLogin dengan:');
    console.log(`  Email   : ${user.email}`);
    console.log(`  Password: (password lama Anda)`);
  } else {
    // Mode tanpa argumen — buat admin default jika belum ada
    const existingAdmin = allUsers.find(u => u.role === 'admin');
    if (existingAdmin) {
      console.log(`✓ Sudah ada admin: ${existingAdmin.name} <${existingAdmin.email}>`);
      console.log('\nGunakan akun ini untuk login ke admin dashboard.');
    } else {
      // Promote user pertama menjadi admin
      const first = await User.findById(allUsers[0]._id);
      first.role = 'admin';
      await first.save();
      console.log(`✓ Auto-promote: ${first.name} (${first.email}) dijadikan ADMIN.`);
      console.log('\nAtau jalankan dengan argumen email spesifik:');
      console.log(`  node server/make-admin.js <email>`);
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
