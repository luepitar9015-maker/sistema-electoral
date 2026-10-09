const sequelize = require('../database/db');
const ProyectoInversion = require('../models/ProyectoInversion');
const ProyectoDocumento = require('../models/ProyectoDocumento');
const NecesidadCiudadana = require('../models/NecesidadCiudadana');

async function syncProyectosSchema() {
    try {
        console.log('--- Sincronizando Esquema del Banco de Proyectos de Inversión ---');
        await ProyectoInversion.sync({ alter: true });
        console.log('✓ Tabla ProyectosInversion sincronizada.');

        await ProyectoDocumento.sync({ alter: true });
        console.log('✓ Tabla ProyectosDocumentos sincronizada.');

        await NecesidadCiudadana.sync({ alter: true });
        console.log('✓ Tabla NecesidadesCiudadanas (con proyecto_id) sincronizada.');

        // Sembrar 2 proyectos de ejemplo si la tabla está vacía
        const count = await ProyectoInversion.count();
        if (count === 0) {
            console.log('Sembrando proyectos de ejemplo para demostración...');
            const projectBankService = require('../services/projectBankService');
            const cfg = projectBankService.getSectoresConfig();

            const p1 = await ProyectoInversion.create({
                titulo: 'Construcción de 2.4 KM de Placa Huella en el Corredor Veredal El Retiro - La Florida',
                sector: 'transporte_vias',
                ministerio_objetivo: 'MinTransporte / Invías',
                linea_convocatoria: 'Caminos Comunitarios de la Paz Total',
                entidad_postulante_tipo: 'alcaldia',
                departamento: 'SANTANDER',
                municipio: 'BUCARAMANGA',
                zona_localidad: 'Vereda El Retiro y La Florida',
                poblacion_beneficiada: 1250,
                costo_estimado_total: 1850000000,
                monto_solicitado_nacion: 1665000000,
                contrapartida_local: 185000000,
                estado: 'revision_antidevolucion',
                score_antidevolucion: 65,
                riesgo_devolucion: 'medio',
                resumen_problema: 'Vía en afirmado deteriorada con pérdidas de banca en época de lluvias, impidiendo la salida de cítricos y leche.',
                objetivo_general: 'Construir 2.4 km de placa huella con cunetas y disipadores para asegurar la transitabilidad permanente.',
                checklist_requisitos_json: JSON.stringify(cfg.transporte_vias.requisitos.map((r, i) => ({
                    ...r,
                    cumplido: i < 5,
                    observacion: i < 5 ? 'Documento técnico aportado y revisado.' : 'Pendiente por expedición formal.'
                })))
            });

            const p2 = await ProyectoInversion.create({
                titulo: 'Optimización de Bocatoma y Construcción de Planta Potabilizadora (PTAP) para Acueducto Veredal',
                sector: 'agua_saneamiento',
                ministerio_objetivo: 'MinVivienda',
                linea_convocatoria: 'Ventanilla Única de Agua Potable y Saneamiento (MinVivienda)',
                entidad_postulante_tipo: 'alcaldia',
                departamento: 'SANTANDER',
                municipio: 'FLORIDABLANCA',
                zona_localidad: 'Corregimiento La Judía',
                poblacion_beneficiada: 3400,
                costo_estimado_total: 2400000000,
                monto_solicitado_nacion: 2160000000,
                contrapartida_local: 240000000,
                estado: 'formulacion_mga',
                score_antidevolucion: 40,
                riesgo_devolucion: 'alto',
                resumen_problema: 'Consumo de agua sin tratamiento con alto índice IRCA (Inviabilidad Sanitaria), generando enfermedades gastrointestinales en niños.',
                objetivo_general: 'Construir una PTAP modular de 8 L/s y optimizar la red de distribución veredal.',
                checklist_requisitos_json: JSON.stringify(cfg.agua_saneamiento.requisitos.map((r, i) => ({
                    ...r,
                    cumplido: i < 2,
                    observacion: i < 2 ? 'Concesión y predio acreditados.' : 'Faltan memorias de cálculo y ensayos RAS.'
                })))
            });

            console.log(`✓ 2 Proyectos de ejemplo sembrados con éxito (IDs: ${p1.id}, ${p2.id}).`);
        }

        console.log('--- Proceso de sincronización finalizado exitosamente ---');
        process.exit(0);
    } catch (error) {
        console.error('Error en sincronización:', error);
        process.exit(1);
    }
}

syncProyectosSchema();
