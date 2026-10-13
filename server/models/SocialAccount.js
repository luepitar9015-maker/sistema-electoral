const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

/**
 * Modelo SocialAccount
 * Representa una cuenta o página monitoreada (propia/administrada o pública de terceros)
 */
const SocialAccount = sequelize.define('SocialAccount', {
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
    // 'managed': Cuenta propia administrada vía OAuth/Token con permisos de lectura/moderación
    // 'public_third_party': Cuenta pública de terceros (candidato, medio de comunicación u opositor) monitoreada legalmente
    tipo_cuenta: {
        type: DataTypes.ENUM('managed', 'public_third_party'),
        defaultValue: 'public_third_party'
    },
    handle: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nombre_mostrado: {
        type: DataTypes.STRING,
        allowNull: true
    },
    external_account_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    url_perfil: {
        type: DataTypes.STRING,
        allowNull: true
    },
    avatar_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Estado técnico de la conexión
    sync_status: {
        type: DataTypes.ENUM('active', 'restricted', 'token_expired', 'rate_limited', 'error', 'pending', 'unauthorized'),
        defaultValue: 'pending'
    },
    sync_status_detail: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    ultimo_sync_exitoso: {
        type: DataTypes.DATE,
        allowNull: true
    },
    frecuencia_sync_minutos: {
        type: DataTypes.INTEGER,
        defaultValue: 60
    },
    total_publicaciones: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    total_seguidores: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'SocialAccounts',
    timestamps: true,
    indexes: [
        { fields: ['campana_id'] },
        { fields: ['plataforma'] },
        { fields: ['tipo_cuenta'] },
        { unique: true, fields: ['campana_id', 'plataforma', 'handle'] }
    ]
});

module.exports = SocialAccount;
