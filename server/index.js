const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');

const jwt = require('jsonwebtoken');
const sequelize = require('./database/db');
const { getSecretKey, verifyJwtToken } = require('./middleware/authMiddleware');
const User = require('./models/User');
const Voter = require('./models/Voter');
const CensoElectoral = require('./models/CensoElectoral');
const Campaign = require('./models/Campaign');
const Apoyo = require('./models/Apoyo');
const WhatsAppMessage = require('./models/WhatsAppMessage');
const Reunion = require('./models/Reunion');
const ReunionAsistente = require('./models/ReunionAsistente');
const SocialMediaPost = require('./models/SocialMediaPost');
const SocialTeamAccount = require('./models/SocialTeamAccount');
const SocialNegativeComment = require('./models/SocialNegativeComment');
const SocialCompetitor = require('./models/SocialCompetitor');
const SocialTeamInteraction = require('./models/SocialTeamInteraction');
const SocialMetricSnapshot = require('./models/SocialMetricSnapshot');
const SocialContentAnalysis = require('./models/SocialContentAnalysis');
const SocialExperiment = require('./models/SocialExperiment');
const AuditLog = require('./models/AuditLog');
const AIUsageLog = require('./models/AIUsageLog');
const SocialPostComment = require('./models/SocialPostComment');
const VoterInteraction = require('./models/VoterInteraction');
const TestigoElectoral = require('./models/TestigoElectoral');
const DiaDMesaReporte = require('./models/DiaDMesaReporte');
const LogisticaVehiculo = require('./models/LogisticaVehiculo');
const LogisticaDespacho = require('./models/LogisticaDespacho');
const CallCenterLog = require('./models/CallCenterLog');

// Asociaciones de Reuniones
Reunion.hasMany(ReunionAsistente, { foreignKey: 'reunion_id', as: 'asistentes', onDelete: 'CASCADE' });
ReunionAsistente.belongsTo(Reunion, { foreignKey: 'reunion_id' });
Reunion.belongsTo(Campaign, { foreignKey: 'campana_id', as: 'campana' });

// Asociaciones de Redes Sociales
SocialMediaPost.hasMany(SocialTeamInteraction, { foreignKey: 'post_id', as: 'interacciones_equipo', onDelete: 'CASCADE' });
SocialTeamInteraction.belongsTo(SocialMediaPost, { foreignKey: 'post_id' });

// Asociaciones de Media Lab / Inteligencia de Contenido
SocialMediaPost.hasMany(SocialMetricSnapshot, { foreignKey: 'post_id', as: 'snapshots', onDelete: 'CASCADE' });
SocialMetricSnapshot.belongsTo(SocialMediaPost, { foreignKey: 'post_id' });
Campaign.hasMany(SocialMetricSnapshot, { foreignKey: 'campana_id', as: 'snapshots_metricas' });
SocialMetricSnapshot.belongsTo(Campaign, { foreignKey: 'campana_id' });

SocialMediaPost.hasMany(SocialContentAnalysis, { foreignKey: 'post_id', as: 'analisis_contenido', onDelete: 'CASCADE' });
SocialContentAnalysis.belongsTo(SocialMediaPost, { foreignKey: 'post_id' });
Campaign.hasMany(SocialContentAnalysis, { foreignKey: 'campana_id', as: 'analisis_contenido' });
SocialContentAnalysis.belongsTo(Campaign, { foreignKey: 'campana_id' });

Campaign.hasMany(SocialExperiment, { foreignKey: 'campana_id', as: 'experimentos_sociales' });
SocialExperiment.belongsTo(Campaign, { foreignKey: 'campana_id' });

SocialMediaPost.hasMany(SocialPostComment, { foreignKey: 'post_id', as: 'comentarios_sociales', onDelete: 'CASCADE' });
SocialPostComment.belongsTo(SocialMediaPost, { foreignKey: 'post_id' });
Campaign.hasMany(SocialPostComment, { foreignKey: 'campana_id', as: 'comentarios_campana' });
SocialPostComment.belongsTo(Campaign, { foreignKey: 'campana_id' });

const app = express();

const PORT = process.env.PORT || 3000;

const authRoutes = require('./routes/authRoutes');
const voterRoutes = require('./routes/voterRoutes');
const reportRoutes = require('./routes/reportRoutes');
const censoRoutes = require('./routes/censoRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const apoyoRoutes = require('./routes/apoyoRoutes');
const userRoutes = require('./routes/userRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const reunionRoutes = require('./routes/reunionRoutes');
const socialRoutes = require('./routes/socialRoutes');
const contentIntelligenceRoutes = require('./routes/contentIntelligenceRoutes');
const diaDRoutes = require('./routes/diaDRoutes');
const logisticaRoutes = require('./routes/logisticaRoutes');
const callCenterRoutes = require('./routes/callCenterRoutes');

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Servir archivos protegidos (evidencias fotográficas, adjuntos) con verificación de token
app.use('/uploads', (req, res, next) => {
    // Permitir token vía header Authorization o query parameter ?token=...
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.startsWith('Bearer ')) 
        ? authHeader.split(' ')[1] 
        : req.query.token;

    if (!token) {
        return res.status(401).json({ message: 'Acceso no autorizado: token requerido para ver archivos.' });
    }

    try {
        const decoded = verifyJwtToken(token);
        req.user = decoded;
        next();
    } catch (e) {
        return res.status(403).json({ message: 'Token inválido o expirado' });
    }
}, express.static(path.join(__dirname, 'uploads')));


// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/voters', voterRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/censo', censoRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/apoyos', apoyoRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/reuniones', reunionRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/social/intelligence', contentIntelligenceRoutes);
app.use('/api/dia-d', diaDRoutes);
app.use('/api/logistica', logisticaRoutes);
app.use('/api/callcenter', callCenterRoutes);

// Ruta pública de Revisor y Trazabilidad por el Link del Candidato
app.get('/r/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await SocialMediaPost.findByPk(postId);
        if (!post) {
            return res.status(404).send('Enlace no encontrado o publicación retirada.');
        }
        post.clics_link_candidato = (post.clics_link_candidato || 0) + 1;
        await post.save();

        if (post.url_publicacion) {
            return res.redirect(post.url_publicacion);
        } else {
            return res.redirect('/social');
        }
    } catch (e) {
        console.error('Error en redirección de link del candidato:', e);
        return res.redirect('/social');
    }
});

// Servir el frontend React (build de producción)
const frontendBuild = path.join(__dirname, '../client2/dist');
app.use(express.static(frontendBuild, {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// Para cualquier ruta que no sea API, devolver el index.html del frontend
app.use((req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(frontendBuild, 'index.html'));
});

// Sincronización de base de datos y arranque del servidor
sequelize.sync().then(() => {
    console.log('Base de datos sincronizada');
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
}).catch(error => {
    console.error('Error al sincronizar la base de datos:', error);
});
