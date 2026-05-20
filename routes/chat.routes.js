const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/auth.middleware');
const Conversacion = require('../models/Conversacion');
const Mensaje = require('../models/Mensaje');

/**
 * POST /api/chat/conversaciones
 * Crear o recuperar una conversación entre dos usuarios
 * Body: { receptorId, intercambioId? }
 */
router.post('/conversaciones', verificarToken, async (req, res) => {
  try {
    const { receptorId, intercambioId } = req.body;
    const remitenteId = req.usuario.id;

    if (!receptorId) {
      return res.status(400).json({ mensaje: 'receptorId es requerido.' });
    }
    if (receptorId === remitenteId) {
      return res.status(400).json({ mensaje: 'No puedes iniciar un chat contigo mismo.' });
    }

    // Buscar conversación existente entre los dos usuarios
    let conversacion = await Conversacion.findOne({
      participantes: { $all: [remitenteId, receptorId] },
      ...(intercambioId ? { intercambio: intercambioId } : {})
    }).populate('participantes', 'nombre foto')
      .populate('ultimoMensaje');

    if (!conversacion) {
      conversacion = await Conversacion.create({
        participantes: [remitenteId, receptorId],
        ...(intercambioId ? { intercambio: intercambioId } : {})
      });
      conversacion = await conversacion.populate('participantes', 'nombre foto');
    }

    res.status(200).json(conversacion);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear/obtener conversación.', error: error.message });
  }
});

/**
 * GET /api/chat/conversaciones
 * Listar todas las conversaciones del usuario autenticado
 */
router.get('/conversaciones', verificarToken, async (req, res) => {
  try {
    const conversaciones = await Conversacion.find({
      participantes: req.usuario.id,
      activa: true
    })
      .populate('participantes', 'nombre foto')
      .populate('ultimoMensaje')
      .populate('intercambio', 'estado')
      .sort({ updatedAt: -1 });

    res.json(conversaciones);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener conversaciones.', error: error.message });
  }
});

/**
 * GET /api/chat/conversaciones/:id/mensajes
 * Obtener historial de mensajes de una conversación (paginado)
 * Query: ?pagina=1&limite=30
 */
router.get('/conversaciones/:id/mensajes', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 30;

    // Verificar que el usuario pertenece a la conversación
    const conversacion = await Conversacion.findOne({
      _id: id,
      participantes: req.usuario.id
    });

    if (!conversacion) {
      return res.status(404).json({ mensaje: 'Conversación no encontrada.' });
    }

    const total = await Mensaje.countDocuments({ conversacion: id });
    const mensajes = await Mensaje.find({ conversacion: id })
      .populate('remitente', 'nombre foto')
      .sort({ createdAt: -1 })
      .skip((pagina - 1) * limite)
      .limit(limite);

    // Marcar mensajes como leídos
    await Mensaje.updateMany(
      { conversacion: id, remitente: { $ne: req.usuario.id }, leido: false },
      { leido: true }
    );

    res.json({
      mensajes: mensajes.reverse(), // Más antiguos primero
      paginacion: {
        total,
        pagina,
        limite,
        paginas: Math.ceil(total / limite)
      }
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener mensajes.', error: error.message });
  }
});

/**
 * GET /api/chat/no-leidos
 * Contar mensajes no leídos del usuario autenticado
 */
router.get('/no-leidos', verificarToken, async (req, res) => {
  try {
    // Buscar todas las conversaciones donde el usuario participa
    const conversaciones = await Conversacion.find({
      participantes: req.usuario.id
    }).select('_id');

    const ids = conversaciones.map(c => c._id);

    const total = await Mensaje.countDocuments({
      conversacion: { $in: ids },
      remitente: { $ne: req.usuario.id },
      leido: false
    });

    res.json({ noLeidos: total });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al contar mensajes no leídos.', error: error.message });
  }
});

module.exports = router;