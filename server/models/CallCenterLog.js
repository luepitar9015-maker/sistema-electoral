const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Campaign = require('./Campaign');
const Voter = require('./Voter');
const User = require('./User');
const Reunion = require('./Reunion');

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
    // Tipo de campaña: 'gotv_dia_d' o 'convocatoria_evento'
    tipo_campana: {
        type: DataTypes.STRING,
        defaultValue: 'gotv_dia_d'
    },
    // Vinculación opcional a un Evento / Encuentro Ciudadano
    reunion_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Reunion,
            key: 'id'
        }
    },
    evento_nombre: {
        type: DataTypes.STRING,
        allowNull: true
    },
    evento_lugar: {
        type: DataTypes.STRING,
        allowNull: true
    },
    evento_fecha_hora: {
        type: DataTypes.STRING,
        allowNull: true
    },
    asistencia_confirmada: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    cantidad_acompanantes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    necesidad_peticion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    resultado: {
        type: DataTypes.STRING,
        allowNull: false // GOTV: 'confirmo_voto', 'requiere_transporte', 'indeciso', 'no_contesta', 'numero_equivocado', 'en_contra'
                         // EVENTO: 'asiste_confirmado', 'apoya_no_asiste', 'deja_peticion', 'reagendar', 'no_contesta', 'no_le_interesa'
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

Reunion.hasMany(CallCenterLog, { foreignKey: 'reunion_id', as: 'llamadas_convocatoria' });
CallCenterLog.belongsTo(Reunion, { foreignKey: 'reunion_id', as: 'reunion' });

module.exports = CallCenterLog;
