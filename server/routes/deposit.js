const express = require('express');
const router  = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const User    = require('../models/User');
const Deposit = require('../models/Deposit');

// ── USER: Ajukan deposit ─────────────────────────────────────────────────────
// POST /api/deposit
router.post('/deposit', auth, async (req, res) => {
  try {
    const { amount, method } = req.body;
    if (!amount || amount < 10000) {
      return res.status(400).json({ message: 'Jumlah minimum deposit Rp 10.000' });
    }

    const user = await User.findById(req.user.id).select('name email').lean();
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    const deposit = await Deposit.create({
      userId:    req.user.id,
      userName:  user.name,
      userEmail: user.email,
      amount,
      method:    method || 'transfer',
      status:    'pending',
    });

    res.json({ ok: true, deposit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal membuat permintaan deposit' });
  }
});

// ── USER: Riwayat deposit milik sendiri ──────────────────────────────────────
// GET /api/deposit/my
router.get('/deposit/my', auth, async (req, res) => {
  try {
    const deposits = await Deposit.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ message: 'Gagal memuat riwayat deposit' });
  }
});

// ── ADMIN: Semua deposit ─────────────────────────────────────────────────────
// GET /api/admin/deposits
router.get('/admin/deposits', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.query; // ?status=pending|approved|rejected
    const filter = status ? { status } : {};
    const deposits = await Deposit.find(filter)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ message: 'Gagal memuat data deposit' });
  }
});

// ── ADMIN: Approve deposit → tambah saldo ────────────────────────────────────
// POST /api/admin/deposits/:id/approve
router.post('/admin/deposits/:id/approve', auth, adminOnly, async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) return res.status(404).json({ message: 'Deposit tidak ditemukan' });
    if (deposit.status !== 'pending') {
      return res.status(400).json({ message: `Deposit sudah ${deposit.status}` });
    }

    // Tambah saldo user
    const user = await User.findById(deposit.userId);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    user.balance += deposit.amount;
    await user.save();

    // Update status deposit
    deposit.status      = 'approved';
    deposit.approvedBy  = req.user.name || 'Admin';
    deposit.processedAt = new Date();
    deposit.note        = req.body.note || '';
    await deposit.save();

    res.json({ ok: true, deposit, newBalance: user.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal approve deposit' });
  }
});

// ── ADMIN: Reject deposit ────────────────────────────────────────────────────
// POST /api/admin/deposits/:id/reject
router.post('/admin/deposits/:id/reject', auth, adminOnly, async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) return res.status(404).json({ message: 'Deposit tidak ditemukan' });
    if (deposit.status !== 'pending') {
      return res.status(400).json({ message: `Deposit sudah ${deposit.status}` });
    }

    deposit.status      = 'rejected';
    deposit.approvedBy  = req.user.name || 'Admin';
    deposit.processedAt = new Date();
    deposit.note        = req.body.note || 'Ditolak oleh admin';
    await deposit.save();

    res.json({ ok: true, deposit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal reject deposit' });
  }
});

// ── ADMIN: Stats deposit (pending count + total pending amount) ───────────────
// GET /api/admin/deposits/stats
router.get('/admin/deposits/stats', auth, adminOnly, async (req, res) => {
  try {
    const pendingCount = await Deposit.countDocuments({ status: 'pending' });
    const pendingAgg   = await Deposit.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const approvedAgg  = await Deposit.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    res.json({
      pendingCount,
      pendingTotal:  pendingAgg[0]?.total  || 0,
      approvedTotal: approvedAgg[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memuat stats deposit' });
  }
});

module.exports = router;
