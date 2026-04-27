const mongoose = require('mongoose');

const articuloSchema = new mongoose.Schema({
  titulo:      { type: String, required: true, trim: true },
  descripcion: { type: String, required: true },
  estado:      { type: String, enum: ['nuevo', 'bueno', 'regular', 'malo'], default: 'bueno' },
  imagenes:    [{ type: String }],
  disponible:  { type: Boolean, default: true },
  usuario:     { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  categoria:   { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', required: true },
  intercambioDeseado: { type: String, trim: true } // Qué quiere a cambio
}, { timestamps: true });

module.exports = mongoose.model('Articulo', articuloSchema);