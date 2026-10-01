const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const ReunionAsistente = sequelize.define('ReunionAsistente', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    reunion_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cedula: {
        type: DataTypes.STRING,
        allowNull: true
    },
    nombre_completo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    telefono: {
        type: DataTypes.STRING,
        allowNull: true
    },
    departamento: {
        type: DataTypes.STRING,
        allowNull: true
    },
    municipio: {
        type: DataTypes.STRING,
        allowNull: true
    },
    barrio: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lider_referido: {
        type: DataTypes.STRING,
        allowNull: true
    },
    grupo_avanzada: {
        type: DataTypes.STRING,
        allowNull: true
    },
    asistio: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    observaciones: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'ReunionAsistentes',
    timestamps: true
});

module.exports = ReunionAsistente;
