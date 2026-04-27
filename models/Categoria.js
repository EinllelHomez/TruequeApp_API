const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema({
  nombre:      { type: String, required: true, unique: true, trim: true, maxlength: 100 },
  descripcion: { type: String, trim: true, maxlength: 100 },
  activo:      { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Categoria', categoriaSchema);
