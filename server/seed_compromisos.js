const sequelize = require('./database/db');
const Campaign = require('./models/Campaign');
const CompromisoGestion = require('./models/CompromisoGestion');

async function seedCompromisos() {
    try {
        await sequelize.sync();

        const count = await CompromisoGestion.count();
        if (count > 0) {
            console.log(`Ya existen ${count} compromisos de gestión registrados.`);
            process.exit(0);
        }

        const camp = await Campaign.findOne();
        if (!camp) {
            console.log('No se encontró ninguna campaña para asociar compromisos.');
            process.exit(0);
        }

        // Actualizar la campaña para que tenga modo_operacion y periodo
        camp.modo_operacion = 'gestion_cargo';
        camp.periodo_gobierno = '2024-2027';
        await camp.save();

        const dummyCompromisos = [
            {
                campana_id: camp.id,
                titulo: 'Pavimentación de la vía perimetral y ciclorruta comunitaria',
                descripcion: 'Compromiso adquirido en asamblea barrial. Pavimentación de 2.5 km en asfalto rígido e iluminación LED.',
                tipo: 'obra_infraestructura',
                departamento: camp.departamento || 'ANTIOQUIA',
                municipio: camp.municipio || 'Medellín',
                barrio_comuna: 'Comuna 13 - San Javier',
                estado: 'cumplido_entregado',
                inversion_presupuesto: 350000000,
                fecha_inicio: '2024-03-15',
                fecha_cumplimiento: '2025-01-20',
                beneficiarios_estimados: 4200
            },
            {
                campana_id: camp.id,
                titulo: 'Radicación de Proyecto de Ley / Acuerdo sobre subsidios al adulto mayor',
                descripcion: 'Iniciativa normativa radicada en plenaria para garantizar bono nutricional a mayores de 65 años sin pensión.',
                tipo: 'proyecto_normativo',
                departamento: camp.departamento || 'ANTIOQUIA',
                municipio: camp.municipio || 'Medellín',
                barrio_comuna: 'Cobertura General',
                estado: 'en_ejecucion',
                inversion_presupuesto: 80000000,
                fecha_inicio: '2024-06-01',
                fecha_cumplimiento: '2025-06-30',
                beneficiarios_estimados: 12000
            },
            {
                campana_id: camp.id,
                titulo: 'Debate de control político sobre seguridad y cámaras de videovigilancia',
                descripcion: 'Citación a secretaría de seguridad para exigir operatividad del 100% de las cámaras y presencia de cuadrantes motorizados.',
                tipo: 'debate_control',
                departamento: camp.departamento || 'ANTIOQUIA',
                municipio: camp.municipio || 'Medellín',
                barrio_comuna: 'Comuna 4 - Aranjuez',
                estado: 'cumplido_entregado',
                inversion_presupuesto: 0,
                fecha_inicio: '2024-09-10',
                fecha_cumplimiento: '2024-09-25',
                beneficiarios_estimados: 8500
            }
        ];

        await CompromisoGestion.bulkCreate(dummyCompromisos);
        console.log(`Se sembraron ${dummyCompromisos.length} compromisos de gestión exitosamente.`);
        process.exit(0);
    } catch (err) {
        console.error('Error al sembrar compromisos:', err);
        process.exit(1);
    }
}

seedCompromisos();
