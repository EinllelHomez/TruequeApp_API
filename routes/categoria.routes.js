const express = require('express');
const router = express.Router();
const Categoria = require('../models/Categoria');
const verificarToken = require('../middleware/auth.middleware');


router.get('/', async (req, res) => {
  try {
    const categorias = await Categoria.find({ activo: true });
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener categorías.', error: error.message });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);
    if (!categoria || !categoria.activo) {
      return res.status(404).json({ mensaje: 'Categoría no encontrada.' });
    }
    res.json(categoria);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener categoría.', error: error.message });
  }
});


router.post('/', verificarToken, async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const categoria = new Categoria({ nombre, descripcion });
    await categoria.save();
    res.status(201).json({ mensaje: 'Categoría creada.', categoria });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear categoría.', error: error.message });
  }
});


router.put('/:id', verificarToken, async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const categoria = await Categoria.findByIdAndUpdate(
      req.params.id,
      { nombre, descripcion },
      { new: true, runValidators: true }
    );
    if (!categoria) return res.status(404).json({ mensaje: 'Categoría no encontrada.' });
    res.json({ mensaje: 'Categoría actualizada.', categoria });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar categoría.', error: error.message });
  }
});


router.delete('/:id', verificarToken, async (req, res) => {
  try {
    await Categoria.findByIdAndUpdate(req.params.id, { activo: false });
    res.json({ mensaje: 'Categoría eliminada correctamente.' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar categoría.', error: error.message });
  }
});

module.exports = router;
