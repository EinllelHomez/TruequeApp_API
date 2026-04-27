const express = require('express');
const router = express.Router();
const Intercambio = require('../models/Intercambio');
const Articulo = require('../models/Articulo');
const verificarToken = require('../middleware/auth.middleware');


router.get('/', verificarToken, async (req, res) => {
  try {
    const intercambios = await Intercambio.find({
      $or: [{ solicitante: req.usuario.id }, { receptor: req.usuario.id }]
    })
      .populate('solicitante', 'nombre email')
      .populate('receptor', 'nombre email')
      .populate('articuloOfrecido', 'titulo imagenes')
      .populate('articuloDeseado', 'titulo imagenes');
    res.json(intercambios);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener intercambios.', error: error.message });
  }
});


router.get('/:id', verificarToken, async (req, res) => {
  try {
    const intercambio = await Intercambio.findById(req.params.id)
      .populate('solicitante', 'nombre email telefono')
      .populate('receptor', 'nombre email telefono')
      .populate('articuloOfrecido')
      .populate('articuloDeseado');
    if (!intercambio) return res.status(404).json({ mensaje: 'Intercambio no encontrado.' });
    res.json(intercambio);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener intercambio.', error: error.message });
  }
});


router.post('/', verificarToken, async (req, res) => {
  try {
    const { articuloOfrecido, articuloDeseado, mensaje } = req.body;

 
    const artDeseado = await Articulo.findById(articuloDeseado);
    if (!artDeseado || !artDeseado.disponible) {
      return res.status(400).json({ mensaje: 'El artículo deseado no está disponible.' });
    }

  
    const artOfrecido = await Articulo.findById(articuloOfrecido);
    if (!artOfrecido || artOfrecido.usuario.toString() !== req.usuario.id) {
      return res.status(400).json({ mensaje: 'El artículo ofrecido no te pertenece.' });
    }

    const intercambio = new Intercambio({
      solicitante: req.usuario.id,
      receptor: artDeseado.usuario,
      articuloOfrecido,
      articuloDeseado,
      mensaje
    });

    await intercambio.save();
    res.status(201).json({ mensaje: 'Propuesta de intercambio enviada.', intercambio });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear intercambio.', error: error.message });
  }
});


router.put('/:id', verificarToken, async (req, res) => {
  try {
    const intercambio = await Intercambio.findById(req.params.id);
    if (!intercambio) return res.status(404).json({ mensaje: 'Intercambio no encontrado.' });

    if (intercambio.receptor.toString() !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'Solo el receptor puede responder esta propuesta.' });
    }

    const { estado } = req.body; 
    const estadosValidos = ['aceptado', 'rechazado', 'completado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ mensaje: 'Estado inválido.' });
    }

    intercambio.estado = estado;
    intercambio.fechaRespuesta = new Date();
    await intercambio.save();

    
    if (estado === 'completado') {
      await Articulo.findByIdAndUpdate(intercambio.articuloOfrecido, { disponible: false });
      await Articulo.findByIdAndUpdate(intercambio.articuloDeseado, { disponible: false });
    }

    res.json({ mensaje: `Intercambio ${estado}.`, intercambio });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar intercambio.', error: error.message });
  }
});


router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const intercambio = await Intercambio.findById(req.params.id);
    if (!intercambio) return res.status(404).json({ mensaje: 'Intercambio no encontrado.' });

    if (intercambio.solicitante.toString() !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'Solo el solicitante puede cancelar esta propuesta.' });
    }

    if (intercambio.estado !== 'pendiente') {
      return res.status(400).json({ mensaje: 'Solo se pueden cancelar propuestas pendientes.' });
    }

    await Intercambio.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Propuesta de intercambio cancelada.' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al cancelar intercambio.', error: error.message });
  }
});

module.exports = router;