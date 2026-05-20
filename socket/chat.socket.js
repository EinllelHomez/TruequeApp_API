const jwt = require('jsonwebtoken');
const Mensaje = require('../models/Mensaje');
const Conversacion = require('../models/Conversacion');

/**
 * Configura todos los eventos de Socket.IO para el chat en tiempo real.
 * @param {import('socket.io').Server} io
 */
const configurarSocket = (io) => {

  // --- Middleware de autenticación para sockets ---
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Autenticación requerida.'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.usuarioId = decoded.id;
      socket.usuarioNombre = decoded.nombre;
      next();
    } catch (err) {
      next(new Error('Token inválido o expirado.'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.usuarioId} [${socket.id}]`);

    // Unirse a una sala personal para recibir notificaciones
    socket.join(`usuario:${socket.usuarioId}`);

    // -------------------------------------------------------
    // EVENTO: Unirse a una conversación
    // El cliente debe emitir esto al abrir un chat
    // -------------------------------------------------------
    socket.on('unirse_conversacion', async (conversacionId) => {
      try {
        // Verificar que el usuario pertenece a la conversación
        const conversacion = await Conversacion.findOne({
          _id: conversacionId,
          participantes: socket.usuarioId
        });

        if (!conversacion) {
          return socket.emit('error_chat', { mensaje: 'Acceso denegado a esta conversación.' });
        }

        socket.join(`conv:${conversacionId}`);
        socket.emit('unido_a_conversacion', { conversacionId });
        console.log(`${socket.usuarioId} se unió a conv:${conversacionId}`);
      } catch (err) {
        socket.emit('error_chat', { mensaje: 'Error al unirse a la conversación.' });
      }
    });

    // -------------------------------------------------------
    // EVENTO: Salir de una conversación
    // -------------------------------------------------------
    socket.on('salir_conversacion', (conversacionId) => {
      socket.leave(`conv:${conversacionId}`);
    });

    // -------------------------------------------------------
    // EVENTO: Enviar mensaje
    // Payload: { conversacionId, contenido }
    // -------------------------------------------------------
    socket.on('enviar_mensaje', async ({ conversacionId, contenido }) => {
      try {
        if (!conversacionId || !contenido?.trim()) {
          return socket.emit('error_chat', { mensaje: 'conversacionId y contenido son requeridos.' });
        }
        if (contenido.length > 1000) {
          return socket.emit('error_chat', { mensaje: 'El mensaje no puede superar 1000 caracteres.' });
        }

        // Verificar pertenencia
        const conversacion = await Conversacion.findOne({
          _id: conversacionId,
          participantes: socket.usuarioId
        });

        if (!conversacion) {
          return socket.emit('error_chat', { mensaje: 'No tienes acceso a esta conversación.' });
        }

        // Guardar mensaje en BD
        const nuevoMensaje = await Mensaje.create({
          conversacion: conversacionId,
          remitente: socket.usuarioId,
          contenido: contenido.trim()
        });

        // Actualizar último mensaje en la conversación
        await Conversacion.findByIdAndUpdate(conversacionId, {
          ultimoMensaje: nuevoMensaje._id
        });

        // Popular datos del remitente para enviarlo al cliente
        const mensajePopulado = await nuevoMensaje.populate('remitente', 'nombre foto');

        // Emitir a todos en la sala de la conversación
        io.to(`conv:${conversacionId}`).emit('nuevo_mensaje', mensajePopulado);

        // Notificar a los otros participantes (aunque no estén en la sala)
        const otrosParticipantes = conversacion.participantes.filter(
          (p) => p.toString() !== socket.usuarioId
        );
        otrosParticipantes.forEach((participanteId) => {
          io.to(`usuario:${participanteId}`).emit('notificacion_mensaje', {
            conversacionId,
            remitente: { id: socket.usuarioId, nombre: socket.usuarioNombre },
            preview: contenido.substring(0, 60)
          });
        });

      } catch (err) {
        console.error('Error al enviar mensaje:', err.message);
        socket.emit('error_chat', { mensaje: 'Error al enviar el mensaje.' });
      }
    });

    // -------------------------------------------------------
    // EVENTO: Indicador "está escribiendo..."
    // Payload: { conversacionId, escribiendo: true/false }
    // -------------------------------------------------------
    socket.on('escribiendo', ({ conversacionId, escribiendo }) => {
      socket.to(`conv:${conversacionId}`).emit('usuario_escribiendo', {
        usuarioId: socket.usuarioId,
        nombre: socket.usuarioNombre,
        escribiendo
      });
    });

    // -------------------------------------------------------
    // EVENTO: Marcar mensajes como leídos
    // Payload: { conversacionId }
    // -------------------------------------------------------
    socket.on('marcar_leidos', async ({ conversacionId }) => {
      try {
        await Mensaje.updateMany(
          {
            conversacion: conversacionId,
            remitente: { $ne: socket.usuarioId },
            leido: false
          },
          { leido: true }
        );

        // Notificar al remitente que sus mensajes fueron leídos
        socket.to(`conv:${conversacionId}`).emit('mensajes_leidos', {
          conversacionId,
          leidoPor: socket.usuarioId
        });
      } catch (err) {
        socket.emit('error_chat', { mensaje: 'Error al marcar mensajes como leídos.' });
      }
    });

    // -------------------------------------------------------
    // Desconexión
    // -------------------------------------------------------
    socket.on('disconnect', () => {
      console.log(`Usuario desconectado: ${socket.usuarioId} [${socket.id}]`);
    });
  });
};

module.exports = configurarSocket;
