const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    telefono: {
        type: DataTypes.STRING,
        allowNull: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // Roles: 
    // superadmin, candidato, gerente, coordinador_zonal, lider, apoyo_bd, 
    // testigo_electoral, comunicaciones_prensa, orador, lider_avanzada, admin
    role: {
        type: DataTypes.STRING,
        defaultValue: 'apoyo_bd'
    },
    campana_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    reset_token: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = User;
