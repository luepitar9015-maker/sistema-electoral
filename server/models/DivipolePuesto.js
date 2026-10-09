const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const DivipolePuesto = sequelize.define('DivipolePuesto', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    departamento: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    municipio: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    puesto: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    comuna: {
        type: DataTypes.STRING(150),
        allowNull: true
    },
    direccion: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    latitud: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    longitud: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    alcalde: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    gobernacion: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    concejo: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    asamblea: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    jal: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    cantidad_elecciones: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'divipole_puestos',
    timestamps: true,
    indexes: [
        {
            fields: ['departamento', 'municipio']
        },
        {
            fields: ['puesto']
        }
    ]
});

module.exports = DivipolePuesto;
