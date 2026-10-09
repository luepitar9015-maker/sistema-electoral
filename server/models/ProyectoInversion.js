const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Campaign = require('./Campaign');
const User = require('./User');

const ProyectoInversion = sequelize.define('ProyectoInversion', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    titulo: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    codigo_bpin: {
        type: DataTypes.STRING(50),
        allowNull: true // Código BPIN o número de radicado oficial si ya existe
    },
    sector: {
        type: DataTypes.STRING(60),
        defaultValue: 'transporte_vias',
        allowNull: false
        // 'transporte_vias', 'agua_saneamiento', 'agricultura_rural', 'seguridad_convivencia',
        // 'salud', 'educacion', 'deporte_recreacion', 'vivienda', 'tic_conectividad', 'medio_ambiente', 'social_comunitario'
    },
    ministerio_objetivo: {
        type: DataTypes.STRING(120),
        allowNull: false,
        defaultValue: 'MinTransporte / Invías'
        // 'MinTransporte / Invías', 'MinVivienda', 'MinAgricultura / ADR', 'MinInterior / FONSECON',
        // 'MinTIC', 'MinDeporte', 'MinEducación / FFIE', 'MinSalud', 'MinIgualdad / DPS', 'Sistema General de Regalías (SGR)'
    },
    linea_convocatoria: {
        type: DataTypes.STRING(255),
        allowNull: true // Ej: "Caminos Comunitarios de la Paz Total", "Ventanilla Única Agua Potable", "FONSECON Seguridad"
    },
    entidad_postulante_tipo: {
        type: DataTypes.STRING(50),
        defaultValue: 'alcaldia' // 'alcaldia', 'gobernacion', 'jac_comunitaria', 'resguardo_etnico', 'asociacion_productores'
    },
    departamento: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    municipio: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    zona_localidad: {
        type: DataTypes.STRING(150),
        allowNull: true // Vereda, Corregimiento, Comuna o Barrio
    },
    latitud: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    longitud: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    poblacion_beneficiada: {
        type: DataTypes.INTEGER,
        defaultValue: 100
    },
    costo_estimado_total: {
        type: DataTypes.DECIMAL(16, 2),
        defaultValue: 0
    },
    monto_solicitado_nacion: {
        type: DataTypes.DECIMAL(16, 2),
        defaultValue: 0
    },
    contrapartida_local: {
        type: DataTypes.DECIMAL(16, 2),
        defaultValue: 0
    },
    estado: {
        type: DataTypes.STRING(50),
        defaultValue: 'idea_perfil'
        // 'idea_perfil', 'formulacion_mga', 'revision_antidevolucion', 'listo_radicar',
        // 'radicado_ventanilla', 'viabilizado_aprobado', 'devuelto_observado', 'en_ejecucion'
    },
    score_antidevolucion: {
        type: DataTypes.INTEGER,
        defaultValue: 0 // 0 a 100%
    },
    riesgo_devolucion: {
        type: DataTypes.STRING(30),
        defaultValue: 'alto' // 'bajo', 'medio', 'alto', 'critico'
    },
    // Componentes Metodología MGA (DNP)
    resumen_problema: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    arbol_problemas_json: {
        type: DataTypes.TEXT,
        allowNull: true // JSON: { problema_central, causas_directas, causas_indirectas, efectos_directos, efectos_indirectos }
    },
    objetivo_general: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    arbol_objetivos_json: {
        type: DataTypes.TEXT,
        allowNull: true // JSON: { objetivo_general, medios_directos, medios_indirectos, fines_directos, fines_indirectos }
    },
    cadena_valor_json: {
        type: DataTypes.TEXT,
        allowNull: true // JSON: { codigo_producto_dnp, nombre_producto, meta_producto, indicador, actividades: [] }
    },
    justificacion_tecnica: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Checklist Anti-Devolución y Auditoría Documental
    checklist_requisitos_json: {
        type: DataTypes.TEXT,
        allowNull: true // JSON con array de requisitos y su cumplimiento
    },
    dictamen_auditoria: {
        type: DataTypes.TEXT,
        allowNull: true // Dictamen técnico preventivo de viabilidad
    },
    observaciones_subsanacion: {
        type: DataTypes.TEXT,
        allowNull: true // Alertas y pasos urgentes para subsanar
    },
    // Relación de Campaña y Usuario
    campana_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Campaign,
            key: 'id'
        }
    },
    creado_por_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: User,
            key: 'id'
        }
    }
}, {
    tableName: 'ProyectosInversion',
    timestamps: true
});

ProyectoInversion.belongsTo(Campaign, { foreignKey: 'campana_id', as: 'campana' });
ProyectoInversion.belongsTo(User, { foreignKey: 'creado_por_id', as: 'creado_por' });

module.exports = ProyectoInversion;
