const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  rating:   { type: Number, required: true, min: 1, max: 5 },
  comment:  { type: String, trim: true, maxlength: 500 },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  toUser:   { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  tradeId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Intercambio', required: true }
}, { timestamps: true });

// Un usuario solo puede dejar UNA reseña por intercambio (pero ambos participantes pueden reseñar)
reviewSchema.index({ tradeId: 1, fromUser: 1 }, { unique: true });
reviewSchema.index({ toUser: 1 });

module.exports = mongoose.model('Review', reviewSchema);
