const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

/**
 * Modelo SocialAuditLog
 * Auditoría estricta e inmutable de eventos del módulo de redes sociales
 */
const SocialAuditLog = sequelize.define('SocialAuditLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    campana_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true // Puede ser null si fue una acción de sistema/cron
    },
    // 'sync_executed', 'connection_created', 'connection_revoked', 'account_linked', 'account_unlinked', 'moderation_action', 'team_consent_registered', 'team_data_purged'
    tipo_evento: {
        type: DataTypes.STRING,
        allowNull: false
    },
    plataforma: {
        type: DataTypes.STRING,
        allowNull: true
    },
    entidad_afectada: {
        type: DataTypes.STRING,
        allowNull: true // 'SocialAccount', 'SocialPostComment', 'SocialTeamAccount', etc.
    },
    entidad_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    ip_origen: {
        type: DataTypes.STRING,
        allowNull: true
    },
    datos_anteriores: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    datos_nuevos: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'SocialAuditLogs',
    timestamps: true,
    indexes: [
        { fields: ['campana_id'] },
        { fields: ['tipo_evento'] },
        { fields: ['createdAt'] }
    ]
});

module.exports = SocialAuditLog;
