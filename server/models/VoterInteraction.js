const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Voter = require('./Voter');
const User = require('./User');

const VoterInteraction = sequelize.define('VoterInteraction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
    tipo: {
        type: DataTypes.STRING,
        defaultValue: 'llamada' // 'llamada', 'visita', 'reunion', 'compromiso', 'whatsapp', 'otro'
    },
    resultado: {
        type: DataTypes.STRING,
        defaultValue: 'positivo' // 'positivo', 'neutral', 'requiere_atencion', 'negativo'
    },
    notas: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fecha: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'VoterInteractions',
    timestamps: true
});

Voter.hasMany(VoterInteraction, { foreignKey: 'voter_id', as: 'interacciones', onDelete: 'CASCADE' });
VoterInteraction.belongsTo(Voter, { foreignKey: 'voter_id' });

User.hasMany(VoterInteraction, { foreignKey: 'usuario_id' });
VoterInteraction.belongsTo(User, { foreignKey: 'usuario_id', as: 'responsable' });

module.exports = VoterInteraction;
