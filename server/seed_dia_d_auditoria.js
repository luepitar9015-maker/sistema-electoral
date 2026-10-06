const sequelize = require('./database/db');
const TestigoElectoral = require('./models/TestigoElectoral');
const DiaDMesaReporte = require('./models/DiaDMesaReporte');
const Campaign = require('./models/Campaign');

async function seedAuditoria() {
    try {
        console.log('Sincronizando modelos TestigoElectoral y DiaDMesaReportes...');
        await TestigoElectoral.sync();
        try {
            await DiaDMesaReporte.drop();
        } catch (e) {}
        await DiaDMesaReporte.sync({ force: true });

        const camp = await Campaign.findByPk(1) || await Campaign.findOne();
        if (!camp) {
            console.log('No se encontró campaña para sembrar auditoría.');
            process.exit(0);
        }

        const campana_id = camp.id;
        console.log(`Sembrando auditoría E-14 para campaña ID ${campana_id}: ${camp.nombre}...`);

        // Borrar anteriores para evitar duplicados en índice único
        await DiaDMesaReporte.destroy({ where: { campana_id } });

        const sampleMesas = [
            {
                campana_id,
                departamento: camp.departamento || 'ANTIOQUIA',
                municipio: camp.municipio || 'Medellín',
                puesto_votacion: 'I.E. San Javier (Comuna 13)',
                mesa: '01',
                total_sufragantes: 240,
                votos_lista_propia: 110,
                votos_candidato_principal: 85,
                votos_en_blanco: 12,
                votos_nulos: 4,
                votos_no_marcados: 2,
                acta_e14_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
                boletin_numero: 'Boletín 14 (17:45)',
                boletin_registraduria_votos: 15,
                diferencia_votos: 70, // Faltan 70 votos en el boletín!
                estado_auditoria: 'alerta_roja',
                reclamacion_radicada: false,
                observaciones: 'Discrepancia grave detectada: Acta E-14 firmada por jurados registra 85 votos, boletín preliminar de la Registraduría solo reportó 15 votos.'
            },
            {
                campana_id,
                departamento: camp.departamento || 'ANTIOQUIA',
                municipio: camp.municipio || 'Medellín',
                puesto_votacion: 'Colegio Mayor de Antioquia',
                mesa: '02',
                total_sufragantes: 215,
                votos_lista_propia: 78,
                votos_candidato_principal: 62,
                votos_en_blanco: 8,
                votos_nulos: 3,
                votos_no_marcados: 1,
                acta_e14_url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80',
                boletin_numero: 'Boletín 15 (18:10)',
                boletin_registraduria_votos: 62,
                diferencia_votos: 0,
                estado_auditoria: 'conciliado',
                reclamacion_radicada: false,
                observaciones: 'Mesa 100% conciliada. Coincide exactamente con el preconteo oficial.'
            },
            {
                campana_id,
                departamento: camp.departamento || 'ANTIOQUIA',
                municipio: camp.municipio || 'Medellín',
                puesto_votacion: 'Escuela República de Israel',
                mesa: '05',
                total_sufragantes: 290,
                votos_lista_propia: 130,
                votos_candidato_principal: 94,
                votos_en_blanco: 15,
                votos_nulos: 5,
                votos_no_marcados: 3,
                acta_e14_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
                boletin_numero: 'Boletín 18 (18:40)',
                boletin_registraduria_votos: 44,
                diferencia_votos: 50, // Faltan 50 votos!
                estado_auditoria: 'alerta_roja',
                reclamacion_radicada: true,
                reclamacion_folio: 'REC-2026-MED-048',
                observaciones: 'Reclamación de recuento radicada ante comisión escrutadora auxiliar por presunta omisión en digitación de mesa.'
            },
            {
                campana_id,
                departamento: camp.departamento || 'ANTIOQUIA',
                municipio: camp.municipio || 'Medellín',
                puesto_votacion: 'I.U. Pascual Bravo',
                mesa: '12',
                total_sufragantes: 195,
                votos_lista_propia: 85,
                votos_candidato_principal: 73,
                votos_en_blanco: 6,
                votos_nulos: 2,
                votos_no_marcados: 1,
                acta_e14_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
                boletin_numero: null,
                boletin_registraduria_votos: null,
                diferencia_votos: 0,
                estado_auditoria: 'pendiente_boletin',
                reclamacion_radicada: false,
                observaciones: 'Acta E-14 transmitida por testigo a las 16:25. En espera de publicación de boletín por parte de Registraduría.'
            }
        ];

        for (const item of sampleMesas) {
            await DiaDMesaReporte.create(item);
        }

        console.log(`Se sembraron ${sampleMesas.length} mesas con datos de auditoría exitosamente.`);
        process.exit(0);
    } catch (error) {
        console.error('Error al sembrar auditoría:', error);
        process.exit(1);
    }
}

seedAuditoria();
