const mongoose = require('mongoose');

const conversacionSchema = new mongoose.Schema({
  participantes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }],
  intercambio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intercambio',
    default: null  // Opcional: vincular el chat a un intercambio específico
  },
  ultimoMensaje: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mensaje',
    default: null
  },
  activa: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Índice para buscar conversaciones por participantes eficientemente
conversacionSchema.index({ participantes: 1 });

module.exports = mongoose.model('Conversacion', conversacionSchema);
