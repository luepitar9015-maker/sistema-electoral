const express = require('express');
const router = express.Router();
const projectBankController = require('../controllers/projectBankController');
const { verifyToken, authorizeCampaignAccess } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Almacenamiento seguro para anexos y documentos de proyectos
const proyectosDir = path.join(__dirname, '../uploads/proyectos');
if (!fs.existsSync(proyectosDir)) {
    fs.mkdirSync(proyectosDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, proyectosDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'anexo-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 30 * 1024 * 1024 } // 30 MB max por documento/plano
});

// Middleware de autenticación y campaña
router.use(verifyToken);
router.use(authorizeCampaignAccess);

// Estadísticas y configuración
router.get('/stats/resumen', projectBankController.getStats);

// Estructurar proyecto desde necesidades comunitarias
router.post('/agrupar-necesidades', projectBankController.agruparDesdeNecesidades);

// Auditoría Anti-Devolución y Formulación MGA con IA
router.post('/:id/auditar-viabilidad', projectBankController.auditarViabilidad);
router.post('/:id/formular-mga', projectBankController.formularMGA);
router.put('/:id/checklist', projectBankController.actualizarChecklist);
router.post('/:id/cartas-radicacion', projectBankController.getCartasRadicacion);

// Gestión documental de anexos
router.post('/:id/documentos', upload.single('archivo'), projectBankController.subirDocumento);
router.delete('/documentos/:docId', projectBankController.eliminarDocumento);

// CRUD de Proyectos
router.get('/', projectBankController.getProyectos);
router.get('/:id', projectBankController.getProyectoById);
router.post('/', projectBankController.createProyecto);
router.put('/:id', projectBankController.updateProyecto);
router.delete('/:id', projectBankController.deleteProyecto);

module.exports = router;
