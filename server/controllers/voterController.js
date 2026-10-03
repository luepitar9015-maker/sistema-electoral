const Voter = require('../models/Voter');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const ExcelJS = require('exceljs');

exports.createVoter = async (req, res) => {
    try {
        const { isLeader, ...voterData } = req.body;

        // Check for duplicates
        const existingVoter = await Voter.findOne({ where: { cedula: voterData.cedula } });
        if (existingVoter) {
            return res.status(400).json({ message: 'Ya existe un votante con esta cédula' });
        }

        const assignedCampanaId = req.campana_id || voterData.campana_id || req.user.campana_id || null;

        const newVoter = await Voter.create({
            ...voterData,
            campana_id: assignedCampanaId,
            usuario_registro_id: req.user.id || req.user.userId,
            isLeader: isLeader || false
        });

        res.status(201).json(newVoter);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar votante', error: error.message });
    }
};

exports.getVoters = async (req, res) => {
    try {
        const whereClause = {};
        const campanaId = req.campana_id || (req.query.campana_id ? parseInt(req.query.campana_id, 10) : null);
        if (campanaId) {
            whereClause.campana_id = campanaId;
        }

        const voters = await Voter.findAll({
            where: whereClause,
            include: [
                { model: User, attributes: ['email'] },
                { model: Campaign, attributes: ['id', 'nombre', 'tipo_cargo', 'candidato', 'color', 'nivel_territorial'] }
            ],
            order: [['fecha_registro', 'DESC']]
        });
        res.json(voters);
    } catch (error) {
        console.error('Error getVoters:', error.message);
        res.status(500).json({ message: 'Error al obtener votantes', error: error.message });
    }
};

exports.getLeaders = async (req, res) => {
    try {
        const whereClause = { isLeader: true };
        const campanaId = req.campana_id || (req.query.campana_id ? parseInt(req.query.campana_id, 10) : null);
        if (campanaId) {
            whereClause.campana_id = campanaId;
        }
        const leaders = await Voter.findAll({
            where: whereClause,
            attributes: ['id', 'nombres', 'apellidos', 'cedula', 'departamento', 'municipio', 'lugar_votacion', 'campana_id'],
            order: [['nombres', 'ASC']]
        });
        res.json(leaders);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener líderes' });
    }
};

exports.getVoterById = async (req, res) => {
    try {
        const voter = await Voter.findByPk(req.params.id, {
            include: [{ model: User, attributes: ['email'] }]
        });
        if (!voter) return res.status(404).json({ message: 'Votante no encontrado' });

        if (req.user.role !== 'superadmin' && req.campana_id && voter.campana_id && voter.campana_id !== req.campana_id) {
            return res.status(403).json({ message: 'Acceso denegado: este votante pertenece a otra campaña' });
        }

        res.json(voter);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el votante', error: error.message });
    }
};

exports.updateVoter = async (req, res) => {
    try {
        const voter = await Voter.findByPk(req.params.id);
        if (!voter) return res.status(404).json({ message: 'Votante no encontrado' });

        if (req.user.role !== 'superadmin' && req.campana_id && voter.campana_id && voter.campana_id !== req.campana_id) {
            return res.status(403).json({ message: 'Acceso denegado: no puede modificar votantes de otra campaña' });
        }

        const { nombres, apellidos, cedula, direccion, lugar_votacion, departamento, municipio, mesa, lider_nombre, lider_cedula, isLeader, campana_id } = req.body;

        // Si se cambia la cédula, verificar que no exista en otro registro
        if (cedula && cedula !== voter.cedula) {
            const existing = await Voter.findOne({ where: { cedula } });
            if (existing && existing.id !== voter.id) {
                return res.status(400).json({ message: 'Ya existe otro votante con esa cédula' });
            }
        }

        await voter.update({
            nombres:       nombres       ?? voter.nombres,
            apellidos:     apellidos     ?? voter.apellidos,
            cedula:        cedula        ?? voter.cedula,
            direccion:     direccion     ?? voter.direccion,
            lugar_votacion: lugar_votacion ?? voter.lugar_votacion,
            departamento:  departamento  ?? voter.departamento,
            municipio:     municipio     ?? voter.municipio,
            mesa:          mesa          ?? voter.mesa,
            lider_nombre:  lider_nombre  ?? voter.lider_nombre,
            lider_cedula:  lider_cedula  ?? voter.lider_cedula,
            isLeader:      isLeader      ?? voter.isLeader,
            campana_id:    req.user.role === 'superadmin' && campana_id !== undefined ? campana_id : voter.campana_id,
        });

        res.json({ message: 'Votante actualizado exitosamente', voter });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar el votante', error: error.message });
    }
};


// ─── DESCARGA DE PLANTILLA EXCEL ───────────────────────────────────────────
exports.downloadTemplate = async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Sistema Electoral';
        const sheet = workbook.addWorksheet('Votantes');

        sheet.columns = [
            { header: 'nombres',        key: 'nombres',        width: 20 },
            { header: 'apellidos',      key: 'apellidos',      width: 20 },
            { header: 'cedula',         key: 'cedula',         width: 15 },
            { header: 'direccion',      key: 'direccion',      width: 25 },
            { header: 'lugar_votacion', key: 'lugar_votacion', width: 25 },
            { header: 'departamento',   key: 'departamento',   width: 20 },
            { header: 'municipio',      key: 'municipio',      width: 20 },
            { header: 'lider_nombre',   key: 'lider_nombre',   width: 25 },
            { header: 'lider_cedula',   key: 'lider_cedula',   width: 15 },
            { header: 'isLeader',       key: 'isLeader',       width: 10 },
        ];

        // Estilo de encabezados
        const headerRow = sheet.getRow(1);
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B894' } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = { bottom: { style: 'medium', color: { argb: 'FF009B77' } } };
        });
        headerRow.height = 22;

        // Fila de ejemplo
        sheet.addRow({
            nombres: 'Juan', apellidos: 'Pérez García', cedula: '1234567890',
            direccion: 'Calle 10 # 5-20', lugar_votacion: 'Colegio San José',
            departamento: 'CUNDINAMARCA', municipio: 'Bogotá D.C.',
            lider_nombre: 'María López', lider_cedula: '9876543210', isLeader: 'false'
        });

        // Nota instructiva en fila 3
        const noteRow = sheet.getRow(3);
        noteRow.getCell(1).value = '⚠ INSTRUCCIONES: Completa desde la fila 2. isLeader acepta "true" o "false". No modifiques los encabezados.';
        noteRow.getCell(1).font = { italic: true, color: { argb: 'FF888888' }, size: 9 };
        sheet.mergeCells('A3:J3');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=plantilla_votantes.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error generando plantilla:', error);
        res.status(500).json({ message: 'Error al generar la plantilla', error: error.message });
    }
};

// ─── IMPORTACIÓN MASIVA DESDE EXCEL ────────────────────────────────────────
exports.importVoters = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No se recibió ningún archivo' });
    }

    const results = { success: 0, errors: [], duplicates: 0, total: 0 };

    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);

        const sheet = workbook.worksheets[0];
        if (!sheet) {
            return res.status(400).json({ message: 'El archivo Excel no contiene hojas de cálculo' });
        }

        // Normalizar texto: sin tildes, minúsculas, sin espacios extra
        const norm = (str) =>
            String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

        // Mapa de variantes de nombres de columnas → campo estándar
        const COLUMN_MAP = {
            nombres:        ['nombres', 'nombre', 'primer nombre', 'nombres completos', 'nombre completo', 'name', 'primer_nombre', '1er nombre'],
            apellidos:      ['apellidos', 'apellido', 'primer apellido', 'apellidos completos', 'lastname', 'primer_apellido', '1er apellido'],
            cedula:         ['cedula', 'cedula de ciudadania', 'cc', 'documento', 'num documento', 'numero documento',
                             'nro cedula', 'no cedula', 'identificacion', 'cedula ciudadania', 'n cedula',
                             'numero de cedula', 'numero_cedula', 'nro. cedula', 'no. cedula'],
            direccion:      ['direccion', 'direcci n', 'direccion residencia', 'domicilio', 'address', 'dir', 'barrio'],
            lugar_votacion: ['lugar_votacion', 'lugar votacion', 'puesto votacion', 'puesto', 'puesto de votacion',
                             'lugar de votacion', 'colegio', 'centro de votacion', 'sede', 'institucion'],
            departamento:   ['departamento', 'depto', 'dpto', 'dept', 'department', 'departamento votacion'],
            municipio:      ['municipio', 'ciudad', 'ciudad municipio', 'municipality', 'muni', 'municipio votacion'],
            lider_nombre:   ['lider_nombre', 'lider nombre', 'nombre lider', 'lider', 'gestor', 'nombre del lider',
                             'responsable', 'coordinador', 'promotor'],
            lider_cedula:   ['lider_cedula', 'lider cedula', 'cedula lider', 'cc lider', 'cc del lider',
                             'documento lider', 'cedula del lider'],
            isLeader:       ['isleader', 'es lider', 'lider s/n', 'is leader', 'eslider', 'tipo', 'es_lider',
                             'es lider?', 'lider?'],
        };

        // Leer encabezados del Excel fila 1
        const rawHeaders = [];
        sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colIdx) => {
            rawHeaders[colIdx - 1] = norm(cell.value);
        });

        // Mapear cada columna a su campo estándar
        const colFieldMap = {}; // colIndex(0-based) => fieldName
        rawHeaders.forEach((rawHeader, colIdx) => {
            for (const [field, variants] of Object.entries(COLUMN_MAP)) {
                if (variants.includes(rawHeader)) {
                    colFieldMap[colIdx] = field;
                    break;
                }
            }
        });

        console.log('Encabezados detectados:', rawHeaders);
        console.log('Mapeo de columnas:', colFieldMap);

        // Leer filas de datos (desde fila 2)
        const rows = [];
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber <= 1) return;
            const obj = {};
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const fieldName = colFieldMap[colNumber - 1];
                if (fieldName) {
                    let val = cell.value;
                    if (val !== null && val !== undefined) {
                        // Manejar cédulas guardadas como número en Excel
                        if (typeof val === 'number') val = String(Math.round(val));
                        else if (val && typeof val === 'object' && val.text) val = val.text; // rich text
                        else val = String(val).trim();
                    } else {
                        val = '';
                    }
                    obj[fieldName] = val;
                }
            });

            // Saltar filas vacías, de ejemplo o de instrucciones
            const cedVal = obj.cedula || '';
            const isInstruction = cedVal.startsWith('⚠') || cedVal.toLowerCase().includes('instruc') || cedVal === '1234567890';
            if (cedVal.length >= 4 && !isInstruction) {
                rows.push(obj);
            }
        });

        results.total = rows.length;

        if (results.total === 0) {
            return res.status(400).json({
                message: 'No se encontraron filas de datos válidas. Revisa que el archivo tenga datos desde la fila 2 y que los encabezados coincidan.',
                encabezadosDetectados: rawHeaders,
                camposMapeados: Object.values(colFieldMap)
            });
        }

        // Procesar cada fila
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2;

            // Validar campos obligatorios mínimos (solo nombres, apellidos y cédula)
            const missing = [];
            if (!row.nombres)   missing.push('nombres');
            if (!row.apellidos) missing.push('apellidos');
            if (!row.cedula)    missing.push('cedula');

            if (missing.length > 0) {
                results.errors.push({
                    fila: rowNum,
                    cedula: row.cedula || '-',
                    mensaje: `Faltan campos obligatorios: ${missing.join(', ')}`
                });
                continue;
            }

            // Verificar duplicado
            const existing = await Voter.findOne({ where: { cedula: row.cedula } });
            if (existing) {
                results.duplicates++;
                results.errors.push({ fila: rowNum, cedula: row.cedula, mensaje: 'Cédula duplicada, ya existe en la base de datos' });
                continue;
            }

            // Determinar si es líder
            const isLeaderVal = norm(row.isLeader || '');
            const isLeader = ['true', 'si', 'sí', '1', 'lider', 'líder', 's', 'yes'].includes(isLeaderVal);

            const targetCampana = req.campana_id || (campanaId ? parseInt(campanaId, 10) : null);

            await Voter.create({
                nombres:             row.nombres,
                apellidos:           row.apellidos,
                cedula:              row.cedula,
                direccion:           row.direccion || '',
                lugar_votacion:      row.lugar_votacion || '',
                mesa:                row.mesa || '',
                departamento:        row.departamento,
                municipio:           row.municipio,
                lider_nombre:        row.lider_nombre || '',
                lider_cedula:        row.lider_cedula || '',
                campana_id:          targetCampana,
                apoyo_id:            apoyoId ? parseInt(apoyoId, 10) : null,
                isLeader,
                usuario_registro_id: req.user.id || req.user.userId
            });

            results.success++;
        }

        res.json({
            message: `Importación completada: ${results.success} registrados, ${results.duplicates} duplicados, ${results.errors.length - results.duplicates} con error.`,
            ...results
        });
    } catch (error) {
        console.error('Error importando Excel:', error);
        res.status(500).json({ message: 'Error al procesar el archivo Excel', error: error.message });
    }
};
