const Reunion = require('../models/Reunion');
const ReunionAsistente = require('../models/ReunionAsistente');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Asegurar directorio para guardar evidencias subidas
const UPLOAD_DIR = path.join(__dirname, '../uploads/evidencias');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Listar reuniones con filtros y métricas
 */
exports.getReuniones = async (req, res) => {
    try {
        const {
            campana_id,
            presidida_por,
            orador_id,
            lider_avanzada_id,
            fecha,
            mes,
            anio,
            estado,
            grupo_avanzada,
            search
        } = req.query;

        const where = {};

        if (campana_id) {
            where.campana_id = parseInt(campana_id, 10);
        }

        if (presidida_por && presidida_por !== 'todos') {
            where.presidida_por = presidida_por;
        }

        if (orador_id && orador_id !== 'todos') {
            where.orador_id = parseInt(orador_id, 10);
        }

        if (lider_avanzada_id && lider_avanzada_id !== 'todos') {
            where.lider_avanzada_id = parseInt(lider_avanzada_id, 10);
        }

        if (estado && estado !== 'todos') {
            where.estado = estado;
        }

        if (grupo_avanzada && grupo_avanzada !== 'todos') {
            where.grupo_avanzada = grupo_avanzada;
        }

        if (fecha) {
            where.fecha = fecha;
        }

        const reuniones = await Reunion.findAll({
            where,
            order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']]
        });

        // Obtener conteo de asistentes registrados por reunión
        const asistentesCounts = await ReunionAsistente.findAll({
            attributes: ['reunion_id', [ReunionAsistente.sequelize.fn('COUNT', ReunionAsistente.sequelize.col('id')), 'total']],
            group: ['reunion_id']
        });

        const countMap = {};
        asistentesCounts.forEach(c => {
            const data = c.toJSON();
            countMap[data.reunion_id] = parseInt(data.total, 10);
        });

        // Cargar nombres de campaña
        const campaigns = await Campaign.findAll({ attributes: ['id', 'nombre', 'candidato', 'color', 'tipo_cargo'] });
        const campMap = {};
        campaigns.forEach(c => { campMap[c.id] = c; });

        let results = reuniones.map(r => {
            const item = r.toJSON();
            let parsedEvidencias = [];
            try {
                parsedEvidencias = JSON.parse(item.evidencias || '[]');
            } catch (e) {
                parsedEvidencias = [];
            }

            return {
                ...item,
                evidencias: parsedEvidencias,
                total_asistentes_registrados: countMap[item.id] || 0,
                campana: campMap[item.campana_id] || null
            };
        });

        // Filtro por mes y año si se especificaron
        if (mes && anio) {
            const padMes = String(mes).padStart(2, '0');
            const prefix = `${anio}-${padMes}`;
            results = results.filter(r => r.fecha && r.fecha.startsWith(prefix));
        } else if (anio) {
            results = results.filter(r => r.fecha && r.fecha.startsWith(`${anio}-`));
        }

        // Filtro de búsqueda textual
        if (search && search.trim() !== '') {
            const s = search.toLowerCase();
            results = results.filter(r =>
                (r.titulo && r.titulo.toLowerCase().includes(s)) ||
                (r.municipio && r.municipio.toLowerCase().includes(s)) ||
                (r.departamento && r.departamento.toLowerCase().includes(s)) ||
                (r.direccion && r.direccion.toLowerCase().includes(s)) ||
                (r.lugar_nombre && r.lugar_nombre.toLowerCase().includes(s)) ||
                (r.orador_nombre && r.orador_nombre.toLowerCase().includes(s)) ||
                (r.grupo_avanzada && r.grupo_avanzada.toLowerCase().includes(s))
            );
        }

        res.json(results);
    } catch (error) {
        console.error('Error al listar reuniones:', error);
        res.status(500).json({ message: 'Error al listar reuniones', error: error.message });
    }
};

/**
 * Obtener detalle de una reunión con sus asistentes
 */
exports.getReunionById = async (req, res) => {
    try {
        const { id } = req.params;
        const reunion = await Reunion.findByPk(id);
        if (!reunion) {
            return res.status(404).json({ message: 'Reunión no encontrada' });
        }

        const data = reunion.toJSON();
        let evidencias = [];
        try {
            evidencias = JSON.parse(data.evidencias || '[]');
        } catch (e) {
            evidencias = [];
        }

        const campana = await Campaign.findByPk(data.campana_id, {
            attributes: ['id', 'nombre', 'candidato', 'color', 'tipo_cargo', 'departamento', 'municipio']
        });

        const asistentes = await ReunionAsistente.findAll({
            where: { reunion_id: id },
            order: [['createdAt', 'DESC']]
        });

        res.json({
            ...data,
            evidencias,
            campana,
            asistentes,
            total_asistentes_registrados: asistentes.length
        });
    } catch (error) {
        console.error('Error al obtener reunión:', error);
        res.status(500).json({ message: 'Error al obtener reunión', error: error.message });
    }
};

/**
 * Crear reunión
 */
exports.createReunion = async (req, res) => {
    try {
        const {
            campana_id,
            titulo,
            descripcion,
            fecha,
            hora_inicio,
            hora_fin,
            presidida_por,
            orador_id,
            orador_nombre,
            lider_avanzada_id,
            lider_avanzada_nombre,
            grupo_avanzada,
            aforo_estimado,
            departamento,
            municipio,
            direccion,
            barrio_vereda,
            lugar_nombre,
            observaciones
        } = req.body;

        if (!campana_id || !titulo || !fecha || !hora_inicio) {
            return res.status(400).json({ message: 'Campaña, título, fecha y hora de inicio son obligatorios' });
        }

        // Si hay orador_id pero no orador_nombre, buscarlo
        let finalOradorNombre = orador_nombre;
        if (orador_id && !finalOradorNombre) {
            const oradorUser = await User.findByPk(orador_id);
            if (oradorUser) finalOradorNombre = oradorUser.nombre || oradorUser.email;
        }

        // Si hay lider_avanzada_id pero no lider_avanzada_nombre, buscarlo
        let finalLiderNombre = lider_avanzada_nombre;
        if (lider_avanzada_id && !finalLiderNombre) {
            const liderUser = await User.findByPk(lider_avanzada_id);
            if (liderUser) finalLiderNombre = liderUser.nombre || liderUser.email;
        }

        const nueva = await Reunion.create({
            campana_id: parseInt(campana_id, 10),
            titulo,
            descripcion,
            fecha,
            hora_inicio,
            hora_fin: hora_fin || null,
            presidida_por: presidida_por || 'candidato',
            orador_id: orador_id ? parseInt(orador_id, 10) : null,
            orador_nombre: finalOradorNombre || null,
            lider_avanzada_id: lider_avanzada_id ? parseInt(lider_avanzada_id, 10) : null,
            lider_avanzada_nombre: finalLiderNombre || null,
            grupo_avanzada: grupo_avanzada || 'Equipo General',
            aforo_estimado: aforo_estimado ? parseInt(aforo_estimado, 10) : 0,
            asistentes_reales: 0,
            departamento: departamento || '',
            municipio: municipio || '',
            direccion: direccion || '',
            barrio_vereda: barrio_vereda || '',
            lugar_nombre: lugar_nombre || '',
            estado: 'programada',
            observaciones: observaciones || '',
            evidencias: '[]',
            creado_por: req.user?.id || null
        });

        res.status(201).json({
            message: 'Reunión agendada exitosamente',
            reunion: {
                ...nueva.toJSON(),
                evidencias: []
            }
        });
    } catch (error) {
        console.error('Error al crear reunión:', error);
        res.status(500).json({ message: 'Error al agendar reunión', error: error.message });
    }
};

/**
 * Actualizar datos de la reunión
 */
exports.updateReunion = async (req, res) => {
    try {
        const { id } = req.params;
        const reunion = await Reunion.findByPk(id);
        if (!reunion) {
            return res.status(404).json({ message: 'Reunión no encontrada' });
        }

        const {
            titulo,
            descripcion,
            fecha,
            hora_inicio,
            hora_fin,
            presidida_por,
            orador_id,
            orador_nombre,
            lider_avanzada_id,
            lider_avanzada_nombre,
            grupo_avanzada,
            aforo_estimado,
            asistentes_reales,
            departamento,
            municipio,
            direccion,
            barrio_vereda,
            lugar_nombre,
            estado,
            observaciones
        } = req.body;

        if (titulo !== undefined) reunion.titulo = titulo;
        if (descripcion !== undefined) reunion.descripcion = descripcion;
        if (fecha !== undefined) reunion.fecha = fecha;
        if (hora_inicio !== undefined) reunion.hora_inicio = hora_inicio;
        if (hora_fin !== undefined) reunion.hora_fin = hora_fin;
        if (presidida_por !== undefined) reunion.presidida_por = presidida_por;
        if (orador_id !== undefined) reunion.orador_id = orador_id ? parseInt(orador_id, 10) : null;
        if (orador_nombre !== undefined) reunion.orador_nombre = orador_nombre;
        if (lider_avanzada_id !== undefined) reunion.lider_avanzada_id = lider_avanzada_id ? parseInt(lider_avanzada_id, 10) : null;
        if (lider_avanzada_nombre !== undefined) reunion.lider_avanzada_nombre = lider_avanzada_nombre;
        if (grupo_avanzada !== undefined) reunion.grupo_avanzada = grupo_avanzada;
        if (aforo_estimado !== undefined) reunion.aforo_estimado = parseInt(aforo_estimado, 10) || 0;
        if (asistentes_reales !== undefined) reunion.asistentes_reales = parseInt(asistentes_reales, 10) || 0;
        if (departamento !== undefined) reunion.departamento = departamento;
        if (municipio !== undefined) reunion.municipio = municipio;
        if (direccion !== undefined) reunion.direccion = direccion;
        if (barrio_vereda !== undefined) reunion.barrio_vereda = barrio_vereda;
        if (lugar_nombre !== undefined) reunion.lugar_nombre = lugar_nombre;
        if (estado !== undefined) reunion.estado = estado;
        if (observaciones !== undefined) reunion.observaciones = observaciones;

        await reunion.save();

        let evidencias = [];
        try { evidencias = JSON.parse(reunion.evidencias || '[]'); } catch (e) { evidencias = []; }

        res.json({
            message: 'Reunión actualizada exitosamente',
            reunion: {
                ...reunion.toJSON(),
                evidencias
            }
        });
    } catch (error) {
        console.error('Error al actualizar reunión:', error);
        res.status(500).json({ message: 'Error al actualizar reunión', error: error.message });
    }
};

/**
 * Eliminar reunión
 */
exports.deleteReunion = async (req, res) => {
    try {
        const { id } = req.params;
        const reunion = await Reunion.findByPk(id);
        if (!reunion) {
            return res.status(404).json({ message: 'Reunión no encontrada' });
        }

        // Eliminar asistentes asociados
        await ReunionAsistente.destroy({ where: { reunion_id: id } });
        await reunion.destroy();

        res.json({ message: 'Reunión eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar reunión:', error);
        res.status(500).json({ message: 'Error al eliminar reunión', error: error.message });
    }
};

/**
 * Cambiar estado de reunión (Iniciar, Finalizar, Cancelar, etc.)
 */
exports.cambiarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { accion, observaciones, asistentes_reales, hora_inicio_real, hora_fin_real } = req.body;

        const reunion = await Reunion.findByPk(id);
        if (!reunion) {
            return res.status(404).json({ message: 'Reunión no encontrada' });
        }

        const nowTime = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });

        if (accion === 'iniciar') {
            reunion.estado = 'en_curso';
            reunion.hora_inicio_real = hora_inicio_real || nowTime;
            if (observaciones) {
                reunion.observaciones = reunion.observaciones
                    ? `${reunion.observaciones}\n[Inicio ${reunion.hora_inicio_real} por ${req.user?.nombre || req.user?.email}]: ${observaciones}`
                    : `[Inicio ${reunion.hora_inicio_real}]: ${observaciones}`;
            }
        } else if (accion === 'finalizar') {
            reunion.estado = 'finalizada';
            reunion.hora_fin_real = hora_fin_real || nowTime;
            if (asistentes_reales !== undefined) {
                reunion.asistentes_reales = parseInt(asistentes_reales, 10) || 0;
            }
            if (observaciones) {
                reunion.observaciones = reunion.observaciones
                    ? `${reunion.observaciones}\n[Cierre ${reunion.hora_fin_real}]: ${observaciones}`
                    : `[Cierre ${reunion.hora_fin_real}]: ${observaciones}`;
            }
        } else if (accion === 'cancelar') {
            reunion.estado = 'cancelada';
            if (observaciones) {
                reunion.observaciones = reunion.observaciones
                    ? `${reunion.observaciones}\n[Cancelada]: ${observaciones}`
                    : `[Cancelada]: ${observaciones}`;
            }
        } else if (accion === 'reprogramar') {
            reunion.estado = 'programada';
        }

        await reunion.save();

        let evidencias = [];
        try { evidencias = JSON.parse(reunion.evidencias || '[]'); } catch (e) { evidencias = []; }

        res.json({
            message: `Estado de la reunión actualizado a '${reunion.estado}'`,
            reunion: {
                ...reunion.toJSON(),
                evidencias
            }
        });
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        res.status(500).json({ message: 'Error al cambiar estado de la reunión', error: error.message });
    }
};

/**
 * Subir evidencia fotográfica (soporta archivos vía Multer o fotos en base64)
 */
exports.subirEvidencia = async (req, res) => {
    try {
        const { id } = req.params;
        const reunion = await Reunion.findByPk(id);
        if (!reunion) {
            return res.status(404).json({ message: 'Reunión no encontrada' });
        }

        let evidencias = [];
        try {
            evidencias = JSON.parse(reunion.evidencias || '[]');
        } catch (e) {
            evidencias = [];
        }

        const now = new Date().toISOString();
        const userName = req.user?.nombre || req.user?.email || 'Usuario';

        // Si se subió archivo con Multer
        if (req.file) {
            const fileUrl = `/uploads/evidencias/${req.file.filename}`;
            const nuevaEvidencia = {
                id: Date.now().toString(),
                url: fileUrl,
                nombre: req.body.nombre || req.file.originalname,
                fecha: now,
                subido_por: userName,
                tipo: 'archivo'
            };
            evidencias.push(nuevaEvidencia);
        } else if (req.body.base64Image) {
            // Si viene imagen capturada en cámara como Data URL base64
            const base64Data = req.body.base64Image.replace(/^data:image\/\w+;base64,/, '');
            const filename = `evidencia_${id}_${Date.now()}.jpg`;
            const filepath = path.join(UPLOAD_DIR, filename);
            fs.writeFileSync(filepath, base64Data, 'base64');

            const nuevaEvidencia = {
                id: Date.now().toString(),
                url: `/uploads/evidencias/${filename}`,
                nombre: req.body.nombre || 'Foto de Reunión',
                fecha: now,
                subido_por: userName,
                tipo: 'foto_camara'
            };
            evidencias.push(nuevaEvidencia);
        } else {
            return res.status(400).json({ message: 'No se envió ninguna foto o archivo de evidencia' });
        }

        reunion.evidencias = JSON.stringify(evidencias);
        await reunion.save();

        res.json({
            message: 'Evidencia fotográfica cargada exitosamente',
            evidencias
        });
    } catch (error) {
        console.error('Error al subir evidencia:', error);
        res.status(500).json({ message: 'Error al subir evidencia fotográfica', error: error.message });
    }
};

/**
 * Eliminar una evidencia fotográfica
 */
exports.eliminarEvidencia = async (req, res) => {
    try {
        const { id, evidenciaId } = req.params;
        const reunion = await Reunion.findByPk(id);
        if (!reunion) {
            return res.status(404).json({ message: 'Reunión no encontrada' });
        }

        let evidencias = [];
        try {
            evidencias = JSON.parse(reunion.evidencias || '[]');
        } catch (e) {
            evidencias = [];
        }

        const filtered = evidencias.filter(e => e.id !== evidenciaId);
        reunion.evidencias = JSON.stringify(filtered);
        await reunion.save();

        res.json({
            message: 'Evidencia eliminada exitosamente',
            evidencias: filtered
        });
    } catch (error) {
        console.error('Error al eliminar evidencia:', error);
        res.status(500).json({ message: 'Error al eliminar evidencia', error: error.message });
    }
};

/**
 * Listar base de datos / asistentes de la reunión
 */
exports.getAsistentes = async (req, res) => {
    try {
        const { id } = req.params;
        const asistentes = await ReunionAsistente.findAll({
            where: { reunion_id: id },
            order: [['createdAt', 'DESC']]
        });
        res.json(asistentes);
    } catch (error) {
        console.error('Error al listar asistentes:', error);
        res.status(500).json({ message: 'Error al listar asistentes', error: error.message });
    }
};

/**
 * Agregar asistente individual a la reunión
 */
exports.addAsistente = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            cedula,
            nombre_completo,
            telefono,
            departamento,
            municipio,
            barrio,
            lider_referido,
            grupo_avanzada,
            asistio,
            observaciones
        } = req.body;

        if (!nombre_completo || nombre_completo.trim() === '') {
            return res.status(400).json({ message: 'El nombre completo es obligatorio' });
        }

        const nuevo = await ReunionAsistente.create({
            reunion_id: parseInt(id, 10),
            cedula: cedula || '',
            nombre_completo: nombre_completo.trim(),
            telefono: telefono || '',
            departamento: departamento || '',
            municipio: municipio || '',
            barrio: barrio || '',
            lider_referido: lider_referido || '',
            grupo_avanzada: grupo_avanzada || '',
            asistio: asistio !== undefined ? asistio : true,
            observaciones: observaciones || ''
        });

        // Actualizar conteo de asistentes reales si es mayor
        const total = await ReunionAsistente.count({ where: { reunion_id: id } });
        await Reunion.update({ asistentes_reales: total }, { where: { id } });

        res.status(201).json({
            message: 'Asistente registrado exitosamente',
            asistente: nuevo,
            total_asistentes: total
        });
    } catch (error) {
        console.error('Error al agregar asistente:', error);
        res.status(500).json({ message: 'Error al registrar asistente', error: error.message });
    }
};

/**
 * Importación masiva de base de datos de asistentes (JSON o Excel)
 */
exports.importAsistentes = async (req, res) => {
    try {
        const { id } = req.params;
        const reunion = await Reunion.findByPk(id);
        if (!reunion) {
            return res.status(404).json({ message: 'Reunión no encontrada' });
        }

        let lista = [];

        // Si viene archivo Excel adjunto
        if (req.file) {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(req.file.path);
            const worksheet = workbook.worksheets[0];

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Cabecera
                const values = row.values;
                // indices en exceljs row.values son 1-based
                const nombre = values[1] || values[2] || '';
                if (!nombre) return;

                lista.push({
                    reunion_id: parseInt(id, 10),
                    nombre_completo: String(nombre).trim(),
                    cedula: values[2] ? String(values[2]).trim() : '',
                    telefono: values[3] ? String(values[3]).trim() : '',
                    municipio: values[4] ? String(values[4]).trim() : reunion.municipio || '',
                    departamento: values[5] ? String(values[5]).trim() : reunion.departamento || '',
                    barrio: values[6] ? String(values[6]).trim() : '',
                    lider_referido: values[7] ? String(values[7]).trim() : '',
                    grupo_avanzada: values[8] ? String(values[8]).trim() : reunion.grupo_avanzada || '',
                    asistio: true,
                    observaciones: values[9] ? String(values[9]).trim() : ''
                });
            });

            // Eliminar archivo temporal
            try { fs.unlinkSync(req.file.path); } catch (e) { }
        } else if (req.body.asistentes && Array.isArray(req.body.asistentes)) {
            // Si viene array en cuerpo JSON
            lista = req.body.asistentes.map(a => ({
                reunion_id: parseInt(id, 10),
                nombre_completo: a.nombre_completo || a.nombre || 'Sin nombre',
                cedula: a.cedula || '',
                telefono: a.telefono || '',
                municipio: a.municipio || reunion.municipio || '',
                departamento: a.departamento || reunion.departamento || '',
                barrio: a.barrio || '',
                lider_referido: a.lider_referido || '',
                grupo_avanzada: a.grupo_avanzada || reunion.grupo_avanzada || '',
                asistio: a.asistio !== false,
                observaciones: a.observaciones || ''
            }));
        } else {
            return res.status(400).json({ message: 'No se suministraron asistentes para importar' });
        }

        if (lista.length === 0) {
            return res.status(400).json({ message: 'El archivo o lista no contiene registros válidos' });
        }

        await ReunionAsistente.bulkCreate(lista);

        const total = await ReunionAsistente.count({ where: { reunion_id: id } });
        await Reunion.update({ asistentes_reales: total }, { where: { id } });

        res.json({
            message: `Se importaron ${lista.length} asistentes exitosamente`,
            total_importados: lista.length,
            total_asistentes: total
        });
    } catch (error) {
        console.error('Error al importar asistentes:', error);
        res.status(500).json({ message: 'Error al importar base de datos de asistentes', error: error.message });
    }
};

/**
 * Eliminar un asistente de la reunión
 */
exports.deleteAsistente = async (req, res) => {
    try {
        const { id, asistenteId } = req.params;
        await ReunionAsistente.destroy({ where: { id: asistenteId, reunion_id: id } });

        const total = await ReunionAsistente.count({ where: { reunion_id: id } });
        await Reunion.update({ asistentes_reales: total }, { where: { id } });

        res.json({ message: 'Asistente eliminado exitosamente', total_asistentes: total });
    } catch (error) {
        console.error('Error al eliminar asistente:', error);
        res.status(500).json({ message: 'Error al eliminar asistente', error: error.message });
    }
};

/**
 * Exportar base de datos de la reunión a archivo Excel (.xlsx)
 */
exports.exportAsistentesExcel = async (req, res) => {
    try {
        const { id } = req.params;
        const reunion = await Reunion.findByPk(id);
        if (!reunion) {
            return res.status(404).json({ message: 'Reunión no encontrada' });
        }

        const asistentes = await ReunionAsistente.findAll({
            where: { reunion_id: id },
            order: [['createdAt', 'ASC']]
        });

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Sistema Electoral';
        const worksheet = workbook.addWorksheet('Base de Datos Asistentes');

        // Título y datos de la reunión
        worksheet.addRow(['REUNIÓN ELECTORAL:', reunion.titulo]);
        worksheet.addRow(['FECHA:', reunion.fecha, 'HORA:', `${reunion.hora_inicio} - ${reunion.hora_fin || ''}`]);
        worksheet.addRow(['LUGAR:', reunion.lugar_nombre || reunion.direccion, 'MUNICIPIO:', `${reunion.municipio || ''}, ${reunion.departamento || ''}`]);
        worksheet.addRow(['PRESIDIDA POR:', reunion.presidida_por === 'candidato' ? 'Candidato' : `Orador: ${reunion.orador_nombre || 'N/A'}`]);
        worksheet.addRow(['GRUPO DE AVANZADA:', reunion.grupo_avanzada || 'N/A', 'AFORO ESTIMADO:', reunion.aforo_estimado]);
        worksheet.addRow([]); // Espacio en blanco

        // Cabecera de la tabla
        const headerRow = worksheet.addRow([
            '#',
            'Nombre Completo',
            'Cédula',
            'Teléfono',
            'Departamento',
            'Municipio',
            'Barrio / Sector',
            'Líder / Referido',
            'Grupo Avanzada',
            'Asistió',
            'Observaciones'
        ]);

        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1E293B' } // Slate 800
        };

        // Agregar filas
        asistentes.forEach((a, index) => {
            worksheet.addRow([
                index + 1,
                a.nombre_completo,
                a.cedula || '',
                a.telefono || '',
                a.departamento || '',
                a.municipio || '',
                a.barrio || '',
                a.lider_referido || '',
                a.grupo_avanzada || '',
                a.asistio ? 'SÍ' : 'NO',
                a.observaciones || ''
            ]);
        });

        // Ajustar anchos
        worksheet.columns.forEach(column => {
            let maxLen = 12;
            column.eachCell({ includeEmpty: true }, cell => {
                const len = cell.value ? String(cell.value).length : 0;
                if (len > maxLen) maxLen = Math.min(len, 40);
            });
            column.width = maxLen + 3;
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="asistentes_reunion_${id}.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error al exportar asistentes a Excel:', error);
        res.status(500).json({ message: 'Error al exportar base de datos a Excel', error: error.message });
    }
};

/**
 * Obtener oradores y líderes de avanzada para selects
 */
exports.getEquipos = async (req, res) => {
    try {
        const { campana_id } = req.query;

        const users = await User.findAll({
            where: { activo: true },
            attributes: ['id', 'nombre', 'email', 'telefono', 'role', 'campana_id']
        });

        // Filtrar o catalogar
        const oradores = users.filter(u =>
            u.role === 'orador' ||
            u.role === 'candidato' ||
            u.role === 'gerente' ||
            u.role === 'superadmin' ||
            u.role === 'admin'
        );

        const lideresAvanzada = users.filter(u =>
            u.role === 'lider_avanzada' ||
            u.role === 'lider' ||
            u.role === 'apoyo_bd' ||
            u.role === 'gerente' ||
            u.role === 'superadmin' ||
            u.role === 'admin'
        );

        res.json({
            oradores,
            lideresAvanzada,
            todos: users
        });
    } catch (error) {
        console.error('Error al obtener equipos:', error);
        res.status(500).json({ message: 'Error al obtener usuarios de equipo', error: error.message });
    }
};
