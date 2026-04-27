const mongoose = require('mongoose');

const intercambioSchema = new mongoose.Schema({
  solicitante:     { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  receptor:        { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  articuloOfrecido:{ type: mongoose.Schema.Types.ObjectId, ref: 'Articulo', required: true },
  articuloDeseado: { type: mongoose.Schema.Types.ObjectId, ref: 'Articulo', required: true },
  estado: {
    type: String,
    enum: ['pendiente', 'aceptado', 'rechazado', 'completado', 'cancelado'],
    default: 'pendiente'
  },
  mensaje: { type: String, trim: true },
  fechaRespuesta: { type: Date }
}, { timestamps: true });
intercambioSchema.index({ estado: 1 });

module.exports = mongoose.model('Intercambio', intercambioSchema);
