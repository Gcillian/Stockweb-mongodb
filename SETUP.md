# NusaTrade Setup Guide

## 1️⃣ Install MongoDB

Download dari: https://www.mongodb.com/try/download/community

Atau gunakan MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

## 2️⃣ Start MongoDB (jika local)

```bash
mongod
```

Atau jika sudah di-install sebagai service, MongoDB akan otomatis berjalan.

## 3️⃣ Install Node.js Dependencies

```bash
cd C:\Users\Awir\Documents\KULIAH\TA-BigData\StockWeb
npm install
```

## 4️⃣ Copy .env

`.env` sudah ada, tapi pastikan pengaturan benar:

```
MONGO_URI=mongodb://127.0.0.1:27017/nusatrade
JWT_SECRET=nusatrade_secret_2024_change_this
PORT=4000
```

## 5️⃣ Jalankan Server

```bash
npm run dev
```

Output yang benar:
```
✓ MongoDB connected
╔════════════════════════════════╗
║  NusaTrade Server Running      ║
║  http://localhost:4000         ║
║  Open: index.html              ║
╚════════════════════════════════╝
```

## 6️⃣ Akses di Browser

- **Homepage:** http://localhost:4000/index.html
- **User Dashboard:** http://localhost:4000/userdashboard.html
- **Admin Dashboard:** http://localhost:4000/admindashboard.html

## 7️⃣ Test Login

Klik tombol "Masuk" di halaman dan gunakan test account:

### User Account
- Email: `user@nusatrade.id`
- Password: `user123`

### Admin Account  
- Email: `admin@nusatrade.id`
- Password: `admin123`

> **Catatan:** Akun di atas belum ada di database. Daftar dulu melalui halaman index.html, atau buat manual di MongoDB.

## 📚 Seed Database (Optional)

Untuk membuat sample data, buat file `server/seed.js`:

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Stock = require('./models/Stock');

mongoose.connect('mongodb://127.0.0.1:27017/nusatrade');

async function seed() {
  // Create admin
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@nusatrade.id',
    password: await bcrypt.hash('admin123', 10),
    role: 'admin',
    balance: 100000000
  });

  // Create user
  const user = await User.create({
    name: 'User',
    email: 'user@nusatrade.id',
    password: await bcrypt.hash('user123', 10),
    role: 'user',
    balance: 10000000
  });

  // Create stocks
  const stocks = [
    { stockCode: 'BBCA', companyName: 'Bank Central Asia', price: 10250, volume: 1000000 },
    { stockCode: 'BBRI', companyName: 'Bank Rakyat Indonesia', price: 4850, volume: 2000000 },
    { stockCode: 'BMRI', companyName: 'Bank Mandiri', price: 7025, volume: 1500000 },
    { stockCode: 'ASII', companyName: 'Astra International', price: 5150, volume: 500000 },
    { stockCode: 'TLKM', companyName: 'Telkom Indonesia', price: 3240, volume: 3000000 },
    { stockCode: 'GOTO', companyName: 'GoTo Gojek Tokopedia', price: 5300, volume: 800000 }
  ];

  await Stock.insertMany(stocks);

  console.log('✓ Database seeded!');
  process.exit(0);
}

seed();
```

Jalankan:
```bash
node server/seed.js
```

## ❌ Troubleshooting

### Error: connect ECONNREFUSED
MongoDB tidak berjalan. Pastikan MongoDB service aktif.

### Error: Module not found
Jalankan `npm install` lagi.

### Port 4000 sudah digunakan
Ubah PORT di `.env` atau tutup aplikasi lain yang pakai port 4000.

## 📖 Dokumentasi Lengkap

Lihat `README.md` untuk dokumentasi API dan struktur project.
