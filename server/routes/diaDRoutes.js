const express = require('express');
const router = express.Router();
const diaDController = require('../controllers/diaDController');
const { verifyToken, authorizeCampaignAccess } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de almacenamiento para actas E-14
const actasDir = path.join(__dirname, '../uploads/actas');
if (!fs.existsSync(actasDir)) {
    fs.mkdirSync(actasDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, actasDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'e14-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } }); // 15MB max

router.use(verifyToken);
router.use(authorizeCampaignAccess);

// 1. Resumen y métricas del Día D
router.get('/summary', diaDController.getDashboardSummary);

// 2. Monitor GOTV (Check-in de votos efectivos)
router.get('/voters-gotv', diaDController.getVotersGOTV);
router.put('/voters/:voterId/checkin', diaDController.toggleVoterCheckIn);
router.post('/sync-offline', diaDController.syncOfflineBatch);

// 3. Testigos Electorales
router.get('/testigos', diaDController.getTestigos);
router.post('/testigos', diaDController.createTestigo);
router.put('/testigos/:id/estado', diaDController.updateTestigoEstado);
router.delete('/testigos/:id', diaDController.deleteTestigo);

// 4. Actas E-14 y Escrutinio Rápido
router.get('/mesas-reportes', diaDController.getMesaReportes);
router.post('/mesas-reportes', upload.single('acta_e14'), diaDController.reportarMesaE14);

// 5. Comparador Auditor E-14 (Testigos vs. Boletines Registraduría)
router.get('/comparador-e14', diaDController.getAuditoriaE14);
router.put('/comparador-e14/:id/boletin', diaDController.updateBoletinMesa);
router.post('/comparador-e14/importar-boletines', diaDController.bulkImportBoletines);
router.get('/comparador-e14/:id/reclamacion', diaDController.generarReclamacionJuridica);
router.put('/comparador-e14/:id/marcar-reclamacion', diaDController.marcarReclamacionRadicada);

module.exports = router;
