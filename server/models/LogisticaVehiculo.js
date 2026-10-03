const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Campaign = require('./Campaign');

const LogisticaVehiculo = sequelize.define('LogisticaVehiculo', {
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
    conductor_nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    conductor_telefono: {
        type: DataTypes.STRING,
        allowNull: false
    },
    placa: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tipo_vehiculo: {
        type: DataTypes.STRING,
        defaultValue: 'automovil' // 'automovil', 'van', 'bus', 'moto'
    },
    capacidad_pasajeros: {
        type: DataTypes.INTEGER,
        defaultValue: 4
    },
    zona_asignada: {
        type: DataTypes.STRING,
        allowNull: true // Barrio, Comuna, Vereda o Puesto
    },
    estado: {
        type: DataTypes.STRING,
        defaultValue: 'disponible' // 'disponible', 'en_ruta', 'mantenimiento', 'inactivo'
    },
    viajes_realizados: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    pasajeros_movilizados: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'LogisticaVehiculos',
    timestamps: true
});

Campaign.hasMany(LogisticaVehiculo, { foreignKey: 'campana_id', as: 'flota_vehiculos' });
LogisticaVehiculo.belongsTo(Campaign, { foreignKey: 'campana_id' });

module.exports = LogisticaVehiculo;
