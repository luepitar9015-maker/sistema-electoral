const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const SocialPostComment = sequelize.define('SocialPostComment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    post_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    campana_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    plataforma: {
        type: DataTypes.STRING,
        defaultValue: 'instagram'
    },
    usuario_red: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nombre_usuario: {
        type: DataTypes.STRING,
        allowNull: true
    },
    texto_comentario: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    tipo_reaccion: {
        type: DataTypes.STRING,
        defaultValue: 'apoyo' // 'apoyo', 'me_gusta', 'me_encanta', 'critica', 'pregunta', 'ataque'
    },
    sentimiento: {
        type: DataTypes.ENUM('positivo', 'neutral', 'negativo'),
        defaultValue: 'positivo'
    },
    es_votante_censo: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // IDENTIFICACIÓN DEL EQUIPO DE CAMPAÑA
    es_equipo_campana: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    equipo_miembro_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    equipo_nombre: {
        type: DataTypes.STRING,
        allowNull: true
    },
    equipo_rol: {
        type: DataTypes.STRING,
        allowNull: true
    },
    likes_comentario: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    fecha_comentario: {
        type: DataTypes.STRING,
        allowNull: true
    },
    respondido: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    respuesta_texto: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'SocialPostComments',
    timestamps: true,
    indexes: [
        { fields: ['post_id'] },
        { fields: ['campana_id'] },
        { fields: ['es_equipo_campana'] },
        { fields: ['sentimiento'] }
    ]
});

module.exports = SocialPostComment;
