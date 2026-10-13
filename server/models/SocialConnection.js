const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

/**
 * Modelo SocialConnection
 * Almacena de forma segura las credenciales de conexión (OAuth / Tokens / API Keys)
 * Nunca se expone el token en plano al frontend
 */
const SocialConnection = sequelize.define('SocialConnection', {
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
        allowNull: true // Puede ser null si es una conexión a nivel de plataforma para la campaña
    },
    plataforma: {
        type: DataTypes.ENUM('facebook', 'instagram', 'tiktok', 'twitter', 'youtube'),
        allowNull: false
    },
    // 'oauth', 'api_key', 'bearer_token', 'page_access_token'
    tipo_autenticacion: {
        type: DataTypes.STRING,
        defaultValue: 'api_key'
    },
    // Token cifrado o credencial protegida
    token_seguro: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    refresh_token_seguro: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    token_expires_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    app_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    permisos_otorgados: {
        type: DataTypes.TEXT, // Lista en JSON de scopes o permisos (e.g. ['pages_read_engagement', 'instagram_basic'])
        allowNull: true
    },
    is_valid: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    ultimo_error: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fecha_ultimo_chequeo: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'SocialConnections',
    timestamps: true,
    indexes: [
        { fields: ['campana_id'] },
        { fields: ['plataforma'] },
        { fields: ['account_id'] }
    ]
});

// Método para sanitizar y nunca enviar secretos al frontend
SocialConnection.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.token_seguro;
    delete values.refresh_token_seguro;
    values.tiene_token_configurado = !!this.token_seguro;
    return values;
};

module.exports = SocialConnection;
