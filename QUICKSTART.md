# 🚀 NusaTrade - Quick Start Guide

Selamat datang di NusaTrade! Berikut panduan cepat untuk memulai.

## 📋 Prerequisites

Sebelum mulai, pastikan sudah install:
- **Node.js** v14+ (download: https://nodejs.org/)
- **MongoDB** (download: https://www.mongodb.com/try/download/community)

### ✅ Verify Installation

```bash
node --version
npm --version
mongod --version
```

---

## 🎯 3-Step Setup

### Step 1: Start MongoDB

**Windows (Jika sudah di-install sebagai service):**
- MongoDB akan otomatis berjalan

**Atau manual:**
```bash
mongod
```

Tunggu sampai muncul message seperti:
```
[initandlisten] waiting for connections on port 27017
```

### Step 2: Seed Database (Optional tapi Recommended)

Double-click file ini: **`seed.bat`**

Atau manual:
```bash
npm run seed
```

Output yang benar:
```
✓ Database Seeded!
Admin: admin@nusatrade.id / admin123
User: user@nusatrade.id / user123
```

### Step 3: Start Server

Double-click file ini: **`run.bat`**

Atau manual:
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

---

## 🌐 Access Aplikasi

Buka di browser:

| Halaman | URL |
|---------|-----|
| **Homepage** | http://localhost:4000/index.html |
| **User Dashboard** | http://localhost:4000/userdashboard.html |
| **Admin Dashboard** | http://localhost:4000/admindashboard.html |

---

## 🔑 Test Akun

### Admin
- **Email:** admin@nusatrade.id
- **Password:** admin123
- **Role:** Admin (bisa manage saham, lihat semua user & transaksi)
- **Balance:** Rp 100.000.000

### User Regular
- **Email:** user@nusatrade.id
- **Password:** user123
- **Role:** User (bisa beli/jual saham, lihat portfolio)
- **Balance:** Rp 10.000.000

### Atau Buat Akun Sendiri
Klik "Mulai Trading" atau "Masuk" di homepage, pilih register.

---

## 📝 Feature Tour

### 1. **Homepage (index.html)**
- Lihat daftar saham terbaru
- Info pasar & fitur aplikasi
- Login / Register

### 2. **User Dashboard (userdashboard.html)**
Fitur:
- ✓ Lihat saham-saham
- ✓ Beli & jual saham
- ✓ Portfolio (saham yang dimiliki)
- ✓ Riwayat transaksi
- ✓ Update balance

**Cara Beli:**
1. Scroll ke bagian "Trade Panel" 
2. Masukkan harga & jumlah lot (1 lot = 100 saham)
3. Klik "Konfirmasi Beli BBCA" (atau saham yg dipilih)

**Cara Jual:**
1. Klik tab "Jual" di Trade Panel
2. Masukkan harga & jumlah lot
3. Klik "Konfirmasi Jual"

### 3. **Admin Dashboard (admindashboard.html)**
Fitur:
- ✓ Lihat total user & transaksi
- ✓ Chart analisis
- ✓ Manage saham (CRUD)
- ✓ Lihat daftar user
- ✓ Monitor trading activity

---

## 📊 Sample Saham

Ini adalah saham yang sudah ada setelah seed:

| Kode | Nama Saham | Harga | Volume |
|------|-----------|-------|--------|
| **BBCA** | Bank Central Asia | Rp 10.250 | 1.000.000 |
| **BBRI** | Bank Rakyat Indonesia | Rp 4.850 | 2.000.000 |
| **BMRI** | Bank Mandiri | Rp 7.025 | 1.500.000 |
| **ASII** | Astra International | Rp 5.150 | 500.000 |
| **TLKM** | Telkom Indonesia | Rp 3.240 | 3.000.000 |
| **GOTO** | GoTo Gojek Tokopedia | Rp 5.300 | 800.000 |

---

## ⚙️ Configuration

File: `.env`

```
MONGO_URI=mongodb://127.0.0.1:27017/nusatrade
JWT_SECRET=nusatrade_secret_2024_change_this
PORT=4000
```

- **MONGO_URI:** Koneksi MongoDB (local atau cloud)
- **JWT_SECRET:** Untuk enkripsi token (ubah ke nilai random untuk production!)
- **PORT:** Port server (default: 4000)

---

## 🐛 Troubleshooting

### ❌ "MongoDB connection error"
**Solusi:**
1. Pastikan MongoDB sudah berjalan
2. Buka CMD/PowerShell
3. Jalankan: `mongod`
4. Tunggu sampai ready for connections

### ❌ "Port 4000 already in use"
**Solusi:**
1. Ubah PORT di `.env` ke port lain (cth: 5000)
2. Restart server

### ❌ "Cannot find module..."
**Solusi:**
```bash
npm install
```

### ❌ "Cannot GET /api/stocks"
**Solusi:**
1. Pastikan server sudah berjalan (npm run dev)
2. Tunggu "✓ MongoDB connected" message
3. Refresh halaman browser

---

## 📚 API Reference

Untuk lengkapnya, lihat file `README.md`.

### Auth
```
POST /api/register  → { name, email, password }
POST /api/login     → { email, password }
```

### Trading
```
POST /api/buy       → { stockCode, lots }
POST /api/sell      → { stockCode, lots }
GET  /api/history   → Riwayat transaksi
```

### Info
```
GET  /api/stocks    → Daftar semua saham
GET  /api/portfolio → Saham user
```

### Admin
```
GET  /api/users        → Daftar user
GET  /api/transactions → Daftar semua transaksi
```

---

## 🎓 Cara Kerja Trading

### Beli Saham
1. **Input:** stockCode="BBCA", lots=10 (1000 saham)
2. **Hitung:** Total = Price × Saham = 10.250 × 1000 = Rp 10.250.000
3. **Fee:** 0.15% × Rp 10.250.000 = Rp 15.375
4. **Dikurangi Balance:** Rp 10.250.000 + Rp 15.375
5. **Ditambah Portfolio:** BBCA 1000 saham

### Jual Saham
1. **Input:** stockCode="BBCA", lots=5 (500 saham)
2. **Check:** User punya BBCA ≥ 500? ✓
3. **Hitung:** Proceeds = 10.250 × 500 = Rp 5.125.000
4. **Ditambah Balance:** Rp 5.125.000
5. **Dikurangi Portfolio:** BBCA 500 saham

---

## 📂 Project Structure

```
StockWeb/
├── server/
│   ├── models/
│   │   ├── User.js
│   │   ├── Stock.js
│   │   ├── Transaction.js
│   │   └── Portfolio.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── stocks.js
│   │   ├── trading.js
│   │   ├── portfolio.js
│   │   └── admin.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   └── seed.js
├── client/
│   └── js/
│       ├── api.js
│       ├── auth.js
│       └── dashboard.js
├── index.html
├── userdashboard.html
├── admindashboard.html
├── .env
├── package.json
├── README.md
├── SETUP.md
└── QUICKSTART.md (file ini)
```

---

## 🚀 Tips & Tricks

### 1. **Rapid Testing**
Buat multiple user accounts untuk test buying/selling antar user.

### 2. **Change Admin Password**
Update di MongoDB:
```javascript
db.users.updateOne(
  { email: "admin@nusatrade.id" },
  { $set: { password: "hashed_new_password" } }
)
```

### 3. **Monitor Transaksi Real-time**
```bash
mongosh
use nusatrade
db.transactions.find().pretty()
```

### 4. **Reset Database**
```bash
npm run seed
```

---

## 💡 Next Steps

1. ✅ Setup selesai
2. 🔄 Test login dengan kedua akun
3. 📊 Coba beli & jual saham
4. 👨‍💼 Explore admin panel
5. 📖 Baca `README.md` untuk API detail
6. 🛠️ Customize sesuai kebutuhan

---

## ❓ Butuh Bantuan?

- **Error di console?** → Lihat terminal server
- **Backend tidak running?** → Cek MongoDB + npm run dev
- **Frontend error?** → Buka DevTools (F12) > Console tab
- **Database kosong?** → Jalankan `npm run seed`

---

**Selamat menggunakan NusaTrade! 🎉**

Last Updated: June 2, 2026
