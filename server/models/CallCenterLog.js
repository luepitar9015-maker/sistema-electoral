const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Campaign = require('./Campaign');
const Voter = require('./Voter');
const User = require('./User');

const CallCenterLog = sequelize.define('CallCenterLog', {
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
    voter_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Voter,
            key: 'id'
        }
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    resultado: {
        type: DataTypes.STRING,
        allowNull: false // 'confirmo_voto', 'requiere_transporte', 'indeciso', 'no_contesta', 'numero_equivocado', 'en_contra'
    },
    notas: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    duracion_segundos: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    fecha_llamada: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'CallCenterLogs',
    timestamps: true
});

Campaign.hasMany(CallCenterLog, { foreignKey: 'campana_id', as: 'llamadas' });
CallCenterLog.belongsTo(Campaign, { foreignKey: 'campana_id' });

Voter.hasMany(CallCenterLog, { foreignKey: 'voter_id', as: 'historial_llamadas' });
CallCenterLog.belongsTo(Voter, { foreignKey: 'voter_id' });

User.hasMany(CallCenterLog, { foreignKey: 'usuario_id' });
CallCenterLog.belongsTo(User, { foreignKey: 'usuario_id', as: 'operador' });

module.exports = CallCenterLog;
