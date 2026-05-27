const multer     = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary se configura con las variables de entorno:
// CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Perfil de usuario ─────────────────────────────────────────
const storagePerfil = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'truequeapp/perfiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  },
});

// ── Artículos ─────────────────────────────────────────────────
const storageArticulo = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'truequeapp/articulos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 800, quality: 'auto' }],
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato no soportado. Usa JPG, PNG, WEBP o GIF.'), false);
  }
};

const uploadPerfilCloudinary   = multer({ storage: storagePerfil,   fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadArticuloCloudinary = multer({ storage: storageArticulo, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = { cloudinary, uploadPerfilCloudinary, uploadArticuloCloudinary };
