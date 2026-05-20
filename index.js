const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

app.use('/api/auth',        require('./routes/auth.routes'));
app.use('/api/usuarios',    require('./routes/usuario.routes'));
app.use('/api/categorias',  require('./routes/categoria.routes'));
app.use('/api/articulos',   require('./routes/articulo.routes'));
app.use('/api/intercambios', require('./routes/intercambio.routes'));

app.get('/', (req, res) => {
  res.json({ mensaje: '¡Bienvenido a la API de TruequeApp!' });
});
// ── Rutas REST del chat ────────────────────────────────────────
app.use('/api/chat', require('./routes/chat.routes'));
 
app.get('/', (req, res) => {
  res.json({ mensaje: '¡Bienvenido a la API de TruequeApp!' });
});
 
// ── Servidor HTTP + Socket.IO ──────────────────────────────────
const server = http.createServer(app);
 
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',  // Ajusta en producción
    methods: ['GET', 'POST']
  }
});
 
// Configurar eventos de chat en tiempo real
const configurarSocket = require('./socket/chat.socket');
configurarSocket(io);

const PORT = process.env.PORT || 4040;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
