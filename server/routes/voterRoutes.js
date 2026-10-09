const express = require('express');
const router = express.Router();
const multer = require('multer');
const voterController = require('../controllers/voterController');
const { verifyToken, authorizeCampaignAccess } = require('../middleware/authMiddleware');

// multer en memoria (no guarda en disco)
const upload = multer({ storage: multer.memoryStorage() });

router.use(verifyToken);
router.use(authorizeCampaignAccess);

router.post('/',               voterController.createVoter);
router.get('/',                voterController.getVoters);
router.get('/leaders',         voterController.getLeaders);

// Importación masiva y plantilla
router.get('/template',        voterController.downloadTemplate);
router.post('/import',         upload.single('file'), voterController.importVoters);
router.post('/quick-import',   voterController.quickImportVoters);

// Inteligencia territorial, GIS y Anti-Trashumancia
router.get('/geo-data',        voterController.getTerritorialGeoData);
router.post('/auditar-trashumancia', voterController.auditarTrashumanciaMasiva);
router.post('/auditar-votos-reales', voterController.auditarVotosReales);
router.get('/resumen-votos-reales',  voterController.getResumenVotosReales);

// Scoring y seguimiento
router.put('/:id/scoring',     voterController.updateVoterScoring);
router.post('/:id/interactions', voterController.addVoterInteraction);
router.get('/:id/interactions', voterController.getVoterInteractions);

// CRUD individual
router.get('/:id',             voterController.getVoterById);
router.put('/:id',             voterController.updateVoter);

module.exports = router;

