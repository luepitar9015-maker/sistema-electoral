const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const ProyectoInversion = require('./ProyectoInversion');

const ProyectoDocumento = sequelize.define('ProyectoDocumento', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    proyecto_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: ProyectoInversion,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    tipo_documento: {
        type: DataTypes.STRING(80),
        allowNull: false
        // 'certificado_tradicion_predio', 'certificado_riesgo_cmgrd', 'estudios_topografia_geotecnia',
        // 'planos_disenos_fase3', 'presupuesto_apu', 'especificaciones_tecnicas',
        // 'licencia_ambiental_servicios', 'carta_presentacion_oficial', 'certificado_plan_desarrollo',
        // 'acta_socializacion_comunitaria', 'certificado_sostenibilidad_10anos', 'otro'
    },
    nombre_archivo: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    url_archivo: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    tamano_bytes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    mimetype: {
        type: DataTypes.STRING(100),
        defaultValue: 'application/pdf'
    },
    estado_revision: {
        type: DataTypes.STRING(30),
        defaultValue: 'aprobado_cumple' // 'pendiente', 'aprobado_cumple', 'observado_subsanar', 'rechazado_invalido'
    },
    es_requisito_bloqueante: {
        type: DataTypes.BOOLEAN,
        defaultValue: true // Si falta o está rechazado, causa DEVOLUCIÓN directa en el ministerio
    },
    observacion_auditoria: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    analisis_ocr_ia: {
        type: DataTypes.TEXT,
        allowNull: true // Metadatos extraídos de la lectura automática del documento
    }
}, {
    tableName: 'ProyectosDocumentos',
    timestamps: true
});

ProyectoInversion.hasMany(ProyectoDocumento, { foreignKey: 'proyecto_id', as: 'documentos', onDelete: 'CASCADE' });
ProyectoDocumento.belongsTo(ProyectoInversion, { foreignKey: 'proyecto_id' });

module.exports = ProyectoDocumento;
