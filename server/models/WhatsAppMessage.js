const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Campaign = require('./Campaign');

const WhatsAppMessage = sequelize.define('WhatsAppMessage', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    campana_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    remitente_telefono: {
        type: DataTypes.STRING,
        allowNull: false
    },
    remitente_nombre: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mensaje: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    respuesta: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    tipo_mensaje: {
        type: DataTypes.STRING,
        defaultValue: 'lista_votantes' // 'datos_lider', 'lista_votantes', 'consulta_puesto', 'mixto'
    },
    votantes_procesados: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    lider_registrado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    detalles_json: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    estado: {
        type: DataTypes.STRING,
        defaultValue: 'procesado' // 'procesado', 'error', 'pendiente'
    }
});

WhatsAppMessage.belongsTo(Campaign, { foreignKey: 'campana_id', as: 'campana' });
Campaign.hasMany(WhatsAppMessage, { foreignKey: 'campana_id', as: 'mensajesWhatsApp' });

module.exports = WhatsAppMessage;
