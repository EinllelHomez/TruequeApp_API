const express        = require('express');
const router         = express.Router();
const Review         = require('../models/Review');
const Intercambio    = require('../models/Intercambio');
const Usuario        = require('../models/Usuario');
const verificarToken = require('../middleware/auth.middleware');

// Recalcula y persiste el promedio de reputación del usuario receptor
async function recalcularReputacion(userId) {
  const reviews  = await Review.find({ toUser: userId });
  const total    = reviews.length;
  const promedio = total
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10
    : 0;
  await Usuario.findByIdAndUpdate(userId, { reputacion: { promedio, total } });
}

// POST /api/reviews
router.post('/', verificarToken, async (req, res) => {
  try {
    const { tradeId, rating, comment } = req.body;

    if (!tradeId || !rating) {
      return res.status(400).json({ mensaje: 'tradeId y rating son requeridos.' });
    }

    const intercambio = await Intercambio.findById(tradeId);
    if (!intercambio) {
      return res.status(404).json({ mensaje: 'Intercambio no encontrado.' });
    }
    if (intercambio.estado !== 'completado') {
      return res.status(400).json({ mensaje: 'Solo puedes reseñar intercambios completados.' });
    }

    const solicitanteId = intercambio.solicitante.toString();
    const receptorId    = intercambio.receptor.toString();
    const userId        = req.usuario.id;

    if (userId !== solicitanteId && userId !== receptorId) {
      return res.status(403).json({ mensaje: 'No participaste en este intercambio.' });
    }

    // El receptor de la reseña es el OTRO participante
    const toUser = userId === solicitanteId ? receptorId : solicitanteId;

    const existe = await Review.findOne({ tradeId, fromUser: userId });
    if (existe) {
      return res.status(409).json({ mensaje: 'Ya enviaste tu reseña para este intercambio.' });
    }

    const review = new Review({ rating, comment, fromUser: userId, toUser, tradeId });
    await review.save();

    // Actualizar reputación en el documento del usuario receptor
    await recalcularReputacion(toUser);

    res.status(201).json({ mensaje: 'Reseña creada exitosamente.', review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ mensaje: 'Ya enviaste tu reseña para este intercambio.' });
    }
    res.status(500).json({ mensaje: 'Error al crear reseña.', error: error.message });
  }
});

// GET /api/reviews/usuario/:userId
router.get('/usuario/:userId', verificarToken, async (req, res) => {
  try {
    const reviews = await Review.find({ toUser: req.params.userId })
      .populate('fromUser', 'nombre foto')
      .sort({ createdAt: -1 });

    const total    = reviews.length;
    const promedio = total
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10
      : 0;

    res.json({ promedio, total, reviews });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener reseñas.', error: error.message });
  }
});

// GET /api/reviews/pendiente/:tradeId
router.get('/pendiente/:tradeId', verificarToken, async (req, res) => {
  try {
    const intercambio = await Intercambio.findById(req.params.tradeId);
    if (!intercambio) return res.status(404).json({ mensaje: 'Intercambio no encontrado.' });

    const userId    = req.usuario.id;
    const participo =
      intercambio.solicitante.toString() === userId ||
      intercambio.receptor.toString()    === userId;

    const puedeResenar = intercambio.estado === 'completado' && participo;
    const miResena     = await Review.findOne({ tradeId: req.params.tradeId, fromUser: userId });

    res.json({ puedeResenar, yaResenado: !!miResena });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error.', error: error.message });
  }
});

module.exports = router;
