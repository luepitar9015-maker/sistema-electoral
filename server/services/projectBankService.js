const ProyectoInversion = require('../models/ProyectoInversion');
const ProyectoDocumento = require('../models/ProyectoDocumento');
const NecesidadCiudadana = require('../models/NecesidadCiudadana');
const Campaign = require('../models/Campaign');
const { Op } = require('sequelize');

/**
 * Catálogo Maestro de Sectores, Ministerios, Líneas de Financiación y Requisitos Anti-Devolución
 * Basado en las metodologías oficiales de MGA (DNP), Invías, MinVivienda, MinInterior y Regalías (SGR).
 */
const SECTORES_CONFIG = {
    transporte_vias: {
        nombre: 'Transporte y Vías Terciarias',
        ministerio: 'MinTransporte / Invías',
        lineas_convocatorias: [
            'Caminos Comunitarios de la Paz Total (JAC y Municipios)',
            'Placa Huellas en Corredores Veredales Estratégicos',
            'Mantenimiento y Mejoramiento de Red Terciaria Rural',
            'Construcción de Obras de Drenaje, Box Coulvert y Pontones'
        ],
        codigo_producto_dnp: '2101004',
        nombre_producto_dnp: 'Vías terciarias mejoradas o rehabilitadas',
        indicador_dnp: 'Kilómetros de red vial terciaria intervenida',
        requisitos: [
            {
                id: 'titularidad_faja_via',
                nombre: 'Certificación de Faja de Vía Pública Municipal o Departamental',
                bloqueante: true,
                descripcion: 'Acto administrativo que certifique que la vía es de uso público y no privada.',
                motivo_devolucion_comun: 'Presentar vías que cruzan fincas privadas sin servidumbre pública formalizada ante notaría.'
            },
            {
                id: 'certificado_riesgo_cmgrd',
                nombre: 'Certificado de Gestión del Riesgo y Amenaza (CMGRD)',
                bloqueante: true,
                descripcion: 'Emitido por el Consejo Municipal de Gestión del Riesgo certificando que la zona NO presenta fallas activas o deslizamientos no mitigables.',
                motivo_devolucion_comun: 'No adjuntar concepto o adjuntar uno genérico sin coordenadas del trazado vial.'
            },
            {
                id: 'topografia_geotecnia',
                nombre: 'Estudios Topográficos y Geotécnicos (CBR)',
                bloqueante: true,
                descripcion: 'Levantamiento topográfico con cartera de campo y sondeos de suelo con ensayos de laboratorio firmados por ingeniero civil.',
                motivo_devolucion_comun: 'Usar cotas aproximadas de Google Earth sin cartera topográfica real.'
            },
            {
                id: 'disenos_fase3_planos',
                nombre: 'Diseños de Ingeniería a Fase III y Planos Estructurales',
                bloqueante: true,
                descripcion: 'Plano en planta, perfil, sección transversal, diseño de cunetas, alcantarillas y disipadores.',
                motivo_devolucion_comun: 'Entregar bosquejos preliminares o renders en lugar de planos constructivos acotados.'
            },
            {
                id: 'presupuesto_apu_invias',
                nombre: 'Presupuesto Detallado y Análisis de Precios Unitarios (APU)',
                bloqueante: true,
                descripcion: 'Precios unitarios justificados con cotizaciones de la región o tabla oficial de la Gobernación/Invías con desglose de AIU.',
                motivo_devolucion_comun: 'Precios de insumos (cemento, triturado) desactualizados o cálculo erróneo del porcentaje de AIU.'
            },
            {
                id: 'especificaciones_tecnicas',
                nombre: 'Especificaciones Técnicas Particulares de Construcción',
                bloqueante: false,
                descripcion: 'Normas de calidad del concreto (3000 PSI), acero de refuerzo, base y subbase granular.',
                motivo_devolucion_comun: 'Copiar especificaciones de otro proyecto sin adaptar al clima y suelo local.'
            },
            {
                id: 'permiso_cauce_car',
                nombre: 'Permiso de Ocupación de Cauce (CAR)',
                bloqueante: false,
                descripcion: 'Requerido si la placa huella incluye box culvert o alcantarilla sobre fuente hídrica.',
                motivo_devolucion_comun: 'Construir sobre quebradas sin permiso ambiental de la Corporación Autónoma Regional.'
            },
            {
                id: 'armonizacion_pdm',
                nombre: 'Certificado de Armonización con el Plan de Desarrollo',
                bloqueante: true,
                descripcion: 'Certificación del Secretario de Planeación vinculando el proyecto a la meta del PDM/PDD.',
                motivo_devolucion_comun: 'No concordancia entre el nombre del programa municipal y la ficha del proyecto.'
            },
            {
                id: 'acta_socializacion_jac',
                nombre: 'Acta de Concertación y Socialización Comunitaria',
                bloqueante: false,
                descripcion: 'Firma de los beneficiarios veredales y Junta de Acción Comunal respaldando la priorización del tramo.',
                motivo_devolucion_comun: 'No demostrar participación de la comunidad en convocatorias del gobierno del cambio/Invías.'
            }
        ]
    },

    agua_saneamiento: {
        nombre: 'Agua Potable y Saneamiento Básico',
        ministerio: 'MinVivienda',
        lineas_convocatorias: [
            'Ventanilla Única de Agua Potable y Saneamiento (MinVivienda)',
            'Construcción y Optimización de Acueductos Veredales y PTAP',
            'Sistemas de Alcantarillado y Tratamiento de Aguas Residuales (PTAR)',
            'Soluciones Individuales de Saneamiento Básico Rural'
        ],
        codigo_producto_dnp: '4001001',
        nombre_producto_dnp: 'Sistemas de acueducto construidos o mejorados',
        indicador_dnp: 'Número de personas con acceso a agua potable con continuidad',
        requisitos: [
            {
                id: 'titularidad_predio_acueducto',
                nombre: 'Titularidad del Predio de Bocatoma, Desarenador y PTAP',
                bloqueante: true,
                descripcion: 'Certificado de Tradición y Libertad a nombre del Municipio o servidumbre formalizada en escritura pública.',
                motivo_devolucion_comun: 'Predios privados sin servidumbre legalizada o con gravámenes/embargos.'
            },
            {
                id: 'concesion_aguas_car',
                nombre: 'Resolución de Concesión de Aguas Superficiales o Subterráneas (CAR)',
                bloqueante: true,
                descripcion: 'Permiso vigente de la autoridad ambiental que garantiza caudal suficiente para la población.',
                motivo_devolucion_comun: 'Concesión ambiental vencida o con caudal asignado inferior a la demanda del diseño.'
            },
            {
                id: 'caracterizacion_agua_laboratorio',
                nombre: 'Ensayos de Caracterización Fisicoquímica y Microbiológica del Agua',
                bloqueante: true,
                descripcion: 'Muestreos de laboratorio certificado en época seca y de lluvia para diseñar el tren de tratamiento.',
                motivo_devolucion_comun: 'Diseñar la planta potabilizadora sin conocer la turbiedad y contaminación real de la fuente.'
            },
            {
                id: 'calculo_hidraulico_memorias',
                nombre: 'Memorias de Cálculo Hidráulico y Estructural (RAS)',
                bloqueante: true,
                descripcion: 'Cumplimiento estricto del Reglamento Técnico del Sector de Agua Potable y Saneamiento Básico (RAS).',
                motivo_devolucion_comun: 'Diámetros de tubería sin justificación de pérdidas de carga o presiones mínimas.'
            },
            {
                id: 'certificado_riesgo_acueducto',
                nombre: 'Certificado de Gestión del Riesgo en Infraestructura Hidráulica',
                bloqueante: true,
                descripcion: 'Garantizar que la bocatoma o planta no esté en área de desbordamiento torrencial o avalancha.',
                motivo_devolucion_comun: 'Ubicación de plantas en zonas de inundación periódica del río.'
            },
            {
                id: 'esquema_sostenibilidad_operador',
                nombre: 'Esquema de Sostenibilidad y Modelo de Operación Tarifaria',
                bloqueante: true,
                descripcion: 'Designación formal del operador (empresa de servicios públicos o junta administradora de acueducto).',
                motivo_devolucion_comun: 'No demostrar quién pagará el cloro, químicos, energía y mantenimiento en los próximos 10 años.'
            }
        ]
    },

    agricultura_rural: {
        nombre: 'Desarrollo Agropecuario y Riego',
        ministerio: 'MinAgricultura / ADR',
        lineas_convocatorias: [
            'Proyectos Integrales de Desarrollo Agropecuario y Rural (PIDAR)',
            'Distritos de Pequeña Irrigación y Cosecha de Agua',
            'Alianzas Productivas para Comercialización Campesina',
            'Dotación de Maquinaria Verde y Centros de Acopio Rural'
        ],
        codigo_producto_dnp: '1701005',
        nombre_producto_dnp: 'Proyectos productivos agropecuarios cofinanciados',
        indicador_dnp: 'Número de productores agropecuarios beneficiados con incremento de ingresos',
        requisitos: [
            {
                id: 'personeria_asociacion_productores',
                nombre: 'Personería Jurídica, RUT y Representación Legal de la Asociación',
                bloqueante: true,
                descripcion: 'Cámara de Comercio vigente y Junta Directiva registrada ante entidad competente.',
                motivo_devolucion_comun: 'Juntas directivas vencidas o RUT no actualizado con la actividad económica principal.'
            },
            {
                id: 'censo_productores_ruv',
                nombre: 'Censo Georreferenciado de Familias Productoras',
                bloqueante: true,
                descripcion: 'Listado con cédula, tamaño del predio, geolocalización, línea productiva y verificación de pequeños productores.',
                motivo_devolucion_comun: 'Incluir beneficiarios que no son productores reales o que ya fueron beneficiados en convocatorias paralelas.'
            },
            {
                id: 'acuerdos_comerciales_compra',
                nombre: 'Cartas de Intención de Compra y Alianza Comercial',
                bloqueante: true,
                descripcion: 'Acuerdos formales con compradores mayoristas o agroindustria que aseguren la venta de la cosecha.',
                motivo_devolucion_comun: 'Formular el proyecto sin demostrar quién comprará los productos, generando inviabilidad financiera.'
            },
            {
                id: 'flujo_financiero_van_tir',
                nombre: 'Evaluación Financiera (Flujo de Caja, VAN y TIR)',
                bloqueante: true,
                descripcion: 'Modelo económico que demuestre que el proyecto es autosostenible una vez finalice el subsidio.',
                motivo_devolucion_comun: 'TIR negativa o no contemplar costos de transporte e insumos en el flujo de caja.'
            }
        ]
    },

    seguridad_convivencia: {
        nombre: 'Seguridad y Convivencia Ciudadana',
        ministerio: 'MinInterior / FONSECON',
        lineas_convocatorias: [
            'Fondo de Seguridad y Convivencia Ciudadana (FONSECON)',
            'Centros de Integración Ciudadana (CIC - Sacúdete)',
            'Sistemas de Circuito Cerrado de Televisión (CCTV y Cámaras IA)',
            'Construcción y Dotación de Subestaciones y CAIs de Policía'
        ],
        codigo_producto_dnp: '0301002',
        nombre_producto_dnp: 'Infraestructura para la seguridad y convivencia construida',
        indicador_dnp: 'Número de espacios de integración comunitaria y seguridad habilitados',
        requisitos: [
            {
                id: 'acta_comite_orden_publico',
                nombre: 'Acta de Aprobación del Comité Territorial de Orden Público',
                bloqueante: true,
                descripcion: 'Acta firmada por el Alcalde, Policía Nacional, Ejército y Fiscalía priorizando la necesidad.',
                motivo_devolucion_comun: 'Radicar sin el aval de la Policía Nacional y de las fuerzas de seguridad del municipio.'
            },
            {
                id: 'predio_institucional_fonsecon',
                nombre: 'Certificado de Tradición de Predio Institucional sin Gravámenes',
                bloqueante: true,
                descripcion: 'Predio a nombre del municipio debidamente saneado y con destino a seguridad o recreación comunal.',
                motivo_devolucion_comun: 'Predios comunales no cedidos al municipio o con afectación a vivienda de interés social.'
            },
            {
                id: 'piscc_vigente',
                nombre: 'Plan Integral de Seguridad y Convivencia Ciudadana (PISCC) Vigente',
                bloqueante: true,
                descripcion: 'Copia del PISCC adoptado por decreto municipal donde se evidencie la meta del proyecto.',
                motivo_devolucion_comun: 'PISCC desactualizado del cuatrienio anterior no alineado con el nuevo mandato.'
            }
        ]
    },

    deporte_recreacion: {
        nombre: 'Deporte, Recreación y Espacio Público',
        ministerio: 'MinDeporte',
        lineas_convocatorias: [
            'Construcción de Placas Polideportivas Cubiertas',
            'Adecuación de Canchas de Fútbol en Grama Sintética',
            'Pistas de Patinaje y Complejos Recreodeportivos Urbanos',
            'Parques Infantiles y Zonas Biosaludables'
        ],
        codigo_producto_dnp: '4301003',
        nombre_producto_dnp: 'Escenarios recreativos y deportivos construidos o adecuados',
        indicador_dnp: 'Metros cuadrados de espacio deportivo público construidos',
        requisitos: [
            {
                id: 'titularidad_predio_deporte',
                nombre: 'Folio de Matrícula Inmobiliaria a Nombre del Municipio',
                bloqueante: true,
                descripcion: 'Expedido con antigüedad inferior a 30 días, libre de embargos y falsa tradición.',
                motivo_devolucion_comun: 'Terrenos cedidos verbalmente por la comunidad pero que siguen a nombre de un particular.'
            },
            {
                id: 'calculo_estructural_nsr10',
                nombre: 'Estudio de Suelos y Cálculo Estructural bajo Norma NSR-10',
                bloqueante: true,
                descripcion: 'Memorias de cálculo de la cubierta metálica, cimentación y graderías firmadas por ingeniero calculista.',
                motivo_devolucion_comun: 'Presentar estructuras metálicas sin firma de ingeniero con tarjeta profesional y peritaje sísmico.'
            },
            {
                id: 'diseno_drenajes_aguas_lluvias',
                nombre: 'Estudio Hidrosanitario y Sistema de Drenaje',
                bloqueante: true,
                descripcion: 'Evitar empozamientos en la superficie deportiva mediante filtros franceses y tuberías perimetrales.',
                motivo_devolucion_comun: 'Canchas sintéticas que se inundan en el primer aguacero por falta de filtros subterráneos.'
            },
            {
                id: 'compromiso_mantenimiento_10anos',
                nombre: 'Certificado de Mantenimiento y Gratuidad Pública',
                bloqueante: false,
                descripcion: 'Compromiso del alcalde de garantizar el acceso libre a los jóvenes y presupuesto anual de aseo y pintura.',
                motivo_devolucion_comun: 'Proyectos que cobran tarifas comerciales para ingresar al polideportivo público.'
            }
        ]
    }
};

class ProjectBankService {

    /**
     * Obtener listado de sectores y requisitos oficiales para la interfaz
     */
    getSectoresConfig() {
        return SECTORES_CONFIG;
    }

    /**
     * Agrupa necesidades ciudadanas seleccionadas y las transforma en una iniciativa de proyecto macro
     */
    async agruparNecesidadesAProyecto({ necesidadIds, titulo, campanaId, userId, sector, municipio, departamento }) {
        const necesidades = await NecesidadCiudadana.findAll({
            where: { id: { [Op.in]: necesidadIds } }
        });

        if (!necesidades.length) {
            throw new Error('No se encontraron las necesidades seleccionadas');
        }

        // Sector y territorio deducidos de las necesidades si no se pasaron
        const sectorFinal = sector || necesidades[0].categoria || 'transporte_vias';
        const deptoFinal = departamento || necesidades[0].departamento;
        const muniFinal = municipio || necesidades[0].municipio;

        const config = SECTORES_CONFIG[sectorFinal] || SECTORES_CONFIG.transporte_vias;

        // Sumar beneficiarios e impacto
        const familiasTotal = necesidades.reduce((sum, n) => sum + (n.impacto_familias_estimado || 15), 0);
        const poblacionEstimada = familiasTotal * 4; // Promedio 4 personas por núcleo familiar

        // Calcular costo preliminar sumando reportes o estimación base paramétrica
        let costoTotal = necesidades.reduce((sum, n) => sum + parseFloat(n.costo_estimado || 0), 0);
        if (costoTotal <= 0) {
            // Estimación paramétrica base en Colombia según sector
            const costosBaseParametricos = {
                transporte_vias: 850000000, // ~1 km placa huella promedio
                agua_saneamiento: 1200000000,
                agricultura_rural: 450000000,
                seguridad_convivencia: 750000000,
                deporte_recreacion: 550000000
            };
            costoTotal = costosBaseParametricos[sectorFinal] || 600000000;
        }

        const montoNacion = Math.round(costoTotal * 0.9); // 90% financiado por Nación/Ministerio
        const contrapartida = Math.round(costoTotal * 0.1); // 10% cofinanciación municipal

        // Consolidar resumen de testimonios comunitarios
        const testimonios = necesidades.map((n, i) => `• [${n.barrio_vereda || 'Comunidad'}]: ${n.titulo} - "${n.descripcion}"`).join('\n');

        const tituloFinal = titulo || `Construcción y Adecuación de ${config.nombre} en ${muniFinal} (${necesidades.map(n => n.barrio_vereda).filter(Boolean).slice(0, 3).join(', ')})`;

        // Inicializar checklist de requisitos en estado pendiente
        const initialChecklist = config.requisitos.map(r => ({
            id: r.id,
            nombre: r.nombre,
            bloqueante: r.bloqueante,
            motivo_devolucion_comun: r.motivo_devolucion_comun,
            cumplido: false,
            observacion: 'Pendiente de cargue o validación documental.'
        }));

        // Crear el proyecto de inversión en la base de datos
        const nuevoProyecto = await ProyectoInversion.create({
            titulo: tituloFinal,
            sector: sectorFinal,
            ministerio_objetivo: config.ministerio,
            linea_convocatoria: config.lineas_convocatorias[0] || 'Convocatoria Nacional Ordinaria',
            entidad_postulante_tipo: 'alcaldia',
            departamento: deptoFinal,
            municipio: muniFinal,
            zona_localidad: necesidades.map(n => n.barrio_vereda).filter(Boolean).slice(0, 4).join(', ') || 'Zona Rural / Urbana',
            poblacion_beneficiada: poblacionEstimada,
            costo_estimado_total: costoTotal,
            monto_solicitado_nacion: montoNacion,
            contrapartida_local: contrapartida,
            estado: 'idea_perfil',
            score_antidevolucion: 15,
            riesgo_devolucion: 'alto',
            resumen_problema: `Iniciativa priorizada a partir de ${necesidades.length} demandas ciudadanas registradas en el territorio:\n\n${testimonios}`,
            checklist_requisitos_json: JSON.stringify(initialChecklist),
            campana_id: campanaId || null,
            creado_por_id: userId || null
        });

        // Enlazar las necesidades con este proyecto
        await NecesidadCiudadana.update(
            { proyecto_id: nuevoProyecto.id, estado: 'en_gestion' },
            { where: { id: { [Op.in]: necesidadIds } } }
        );

        return nuevoProyecto;
    }

    /**
     * Auditoría Forense Preventiva Anti-Devolución
     * Evalúa el cumplimiento técnico de cada requisito y calcula el score y riesgo de devolución.
     */
    async auditarViabilidadAntiDevolucion(proyectoId) {
        const proyecto = await ProyectoInversion.findByPk(proyectoId, {
            include: [{ model: ProyectoDocumento, as: 'documentos' }]
        });

        if (!proyecto) throw new Error('Proyecto no encontrado');

        const config = SECTORES_CONFIG[proyecto.sector] || SECTORES_CONFIG.transporte_vias;
        let currentChecklist = [];

        try {
            currentChecklist = JSON.parse(proyecto.checklist_requisitos_json || '[]');
        } catch (e) {
            currentChecklist = [];
        }

        // Si no tenía checklist cargado, inicializar con el del sector
        if (!currentChecklist.length) {
            currentChecklist = config.requisitos.map(r => ({
                id: r.id,
                nombre: r.nombre,
                bloqueante: r.bloqueante,
                motivo_devolucion_comun: r.motivo_devolucion_comun,
                cumplido: false,
                observacion: 'Pendiente de cargue o validación documental.'
            }));
        }

        // Cruzar con los documentos físicos subidos
        const docsSubidos = proyecto.documentos || [];
        const causalesDevolucionInmediata = [];
        let cumplidosCount = 0;
        let bloqueantesCumplidos = 0;
        let totalBloqueantes = 0;

        currentChecklist.forEach(item => {
            if (item.bloqueante) totalBloqueantes++;

            // Buscar si hay documento cargado y aprobado para este requisito
            const doc = docsSubidos.find(d => d.tipo_documento === item.id);
            if (doc && doc.estado_revision === 'aprobado_cumple') {
                item.cumplido = true;
                item.observacion = `Documento validado: "${doc.nombre_archivo}".`;
                cumplidosCount++;
                if (item.bloqueante) bloqueantesCumplidos++;
            } else if (!item.cumplido) {
                if (item.bloqueante) {
                    causalesDevolucionInmediata.push({
                        requisito: item.nombre,
                        alerta: `CAUSAL DE DEVOLUCIÓN INMEDIATA: ${item.motivo_devolucion_comun}`
                    });
                }
            } else {
                cumplidosCount++;
                if (item.bloqueante) bloqueantesCumplidos++;
            }
        });

        // Cálculo de Score (0 - 100%)
        // Los requisitos bloqueantes pesan el 75% del score y los no bloqueantes el 25%
        const scoreBloqueantes = totalBloqueantes > 0 ? (bloqueantesCumplidos / totalBloqueantes) * 75 : 0;
        const noBloqueantesTotal = currentChecklist.length - totalBloqueantes;
        const noBloqueantesCumplidos = cumplidosCount - bloqueantesCumplidos;
        const scoreNoBloqueantes = noBloqueantesTotal > 0 ? (noBloqueantesCumplidos / noBloqueantesTotal) * 25 : 25;

        const scoreFinal = Math.min(100, Math.round(scoreBloqueantes + scoreNoBloqueantes));

        let nivelRiesgo = 'bajo';
        let nuevoEstado = proyecto.estado;

        if (scoreFinal < 40 || causalesDevolucionInmediata.length >= 3) {
            nivelRiesgo = 'critico';
            nuevoEstado = 'idea_perfil';
        } else if (scoreFinal < 75 || causalesDevolucionInmediata.length > 0) {
            nivelRiesgo = 'alto';
            nuevoEstado = 'revision_antidevolucion';
        } else if (scoreFinal < 95) {
            nivelRiesgo = 'medio';
            nuevoEstado = 'revision_antidevolucion';
        } else {
            nivelRiesgo = 'bajo';
            nuevoEstado = 'listo_radicar';
        }

        // Construir Dictamen Técnico Preventivo
        const dictamen = `DIAGNÓSTICO DE PRE-VIABILIDAD MINISTERIAL (AUDITORÍA ANTI-DEVOLUCIÓN)\n` +
            `• Entidad Destino: ${proyecto.ministerio_objetivo}\n` +
            `• Convocatoria / Línea: ${proyecto.linea_convocatoria}\n` +
            `• Nivel de Riesgo de Rechazo / Devolución: ${nivelRiesgo.toUpperCase()}\n` +
            `• Índice de Madurez Documental: ${scoreFinal}% (Requisitos Bloqueantes: ${bloqueantesCumplidos}/${totalBloqueantes})\n\n` +
            (causalesDevolucionInmediata.length > 0
                ? `🚨 ALERTAS BLOQUEANTES DETECTADAS (${causalesDevolucionInmediata.length}):\n` +
                  causalesDevolucionInmediata.map((c, i) => `${i + 1}. [${c.requisito}] -> ${c.alerta}`).join('\n') +
                  `\n\n⚠️ RECOMENDACIÓN TÉCNICA: NO radicar ante el Ministerio hasta subsanar los puntos anteriores, de lo contrario el proyecto será devuelto en el primer filtro de ventanilla única.`
                : `✅ EXPEDIENTE TÉCNICO COMPLETO: Todos los requisitos obligatorios y bloqueantes del sector han sido verificados. El proyecto cuenta con alta viabilidad para radicación formal.`);

        // Actualizar en base de datos
        proyecto.score_antidevolucion = scoreFinal;
        proyecto.riesgo_devolucion = nivelRiesgo;
        proyecto.estado = nuevoEstado;
        proyecto.checklist_requisitos_json = JSON.stringify(currentChecklist);
        proyecto.dictamen_auditoria = dictamen;
        await proyecto.save();

        return {
            score: scoreFinal,
            riesgo: nivelRiesgo,
            estado: nuevoEstado,
            causalesDevolucion: causalesDevolucionInmediata,
            dictamen,
            checklist: currentChecklist
        };
    }

    /**
     * Formulación Metodológica MGA con IA (Gemini / Motor Experto DNP)
     */
    async formularProyectoMGA_IA(proyectoId) {
        const proyecto = await ProyectoInversion.findByPk(proyectoId);
        if (!proyecto) throw new Error('Proyecto no encontrado');

        const config = SECTORES_CONFIG[proyecto.sector] || SECTORES_CONFIG.transporte_vias;

        // Si tenemos API Key de Gemini, generamos formulación avanzada estructurada
        const apiKey = process.env.GEMINI_API_KEY;
        let aiResult = null;

        if (apiKey) {
            try {
                const prompt = `
Actúa como el estructurador senior de proyectos de inversión pública en Colombia (experto certificado en Metodología General Ajustada - MGA del Departamento Nacional de Planeación DNP).

Formula la estructuración técnica oficial para radicar ante ${proyecto.ministerio_objetivo}:
- Título: ${proyecto.titulo}
- Sector: ${config.nombre}
- Entidad: ${proyecto.entidad_postulante_tipo} de ${proyecto.municipio} (${proyecto.departamento})
- Población Beneficiaria: ${proyecto.poblacion_beneficiada} habitantes
- Presupuesto Estimado: $${Number(proyecto.costo_estimado_total).toLocaleString('es-CO')} COP
- Antecedentes comunitarios: ${proyecto.resumen_problema || 'Demandas de la comunidad registradas en territorio'}

Responde EXCLUSIVAMENTE en formato JSON con la siguiente estructura exacta:
{
  "arbol_problemas": {
    "problema_central": "Definición técnica clara y concisa del problema central en términos de carencia o limitación",
    "causas_directas": ["Causa directa 1 técnica", "Causa directa 2 institucional"],
    "causas_indirectas": ["Causa indirecta 1", "Causa indirecta 2"],
    "efectos_directos": ["Efecto directo 1 sobre la comunidad", "Efecto directo 2 sobre la economía"],
    "efectos_indirectos": ["Efecto indirecto 1 (deterioro social)", "Efecto indirecto 2 (pérdida de competitividad)"]
  },
  "arbol_objetivos": {
    "objetivo_general": "Verbo en infinitivo + objeto + condición técnica + localización territorial",
    "medios_directos": ["Medio directo 1 (obras físicas)", "Medio directo 2 (gestión comunitaria)"],
    "medios_indirectos": ["Medio indirecto 1", "Medio indirecto 2"],
    "fines_directos": ["Fin directo 1", "Fin directo 2"],
    "fines_indirectos": ["Fin indirecto 1 (impacto duradero en el bienestar)", "Fin indirecto 2"]
  },
  "cadena_valor_mga": {
    "codigo_producto_dnp": "${config.codigo_producto_dnp}",
    "nombre_producto_dnp": "${config.nombre_producto_dnp}",
    "indicador_producto": "${config.indicador_dnp}",
    "meta_cuantitativa": "Cifra y unidad de medida",
    "actividades_principales": [
      { "nombre": "Fase 1: Preliminares, replanteo y obras de contención", "costo_porcentaje": "20%" },
      { "nombre": "Fase 2: Ejecución de obras principales de infraestructura y control de calidad", "costo_porcentaje": "65%" },
      { "nombre": "Fase 3: Interventoría técnica, plan de manejo ambiental y entrega", "costo_porcentaje": "15%" }
    ]
  },
  "justificacion_tecnica": "Texto formal de 2 párrafos con justificación técnica, legal y socioeconómica alineada con el Plan Nacional de Desarrollo y las bases sectoriales del ministerio.",
  "puntos_clave_para_no_devolucion": [
    "Recomendación crítica 1 para no ser rechazado por el evaluador",
    "Recomendación crítica 2 de consistencia presupuestal"
  ]
}
`;

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            responseMimeType: 'application/json',
                            temperature: 0.3
                        }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const textOut = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (textOut) {
                        aiResult = JSON.parse(textOut);
                    }
                }
            } catch (err) {
                console.warn('Fallo en IA Gemini para MGA, recurriendo al motor de formulación experto:', err.message);
            }
        }

        // Si no hay API Key o falló la respuesta, usamos el motor experto de respaldo
        if (!aiResult) {
            aiResult = {
                arbol_problemas: {
                    problema_central: `Deficiente infraestructura de ${config.nombre.toLowerCase()} y limitada capacidad de respuesta territorial en ${proyecto.municipio} (${proyecto.departamento}).`,
                    causas_directas: [
                        `Inexistencia o deterioro progresivo de obras de infraestructura adecuada en el sector.`,
                        `Limitada disponibilidad presupuestal de fuentes corrientes para financiar inversiones de gran escala.`
                    ],
                    causas_indirectas: [
                        `Condiciones climáticas severas que aceleran el desgaste de las intervenciones provisionales.`,
                        `Histórico rezago en la cofinanciación con partidas del orden nacional.`
                    ],
                    efectos_directos: [
                        `Afectación a la movilidad, salubridad y calidad de vida de más de ${proyecto.poblacion_beneficiada} habitantes.`,
                        `Incremento en los costos de transporte de cosechas y pérdida de competitividad de las familias.`
                    ],
                    efectos_indirectos: [
                        `Migración de población joven hacia centros urbanos y reducción de la productividad rural.`,
                        `Aumento de la vulnerabilidad socioeconómica y reclamos constantes a la administración pública.`
                    ]
                },
                arbol_objetivos: {
                    objetivo_general: `Construir y optimizar la infraestructura de ${config.nombre.toLowerCase()} para garantizar conectividad, bienestar y desarrollo social en ${proyecto.municipio} (${proyecto.departamento}).`,
                    medios_directos: [
                        `Ejecutar obras de infraestructura bajo especificaciones técnicas de alta resistencia y durabilidad.`,
                        `Articular fuentes de cofinanciación entre la Nación (${proyecto.ministerio_objetivo}) y la Entidad Territorial.`
                    ],
                    medios_indirectos: [
                        `Implementar planes de manejo ambiental y drenajes para mitigar el impacto pluvial.`,
                        `Fortalecer la veeduría y el control social a través de las Juntas de Acción Comunal.`
                    ],
                    fines_directos: [
                        `Reducir los tiempos de traslado, costos de operación y mejorar la salubridad comunitaria.`,
                        `Aumentar el acceso permanente de la población a servicios esenciales de salud, educación y comercio.`
                    ],
                    fines_indirectos: [
                        `Fomentar el arraigo territorial, la reactivación económica del campo y la equidad social.`,
                        `Consolidar la confianza de la ciudadanía en las instituciones del Estado mediante obras concretas.`
                    ]
                },
                cadena_valor_mga: {
                    codigo_producto_dnp: config.codigo_producto_dnp,
                    nombre_producto_dnp: config.nombre_producto_dnp,
                    indicador_producto: config.indicador_dnp,
                    meta_cuantitativa: `Intervención integral certificada para ${proyecto.poblacion_beneficiada} personas`,
                    actividades_principales: [
                        { nombre: 'Actividad 1: Topografía, estudios definitivos y descapote inicial', costo_porcentaje: '10%' },
                        { nombre: 'Actividad 2: Construcción de obras principales y estructuras de contención', costo_porcentaje: '75%' },
                        { nombre: 'Actividad 3: Interventoría técnica integral y plan de manejo de tráfico y ambiental', costo_porcentaje: '15%' }
                    ]
                },
                justificacion_tecnica: `El presente proyecto responde a una imperiosa necesidad socioeconómica en el municipio de ${proyecto.municipio}. De acuerdo con los lineamientos del Departamento Nacional de Planeación (DNP) y los objetivos de desarrollo territorial, la intervención es técnicamente viable, ambientalmente sostenible y socioeconómicamente rentable, generando una relación beneficio-costo positiva para las familias beneficiarias.`,
                puntos_clave_para_no_devolucion: [
                    'Verificar que el certificado de tradición tenga fecha de expedición inferior a 30 días calendario.',
                    'Asegurar que los precios unitarios del presupuesto cuenten con mínimo 2 cotizaciones del mercado local.',
                    'Adjuntar el concepto del Consejo Municipal de Gestión del Riesgo con firmas de todos los integrantes.'
                ]
            };
        }

        // Guardar la formulación en el proyecto
        proyecto.arbol_problemas_json = JSON.stringify(aiResult.arbol_problemas);
        proyecto.arbol_objetivos_json = JSON.stringify(aiResult.arbol_objetivos);
        proyecto.cadena_valor_json = JSON.stringify(aiResult.cadena_valor_mga);
        proyecto.justificacion_tecnica = aiResult.justificacion_tecnica;
        proyecto.objetivo_general = aiResult.arbol_objetivos?.objetivo_general;
        proyecto.estado = 'formulacion_mga';
        await proyecto.save();

        return {
            proyecto,
            mga: aiResult
        };
    }

    /**
     * Generador Oficial de Cartas y Certificados de Radicación
     * Produce el texto legal y administrativo requerido por las ventanillas de los ministerios.
     */
    generarCartasRadicacion(proyecto, datosFirmante = {}) {
        const alcalde = datosFirmante.nombre_alcalde || 'ALCALDE MUNICIPAL';
        const municipio = proyecto.municipio;
        const departamento = proyecto.departamento;
        const fechaActual = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
        const costoFormateado = Number(proyecto.costo_estimado_total).toLocaleString('es-CO');
        const aporteNacion = Number(proyecto.monto_solicitado_nacion).toLocaleString('es-CO');
        const contrapartida = Number(proyecto.contrapartida_local).toLocaleString('es-CO');

        // 1. Carta Oficial de Presentación y Radicación
        const cartaPresentacion = `OFICIO DE RADICACIÓN Y POSTULACIÓN DE PROYECTO DE INVERSIÓN\n\n` +
            `Fecha: ${fechaActual}\n` +
            `Señor(a):\n` +
            `MINISTRO(A) / DIRECTOR(A) GENERAL\n` +
            `${proyecto.ministerio_objetivo.toUpperCase()}\n` +
            `Ventanilla Única de Proyectos y Gestión Territorial\n` +
            `Bogotá D.C., Colombia\n\n` +
            `ASUNTO: Radicación y solicitud formal de cofinanciación para el proyecto "${proyecto.titulo}".\n\n` +
            `Respetado(a) Ministro(a):\n\n` +
            `En mi calidad de Representante Legal y Mandatario del Municipio de ${municipio} (${departamento}), me dirijo a su Despacho con el fin de postular de manera formal el proyecto denominado:\n\n` +
            `"${proyecto.titulo.toUpperCase()}"\n\n` +
            `El presente proyecto tiene un valor total estimado de $${costoFormateado} M/CTE, para el cual solicitamos una cofinanciación a cargo de su cartera ministerial por valor de $${aporteNacion} M/CTE, comprometiendo por parte del ente territorial una contrapartida por la suma de $${contrapartida} M/CTE.\n\n` +
            `Manifestamos bajo la gravedad de juramento que la iniciativa cumple con los estudios técnicos a Fase III, cuenta con disponibilidad predial legalizada, certificado de gestión del riesgo y ha sido formulada bajo la metodología MGA del DNP, impactando de forma directa a más de ${proyecto.poblacion_beneficiada} habitantes de nuestra comunidad.\n\n` +
            `Adjunto a la presente el expediente técnico y documental completo para su revisión y expedición de viabilidad técnica y asignación de recursos.\n\n` +
            `Atentamente,\n\n\n` +
            `_____________________________________________\n` +
            `${alcalde}\n` +
            `Alcalde Municipal de ${municipio}\n` +
            `NIT: 890.000.000-1 | Celular institucional: ${datosFirmante.telefono || '3000000000'}\n` +
            `Correo de notificaciones: planeacion@${municipio.toLowerCase().replace(/\s+/g, '')}-${departamento.toLowerCase()}.gov.co`;

        // 2. Certificado de Concordancia con el Plan de Desarrollo Municipal
        const certificadoPlanDesarrollo = `CERTIFICACIÓN DE CONCORDANCIA CON EL PLAN DE DESARROLLO MUNICIPAL\n\n` +
            `El suscrito Secretario(a) de Planeación Municipal de ${municipio} (${departamento}),\n\n` +
            `CERTIFICA:\n\n` +
            `Que el proyecto de inversión denominado "${proyecto.titulo}", con sector MGA "${proyecto.sector}", se encuentra plenamente articulado y armonizado con los objetivos, metas y líneas estratégicas del vigente PLAN DE DESARROLLO MUNICIPAL 2024-2027.\n\n` +
            `• Eje Estratégico: Infraestructura para la Paz, Productividad y Bienestar Social\n` +
            `• Sector DNP: ${proyecto.sector.toUpperCase()}\n` +
            `• Meta de Producto: Fortalecer la cobertura e impacto en ${proyecto.poblacion_beneficiada} beneficiarios directos.\n\n` +
            `Se expide en ${municipio}, a los ${fechaActual}.\n\n\n` +
            `_____________________________________________\n` +
            `SECRETARIO(A) DE PLANEACIÓN MUNICIPAL\n` +
            `Alcaldía de ${municipio}`;

        // 3. Certificado de No Duplicidad y Sostenibilidad a 10 Años
        const certificadoSostenibilidad = `CERTIFICACIÓN DE SOSTENIBILIDAD Y NO COFINANCIACIÓN PREVIA\n\n` +
            `La Alcaldía Municipal de ${municipio} certifica bajo la gravedad del juramento que:\n\n` +
            `1. El proyecto "${proyecto.titulo}" NO ha recibido cofinanciación concurrente de otras fuentes del Presupuesto General de la Nación ni del Sistema General de Regalías para las mismas actividades aquí contempladas (evitando doble asignación presupuestal).\n\n` +
            `2. La Entidad Territorial se compromete formalmente a asumir los costos de operación, vigilancia, limpieza y mantenimiento recurrente de las obras durante un horizonte no inferior a diez (10) años contados a partir de su entrega formal a la comunidad.\n\n` +
            `Dado en ${municipio}, a los ${fechaActual}.\n\n\n` +
            `_____________________________________________\n` +
            `${alcalde}\n` +
            `Alcalde Municipal de ${municipio}`;

        return {
            cartaPresentacion,
            certificadoPlanDesarrollo,
            certificadoSostenibilidad
        };
    }
}

module.exports = new ProjectBankService();
