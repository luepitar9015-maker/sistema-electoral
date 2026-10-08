const sequelize = require('../database/db');

async function fixSchema() {
    console.log('--- VERIFICANDO Y CORRIGIENDO ESQUEMA SQLITE ---');
    try {
        await sequelize.authenticate();

        // 1. Columnas de Voters
        const [voterCols] = await sequelize.query("PRAGMA table_info(Voters);");
        const existingVoterCols = new Set(voterCols.map(c => c.name));

        const voterColumnsToAdd = [
            { name: 'fidelidad_score', type: 'INTEGER DEFAULT 3' },
            { name: 'intencion_voto', type: "VARCHAR(255) DEFAULT 'probable'" },
            { name: 'ha_votado', type: 'BOOLEAN DEFAULT 0' },
            { name: 'hora_voto', type: 'DATETIME' },
            { name: 'registrado_por_voto_id', type: 'INTEGER' },
            { name: 'latitud', type: 'FLOAT' },
            { name: 'longitud', type: 'FLOAT' },
            { name: 'observaciones_seguimiento', type: 'TEXT' },
            { name: 'municipio_censo_real', type: 'VARCHAR(255)' },
            { name: 'departamento_censo_real', type: 'VARCHAR(255)' },
            { name: 'puesto_censo_real', type: 'VARCHAR(255)' },
            { name: 'mesa_censo_real', type: 'VARCHAR(255)' },
            { name: 'estado_trashumancia', type: "VARCHAR(255) DEFAULT 'pendiente'" },
            { name: 'detalle_trashumancia', type: 'TEXT' }
        ];

        for (const col of voterColumnsToAdd) {
            if (!existingVoterCols.has(col.name)) {
                console.log(`+ Agregando columna '${col.name}' a Voters`);
                await sequelize.query(`ALTER TABLE Voters ADD COLUMN ${col.name} ${col.type};`);
            }
        }

        // 2. Columnas de Campaigns
        const [campCols] = await sequelize.query("PRAGMA table_info(Campaigns);");
        const existingCampCols = new Set(campCols.map(c => c.name));

        const campColumnsToAdd = [
            { name: 'link_instagram', type: 'VARCHAR(255)' },
            { name: 'link_tiktok', type: 'VARCHAR(255)' },
            { name: 'link_facebook', type: 'VARCHAR(255)' },
            { name: 'link_twitter', type: 'VARCHAR(255)' },
            { name: 'link_youtube', type: 'VARCHAR(255)' },
            { name: 'link_whatsapp', type: 'VARCHAR(255)' },
            { name: 'fecha_inicio', type: 'VARCHAR(255)' },
            { name: 'fecha_elecciones', type: 'VARCHAR(255)' },
            { name: 'modo_operacion', type: "VARCHAR(255) DEFAULT 'electoral'" },
            { name: 'periodo_gobierno', type: "VARCHAR(255) DEFAULT '2024-2027'" },
            { name: 'parent_campaign_id', type: 'INTEGER' },
            { name: 'meta_comunas_json', type: 'TEXT' }
        ];

        for (const col of campColumnsToAdd) {
            if (!existingCampCols.has(col.name)) {
                console.log(`+ Agregando columna '${col.name}' a Campaigns`);
                await sequelize.query(`ALTER TABLE Campaigns ADD COLUMN ${col.name} ${col.type};`);
            }
        }

        // Sincronizar modelos que crean sus propias tablas si no existen
        const LogisticaVehiculo = require('../models/LogisticaVehiculo');
        const LogisticaDespacho = require('../models/LogisticaDespacho');
        const CallCenterLog = require('../models/CallCenterLog');
        const NecesidadCiudadana = require('../models/NecesidadCiudadana');
        const CompromisoGestion = require('../models/CompromisoGestion');
        const DiaDMesaReporte = require('../models/DiaDMesaReporte');
        const TestigoElectoral = require('../models/TestigoElectoral');
        const Reunion = require('../models/Reunion');
        const ReunionAsistente = require('../models/ReunionAsistente');

        await LogisticaVehiculo.sync();
        await LogisticaDespacho.sync();
        await CallCenterLog.sync();
        await NecesidadCiudadana.sync();
        await CompromisoGestion.sync();
        await DiaDMesaReporte.sync();
        await TestigoElectoral.sync();
        await Reunion.sync();
        await ReunionAsistente.sync();

        console.log('✅ ESQUEMA SQLITE 100% REVISADO Y COMPATIBLE');
        process.exit(0);
    } catch (err) {
        console.error('Error al corregir esquema:', err);
        process.exit(1);
    }
}

fixSchema();
