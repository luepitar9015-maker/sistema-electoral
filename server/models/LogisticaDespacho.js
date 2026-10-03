const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Campaign = require('./Campaign');
const LogisticaVehiculo = require('./LogisticaVehiculo');
const Voter = require('./Voter');
const User = require('./User');

const LogisticaDespacho = sequelize.define('LogisticaDespacho', {
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
    vehiculo_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: LogisticaVehiculo,
            key: 'id'
        }
    },
    voter_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Voter,
            key: 'id'
        }
    },
    usuario_despachador_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    solicitante_nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    solicitante_telefono: {
        type: DataTypes.STRING,
        allowNull: true
    },
    origen_direccion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    destino_puesto: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cantidad_pasajeros: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    estado: {
        type: DataTypes.STRING,
        defaultValue: 'solicitado' // 'solicitado', 'asignado', 'en_camino', 'completado', 'cancelado'
    },
    hora_solicitud: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    hora_completado: {
        type: DataTypes.DATE,
        allowNull: true
    },
    notas: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'LogisticaDespachos',
    timestamps: true
});

Campaign.hasMany(LogisticaDespacho, { foreignKey: 'campana_id', as: 'despachos' });
LogisticaDespacho.belongsTo(Campaign, { foreignKey: 'campana_id' });

LogisticaVehiculo.hasMany(LogisticaDespacho, { foreignKey: 'vehiculo_id', as: 'viajes' });
LogisticaDespacho.belongsTo(LogisticaVehiculo, { foreignKey: 'vehiculo_id', as: 'vehiculo' });

Voter.hasMany(LogisticaDespacho, { foreignKey: 'voter_id' });
LogisticaDespacho.belongsTo(Voter, { foreignKey: 'voter_id' });

module.exports = LogisticaDespacho;
