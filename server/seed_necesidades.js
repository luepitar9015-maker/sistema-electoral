const sequelize = require('./database/db');
const NecesidadCiudadana = require('./models/NecesidadCiudadana');
const Campaign = require('./models/Campaign');

async function seedNecesidades() {
    try {
        await sequelize.sync();

        const count = await NecesidadCiudadana.count();
        if (count > 0) {
            console.log(`Ya existen ${count} necesidades registradas. No se requiere seed.`);
            process.exit(0);
        }

        const firstCampaign = await Campaign.findOne();
        const campId = firstCampaign ? firstCampaign.id : null;

        const dummyNeeds = [
            {
                titulo: 'Falta de pavimentación y alcantarillado en vía principal',
                descripcion: 'La vía de acceso principal al barrio presenta huecos de gran tamaño y desbordamiento de aguas negras en temporada de lluvias. Impide el paso de transporte público.',
                categoria: 'vias_infraestructura',
                nivel_territorial: 'municipal',
                departamento: 'ANTIOQUIA',
                municipio: 'Medellín',
                comuna_corregimiento: 'Comuna 13 - San Javier',
                barrio_vereda: 'El Salado',
                direccion_referencia: 'Carrera 115 con Calle 39B',
                prioridad: 'critica_urgente',
                estado: 'reportada',
                impacto_familias_estimado: 450,
                costo_estimado: 180000000,
                competencia: 'alcaldia',
                solucion_propuesta: 'Intervención inmediata con maquinaria amarilla y postulación al banco de proyectos del municipio.',
                reportado_por_nombre: 'Hernán Darío Correa (Presidente JAC)',
                reportado_por_telefono: '3124567890',
                origen_reporte: 'lider',
                campana_id: campId
            },
            {
                titulo: 'Puesto de salud sin médico permanente ni medicamentos básicos',
                descripcion: 'El centro de salud local solo cuenta con una enfermera dos días a la semana. Los pacientes con urgencias deben trasladarse más de 2 horas a la cabecera municipal.',
                categoria: 'salud',
                nivel_territorial: 'departamental',
                departamento: 'ANTIOQUIA',
                municipio: 'Bello',
                comuna_corregimiento: 'Zona Rural',
                barrio_vereda: 'Vereda San Félix',
                direccion_referencia: 'Frente al parque central de la vereda',
                prioridad: 'critica_urgente',
                estado: 'en_analisis',
                impacto_familias_estimado: 850,
                costo_estimado: 95000000,
                competencia: 'gobernacion',
                solucion_propuesta: 'Asignación de médico rural en el esquema de la ESE departamental y dotación de ambulancia de traslado.',
                reportado_por_nombre: 'Gloria Inés Patiño',
                reportado_por_telefono: '3009876543',
                origen_reporte: 'brigada_territorial',
                campana_id: campId
            },
            {
                titulo: 'Ola de hurtos e iluminación deficiente en el parque comunal',
                descripcion: 'Luminarias quemadas desde hace 4 meses. Grupos delincuenciales han tomado la zona verde impidiendo la recreación de niños y jóvenes.',
                categoria: 'seguridad',
                nivel_territorial: 'municipal',
                departamento: 'CUNDINAMARCA',
                municipio: 'Bogotá D.C.',
                comuna_corregimiento: 'Localidad Kennedy',
                barrio_vereda: 'Castilla',
                direccion_referencia: 'Parque Los Fundadores',
                prioridad: 'alta',
                estado: 'en_gestion',
                impacto_familias_estimado: 1200,
                costo_estimado: 35000000,
                competencia: 'alcaldia',
                solucion_propuesta: 'Modernización a luminarias LED y solicitud de CAI móvil o patrullaje cuadrante nocturno.',
                reportado_por_nombre: 'Javier Restrepo',
                reportado_por_telefono: '3157891234',
                origen_reporte: 'whatsapp',
                campana_id: campId
            },
            {
                titulo: 'Desabastecimiento continuo de agua potable en sector alto',
                descripcion: 'La presión del acueducto no llega a las zonas altas. Las familias reciben agua únicamente 3 horas cada dos días.',
                categoria: 'servicios_publicos_agua',
                nivel_territorial: 'nacional',
                departamento: 'ATLÁNTICO',
                municipio: 'Soledad',
                comuna_corregimiento: 'Sector Villa Katanga',
                barrio_vereda: 'Los Almendros',
                direccion_referencia: 'Calle 54 con Diagonal 23',
                prioridad: 'critica_urgente',
                estado: 'en_plan_desarrollo',
                impacto_familias_estimado: 2300,
                costo_estimado: 450000000,
                competencia: 'nacion_congreso',
                solucion_propuesta: 'Construcción de tanque de almacenamiento compensatorio y gestión de recursos con MinVivienda.',
                reportado_por_nombre: 'Cielo Vargas',
                reportado_por_telefono: '3012345678',
                origen_reporte: 'ciudadano_web',
                campana_id: campId
            },
            {
                titulo: 'Altos índices de desempleo juvenil y deserción escolar',
                descripcion: 'Jóvenes egresados de bachillerato no cuentan con oportunidades de formación técnica ni empleo local, propensos a vinculación con bandas delincuenciales.',
                categoria: 'empleo_desarrollo',
                nivel_territorial: 'municipal',
                departamento: 'VALLE DEL CAUCA',
                municipio: 'Cali',
                comuna_corregimiento: 'Comuna 15',
                barrio_vereda: 'El Vallado',
                direccion_referencia: 'Casa de la Juventud',
                prioridad: 'alta',
                estado: 'reportada',
                impacto_familias_estimado: 1500,
                costo_estimado: 120000000,
                competencia: 'alcaldia',
                solucion_propuesta: 'Convenio con SENA para abrir cursos técnicos descentralizados y banco de primer empleo con incentivos tributarios.',
                reportado_por_nombre: 'Mauricio Caicedo',
                reportado_por_telefono: '3187654321',
                origen_reporte: 'lider',
                campana_id: campId
            }
        ];

        await NecesidadCiudadana.bulkCreate(dummyNeeds);
        console.log(`Se sembraron ${dummyNeeds.length} necesidades ciudadanas de ejemplo exitosamente.`);
        process.exit(0);
    } catch (err) {
        console.error('Error al sembrar necesidades:', err);
        process.exit(1);
    }
}

seedNecesidades();
