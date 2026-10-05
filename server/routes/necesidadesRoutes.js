const express = require('express');
const router = express.Router();
const necesidadesController = require('../controllers/necesidadesController');
const { verifyToken, authorizeCampaignAccess } = require('../middleware/authMiddleware');

// Middleware de autenticación y asignación de campaña
router.use(verifyToken);
router.use(authorizeCampaignAccess);

// Estadísticas territoriales
router.get('/stats/resumen', necesidadesController.getEstadisticas);

// Generador de Resumen Ejecutivo y Soluciones con IA (Gemini)
router.post('/ai/resumen-ejecutivo', necesidadesController.generarResumenIA);

// CRUD
router.get('/', necesidadesController.getNecesidades);
router.get('/:id', necesidadesController.getNecesidadById);
router.post('/', necesidadesController.createNecesidad);
router.put('/:id', necesidadesController.updateNecesidad);
router.delete('/:id', necesidadesController.deleteNecesidad);

module.exports = router;
