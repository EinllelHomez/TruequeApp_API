const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  nombre:    { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Email inválido'] },
  password:  { type: String, required: true, minlength: 4 },
  telefono:  { type: String, trim: true },
  direccion: { type: String, trim: true },
  foto:      { type: String, default: '' },
  reputacion: {
    promedio: { type: Number, default: 0, min: 0, max: 5 },
    total:    { type: Number, default: 0, min: 0 }
  },
  activo: { type: Boolean, default: true }
}, { timestamps: true });

usuarioSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

usuarioSchema.methods.compararPassword = async function (passwordIngresado) {
  return await bcrypt.compare(passwordIngresado, this.password);
};

module.exports = mongoose.model('Usuario', usuarioSchema);
