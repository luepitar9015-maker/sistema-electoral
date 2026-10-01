const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const SocialCompetitor = sequelize.define('SocialCompetitor', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    campana_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    nombre_candidato: {
        type: DataTypes.STRING,
        allowNull: false
    },
    partido_movimiento: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cargo_postulado: {
        type: DataTypes.STRING,
        allowNull: true
    },
    redes_principales: {
        type: DataTypes.TEXT, // JSON string de handles { twitter, instagram, facebook, tiktok }
        allowNull: true,
        defaultValue: '{}'
    },
    alcance_estimado: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    seguidores_totales: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // Análisis de la estrategia de la oposición
    narrativa_principal: {
        type: DataTypes.STRING, // e.g. 'Ataque a la gestión actual', 'Discurso de seguridad estricta', 'Promesas de subsidios'
        allowNull: true
    },
    lineas_de_ataque: {
        type: DataTypes.TEXT, // Temas contra nosotros
        allowNull: true
    },
    puntos_fuertes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    puntos_debiles: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    contra_estrategia_sugerida: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    nivel_amenaza: {
        type: DataTypes.ENUM('bajo', 'medio', 'alto', 'muy_alto'),
        defaultValue: 'medio'
    },
    ultima_movida: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'SocialCompetitors',
    timestamps: true
});

module.exports = SocialCompetitor;
