const express = require('express');
const router = express.Router();
const callCenterController = require('../controllers/callCenterController');
const { verifyToken, authorizeCampaignAccess } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(authorizeCampaignAccess);

// 1. MODO GOTV / DÍA D
router.get('/next', callCenterController.getNextVoter);
router.post('/record', callCenterController.recordCall);
router.post('/log', callCenterController.recordCall);
router.get('/stats', callCenterController.getCallCenterStats);

// 2. MODO CONVOCATORIA A EVENTOS Y ENCUENTROS COMUNITARIOS
router.get('/eventos-activos', callCenterController.getEventosActivos);
router.post('/crear-evento', callCenterController.crearEventoConvocatoria);
router.get('/segmentos-geograficos', callCenterController.getSegmentosGeograficos);
router.get('/next-evento', callCenterController.getNextVoterEvento);
router.post('/record-evento', callCenterController.recordCallEvento);
router.get('/evento/:reunionId/auditoria', callCenterController.getEventoAuditoria);

module.exports = router;
