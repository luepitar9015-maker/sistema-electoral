const express = require('express');
const router = express.Router();
const multer = require('multer');
const censoController = require('../controllers/censoController');
const { verifyToken } = require('../middleware/authMiddleware');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // Hasta 50 MB para archivos grandes de censo
});

router.use(verifyToken);

// Consulta individual
router.get('/lookup/:cedula', censoController.lookupCedula);

// Carga masiva y plantilla
router.get('/template', censoController.downloadTemplate);
router.post('/import', upload.single('file'), censoController.importCenso);

// Autodiligenciamiento masivo de votantes
router.post('/auto-assign', censoController.autoAssignVoters);

// Estadísticas de cobertura
router.get('/stats', censoController.getStats);

// Limpieza de censo
router.delete('/clear', censoController.clearCenso);

module.exports = router;
