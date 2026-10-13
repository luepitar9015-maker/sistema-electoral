const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

/**
 * Modelo SocialTeamInteraction
 * Registra la participación de miembros del equipo con distinción estricta de verificabilidad
 * Prohibido: scores de lealtad, espionaje o perfilamiento político
 */
const SocialTeamInteraction = sequelize.define('SocialTeamInteraction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    campana_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    post_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    team_account_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    nombre_miembro: {
        type: DataTypes.STRING,
        allowNull: false
    },
    rol_equipo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    usuario_handle: {
        type: DataTypes.STRING,
        allowNull: true
    },
    plataforma: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // 'verificada': Confirmada directamente por la API oficial con ID de comentario o respuesta
    // 'declarada': Notificada por el miembro con enlace público de evidencia
    // 'no_verificable': No es posible corroborar técnicamente debido a restricciones de privacidad de la plataforma
    tipo_verificacion: {
        type: DataTypes.ENUM('verificada', 'declarada', 'no_verificable'),
        defaultValue: 'declarada'
    },
    tipo_reaccion: {
        type: DataTypes.STRING,
        defaultValue: 'like'
    },
    comento: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    texto_comentario: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    compartio: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    url_compartido: {
        type: DataTypes.STRING,
        allowNull: true
    },
    evidencia_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    external_interaction_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    api_verified_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    notas_verificacion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fecha_interaccion: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'SocialTeamInteractions',
    timestamps: true,
    indexes: [
        { fields: ['campana_id'] },
        { fields: ['post_id'] },
        { fields: ['tipo_verificacion'] },
        { fields: ['usuario_handle'] }
    ]
});

module.exports = SocialTeamInteraction;
