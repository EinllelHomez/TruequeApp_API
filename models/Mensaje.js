const mongoose = require('mongoose');

const mensajeSchema = new mongoose.Schema({
  conversacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversacion',
    required: true
  },
  remitente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  contenido: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  leido: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Mensaje', mensajeSchema);
