const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

/**
 * Modelo ContentAlert
 * Alertas de contenido de alto riesgo (amenazas explícitas, insultos graves, spam coordinado o requerimiento de moderación urgente)
 */
const ContentAlert = sequelize.define('ContentAlert', {
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
        type: DataTypes.STRING,
        allowNull: false
    },
    post_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    comment_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // 'amenaza', 'insulto_grave', 'acoso_coordinado', 'spam_masivo', 'crisis_reputacional', 'requiere_revision'
    tipo_alerta: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nivel_severidad: {
        type: DataTypes.ENUM('bajo', 'medio', 'alto', 'critico'),
        defaultValue: 'medio'
    },
    titulo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    texto_original: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    autor_comentario: {
        type: DataTypes.STRING,
        allowNull: true
    },
    url_evidencia: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // 'pendiente', 'en_revision', 'confirmado', 'descartado_falso_positivo', 'gestionado'
    estado: {
        type: DataTypes.ENUM('pendiente', 'en_revision', 'confirmado', 'descartado_falso_positivo', 'gestionado'),
        defaultValue: 'pendiente'
    },
    revisado_por_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    resolucion_notas: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fecha_resolucion: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'ContentAlerts',
    timestamps: true,
    indexes: [
        { fields: ['campana_id'] },
        { fields: ['tipo_alerta'] },
        { fields: ['nivel_severidad'] },
        { fields: ['estado'] }
    ]
});

module.exports = ContentAlert;
