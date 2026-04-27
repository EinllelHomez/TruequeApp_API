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