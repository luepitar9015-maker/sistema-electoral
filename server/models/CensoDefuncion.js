const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const CensoDefuncion = sequelize.define('CensoDefuncion', {
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
    nombres: {
        type: DataTypes.STRING,
        allowNull: true
    },
    apellidos: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fecha_defuncion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    municipio_defuncion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    departamento_defuncion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fuente_registro: {
        type: DataTypes.STRING,
        defaultValue: 'RNEC - Bajas por Muerte'
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'CensoDefuncion',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['cedula']
        }
    ]
});

module.exports = CensoDefuncion;
