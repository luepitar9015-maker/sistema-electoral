const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const User = require('./User');
const Campaign = require('./Campaign');
const Apoyo = require('./Apoyo');

const Voter = sequelize.define('Voter', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombres: {
        type: DataTypes.STRING,
        allowNull: false
    },
    apellidos: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cedula: {
        type: DataTypes.STRING, // Changed to STRING to avoid potential integer overflow or format issues
        allowNull: false,
        unique: true
    },
    direccion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lugar_votacion: {
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
    mesa: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lider_nombre: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lider_cedula: {
        type: DataTypes.STRING,
        allowNull: true
    },
    usuario_registro_id: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id'
        }
    },
    campana_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Campaign,
            key: 'id'
        }
    },
    apoyo_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Apoyo,
            key: 'id'
        }
    },
    isLeader: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true,
    createdAt: 'fecha_registro',
    updatedAt: false // We only need creation date as per requirements
});

User.hasMany(Voter, { foreignKey: 'usuario_registro_id' });
Voter.belongsTo(User, { foreignKey: 'usuario_registro_id' });

Campaign.hasMany(Voter, { foreignKey: 'campana_id' });
Voter.belongsTo(Campaign, { foreignKey: 'campana_id' });

Apoyo.hasMany(Voter, { foreignKey: 'apoyo_id' });
Voter.belongsTo(Apoyo, { foreignKey: 'apoyo_id' });

module.exports = Voter;

