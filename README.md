# NusaTrade - Simple Fullstack Stock Trading App

Platform jual beli saham Indonesia modern dengan teknologi Node.js, Express, MongoDB, dan Vanilla JavaScript.

## Quick Start

### 1. Setup Environment
```bash
cp .env.example .env
```

Edit `.env` dan pastikan MongoDB URI benar:
```
MONGO_URI=mongodb://127.0.0.1:27017/nusatrade
JWT_SECRET=your_secret_key_here
PORT=4000
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Server
```bash
npm run dev
```

Server akan berjalan di `http://localhost:4000`

### 4. Access App
Buka di browser:
- Homepage: `http://localhost:4000/index.html`
- User Dashboard: `http://localhost:4000/userdashboard.html`
- Admin Dashboard: `http://localhost:4000/admindashboard.html`

## Default Test Account

Untuk testing, buat akun melalui halaman index.html atau langsung di MongoDB:

**Admin:**
- Email: `admin@nusatrade.id`
- Password: `admin123`
- Role: `admin`
- Balance: `100000000`

**User:**
- Email: `user@nusatrade.id`
- Password: `user123`
- Role: `user`
- Balance: `10000000`

## Features

### User Features
- Register & Login dengan JWT
- Lihat daftar saham
- Beli saham
- Jual saham
- Lihat portfolio
- Lihat riwayat transaksi
- User dashboard

### Admin Features
- Manage saham (CRUD)
- Lihat daftar user
- Lihat semua transaksi
- Admin dashboard

## API Routes

### Auth
- `POST /api/register` - Daftar user baru
- `POST /api/login` - Login

### Stocks
- `GET /api/stocks` - List semua saham
- `POST /api/stocks` - Buat saham (admin)
- `PUT /api/stocks/:id` - Update saham (admin)
- `DELETE /api/stocks/:id` - Hapus saham (admin)

### Trading
- `POST /api/buy` - Beli saham `{ stockCode, lots }`
- `POST /api/sell` - Jual saham `{ stockCode, lots }`
- `GET /api/history` - Riwayat transaksi user

### Portfolio
- `GET /api/portfolio` - Saham yang dimiliki user

### Admin
- `GET /api/users` - Daftar user (admin)
- `GET /api/transactions` - Daftar transaksi (admin)

## Database Models

### User
- name, email, password (hashed), role, balance

### Stock
- stockCode, companyName, price, volume

### Transaction
- userId, stockCode, type (buy/sell), quantity, total, createdAt

### Portfolio
- userId, stockCode, quantity

## Teknologi

- **Backend:** Node.js, Express.js
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT + bcryptjs
- **Frontend:** Vanilla JavaScript, Tailwind CSS
- **Security:** CORS, password hashing, token-based auth

## Folder Structure

```
.
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
│   └── server.js
├── client/
│   └── js/
│       ├── api.js
│       ├── auth.js
│       └── dashboard.js
├── index.html
├── userdashboard.html
├── admindashboard.html
├── package.json
├── .env
├── .env.example
└── README.md
```

## Notes

- Satu lot = 100 saham
- Fee pembelian: 0.15% dari total
- Fee penjualan: 0 (gratis untuk kesederhanaan)
- Default balance user baru: Rp 10.000.000
- JWT token berlaku 12 jam
