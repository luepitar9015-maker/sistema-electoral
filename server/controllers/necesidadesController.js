const NecesidadCiudadana = require('../models/NecesidadCiudadana');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const { Op } = require('sequelize');

// Obtener todas las necesidades con filtros
exports.getNecesidades = async (req, res) => {
    try {
        const {
            departamento,
            municipio,
            categoria,
            prioridad,
            estado,
            nivel_territorial,
            search,
            campana_id
        } = req.query;

        const whereClause = {};

        // Filtro territorial
        if (departamento && departamento !== 'TODOS') {
            whereClause.departamento = departamento;
        }
        if (municipio && municipio !== 'TODOS') {
            whereClause.municipio = municipio;
        }
        if (categoria && categoria !== 'TODAS') {
            whereClause.categoria = categoria;
        }
        if (prioridad && prioridad !== 'TODAS') {
            whereClause.prioridad = prioridad;
        }
        if (estado && estado !== 'TODOS') {
            whereClause.estado = estado;
        }
        if (nivel_territorial && nivel_territorial !== 'TODOS') {
            whereClause.nivel_territorial = nivel_territorial;
        }

        // Campaña activa o asignada
        const targetCampId = campana_id || req.campana_id || null;
        if (targetCampId) {
            whereClause[Op.or] = [
                { campana_id: targetCampId },
                { campana_id: null } // Necesidades comunitarias generales
            ];
        }

        // Búsqueda por texto libre
        if (search && search.trim()) {
            const cleanSearch = `%${search.trim().toLowerCase()}%`;
            whereClause[Op.or] = [
                { titulo: { [Op.like]: cleanSearch } },
                { descripcion: { [Op.like]: cleanSearch } },
                { barrio_vereda: { [Op.like]: cleanSearch } },
                { comuna_corregimiento: { [Op.like]: cleanSearch } },
                { reportado_por_nombre: { [Op.like]: cleanSearch } }
            ];
        }

        const necesidades = await NecesidadCiudadana.findAll({
            where: whereClause,
            include: [
                { model: Campaign, as: 'campana', attributes: ['id', 'nombre', 'candidato', 'tipo_cargo', 'color'] },
                { model: User, as: 'registrado_por', attributes: ['id', 'email', 'nombre'] }
            ],
            order: [
                ['prioridad', 'DESC'],
                ['createdAt', 'DESC']
            ]
        });

        return res.json(necesidades);
    } catch (error) {
        console.error('Error al obtener necesidades ciudadanas:', error);
        return res.status(500).json({ message: 'Error al listar necesidades', error: error.message });
    }
};

// Obtener detalle de una necesidad
exports.getNecesidadById = async (req, res) => {
    try {
        const necesidad = await NecesidadCiudadana.findByPk(req.params.id, {
            include: [
                { model: Campaign, as: 'campana' },
                { model: User, as: 'registrado_por', attributes: ['id', 'email', 'nombre'] }
            ]
        });
        if (!necesidad) {
            return res.status(404).json({ message: 'Necesidad ciudadana no encontrada' });
        }
        return res.json(necesidad);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener detalle', error: error.message });
    }
};

// Crear nueva necesidad ciudadana
exports.createNecesidad = async (req, res) => {
    try {
        const {
            titulo,
            descripcion,
            categoria,
            nivel_territorial,
            departamento,
            municipio,
            comuna_corregimiento,
            barrio_vereda,
            direccion_referencia,
            latitud,
            longitud,
            prioridad,
            impacto_familias_estimado,
            costo_estimado,
            competencia,
            solucion_propuesta,
            reportado_por_nombre,
            reportado_por_telefono,
            reportado_por_cedula,
            origen_reporte,
            evidencia_foto_url,
            campana_id
        } = req.body;

        if (!titulo || !descripcion || !departamento || !municipio) {
            return res.status(400).json({ message: 'Título, descripción, departamento y municipio son obligatorios' });
        }

        const assignedCampId = campana_id || req.campana_id || req.user?.campana_id || null;

        const nueva = await NecesidadCiudadana.create({
            titulo,
            descripcion,
            categoria: categoria || 'vias_infraestructura',
            nivel_territorial: nivel_territorial || 'municipal',
            departamento,
            municipio,
            comuna_corregimiento: comuna_corregimiento || null,
            barrio_vereda: barrio_vereda || null,
            direccion_referencia: direccion_referencia || null,
            latitud: latitud ? parseFloat(latitud) : null,
            longitud: longitud ? parseFloat(longitud) : null,
            prioridad: prioridad || 'media',
            estado: 'reportada',
            impacto_familias_estimado: impacto_familias_estimado ? parseInt(impacto_familias_estimado, 10) : 10,
            costo_estimado: costo_estimado ? parseFloat(costo_estimado) : 0,
            competencia: competencia || 'alcaldia',
            solucion_propuesta: solucion_propuesta || null,
            reportado_por_nombre: reportado_por_nombre || null,
            reportado_por_telefono: reportado_por_telefono || null,
            reportado_por_cedula: reportado_por_cedula || null,
            origen_reporte: origen_reporte || 'lider',
            evidencia_foto_url: evidencia_foto_url || null,
            campana_id: assignedCampId,
            usuario_registro_id: req.user?.id || req.user?.userId || null
        });

        return res.status(201).json(nueva);
    } catch (error) {
        console.error('Error al crear necesidad ciudadana:', error);
        return res.status(500).json({ message: 'Error al registrar necesidad', error: error.message });
    }
};

// Actualizar necesidad ciudadana
exports.updateNecesidad = async (req, res) => {
    try {
        const necesidad = await NecesidadCiudadana.findByPk(req.params.id);
        if (!necesidad) {
            return res.status(404).json({ message: 'Necesidad ciudadana no encontrada' });
        }

        const fieldsToUpdate = [
            'titulo', 'descripcion', 'categoria', 'nivel_territorial', 'departamento',
            'municipio', 'comuna_corregimiento', 'barrio_vereda', 'direccion_referencia',
            'latitud', 'longitud', 'prioridad', 'estado', 'impacto_familias_estimado',
            'costo_estimado', 'competencia', 'solucion_propuesta', 'reportado_por_nombre',
            'reportado_por_telefono', 'evidencia_foto_url'
        ];

        fieldsToUpdate.forEach(f => {
            if (req.body[f] !== undefined) {
                necesidad[f] = req.body[f];
            }
        });

        await necesidad.save();
        return res.json({ message: 'Necesidad actualizada exitosamente', necesidad });
    } catch (error) {
        console.error('Error al actualizar necesidad:', error);
        return res.status(500).json({ message: 'Error al actualizar', error: error.message });
    }
};

// Eliminar necesidad ciudadana
exports.deleteNecesidad = async (req, res) => {
    try {
        const necesidad = await NecesidadCiudadana.findByPk(req.params.id);
        if (!necesidad) {
            return res.status(404).json({ message: 'Necesidad no encontrada' });
        }
        await necesidad.destroy();
        return res.json({ message: 'Necesidad eliminada correctamente' });
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar necesidad', error: error.message });
    }
};

// Estadísticas territoriales
exports.getEstadisticas = async (req, res) => {
    try {
        const { departamento, municipio, campana_id } = req.query;
        const whereClause = {};
        if (departamento && departamento !== 'TODOS') whereClause.departamento = departamento;
        if (municipio && municipio !== 'TODOS') whereClause.municipio = municipio;
        const targetCampId = campana_id || req.campana_id;
        if (targetCampId) whereClause.campana_id = targetCampId;

        const all = await NecesidadCiudadana.findAll({ where: whereClause });

        const total = all.length;
        let totalFamilias = 0;
        let totalCostoEstimado = 0;
        const porCategoria = {};
        const porPrioridad = { baja: 0, media: 0, alta: 0, critica_urgente: 0 };
        const porEstado = { reportada: 0, en_analisis: 0, en_plan_desarrollo: 0, en_gestion: 0, solucionada: 0 };
        const porMunicipio = {};

        all.forEach(item => {
            totalFamilias += item.impacto_familias_estimado || 0;
            totalCostoEstimado += parseFloat(item.costo_estimado || 0);

            // Categoria
            const cat = item.categoria || 'otra';
            porCategoria[cat] = (porCategoria[cat] || 0) + 1;

            // Prioridad
            if (porPrioridad[item.prioridad] !== undefined) {
                porPrioridad[item.prioridad]++;
            }

            // Estado
            if (porEstado[item.estado] !== undefined) {
                porEstado[item.estado]++;
            }

            // Municipio
            const muni = item.municipio || 'Sin Municipio';
            porMunicipio[muni] = (porMunicipio[muni] || 0) + 1;
        });

        // Top 5 municipios más afectados
        const topMunicipios = Object.entries(porMunicipio)
            .map(([municipio, count]) => ({ municipio, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return res.json({
            total_reportes: total,
            total_familias_afectadas: totalFamilias,
            presupuesto_total_estimado: totalCostoEstimado,
            por_categoria: porCategoria,
            por_prioridad: porPrioridad,
            por_estado: porEstado,
            top_municipios: topMunicipios
        });
    } catch (error) {
        console.error('Error en estadísticas de necesidades:', error);
        return res.status(500).json({ message: 'Error al calcular estadísticas' });
    }
};

// ─── RESUMEN EJECUTIVO CON IA DE NECESIDADES Y SOLUCIONES ──────────────────
exports.generarResumenIA = async (req, res) => {
    try {
        const { departamento, municipio, nivel_territorial, campana_id, enfoque } = req.body;

        const whereClause = {};
        if (departamento && departamento !== 'TODOS') whereClause.departamento = departamento;
        if (municipio && municipio !== 'TODOS') whereClause.municipio = municipio;
        const targetCampId = campana_id || req.campana_id;
        if (targetCampId) whereClause.campana_id = targetCampId;

        const necesidades = await NecesidadCiudadana.findAll({
            where: whereClause,
            order: [['prioridad', 'DESC'], ['impacto_familias_estimado', 'DESC']],
            limit: 60
        });

        if (necesidades.length === 0) {
            return res.json({
                resumen_ejecutivo: 'No hay reportes de necesidades comunitarias registrados para este territorio aún. Comience ingresando reportes por medio de líderes barriales o brigadas territoriales.',
                top_dolores: [],
                soluciones_estrategicas: [],
                argumentario_discurso: 'Territorio sin incidencias críticas reportadas actualmente.'
            });
        }

        // Datos agrupados para el prompt de IA
        const resumenDatos = necesidades.map(n => ({
            titulo: n.titulo,
            categoria: n.categoria,
            territorio: `${n.municipio}, ${n.barrio_vereda || n.comuna_corregimiento || ''}`,
            prioridad: n.prioridad,
            familias: n.impacto_familias_estimado,
            descripcion: n.descripcion
        }));

        const territorioNombre = municipio && municipio !== 'TODOS'
            ? `${municipio} (${departamento})`
            : (departamento && departamento !== 'TODOS' ? `Departamento de ${departamento}` : 'Nivel Nacional (Colombia)');

        const promptText = `
Eres el Director de Estrategia Política y Políticas Públicas de un alto mandatario o candidato (Senador, Representante, Gobernador, Alcalde, Diputado, Concejal).
Analiza los siguientes ${necesidades.length} reportes de necesidades ciudadanas reales levantados en el territorio de: "${territorioNombre}".

DATOS RECOLECTADOS:
${JSON.stringify(resumenDatos.slice(0, 30), null, 2)}

Genera una respuesta en formato JSON estrictamente válido con la siguiente estructura:
{
  "titulo_informe": "Título impactante del diagnóstico territorial",
  "diagnostico_situacion": "Resumen ejecutivo claro de la situación comunitaria, destacando los dolores más agudos que afectan a la población y el clima social.",
  "top_dolores": [
    {
      "categoria": "Nombre de la categoría (ej: Vías, Agua potable, Seguridad)",
      "problema": "Descripción sintética del problema principal",
      "zonas_afectadas": "Barrios o sectores más golpeados",
      "impacto_social": "Grado de urgencia y cantidad de familias perjudicadas"
    }
  ],
  "matriz_soluciones": [
    {
      "plazo": "Corto Plazo (Primeros 100 Días)",
      "accion_concreta": "Medida inmediata de alto impacto visible para el ciudadano",
      "entidad_responsable": "Alcaldía / Secretaría de Obras / Gobernación / etc.",
      "viabilidad": "Alta / Inmediata"
    },
    {
      "plazo": "Mediano Plazo (Plan de Desarrollo / Gestión 4 Años)",
      "accion_concreta": "Proyecto estructurado con presupuesto para resolver la causa raíz",
      "entidad_responsable": "Concejo / Asamblea / Gobierno Municipal o Dptal",
      "viabilidad": "Media - Requiere gestión presupuestal"
    },
    {
      "plazo": "Largo Plazo / Gestión Legislativa (Senado / Cámara / Conpes)",
      "accion_concreta": "Articulación con Presupuesto General de la Nación, regalías o proyectos de ley",
      "entidad_responsable": "Gobierno Nacional / Bancada Parlamentaria",
      "viabilidad": "Estratégica"
    }
  ],
  "discurso_candidato": "Discurso emotivo, empático y contundente de 2 párrafos que el candidato o mandatario puede pronunciar en plaza pública o plenaria, citando los dolores reales de la gente y comprometiéndose con las soluciones mencionadas.",
  "proposicion_legislativa_o_acuerdo": "Texto de una proposición formal de control político o acuerdo municipal/ordenanza lista para radicar en plenaria."
}
`;

        // Intentar llamar a Gemini si hay API Key disponible
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: promptText }] }],
                        generationConfig: {
                            responseMimeType: 'application/json',
                            temperature: 0.4
                        }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const textOut = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (textOut) {
                        const parsed = JSON.parse(textOut);
                        return res.json({
                            success: true,
                            fuente: 'gemini-ai',
                            territorio: territorioNombre,
                            total_analizados: necesidades.length,
                            ...parsed
                        });
                    }
                }
            } catch (aiErr) {
                console.warn('Fallo en llamada externa a Gemini, usando motor analítico interno:', aiErr.message);
            }
        }

        // Motor Analítico de Respaldo Determinista Inteligente
        const catsCount = {};
        necesidades.forEach(n => {
            catsCount[n.categoria] = (catsCount[n.categoria] || 0) + 1;
        });
        const topCat = Object.entries(catsCount).sort((a, b) => b[1] - a.count || 0)?.[0]?.[0] || 'Vías e Infraestructura';

        return res.json({
            success: true,
            fuente: 'motor-analitico-territorial',
            territorio: territorioNombre,
            total_analizados: necesidades.length,
            titulo_informe: `Diagnóstico y Plan de Acción Territorial: ${territorioNombre}`,
            diagnostico_situacion: `Se han identificado ${necesidades.length} necesidades comunitarias urgentes en ${territorioNombre}. La principal preocupación ciudadana se concentra en el sector de ${topCat}, impactando a más de ${necesidades.reduce((acc, c) => acc + (c.impacto_familias_estimado || 0), 0)} familias. La comunidad exige celeridad en la intervención pública para evitar deterioro social y protestas comunitarias.`,
            top_dolores: Object.entries(catsCount).slice(0, 4).map(([cat, cant]) => ({
                categoria: cat.toUpperCase().replace(/_/g, ' '),
                problema: `Reiteradas denuncias sobre abandono en servicios y gestión de ${cat.replace(/_/g, ' ')}.`,
                zonas_afectadas: necesidades.filter(n => n.categoria === cat).map(n => n.barrio_vereda || n.municipio).filter(Boolean).slice(0, 3).join(', ') || territorioNombre,
                impacto_social: `Concentra ${cant} reportes comunitarios con alta vulnerabilidad.`
            })),
            matriz_soluciones: [
                {
                    plazo: 'Corto Plazo (Primeros 100 Días)',
                    accion_concreta: `Mesa técnica de emergencia territorial en ${territorioNombre} para atender de inmediato los puntos críticos de ${topCat.replace(/_/g, ' ')}.`,
                    entidad_responsable: 'Alcaldía Municipal / Despacho del Mandatario',
                    viabilidad: 'Alta'
                },
                {
                    plazo: 'Mediano Plazo (Plan de Desarrollo / Cuatrienio)',
                    accion_concreta: `Asignación de partidas específicas en el presupuesto plurianual de inversiones para proyectos de ${topCat.replace(/_/g, ' ')}.`,
                    entidad_responsable: 'Concejo / Asamblea / Secretaría de Planeación',
                    viabilidad: 'Media'
                },
                {
                    plazo: 'Largo Plazo (Gestión Congreso y Nacional)',
                    accion_concreta: `Radicación de proyecto de cofinanciación nacional ante ministerios y regalías para transformación estructural de la zona.`,
                    entidad_responsable: 'Bancada de Senadores y Representantes',
                    viabilidad: 'Estratégica'
                }
            ],
            discurso_candidato: `Amigos y vecinos de ${territorioNombre}: he caminado sus calles y he escuchado sus testimonios. No podemos permitir que nuestras familias sigan sufriendo por la falta de atención en ${topCat.replace(/_/g, ' ')}. Este mandato no es para quedarse en un escritorio, es para traer soluciones concretas a cada barrio y a cada vereda. Nos comprometemos a priorizar los recursos donde más duele y a darles la dignidad que se merecen.`,
            proposicion_legislativa_o_acuerdo: `CÍTESE a debate de control político a los secretarios del ramo para que rindan informe detallado sobre el cronograma de ejecución y partidas presupuestales destinadas a resolver las contingencias de ${topCat.replace(/_/g, ' ')} en ${territorioNombre}.`
        });

    } catch (error) {
        console.error('Error generando resumen con IA:', error);
        return res.status(500).json({ message: 'Error al generar resumen ejecutivo', error: error.message });
    }
};
