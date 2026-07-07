const mongoose = require('mongoose');

const DepositSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName:  { type: String },
  userEmail: { type: String },
  amount:    { type: Number, required: true },
  method:    { type: String, default: 'transfer' },
  status:    { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  note:      { type: String, default: '' },         // catatan dari admin
  approvedBy: { type: String, default: '' },        // nama admin yg approve/reject
  processedAt: { type: Date, default: null },       // waktu diproses
}, { timestamps: true });

module.exports = mongoose.model('Deposit', DepositSchema);
