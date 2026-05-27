const express    = require('express');
const http       = require('http');
const path       = require('path');
const { Server } = require('socket.io');
const dotenv     = require('dotenv');
const connectDB  = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(express.json({ limit: '10mb' }));

// Servir imágenes de perfil subidas con Multer
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas REST
app.use('/api/auth',        require('./routes/auth.routes'));
app.use('/api/usuarios',    require('./routes/usuario.routes'));
app.use('/api/categorias',  require('./routes/categoria.routes'));
app.use('/api/articulos',   require('./routes/articulo.routes'));
app.use('/api/intercambios',require('./routes/intercambio.routes'));
app.use('/api/reviews',     require('./routes/review.routes'));
app.use('/api/upload',      require('./routes/upload.routes'));
app.use('/api/chat',        require('./routes/chat.routes'));
app.use('/api/stats',       require('./routes/stats.routes'));

app.get('/', (_req, res) => res.json({ mensaje: '¡Bienvenido a la API de TruequeApp!' }));

// Servidor HTTP + Socket.IO
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  }
});

const configurarSocket = require('./socket/chat.socket');
configurarSocket(io);

const PORT = process.env.PORT || 4040;
server.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
