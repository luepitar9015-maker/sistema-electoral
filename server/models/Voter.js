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
    },
    // Inteligencia del Voto y Scoring (1: En riesgo, 2: Indeciso, 3: Simpatizante, 4: Comprometido, 5: Militante Seguro)
    fidelidad_score: {
        type: DataTypes.INTEGER,
        defaultValue: 3,
        validate: { min: 1, max: 5 }
    },
    intencion_voto: {
        type: DataTypes.STRING,
        defaultValue: 'probable' // 'seguro', 'probable', 'dudoso', 'en_contra'
    },
    // Operación Día D (GOTV - Get Out The Vote)
    ha_votado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    hora_voto: {
        type: DataTypes.DATE,
        allowNull: true
    },
    registrado_por_voto_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // Geolocalización territorial (GIS / Mapas de calor)
    latitud: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    longitud: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    observaciones_seguimiento: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Control Inteligente de Censo y Trashumancia Electoral
    estado_trashumancia: {
        type: DataTypes.STRING,
        defaultValue: 'pendiente' // 'valido', 'alerta_municipio', 'alerta_departamento', 'no_en_censo', 'sospecha_concentracion'
    },
    detalle_trashumancia: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    municipio_censo_real: {
        type: DataTypes.STRING,
        allowNull: true
    },
    departamento_censo_real: {
        type: DataTypes.STRING,
        allowNull: true
    },
    puesto_censo_real: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mesa_censo_real: {
        type: DataTypes.STRING,
        allowNull: true
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

