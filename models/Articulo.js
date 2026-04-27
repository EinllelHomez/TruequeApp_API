const mongoose = require('mongoose');
const ESTADOS = ['nuevo', 'bueno', 'regular', 'malo'];

const articuloSchema = new mongoose.Schema({
  titulo:      { type: String, required: true, trim: true, maxlength: 100 },
  descripcion: { type: String, required: true, maxlength: 100 }, 
  estado:      { type: String, enum:ESTADOS, default: 'bueno' },
  imagenes:    [{ type: String }],
  disponible:  { type: Boolean, default: true },
  usuario:     { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  categoria:   { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', required: true },
  intercambioDeseado: { type: String, trim: true } 
}, { timestamps: true });

module.exports = mongoose.model('Articulo', articuloSchema);