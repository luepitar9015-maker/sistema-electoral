const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const CensoElectoral = sequelize.define('CensoElectoral', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    cedula: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    departamento: {
        type: DataTypes.STRING,
        allowNull: true
    },
    municipio: {
        type: DataTypes.STRING,
        allowNull: true
    },
    puesto_votacion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    direccion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mesa: {
        type: DataTypes.STRING,
        allowNull: true
    },
    nombres: {
        type: DataTypes.STRING,
        allowNull: true
    },
    apellidos: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'CensoElectoral',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['cedula']
        }
    ]
});

module.exports = CensoElectoral;
