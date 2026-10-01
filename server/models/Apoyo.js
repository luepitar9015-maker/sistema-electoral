const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Campaign = require('./Campaign');

const Apoyo = sequelize.define('Apoyo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    campana_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Campaign,
            key: 'id'
        }
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tipo_apoyo: {
        type: DataTypes.STRING,
        defaultValue: 'candidato_aliado'
    },
    cargo_o_rol: {
        type: DataTypes.STRING,
        allowNull: true
    },
    partido_politico: {
        type: DataTypes.STRING,
        allowNull: true
    },
    telefono: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
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
    compromiso_votos: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    foto: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'Apoyos',
    timestamps: true
});

Campaign.hasMany(Apoyo, { foreignKey: 'campana_id', onDelete: 'CASCADE' });
Apoyo.belongsTo(Campaign, { foreignKey: 'campana_id' });

module.exports = Apoyo;
