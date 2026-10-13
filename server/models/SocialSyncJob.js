const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

/**
 * Modelo SocialSyncJob
 * Registra cada ejecución de sincronización periódica o manual con plataformas oficiales
 */
const SocialSyncJob = sequelize.define('SocialSyncJob', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    campana_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    account_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    plataforma: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tipo_origen: {
        type: DataTypes.ENUM('cron_automatico', 'manual_usuario', 'webhook'),
        defaultValue: 'manual_usuario'
    },
    // 'running', 'completed', 'partial', 'failed', 'rate_limited'
    estado: {
        type: DataTypes.ENUM('running', 'completed', 'partial', 'failed', 'rate_limited'),
        defaultValue: 'running'
    },
    iniciado_en: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    finalizado_en: {
        type: DataTypes.DATE,
        allowNull: true
    },
    publicaciones_obtenidas: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    comentarios_obtenidos: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    registros_actualizados: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    cursor_paginacion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    detalles_tecnicos: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    mensaje_error: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'SocialSyncJobs',
    timestamps: true,
    indexes: [
        { fields: ['campana_id'] },
        { fields: ['plataforma'] },
        { fields: ['estado'] },
        { fields: ['iniciado_en'] }
    ]
});

module.exports = SocialSyncJob;
