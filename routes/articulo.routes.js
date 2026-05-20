const express = require('express');
const router = express.Router();
const Articulo = require('../models/Articulo');
const verificarToken = require('../middleware/auth.middleware');

router.get('/', async (req, res) => {
  try {
    const { categoria, estado, limite=10 } = req.query;
    const filtro = { disponible: true };
    if (categoria) filtro.categoria = categoria;
    if (estado) filtro.estado = estado;

    const articulos = await Articulo.find(filtro)
      .populate('usuario', 'nombre email telefono')
      .populate('categoria', 'nombre');
    res.json(articulos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener artículos.', error: error.message });
  }
});

router.post('/', verificarToken, async (req, res) => {
  try {
    const { titulo, descripcion, estado, imagenes, categoria, intercambioDeseado } = req.body;
    const articulo = new Articulo({
      titulo,
      descripcion,
      estado,
      imagenes,
      categoria,
      intercambioDeseado,
      usuario: req.usuario.id
    });
    await articulo.save();
    res.status(201).json({ mensaje: 'Artículo creado exitosamente.', articulo });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear artículo.', error: error.message });
  }
});

//Post aqui

router.get('/:id', async (req, res) => {
  try {
    const articulo = await Articulo.findById(req.params.id)
      .populate('usuario', 'nombre email telefono')
      .populate('categoria', 'nombre');
    if (!articulo) return res.status(404).json({ mensaje: 'Artículo no encontrado.' });
    res.json(articulo);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener artículo.', error: error.message });
  }
});
// ACTUALIZAR artículo
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const articulo = await Articulo.findById(req.params.id);
    if (!articulo) return res.status(404).json({ mensaje: 'Artículo no encontrado.' });
    if (articulo.usuario.toString() !== req.usuario.id)
      return res.status(403).json({ mensaje: 'No autorizado.' });

    const actualizado = await Articulo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(actualizado);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al actualizar.', error: error.message });
  }
});

// ELIMINAR artículo
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const articulo = await Articulo.findById(req.params.id);
    if (!articulo) return res.status(404).json({ mensaje: 'Artículo no encontrado.' });
    if (articulo.usuario.toString() !== req.usuario.id)
      return res.status(403).json({ mensaje: 'No autorizado.' });

    await Articulo.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Artículo eliminado.' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar.', error: error.message });
  }
});
module.exports = router;