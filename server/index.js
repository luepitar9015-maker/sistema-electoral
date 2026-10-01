const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./database/db');
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

// Asociaciones de Reuniones
Reunion.hasMany(ReunionAsistente, { foreignKey: 'reunion_id', as: 'asistentes', onDelete: 'CASCADE' });
ReunionAsistente.belongsTo(Reunion, { foreignKey: 'reunion_id' });
Reunion.belongsTo(Campaign, { foreignKey: 'campana_id', as: 'campana' });

// Asociaciones de Redes Sociales
SocialMediaPost.hasMany(SocialTeamInteraction, { foreignKey: 'post_id', as: 'interacciones_equipo', onDelete: 'CASCADE' });
SocialTeamInteraction.belongsTo(SocialMediaPost, { foreignKey: 'post_id' });

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

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Servir archivos estáticos subidos (evidencias fotográficas, adjuntos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use(express.static(frontendBuild));

// Para cualquier ruta que no sea API, devolver el index.html del frontend
app.use((req, res) => {
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
