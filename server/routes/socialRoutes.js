const express = require('express');
const router = express.Router();
const socialController = require('../controllers/socialController');
const { verifyToken, authorizeCampaignAccess } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(authorizeCampaignAccess);


// Dashboard / Métricas globales
router.get('/metrics', socialController.getDashboardMetrics);

// Publicaciones y Monitoreo en Vivo
router.get('/posts', socialController.getPosts);
router.post('/posts', socialController.createPost);
router.put('/posts/:id', socialController.updatePost);
router.delete('/posts/:id', socialController.deletePost);
router.post('/posts/:id/track-click', socialController.trackPostClick);

// Sincronización de Perfiles y Publicaciones Reales desde Enlaces
router.post('/sync-profile', socialController.syncProfile);
router.post('/candidate-sweep', socialController.executeCandidateSweep);

// Cuentas Monitoreadas (Cuentas Administradas y Cuentas Públicas de Terceros)
router.get('/accounts', socialController.getAccounts);
router.post('/accounts', socialController.createAccount);
router.delete('/accounts/:id', socialController.deleteAccount);
router.post('/accounts/:id/sync', socialController.syncAccount);

// Conexiones Oficiales y Credenciales de Plataformas
router.get('/connections', socialController.getConnections);
router.post('/connections', socialController.saveConnection);
router.post('/connections/test', socialController.testConnection);

// Bandeja de Alertas de Contenido (Amenazas, Insultos, Spam, Crisis)
router.get('/content-alerts', socialController.getContentAlerts);
router.put('/content-alerts/:id/resolve', socialController.resolveContentAlert);

// Comentarios y Auditoría de Integrantes del Equipo por Publicación y Global
router.get('/comments', socialController.getAllComments);
router.get('/posts/:postId/comments', socialController.getPostComments);
router.post('/comments/:commentId/reply', socialController.replyToComment);
router.put('/comments/:commentId/review', socialController.reviewComment);

// Historial Técnico de Sincronización y Errores de API
router.get('/sync-jobs', socialController.getSyncJobs);

// Importación Masiva de Base de Datos del Equipo (Excel / CSV / JSON)
router.post('/team/import', socialController.importTeamDatabase);

// Base de datos de usuarios del equipo (User model)
router.get('/team-users', socialController.getTeamDatabaseUsers);

// Redes del Equipo y Seguimiento de Participación
router.get('/team-accounts', socialController.getTeamAccounts);
router.post('/team-accounts', socialController.createTeamAccount);
router.put('/team-accounts/:id', socialController.updateTeamAccount);
router.post('/team-accounts/:id/support', socialController.recordTeamSupport);
router.delete('/team-accounts/:id', socialController.deleteTeamAccount);

// Interacciones y Auditoría de Apoyo del Equipo en Publicaciones
router.get('/posts/:postId/interactions', socialController.getPostInteractions);
router.post('/posts/:postId/interactions', socialController.recordPostInteraction);
router.delete('/interactions/:interactionId', socialController.deletePostInteraction);

// Comentarios Negativos y Alertas de Crisis
router.get('/negative-comments', socialController.getNegativeComments);
router.post('/negative-comments', socialController.createNegativeComment);
router.put('/negative-comments/:id', socialController.updateNegativeComment);
router.delete('/negative-comments/:id', socialController.deleteNegativeComment);

// Radar de Contrincantes y Oposición
router.get('/competitors', socialController.getCompetitors);
router.post('/competitors', socialController.createCompetitor);
router.put('/competitors/:id', socialController.updateCompetitor);
router.delete('/competitors/:id', socialController.deleteCompetitor);

// Bitácora de Ataques de la Oposición y War Room
router.get('/competitors/attacks', socialController.getCompetitorAttacks);
router.post('/competitors/attacks', socialController.createCompetitorAttack);
router.put('/competitors/attacks/:id', socialController.updateCompetitorAttack);
router.delete('/competitors/attacks/:id', socialController.deleteCompetitorAttack);
router.post('/competitors/attacks/analyze-ai', socialController.analyzeAttackWithAi);
router.post('/competitors/attacks/scan-url', socialController.scanCompetitorAttackFromUrl);

// Asesor Virtual de Viralidad con Inteligencia Artificial
router.post('/advisor/viral-analysis', socialController.getViralAdvisorAnalysis);
router.post('/advisor/ask', socialController.chatWithViralAdvisor);

// Seguimiento a los En Vivo en Todas las Redes
router.get('/live-streams', socialController.getLiveStreamMonitor);
router.post('/live-streams/alert', socialController.dispatchLiveSupportAlert);

// Exportación de Redes Sociales a Excel / CSV
router.get('/export/excel', socialController.exportSocialExcel);

module.exports = router;
