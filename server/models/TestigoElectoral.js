const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Campaign = require('./Campaign');
const User = require('./User');

const TestigoElectoral = sequelize.define('TestigoElectoral', {
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
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cedula: {
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
    puesto_votacion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mesa: {
        type: DataTypes.STRING,
        defaultValue: 'TODAS' // 'TODAS' or specific mesa number like '1', '2'
    },
    rol: {
        type: DataTypes.STRING,
        defaultValue: 'testigo_mesa' // 'testigo_mesa', 'testigo_remitente', 'coordinador_puesto'
    },
    estado: {
        type: DataTypes.STRING,
        defaultValue: 'asignado' // 'asignado', 'confirmado', 'en_mesa', 'inactivo'
    },
    credencial_numero: {
        type: DataTypes.STRING,
        allowNull: true
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'TestigosElectorales',
    timestamps: true
});

Campaign.hasMany(TestigoElectoral, { foreignKey: 'campana_id', as: 'testigos' });
TestigoElectoral.belongsTo(Campaign, { foreignKey: 'campana_id' });

User.hasMany(TestigoElectoral, { foreignKey: 'usuario_id' });
TestigoElectoral.belongsTo(User, { foreignKey: 'usuario_id' });

module.exports = TestigoElectoral;
