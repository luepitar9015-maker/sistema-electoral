const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const SocialExperiment = sequelize.define('SocialExperiment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    campana_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    titulo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    hipotesis: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    tipo_experimento: {
        type: DataTypes.ENUM('formato', 'duracion', 'gancho_apertura', 'horario', 'tema'),
        defaultValue: 'formato'
    },
    modo: {
        type: DataTypes.ENUM('real', 'simulado'),
        defaultValue: 'simulado'
    },
    post_a_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    post_b_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    metricas_observadas_json: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    conclusion_editorial: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    estado: {
        type: DataTypes.ENUM('en_curso', 'completado', 'inconcluso'),
        defaultValue: 'en_curso'
    },
    ganador_post_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'SocialExperiments',
    timestamps: true,
    indexes: [
        { fields: ['campana_id'] },
        { fields: ['estado'] }
    ]
});

module.exports = SocialExperiment;
