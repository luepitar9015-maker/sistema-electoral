const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const reunionController = require('../controllers/reunionController');
const { verifyToken, authorizeCampaignAccess } = require('../middleware/authMiddleware');

// Configuración de almacenamiento para evidencias y archivos
const uploadDir = path.join(__dirname, '../uploads/evidencias');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'evidencia-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25 MB
});

// Todas las rutas requieren autenticación y aislamiento de campaña
router.use(verifyToken);
router.use(authorizeCampaignAccess);


// CRUD de reuniones
router.get('/', reunionController.getReuniones);
router.get('/equipos', reunionController.getEquipos);
router.get('/:id', reunionController.getReunionById);
router.post('/', reunionController.createReunion);
router.put('/:id', reunionController.updateReunion);
router.delete('/:id', reunionController.deleteReunion);

// Control de estado de la reunión (Iniciar, Finalizar, Cancelar)
router.patch('/:id/estado', reunionController.cambiarEstado);

// Evidencias fotográficas
router.post('/:id/evidencias', upload.single('foto'), reunionController.subirEvidencia);
router.delete('/:id/evidencias/:evidenciaId', reunionController.eliminarEvidencia);

// Base de datos de asistentes de la reunión
router.get('/:id/asistentes', reunionController.getAsistentes);
router.post('/:id/asistentes', reunionController.addAsistente);
router.post('/:id/asistentes/import', upload.single('archivo'), reunionController.importAsistentes);
router.delete('/:id/asistentes/:asistenteId', reunionController.deleteAsistente);
router.get('/:id/asistentes/exportar', reunionController.exportAsistentesExcel);

module.exports = router;
