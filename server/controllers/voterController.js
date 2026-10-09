const Voter = require('../models/Voter');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const VoterInteraction = require('../models/VoterInteraction');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const { evaluarTrashumancia } = require('../services/trashumanciaService');
const { ejecutarAuditoriaVotosReales } = require('../services/electoralAuditService');

exports.createVoter = async (req, res) => {
    try {
        const { isLeader, ...voterData } = req.body;

        // Check for duplicates
        const existingVoter = await Voter.findOne({ where: { cedula: voterData.cedula } });
        if (existingVoter) {
            return res.status(400).json({ message: 'Ya existe un votante con esta cédula' });
        }

        const assignedCampanaId = req.campana_id || voterData.campana_id || req.user?.campana_id || null;

        // Evaluación automática de Censo y Trashumancia Electoral
        const evaluacion = await evaluarTrashumancia({
            cedula: voterData.cedula,
            direccion: voterData.direccion || '',
            departamentoReportado: voterData.departamento || '',
            municipioReportado: voterData.municipio || '',
            campanaId: assignedCampanaId,
            voterModel: Voter
        });

        const newVoter = await Voter.create({
            ...voterData,
            campana_id: assignedCampanaId,
            usuario_registro_id: req.user?.id || req.user?.userId || null,
            isLeader: isLeader || false,
            estado_trashumancia: evaluacion.estado_trashumancia,
            detalle_trashumancia: evaluacion.detalle_trashumancia,
            municipio_censo_real: evaluacion.municipio_censo_real || voterData.municipio || null,
            departamento_censo_real: evaluacion.departamento_censo_real || voterData.departamento || null,
            puesto_censo_real: evaluacion.puesto_censo_real || voterData.lugar_votacion || null,
            mesa_censo_real: evaluacion.mesa_censo_real || voterData.mesa || null
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

        // Restricción de seguridad: Los líderes solo ven sus propios votantes
        if (req.user && req.user.role === 'lider') {
            whereClause[Op.or] = [
                { lider_cedula: req.user.cedula },
                { usuario_registro_id: req.user.id }
            ];
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

// Actualizar Scoring de Fidelidad e Intención de Voto
exports.updateVoterScoring = async (req, res) => {
    try {
        const { id } = req.params;
        const { fidelidad_score, intencion_voto, observaciones_seguimiento, latitud, longitud } = req.body;

        const voter = await Voter.findByPk(id);
        if (!voter) {
            return res.status(404).json({ message: 'Votante no encontrado' });
        }

        if (fidelidad_score !== undefined) voter.fidelidad_score = parseInt(fidelidad_score, 10);
        if (intencion_voto !== undefined) voter.intencion_voto = intencion_voto;
        if (observaciones_seguimiento !== undefined) voter.observaciones_seguimiento = observaciones_seguimiento;
        if (latitud !== undefined) voter.latitud = parseFloat(latitud);
        if (longitud !== undefined) voter.longitud = parseFloat(longitud);

        await voter.save();
        return res.json({ message: 'Scoring y datos territoriales actualizados', voter });
    } catch (error) {
        console.error('Error al actualizar scoring del votante:', error);
        return res.status(500).json({ message: 'Error al actualizar scoring' });
    }
};

// Registrar interacción con el votante (Llamada, Visita, Reunión, etc.)
exports.addVoterInteraction = async (req, res) => {
    try {
        const { id } = req.params; // voter_id
        const { tipo, resultado, notas } = req.body;

        const voter = await Voter.findByPk(id);
        if (!voter) {
            return res.status(404).json({ message: 'Votante no encontrado' });
        }

        const interaction = await VoterInteraction.create({
            voter_id: id,
            usuario_id: req.user.id || req.user.userId,
            tipo: tipo || 'llamada',
            resultado: resultado || 'positivo',
            notas: notas || ''
        });

        // Si la interacción es muy positiva o de riesgo, ajustar fidelidad automáticamente
        if (resultado === 'positivo' && voter.fidelidad_score < 5) {
            voter.fidelidad_score = Math.min(5, voter.fidelidad_score + 1);
            await voter.save();
        } else if (resultado === 'negativo') {
            voter.fidelidad_score = Math.max(1, voter.fidelidad_score - 1);
            voter.intencion_voto = 'dudoso';
            await voter.save();
        }

        return res.status(201).json({ message: 'Interacción registrada', interaction });
    } catch (error) {
        console.error('Error al registrar interacción:', error);
        return res.status(500).json({ message: 'Error al registrar interacción' });
    }
};

// Obtener historial de interacciones de un votante
exports.getVoterInteractions = async (req, res) => {
    try {
        const { id } = req.params;
        const interacciones = await VoterInteraction.findAll({
            where: { voter_id: id },
            include: [{ model: User, as: 'responsable', attributes: ['id', 'email', 'cedula'] }],
            order: [['createdAt', 'DESC']]
        });
        return res.json(interacciones);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener historial de interacciones' });
    }
};

// Obtener datos geoespaciales para mapa de calor territorial (Leaflet / GIS)
exports.getTerritorialGeoData = async (req, res) => {
    try {
        const campanaId = req.campaignId || (req.query.campana_id ? parseInt(req.query.campana_id, 10) : null);
        const whereClause = {};
        if (campanaId) whereClause.campana_id = campanaId;

        const voters = await Voter.findAll({
            where: whereClause,
            attributes: ['id', 'nombres', 'apellidos', 'cedula', 'municipio', 'departamento', 'lugar_votacion', 'mesa', 'latitud', 'longitud', 'fidelidad_score', 'intencion_voto', 'ha_votado', 'lider_nombre']
        });

        // Tabla de referencia de coordenadas geográficas en Colombia
        const coordsFallback = {
            'UIS - Campus Central': [7.1404, -73.1205],
            'Coliseo Bicentenario': [7.1332, -73.1167],
            'Colegio Santander': [7.1380, -73.1250],
            'I.E. Dámaso Zapata': [7.1350, -73.1220],
            'Colegio La Salle': [7.1180, -73.1110],
            'Colegio José Elías Puyana': [7.0620, -73.0870],
            'Coliseo La Cumbre': [7.0710, -73.0920],
            'Colegio Pan de Azúcar': [7.0850, -73.1010],
            'Colegio Balbino García': [6.9880, -73.0510],
            'Polideportivo Villabel': [6.9920, -73.0550],
            'Colegio San Juan de Girón': [7.0730, -73.1690],
            'Coliseo Santa Cruz': [7.0700, -73.1650],
            'Colegio Diego Hernández de Gallegos': [7.0650, -73.8540],
            'Club Infantas': [7.0610, -73.8590],
            'Colegio Camilo Torres': [7.0700, -73.8610],
            'Colegio San José Guanentá': [6.5540, -73.1340],
            'Coliseo Lorenzo Alcantuz': [6.5580, -73.1360],
            'Colegio Universitario': [6.4670, -73.2610],
            'Colegio Nacional Universitario': [6.0120, -73.6730],
            'Corferias (Pabellón 4)': [4.6295, -74.0898],
            'Unicentro (Entrada 5)': [4.7018, -74.0416],
            'Plaza de las Américas': [4.6210, -74.1350],
            'Coliseo El Campín': [4.6490, -74.0770],
            'Colegio Cafam La Floresta': [4.6850, -74.0750],
            'Estadio General Santander': [7.8939, -72.5078],
            'Colegio Calasanz': [7.9010, -72.4980],
            'Colegio Municipal': [7.8870, -72.5010],
            'Colegio José Eusebio Caro': [8.2380, -73.3540],
            'Colegio Provincial San José': [7.3760, -72.6480],
            'Colegio General Santander': [7.8340, -72.4760],
            'Plaza Mayor': [6.2425, -75.5768],
            'Colegio San Ignacio': [6.2480, -75.5650],
            'I.E. San Javier': [6.2520, -75.6120],
            'Colegio Manuel Uribe Ángel': [6.1730, -75.5860],
            'Colegio San José de las Cuchillas': [6.1550, -75.3740],
            'Colegio de Boyacá': [5.5350, -73.3670],
            'Coliseo San Antonio': [5.5410, -73.3590],
            'Colegio Guillermo León Valencia': [5.8270, -73.0340],
            // Fallback por municipios
            'Bucaramanga': [7.1254, -73.1198],
            'Floridablanca': [7.0622, -73.0864],
            'Piedecuesta': [6.9877, -73.0494],
            'Girón': [7.0682, -73.1698],
            'Barrancabermeja': [7.0653, -73.8547],
            'San Gil': [6.5569, -73.1332],
            'Socorro': [6.4682, -73.2625],
            'Vélez': [6.0125, -73.6738],
            'Bogotá D.C.': [4.6500, -74.0800],
            'Cúcuta': [7.8939, -72.5078],
            'Ocaña': [8.2380, -73.3540],
            'Pamplona': [7.3760, -72.6480],
            'Villa del Rosario': [7.8340, -72.4760],
            'Medellín': [6.2442, -75.5812],
            'Envigado': [6.1730, -75.5860],
            'Rionegro': [6.1550, -75.3740],
            'Tunja': [5.5350, -73.3670],
            'Duitama': [5.8270, -73.0340],
            'Cali': [3.4516, -76.5320],
            'Barranquilla': [10.9685, -74.7813]
        };

        // Agrupación por puestos de votación
        const puestosMap = {};
        voters.forEach(v => {
            const puestoKey = `${v.municipio || ''} - ${v.lugar_votacion || 'Sin Puesto'}`;
            if (!puestosMap[puestoKey]) {
                let initialLat = v.latitud || null;
                let initialLng = v.longitud || null;

                if (!initialLat || !initialLng) {
                    if (v.lugar_votacion && coordsFallback[v.lugar_votacion]) {
                        [initialLat, initialLng] = coordsFallback[v.lugar_votacion];
                    } else if (v.municipio && coordsFallback[v.municipio]) {
                        const base = coordsFallback[v.municipio];
                        initialLat = base[0] + (Math.random() * 0.01 - 0.005);
                        initialLng = base[1] + (Math.random() * 0.01 - 0.005);
                    }
                }

                puestosMap[puestoKey] = {
                    puesto: v.lugar_votacion || 'Sin Puesto',
                    municipio: v.municipio || '',
                    departamento: v.departamento || '',
                    total_votantes: 0,
                    votos_efectivos: 0,
                    latitud: initialLat,
                    longitud: initialLng,
                    scores: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                };
            }

            puestosMap[puestoKey].total_votantes++;
            if (v.ha_votado) puestosMap[puestoKey].votos_efectivos++;
            const sc = v.fidelidad_score || 3;
            if (puestosMap[puestoKey].scores[sc] !== undefined) puestosMap[puestoKey].scores[sc]++;
            
            if (!puestosMap[puestoKey].latitud && v.latitud) puestosMap[puestoKey].latitud = v.latitud;
            if (!puestosMap[puestoKey].longitud && v.longitud) puestosMap[puestoKey].longitud = v.longitud;
        });

        // Asegurar que ningún puesto quede sin coordenadas si tiene municipio
        Object.values(puestosMap).forEach(p => {
            if (!p.latitud || !p.longitud) {
                if (coordsFallback[p.puesto]) {
                    [p.latitud, p.longitud] = coordsFallback[p.puesto];
                } else if (coordsFallback[p.municipio]) {
                    const base = coordsFallback[p.municipio];
                    p.latitud = base[0] + (Math.random() * 0.01 - 0.005);
                    p.longitud = base[1] + (Math.random() * 0.01 - 0.005);
                }
            }
        });

        const puestosArray = Object.values(puestosMap);
        const conCoords = puestosArray.filter(p => !!p.latitud && !!p.longitud);

        return res.json({
            total_geolocalizados: conCoords.length,
            total_votantes: voters.length,
            puestos: puestosArray,
            votantes_geolocalizados: voters.filter(v => !!v.latitud && !!v.longitud)
        });
    } catch (error) {
        console.error('Error al generar datos territoriales:', error);
        return res.status(500).json({ message: 'Error al generar mapa territorial' });
    }
};

// ─── AUDITORÍA MASIVA DE TRASHUMANCIA ELECTORAL ─────────────────────────────
exports.auditarTrashumanciaMasiva = async (req, res) => {
    try {
        const campanaId = req.campana_id || (req.query.campana_id ? parseInt(req.query.campana_id, 10) : null);
        const whereClause = {};
        if (campanaId) whereClause.campana_id = campanaId;

        const voters = await Voter.findAll({ where: whereClause });

        const stats = {
            total_auditados: voters.length,
            validos: 0,
            alerta_municipio: 0,
            alerta_departamento: 0,
            no_en_censo: 0,
            sospecha_concentracion: 0
        };

        for (const v of voters) {
            const ev = await evaluarTrashumancia({
                cedula: v.cedula,
                direccion: v.direccion || '',
                departamentoReportado: v.departamento || '',
                municipioReportado: v.municipio || '',
                campanaId: v.campana_id || campanaId,
                voterModel: Voter
            });

            v.estado_trashumancia = ev.estado_trashumancia;
            v.detalle_trashumancia = ev.detalle_trashumancia;
            if (ev.municipio_censo_real) v.municipio_censo_real = ev.municipio_censo_real;
            if (ev.departamento_censo_real) v.departamento_censo_real = ev.departamento_censo_real;
            if (ev.puesto_censo_real) v.puesto_censo_real = ev.puesto_censo_real;
            if (ev.mesa_censo_real) v.mesa_censo_real = ev.mesa_censo_real;
            await v.save();

            if (stats[ev.estado_trashumancia] !== undefined) {
                stats[ev.estado_trashumancia]++;
            }
        }

        return res.json({
            message: 'Auditoría de trashumancia completada exitosamente',
            stats
        });
    } catch (error) {
        console.error('Error en auditarTrashumanciaMasiva:', error);
        return res.status(500).json({ message: 'Error al ejecutar auditoría', error: error.message });
    }
};

// ─── AUDITORÍA INTEGRAL DE VOTOS REALES Y DIFUNTOS ─────────────────────────
exports.auditarVotosReales = async (req, res) => {
    try {
        const campanaId = req.campaignId || req.campana_id || (req.query.campana_id ? parseInt(req.query.campana_id, 10) : null);
        const resultado = await ejecutarAuditoriaVotosReales(campanaId);
        return res.json({
            success: true,
            message: 'Auditoría integral completada: Se identificaron difuntos, duplicados, inconsistencias de censo y se calcularon los votos reales.',
            data: resultado
        });
    } catch (error) {
        console.error('Error en auditarVotosReales:', error);
        return res.status(500).json({ message: 'Error al ejecutar auditoría de votos reales', error: error.message });
    }
};

// ─── RESUMEN DE VOTOS REALES Y EFECTIVIDAD ─────────────────────────────────
exports.getResumenVotosReales = async (req, res) => {
    try {
        const campanaId = req.campaignId || req.campana_id || (req.query.campana_id ? parseInt(req.query.campana_id, 10) : null);
        const whereClause = {};
        if (campanaId) whereClause.campana_id = campanaId;

        const totalAuditados = await Voter.count({ where: whereClause });
        const difuntosCount = await Voter.count({ where: { ...whereClause, es_fallecido: true } });
        const duplicadosCount = await Voter.count({ where: { ...whereClause, es_duplicado: true, es_voto_real: false } });
        const noEnCensoCount = await Voter.count({ where: { ...whereClause, estado_trashumancia: 'no_en_censo' } });
        const trashumanciaMpio = await Voter.count({ where: { ...whereClause, estado_trashumancia: 'alerta_municipio' } });
        const trashumanciaDepto = await Voter.count({ where: { ...whereClause, estado_trashumancia: 'alerta_departamento' } });
        const votosReales = await Voter.count({ where: { ...whereClause, es_voto_real: true } });

        // Scoring de votos reales seguros (fidelidad >= 4)
        const votoDuro = await Voter.count({ 
            where: { 
                ...whereClause, 
                es_voto_real: true, 
                fidelidad_score: { [Op.gte]: 4 } 
            } 
        });

        return res.json({
            total_auditados: totalAuditados,
            votos_brutos: totalAuditados,
            difuntos_detectados: difuntosCount,
            duplicados_detectados: duplicadosCount,
            no_en_censo: noEnCensoCount,
            trashumancia_municipio: trashumanciaMpio,
            trashumancia_departamento: trashumanciaDepto,
            votos_reales_computables: votosReales,
            voto_duro_seguro: votoDuro,
            porcentaje_efectividad_real: totalAuditados > 0 ? Math.round((votosReales / totalAuditados) * 100) : 0
        });
    } catch (error) {
        console.error('Error en getResumenVotosReales:', error);
        return res.status(500).json({ message: 'Error al obtener resumen de votos reales', error: error.message });
    }
};


