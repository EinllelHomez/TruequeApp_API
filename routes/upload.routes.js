const express        = require('express');
const router         = express.Router();
const path           = require('path');
const fs             = require('fs');
const verificarToken = require('../middleware/auth.middleware');
const Usuario        = require('../models/Usuario');
const Articulo       = require('../models/Articulo');

// ── Helpers para elegir el storage activo ────────────────────
// Si las variables de Cloudinary están configuradas en .env se usa Cloudinary,
// en caso contrario se mantiene el comportamiento original con disco local.
const useCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY    &&
  process.env.CLOUDINARY_API_SECRET;

let uploadPerfilMiddleware, uploadArticuloMiddleware, cloudinary;

if (useCloudinary) {
  const cld = require('../middleware/cloudinary.middleware');
  uploadPerfilMiddleware   = cld.uploadPerfilCloudinary;
  uploadArticuloMiddleware = cld.uploadArticuloCloudinary;
  cloudinary               = cld.cloudinary;
} else {
  // Fallback: multer en disco (comportamiento original)
  uploadPerfilMiddleware   = require('../middleware/upload.middleware');
  uploadArticuloMiddleware = require('../middleware/upload.articulo.middleware');
}

// ─────────────────────────────────────────────────────────────
// POST /api/upload/imagenes  →  foto de perfil de usuario
// ─────────────────────────────────────────────────────────────
router.post(
  '/imagenes',
  verificarToken,
  uploadPerfilMiddleware.single('imagenes'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ mensaje: 'No se recibió ningún archivo.' });
      }

      // Cloudinary devuelve req.file.path como URL; disco local usa filename
      const publicUrl = useCloudinary
        ? req.file.path          // URL completa de Cloudinary
        : `/uploads/perfiles/${req.file.filename}`;

      // Borrar foto anterior en Cloudinary (si aplica)
      if (useCloudinary) {
        const usuario = await Usuario.findById(req.usuario.id);
        if (usuario?.foto && usuario.foto.includes('cloudinary.com')) {
          // Extraer public_id del URL
          const parts    = usuario.foto.split('/');
          const filename = parts[parts.length - 1].split('.')[0];
          const folder   = parts[parts.length - 2];
          await cloudinary.uploader.destroy(`${folder}/${filename}`).catch(() => {});
        }
      } else {
        // Borrar foto anterior en disco
        const usuario = await Usuario.findById(req.usuario.id);
        if (usuario?.foto && usuario.foto.startsWith('/uploads/')) {
          const oldPath = path.join(__dirname, '..', usuario.foto);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
      }

      await Usuario.findByIdAndUpdate(req.usuario.id, { foto: publicUrl });
      res.json({ urls: [publicUrl] });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al subir imagen.', error: error.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// POST /api/upload/articulos  →  imágenes de artículos
// Devuelve { urls: [...] } y opcionalmente actualiza el artículo
// si se envía el parámetro articuloId en el body / query.
// ─────────────────────────────────────────────────────────────
router.post(
  '/articulos',
  verificarToken,
  uploadArticuloMiddleware.array('imagenes', 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ mensaje: 'No se recibió ningún archivo.' });
      }

      const urls = useCloudinary
        ? req.files.map(f => f.path)                               // URL Cloudinary
        : req.files.map(f => `/uploads/articulos/${f.filename}`);  // URL disco local

      // Opcional: si el cliente envía articuloId, persistir las URLs en el modelo
      const articuloId = req.body.articuloId || req.query.articuloId;
      if (articuloId) {
        await Articulo.findByIdAndUpdate(
          articuloId,
          { $push: { imagenes: { $each: urls } } }
        );
      }

      res.json({ urls });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al subir imágenes.', error: error.message });
    }
  }
);

module.exports = router;
