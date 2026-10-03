const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const SocialMediaPost = sequelize.define('SocialMediaPost', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    campana_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    plataforma: {
        type: DataTypes.ENUM('facebook', 'instagram', 'tiktok', 'twitter', 'youtube'),
        allowNull: false
    },
    titulo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    contenido: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    url_publicacion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    autor_nombre: {
        type: DataTypes.STRING,
        allowNull: true
    },
    autor_usuario: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fecha_publicacion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tipo_contenido: {
        type: DataTypes.STRING, // 'video', 'imagen', 'carrusel', 'texto', 'live'
        defaultValue: 'imagen'
    },
    // Métricas de alcance y efectividad
    alcance: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    impresiones: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    reproducciones: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    interacciones: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    compartidos: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    comentarios_conteo: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    engagement_rate: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0
    },
    // Reacciones desglosadas
    likes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    me_encanta: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    me_enoja: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    sentimiento_positivo: {
        type: DataTypes.FLOAT, // Porcentaje 0 a 100
        defaultValue: 70.0
    },
    sentimiento_neutral: {
        type: DataTypes.FLOAT,
        defaultValue: 20.0
    },
    sentimiento_negativo: {
        type: DataTypes.FLOAT,
        defaultValue: 10.0
    },
    en_vivo: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    estado_en_vivo: {
        type: DataTypes.STRING, // 'en_directo', 'programado', 'finalizado'
        defaultValue: 'finalizado'
    },
    espectadores_en_vivo: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    pico_espectadores: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    duracion_en_vivo: {
        type: DataTypes.STRING,
        defaultValue: '00:00'
    },
    tema_estrategico: {
        type: DataTypes.STRING,
        allowNull: true // Ej. 'Propuesta Salud', 'Reunión Comuna 4', 'Debate Oposición'
    },
    // Trazabilidad del link del candidato
    clics_link_candidato: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    link_candidato: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Metadatos audiovisuales (Media Lab / Content Intelligence)
    video_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    video_duration_seconds: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    video_resolution: {
        type: DataTypes.STRING,
        allowNull: true
    },
    video_fps: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    video_aspect_ratio: {
        type: DataTypes.STRING,
        allowNull: true
    },
    is_simulation: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'SocialMediaPosts',
    timestamps: true
});


module.exports = SocialMediaPost;
