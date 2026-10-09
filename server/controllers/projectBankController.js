const ProyectoInversion = require('../models/ProyectoInversion');
const ProyectoDocumento = require('../models/ProyectoDocumento');
const NecesidadCiudadana = require('../models/NecesidadCiudadana');
const Campaign = require('../models/Campaign');
const projectBankService = require('../services/projectBankService');
const { Op } = require('sequelize');

// Listar proyectos con filtros
exports.getProyectos = async (req, res) => {
    try {
        const { sector, estado, ministerio, search, campana_id } = req.query;
        const whereClause = {};

        if (sector && sector !== 'TODOS') whereClause.sector = sector;
        if (estado && estado !== 'TODOS') whereClause.estado = estado;
        if (ministerio && ministerio !== 'TODOS') whereClause.ministerio_objetivo = ministerio;

        const targetCampId = campana_id || req.campana_id || null;
        if (targetCampId) {
            whereClause[Op.or] = [
                { campana_id: targetCampId },
                { campana_id: null }
            ];
        }

        if (search && search.trim()) {
            const cleanSearch = `%${search.trim().toLowerCase()}%`;
            whereClause[Op.or] = [
                { titulo: { [Op.like]: cleanSearch } },
                { municipio: { [Op.like]: cleanSearch } },
                { departamento: { [Op.like]: cleanSearch } },
                { zona_localidad: { [Op.like]: cleanSearch } },
                { codigo_bpin: { [Op.like]: cleanSearch } }
            ];
        }

        const proyectos = await ProyectoInversion.findAll({
            where: whereClause,
            include: [
                { model: Campaign, as: 'campana', attributes: ['id', 'nombre', 'candidato', 'color'] },
                { model: ProyectoDocumento, as: 'documentos', attributes: ['id', 'tipo_documento', 'nombre_archivo', 'estado_revision'] }
            ],
            order: [['updatedAt', 'DESC']]
        });

        res.json(proyectos);
    } catch (error) {
        console.error('Error al listar proyectos:', error);
        res.status(500).json({ message: 'Error al listar proyectos', error: error.message });
    }
};

// Detalle de un proyecto
exports.getProyectoById = async (req, res) => {
    try {
        const proyecto = await ProyectoInversion.findByPk(req.params.id, {
            include: [
                { model: Campaign, as: 'campana' },
                { model: ProyectoDocumento, as: 'documentos' }
            ]
        });

        if (!proyecto) {
            return res.status(404).json({ message: 'Proyecto no encontrado' });
        }

        // Obtener necesidades ciudadanas vinculadas
        const necesidadesVinculadas = await NecesidadCiudadana.findAll({
            where: { proyecto_id: proyecto.id }
        });

        res.json({
            ...proyecto.toJSON(),
            necesidadesVinculadas
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener detalle del proyecto', error: error.message });
    }
};

// Crear proyecto manual
exports.createProyecto = async (req, res) => {
    try {
        const {
            titulo,
            sector,
            ministerio_objetivo,
            linea_convocatoria,
            entidad_postulante_tipo,
            departamento,
            municipio,
            zona_localidad,
            poblacion_beneficiada,
            costo_estimado_total,
            monto_solicitado_nacion,
            contrapartida_local,
            campana_id
        } = req.body;

        const config = projectBankService.getSectoresConfig()[sector] || projectBankService.getSectoresConfig().transporte_vias;

        const initialChecklist = config.requisitos.map(r => ({
            id: r.id,
            nombre: r.nombre,
            bloqueante: r.bloqueante,
            motivo_devolucion_comun: r.motivo_devolucion_comun,
            cumplido: false,
            observacion: 'Pendiente de cargue o validación documental.'
        }));

        const proyecto = await ProyectoInversion.create({
            titulo,
            sector: sector || 'transporte_vias',
            ministerio_objetivo: ministerio_objetivo || config.ministerio,
            linea_convocatoria: linea_convocatoria || config.lineas_convocatorias[0],
            entidad_postulante_tipo: entidad_postulante_tipo || 'alcaldia',
            departamento: departamento || 'CUNDINAMARCA',
            municipio: municipio || 'BOGOTÁ D.C.',
            zona_localidad,
            poblacion_beneficiada: poblacion_beneficiada || 100,
            costo_estimado_total: costo_estimado_total || 500000000,
            monto_solicitado_nacion: monto_solicitado_nacion || (costo_estimado_total ? costo_estimado_total * 0.9 : 450000000),
            contrapartida_local: contrapartida_local || (costo_estimado_total ? costo_estimado_total * 0.1 : 50000000),
            estado: 'idea_perfil',
            score_antidevolucion: 10,
            riesgo_devolucion: 'alto',
            checklist_requisitos_json: JSON.stringify(initialChecklist),
            campana_id: campana_id || req.campana_id || null,
            creado_por_id: req.user?.id || null
        });

        res.status(201).json(proyecto);
    } catch (error) {
        console.error('Error creando proyecto:', error);
        res.status(500).json({ message: 'Error al crear proyecto', error: error.message });
    }
};

// Agrupar necesidades ciudadanas en un nuevo proyecto
exports.agruparDesdeNecesidades = async (req, res) => {
    try {
        const { necesidadIds, titulo, sector, municipio, departamento, campana_id } = req.body;

        if (!necesidadIds || !Array.isArray(necesidadIds) || necesidadIds.length === 0) {
            return res.status(400).json({ message: 'Debes seleccionar al menos una necesidad para agrupar.' });
        }

        const proyecto = await projectBankService.agruparNecesidadesAProyecto({
            necesidadIds,
            titulo,
            campanaId: campana_id || req.campana_id || null,
            userId: req.user?.id || null,
            sector,
            municipio,
            departamento
        });

        res.status(201).json({
            message: 'Proyecto estructurado exitosamente a partir de las demandas comunitarias',
            proyecto
        });
    } catch (error) {
        console.error('Error al agrupar necesidades:', error);
        res.status(500).json({ message: 'Error al estructurar proyecto desde necesidades', error: error.message });
    }
};

// Ejecutar Auditoría Anti-Devolución
exports.auditarViabilidad = async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await projectBankService.auditarViabilidadAntiDevolucion(id);
        res.json({
            success: true,
            ...resultado
        });
    } catch (error) {
        console.error('Error al auditar viabilidad:', error);
        res.status(500).json({ message: 'Error al auditar viabilidad del proyecto', error: error.message });
    }
};

// Formular Metodología MGA con IA
exports.formularMGA = async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await projectBankService.formularProyectoMGA_IA(id);
        res.json({
            success: true,
            ...resultado
        });
    } catch (error) {
        console.error('Error al formular MGA con IA:', error);
        res.status(500).json({ message: 'Error al generar formulación MGA', error: error.message });
    }
};

// Actualizar estado de ítems de checklist
exports.actualizarChecklist = async (req, res) => {
    try {
        const { id } = req.params;
        const { checklist } = req.body;

        const proyecto = await ProyectoInversion.findByPk(id);
        if (!proyecto) return res.status(404).json({ message: 'Proyecto no encontrado' });

        proyecto.checklist_requisitos_json = JSON.stringify(checklist);
        await proyecto.save();

        // Re-evaluar score de viabilidad inmediatamente
        const resultado = await projectBankService.auditarViabilidadAntiDevolucion(id);

        res.json({
            message: 'Checklist actualizado correctamente',
            ...resultado
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar checklist', error: error.message });
    }
};

// Subir documento de soporte técnico (anexo)
exports.subirDocumento = async (req, res) => {
    try {
        const { id } = req.params;
        const { tipo_documento, observacion } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ningún archivo' });
        }

        const proyecto = await ProyectoInversion.findByPk(id);
        if (!proyecto) return res.status(404).json({ message: 'Proyecto no encontrado' });

        const nuevoDoc = await ProyectoDocumento.create({
            proyecto_id: proyecto.id,
            tipo_documento: tipo_documento || 'otro',
            nombre_archivo: req.file.originalname,
            url_archivo: `/uploads/proyectos/${req.file.filename}`,
            tamano_bytes: req.file.size,
            mimetype: req.file.mimetype,
            estado_revision: 'aprobado_cumple',
            observacion_auditoria: observacion || 'Documento cargado por el equipo estructurador.'
        });

        // Re-ejecutar auditoría para actualizar el score
        await projectBankService.auditarViabilidadAntiDevolucion(id);

        res.status(201).json({
            message: 'Documento subido y validado con éxito',
            documento: nuevoDoc
        });
    } catch (error) {
        console.error('Error al subir documento:', error);
        res.status(500).json({ message: 'Error al subir documento', error: error.message });
    }
};

// Eliminar documento
exports.eliminarDocumento = async (req, res) => {
    try {
        const { docId } = req.params;
        const doc = await ProyectoDocumento.findByPk(docId);
        if (!doc) return res.status(404).json({ message: 'Documento no encontrado' });

        const proyectoId = doc.proyecto_id;
        await doc.destroy();

        // Re-auditar
        await projectBankService.auditarViabilidadAntiDevolucion(proyectoId);

        res.json({ message: 'Documento eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar documento', error: error.message });
    }
};

// Actualizar datos del proyecto
exports.updateProyecto = async (req, res) => {
    try {
        const proyecto = await ProyectoInversion.findByPk(req.params.id);
        if (!proyecto) return res.status(404).json({ message: 'Proyecto no encontrado' });

        await proyecto.update(req.body);
        res.json({ message: 'Proyecto actualizado con éxito', proyecto });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar proyecto', error: error.message });
    }
};

// Eliminar proyecto
exports.deleteProyecto = async (req, res) => {
    try {
        const proyecto = await ProyectoInversion.findByPk(req.params.id);
        if (!proyecto) return res.status(404).json({ message: 'Proyecto no encontrado' });

        // Desvincular necesidades
        await NecesidadCiudadana.update(
            { proyecto_id: null, estado: 'reportada' },
            { where: { proyecto_id: proyecto.id } }
        );

        await proyecto.destroy();
        res.json({ message: 'Proyecto eliminado con éxito' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar proyecto', error: error.message });
    }
};

// Generar cartas oficiales de radicación y certificados
exports.getCartasRadicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const proyecto = await ProyectoInversion.findByPk(id);
        if (!proyecto) return res.status(404).json({ message: 'Proyecto no encontrado' });

        const cartas = projectBankService.generarCartasRadicacion(proyecto, req.body || {});
        res.json(cartas);
    } catch (error) {
        res.status(500).json({ message: 'Error al generar cartas', error: error.message });
    }
};

// Estadísticas consolidadas del Banco de Proyectos
exports.getStats = async (req, res) => {
    try {
        const campanaId = req.campana_id || (req.query.campana_id ? parseInt(req.query.campana_id, 10) : null);
        const whereClause = {};
        if (campanaId) whereClause.campana_id = campanaId;

        const proyectos = await ProyectoInversion.findAll({ where: whereClause });

        const totalProyectos = proyectos.length;
        const montoTotalGestionado = proyectos.reduce((sum, p) => sum + parseFloat(p.costo_estimado_total || 0), 0);
        const montoNacionSolicitado = proyectos.reduce((sum, p) => sum + parseFloat(p.monto_solicitado_nacion || 0), 0);
        const listosRadicar = proyectos.filter(p => p.estado === 'listo_radicar' || p.score_antidevolucion >= 80).length;
        const promedioScore = totalProyectos > 0 ? Math.round(proyectos.reduce((sum, p) => sum + (p.score_antidevolucion || 0), 0) / totalProyectos) : 0;

        res.json({
            totalProyectos,
            montoTotalGestionado,
            montoNacionSolicitado,
            listosRadicar,
            promedioScore,
            sectoresConfig: projectBankService.getSectoresConfig()
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al calcular estadísticas', error: error.message });
    }
};
