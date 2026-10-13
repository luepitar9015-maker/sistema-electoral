const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

/**
 * Modelo SocialSyncError
 * Registro pormenorizado de errores de APIs, restricciones de cuota, permisos o conectividad
 */
const SocialSyncError = sequelize.define('SocialSyncError', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    sync_job_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    campana_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    plataforma: {
        type: DataTypes.STRING,
        allowNull: false
    },
    endpoint_llamado: {
        type: DataTypes.STRING,
        allowNull: true
    },
    http_status: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // 'auth_expired', 'quota_exceeded', 'rate_limit', 'permission_denied', 'resource_not_found', 'network_timeout', 'schema_error'
    tipo_error: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mensaje_tecnico: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    explicacion_usuario: {
        type: DataTypes.TEXT,
        allowNull: true // Ej. "No disponible por restricciones de la plataforma (403: permisos de la aplicación insuficientes)"
    },
    recomendacion_tecnica: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    reintentos_efectuados: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    es_recuperable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'SocialSyncErrors',
    timestamps: true,
    indexes: [
        { fields: ['campana_id'] },
        { fields: ['plataforma'] },
        { fields: ['tipo_error'] }
    ]
});

module.exports = SocialSyncError;
