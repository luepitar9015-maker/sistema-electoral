const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const SocialCompetitorAttack = sequelize.define('SocialCompetitorAttack', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    campana_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    competitor_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    adversario_nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    plataforma: {
        type: DataTypes.STRING, // 'twitter', 'instagram', 'tiktok', 'facebook', 'youtube', 'medios', 'otro'
        defaultValue: 'twitter'
    },
    url_publicacion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fecha_ataque: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    // A quién o qué ataca específicamente:
    blanco_ataque: {
        type: DataTypes.ENUM('candidato', 'partido', 'alcalde', 'gobernador', 'concejal', 'senador', 'congresista', 'gestion_institucional', 'familia_personal', 'equipo_campana'),
        defaultValue: 'candidato'
    },
    descripcion_blanco: {
        type: DataTypes.STRING, // ej: "Alcaldía de Bucaramanga / Gestión de Vías", "Partido Conservador", "Candidato Presidencial"
        allowNull: true
    },
    contenido_ataque: {
        type: DataTypes.TEXT, // transcripción, tweet o síntesis del ataque
        allowNull: false
    },
    tema_ataque: {
        type: DataTypes.STRING, // 'Corrupción / Transparencia', 'Seguridad', 'Obras / Infraestructura', 'Economía / Empleo', 'Gasto Público / Austeridad', 'Vida Personal / Moral', 'Incoherencia Política', 'Alianzas Cuestionadas'
        defaultValue: 'Guerra Sucia / Desprestigio'
    },
    nivel_amenaza: {
        type: DataTypes.ENUM('bajo', 'medio', 'alto', 'muy_alto'),
        defaultValue: 'medio'
    },
    alcance_estimado: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    likes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    reposts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    comentarios: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    es_fake_news: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    posible_red_bots: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // Recomendaciones del Director Estratega
    tactica_recomendada: {
        type: DataTypes.ENUM('ignorar', 'desmentir', 'redireccionar', 'contraatacar', 'tropa_digital'),
        defaultValue: 'redireccionar'
    },
    analisis_estrategico: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    guion_candidato: {
        type: DataTypes.TEXT, // Discurso de estadista / respuesta en tarima o medios
        allowNull: true
    },
    guion_voceros: {
        type: DataTypes.TEXT, // Para ruedas de prensa y portavoces
        allowNull: true
    },
    guion_tropa_digital: {
        type: DataTypes.TEXT, // Comentarios de contra-ataque o clarificación para activistas
        allowNull: true
    },
    guion_debates: {
        type: DataTypes.TEXT, // Respuesta relámpago si se lo sacan en debate
        allowNull: true
    },
    estado: {
        type: DataTypes.ENUM('en_monitoreo', 'estrategia_desplegada', 'neutralizado', 'descartado'),
        defaultValue: 'en_monitoreo'
    },
    notas_director: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'SocialCompetitorAttacks',
    timestamps: true
});

module.exports = SocialCompetitorAttack;
