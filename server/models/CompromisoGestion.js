const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Campaign = require('./Campaign');

const CompromisoGestion = sequelize.define('CompromisoGestion', {
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
    titulo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    tipo: {
        type: DataTypes.STRING,
        defaultValue: 'obra_infraestructura'
        // 'obra_infraestructura', 'proyecto_normativo', 'debate_control', 'gestion_social', 'seguridad', 'salud_educacion', 'otro'
    },
    departamento: {
        type: DataTypes.STRING,
        allowNull: true
    },
    municipio: {
        type: DataTypes.STRING,
        allowNull: true
    },
    barrio_comuna: {
        type: DataTypes.STRING,
        allowNull: true
    },
    estado: {
        type: DataTypes.STRING,
        defaultValue: 'en_ejecucion'
        // 'promesa_campana', 'en_estudio', 'en_ejecucion', 'cumplido_entregado', 'inviable'
    },
    inversion_presupuesto: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    fecha_inicio: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fecha_cumplimiento: {
        type: DataTypes.STRING,
        allowNull: true
    },
    beneficiarios_estimados: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    evidencia_url: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'CompromisosGestion',
    timestamps: true
});

Campaign.hasMany(CompromisoGestion, { foreignKey: 'campana_id', as: 'compromisos' });
CompromisoGestion.belongsTo(Campaign, { foreignKey: 'campana_id', as: 'campana' });

module.exports = CompromisoGestion;
