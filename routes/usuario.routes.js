const express        = require('express');
const router         = express.Router();
const Usuario        = require('../models/Usuario');
const verificarToken = require('../middleware/auth.middleware');

// GET /api/usuarios
router.get('/', verificarToken, async (req, res) => {
  try {
    const usuarios = await Usuario.find({ activo: true }).select('-password');
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener usuarios.', error: error.message });
  }
});

// GET /api/usuarios/:id
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-password');
    if (!usuario || !usuario.activo) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener usuario.', error: error.message });
  }
});

// PUT /api/usuarios/:id
router.put('/:id', verificarToken, async (req, res) => {
  try {
    if (req.usuario.id !== req.params.id) {
      return res.status(403).json({ mensaje: 'No tienes permiso para editar este usuario.' });
    }

    const { nombre, telefono, direccion, foto, imagenes } = req.body;
    const fotoFinal = foto || imagenes || undefined;

    const updateData = { nombre, telefono, direccion };
    if (fotoFinal !== undefined && fotoFinal !== '') updateData.foto = fotoFinal;

    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    res.json({ mensaje: 'Usuario actualizado.', usuario });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar usuario.', error: error.message });
  }
});

// DELETE /api/usuarios/:id
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    if (req.usuario.id !== req.params.id) {
      return res.status(403).json({ mensaje: 'No tienes permiso para eliminar este usuario.' });
    }
    await Usuario.findByIdAndUpdate(req.params.id, { activo: false });
    res.json({ mensaje: 'Usuario eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar usuario.', error: error.message });
  }
});

module.exports = router;
