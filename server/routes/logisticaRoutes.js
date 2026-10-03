const express = require('express');
const router = express.Router();
const logisticaController = require('../controllers/logisticaController');
const { verifyToken, authorizeCampaignAccess } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(authorizeCampaignAccess);

router.get('/summary', logisticaController.getLogisticaSummary);

// Flota de vehículos
router.get('/vehiculos', logisticaController.getVehiculos);
router.post('/vehiculos', logisticaController.createVehiculo);
router.put('/vehiculos/:id/estado', logisticaController.updateVehiculoEstado);
router.delete('/vehiculos/:id', logisticaController.deleteVehiculo);

// Despacho de viajes
router.get('/despachos', logisticaController.getDespachos);
router.post('/despachos', logisticaController.createDespacho);
router.put('/despachos/:id/asignar', logisticaController.asignarVehiculo);
router.put('/despachos/:id/completar', logisticaController.completarDespacho);

module.exports = router;
