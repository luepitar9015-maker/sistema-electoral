const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

/**
 * Modelo SocialPostComment
 * Representa comentarios reales extraídos de plataformas oficiales con clasificación NLP y moderación humana
 */
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
    account_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    external_id: {
        type: DataTypes.STRING,
        allowNull: true // ID oficial del comentario en la plataforma
    },
    parent_comment_id: {
        type: DataTypes.STRING,
        allowNull: true // ID del comentario padre si es una respuesta
    },
    plataforma: {
        type: DataTypes.STRING,
        defaultValue: 'instagram'
    },
    usuario_red: {
        type: DataTypes.STRING,
        allowNull: false // @handle o ID público
    },
    nombre_usuario: {
        type: DataTypes.STRING,
        allowNull: true
    },
    autor_id_externo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    url_comentario: {
        type: DataTypes.STRING,
        allowNull: true // Enlace directo al comentario o publicación
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
        defaultValue: 'neutral'
    },
    // CLASIFICACIÓN NLP FORMAL
    // 'general', 'pregunta', 'critica', 'insulto', 'amenaza', 'acoso_repetitivo', 'spam', 'requiere_revision'
    categoria_contenido: {
        type: DataTypes.STRING,
        defaultValue: 'general'
    },
    nivel_confianza_ia: {
        type: DataTypes.FLOAT,
        defaultValue: 1.0 // 0.0 a 1.0
    },
    es_critica_legitima: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    es_amenaza: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    requiere_revision_humana: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // ESTADO DE REVISIÓN Y MODERACIÓN HUMANA
    // 'pendiente', 'aprobado', 'corregido', 'descartado'
    estado_revision: {
        type: DataTypes.STRING,
        defaultValue: 'pendiente'
    },
    revisado_por_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    notas_moderacion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    es_votante_censo: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // IDENTIFICACIÓN DEL EQUIPO DE CAMPAÑA (SOLO MATCH EXACTO REGISTRADO)
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
    },
    raw_data: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'SocialPostComments',
    timestamps: true,
    indexes: [
        { fields: ['post_id'] },
        { fields: ['campana_id'] },
        { fields: ['plataforma'] },
        { fields: ['external_id'] },
        { fields: ['categoria_contenido'] },
        { fields: ['estado_revision'] },
        { fields: ['es_equipo_campana'] },
        { fields: ['sentimiento'] }
    ]
});

module.exports = SocialPostComment;
