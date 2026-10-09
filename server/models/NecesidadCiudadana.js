const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Campaign = require('./Campaign');
const User = require('./User');

const NecesidadCiudadana = sequelize.define('NecesidadCiudadana', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    titulo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    categoria: {
        type: DataTypes.STRING,
        defaultValue: 'vias_infraestructura',
        // 'vias_infraestructura', 'salud', 'seguridad', 'educacion', 'servicios_publicos_agua',
        // 'empleo_desarrollo', 'medio_ambiente', 'cultura_deporte', 'vivienda', 'agricultura_rural', 'otra'
        allowNull: false
    },
    nivel_territorial: {
        type: DataTypes.STRING,
        defaultValue: 'municipal', // 'municipal', 'departamental', 'nacional'
        allowNull: false
    },
    departamento: {
        type: DataTypes.STRING,
        allowNull: false
    },
    municipio: {
        type: DataTypes.STRING,
        allowNull: false
    },
    comuna_corregimiento: {
        type: DataTypes.STRING,
        allowNull: true
    },
    barrio_vereda: {
        type: DataTypes.STRING,
        allowNull: true
    },
    direccion_referencia: {
        type: DataTypes.STRING,
        allowNull: true
    },
    latitud: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    longitud: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    prioridad: {
        type: DataTypes.STRING,
        defaultValue: 'media' // 'baja', 'media', 'alta', 'critica_urgente'
    },
    estado: {
        type: DataTypes.STRING,
        defaultValue: 'reportada' // 'reportada', 'en_analisis', 'en_plan_desarrollo', 'en_gestion', 'solucionada', 'descartada'
    },
    impacto_familias_estimado: {
        type: DataTypes.INTEGER,
        defaultValue: 10
    },
    costo_estimado: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    competencia: {
        type: DataTypes.STRING,
        defaultValue: 'alcaldia' // 'alcaldia', 'gobernacion', 'nacion_congreso', 'mixta'
    },
    solucion_propuesta: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    reportado_por_nombre: {
        type: DataTypes.STRING,
        allowNull: true
    },
    reportado_por_telefono: {
        type: DataTypes.STRING,
        allowNull: true
    },
    reportado_por_cedula: {
        type: DataTypes.STRING,
        allowNull: true
    },
    origen_reporte: {
        type: DataTypes.STRING,
        defaultValue: 'lider' // 'lider', 'ciudadano_web', 'whatsapp', 'brigada_territorial'
    },
    evidencia_foto_url: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    campana_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Campaign,
            key: 'id'
        }
    },
    usuario_registro_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    proyecto_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'NecesidadesCiudadanas',
    timestamps: true
});

Campaign.hasMany(NecesidadCiudadana, { foreignKey: 'campana_id', as: 'necesidades' });
NecesidadCiudadana.belongsTo(Campaign, { foreignKey: 'campana_id', as: 'campana' });

User.hasMany(NecesidadCiudadana, { foreignKey: 'usuario_registro_id' });
NecesidadCiudadana.belongsTo(User, { foreignKey: 'usuario_registro_id', as: 'registrado_por' });

module.exports = NecesidadCiudadana;
