const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Campaign = require('./Campaign');
const TestigoElectoral = require('./TestigoElectoral');
const User = require('./User');

const DiaDMesaReporte = sequelize.define('DiaDMesaReporte', {
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
    testigo_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: TestigoElectoral,
            key: 'id'
        }
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
        allowNull: false
    },
    total_sufragantes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    votos_lista_propia: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    votos_candidato_principal: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    votos_partidos_rivales: {
        type: DataTypes.TEXT, // JSON string { "Partido A": 45, "Partido B": 28 }
        allowNull: true
    },
    votos_en_blanco: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    votos_nulos: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    votos_no_marcados: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    acta_e14_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ocr_detectado: {
        type: DataTypes.TEXT, // Raw OCR extracted text
        allowNull: true
    },
    verificado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    verificado_por_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'DiaDMesaReportes',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['campana_id', 'puesto_votacion', 'mesa']
        }
    ]
});

Campaign.hasMany(DiaDMesaReporte, { foreignKey: 'campana_id', as: 'reportes_dia_d' });
DiaDMesaReporte.belongsTo(Campaign, { foreignKey: 'campana_id' });

TestigoElectoral.hasMany(DiaDMesaReporte, { foreignKey: 'testigo_id', as: 'reportes_mesa' });
DiaDMesaReporte.belongsTo(TestigoElectoral, { foreignKey: 'testigo_id', as: 'testigo' });

User.hasMany(DiaDMesaReporte, { foreignKey: 'verificado_por_id' });
DiaDMesaReporte.belongsTo(User, { foreignKey: 'verificado_por_id', as: 'auditor' });

module.exports = DiaDMesaReporte;
