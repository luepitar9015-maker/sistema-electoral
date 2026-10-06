const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');

// Proteger con verificación de token
router.use(verifyToken);

// Obtener alertas operativas en tiempo real
router.get('/', notificationController.getLiveAlerts);

module.exports = router;
