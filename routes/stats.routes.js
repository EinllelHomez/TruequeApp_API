const express     = require('express');
const router      = express.Router();
const Articulo    = require('../models/Articulo');
const Usuario     = require('../models/Usuario');
const Intercambio = require('../models/Intercambio');

// GET /api/stats  — público, sin token
router.get('/', async (_req, res) => {
  try {
    const [
      totalArticulos,
      totalUsuarios,
      totalIntercambios,
      articulosPorEstado,
      articulosPorCategoria,
      ultimosArticulos
    ] = await Promise.all([
      Articulo.countDocuments({ disponible: true }),
      Usuario.countDocuments(),                      // FIX: no filtrar por "activo" — el campo existe pero countDocuments({activo:true}) falla cuando hay docs sin ese campo indexado; contamos todos los usuarios
      Intercambio.countDocuments(),
      Articulo.aggregate([
        { $match: { disponible: true } },
        { $group: { _id: '$estado', total: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ]),
      Articulo.aggregate([
        { $match: { disponible: true } },
        { $group: { _id: '$categoria', total: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'categorias',
            localField: '_id',
            foreignField: '_id',
            as: 'cat'
          }
        },
        { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            nombre: { $ifNull: ['$cat.nombre', 'Sin categoría'] },
            total: 1
          }
        }
      ]),
      Articulo.find({ disponible: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('usuario', 'nombre')
        .populate('categoria', 'nombre')
        .select('titulo estado imagenes usuario categoria createdAt')
    ]);

    res.json({
      totales: {
        articulos: totalArticulos,
        usuarios: totalUsuarios,
        intercambios: totalIntercambios
      },
      articulosPorEstado,
      articulosPorCategoria,
      ultimosArticulos
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener estadísticas.', error: error.message });
  }
});

module.exports = router;
