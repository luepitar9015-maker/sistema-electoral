const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const SocialNegativeComment = sequelize.define('SocialNegativeComment', {
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
    publicacion_origen: {
        type: DataTypes.STRING,
        allowNull: true // Título o URL del post donde se comentó
    },
    usuario_comenta: {
        type: DataTypes.STRING,
        allowNull: false // e.g. '@critico_politico' o 'Usuario Anónimo'
    },
    texto_comentario: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    fecha_deteccion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    categoria_ataque: {
        type: DataTypes.STRING, // 'Fake News / Desinformación', 'Ataque Personal', 'Crítica a Propuesta', 'Troll / Bot', 'Reclamo Comunitario'
        defaultValue: 'Crítica a Propuesta'
    },
    nivel_riesgo: {
        type: DataTypes.ENUM('bajo', 'medio', 'alto', 'critico'),
        defaultValue: 'medio'
    },
    estado_gestion: {
        type: DataTypes.ENUM('pendiente', 'en_respuesta', 'neutralizado', 'escalado_legal'),
        defaultValue: 'pendiente'
    },
    respuesta_sugerida: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    respuesta_publicada: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    responsable_respuesta: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'SocialNegativeComments',
    timestamps: true
});

module.exports = SocialNegativeComment;
