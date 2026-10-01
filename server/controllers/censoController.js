const CensoElectoral = require('../models/CensoElectoral');
const Voter = require('../models/Voter');
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');

// Normalizar texto: minúsculas, sin tildes, sin espacios extra
const norm = (str) =>
    String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Columnas aceptadas para mapeo inteligente
const CENSO_COLUMN_MAP = {
    cedula: [
        'cedula', 'cedula de ciudadania', 'cc', 'documento', 'num documento', 'numero documento',
        'nro cedula', 'no cedula', 'identificacion', 'cedula ciudadania', 'nuip', 'doc',
        'numero de cedula', 'numero_cedula', 'nro. cedula', 'no. cedula'
    ],
    departamento: [
        'departamento', 'depto', 'dpto', 'dept', 'department', 'departamento votacion', 'divipole_depto'
    ],
    municipio: [
        'municipio', 'ciudad', 'ciudad municipio', 'municipality', 'muni', 'municipio votacion', 'divipole_muni'
    ],
    puesto_votacion: [
        'puesto_votacion', 'puesto votacion', 'puesto', 'puesto de votacion', 'puesto_de_votacion',
        'lugar_votacion', 'lugar votacion', 'lugar de votacion', 'colegio', 'centro de votacion',
        'sede', 'institucion', 'nombre puesto', 'nom_puesto'
    ],
    direccion: [
        'direccion', 'direcci n', 'direccion puesto', 'direccion de puesto', 'dir', 'domicilio', 'address'
    ],
    mesa: [
        'mesa', 'num_mesa', 'numero_mesa', 'numero mesa', 'nro mesa', 'nro_mesa', 'no mesa', 'mesa votacion'
    ],
    nombres: [
        'nombres', 'nombre', 'primer nombre', 'nombres completos', 'nombre completo', 'name'
    ],
    apellidos: [
        'apellidos', 'apellido', 'primer apellido', 'apellidos completos', 'lastname'
    ]
};

// ─── CONSULTAR CÉDULA INDIVIDUAL EN EL CENSO ───────────────────────────────
exports.lookupCedula = async (req, res) => {
    try {
        const rawCedula = String(req.params.cedula || '').replace(/\D/g, '').trim();
        if (!rawCedula) {
            return res.status(400).json({ found: false, message: 'Número de cédula inválido' });
        }

        const record = await CensoElectoral.findOne({
            where: { cedula: rawCedula }
        });

        if (!record) {
            return res.json({
                found: false,
                cedula: rawCedula,
                message: 'La cédula no figura en el censo electoral local.'
            });
        }

        return res.json({
            found: true,
            data: {
                cedula: record.cedula,
                departamento: record.departamento || '',
                municipio: record.municipio || '',
                puesto_votacion: record.puesto_votacion || '',
                lugar_votacion: record.puesto_votacion || '', // alias
                direccion: record.direccion || '',
                mesa: record.mesa || '',
                nombres: record.nombres || '',
                apellidos: record.apellidos || ''
            }
        });
    } catch (error) {
        console.error('Error en lookupCedula:', error);
        return res.status(500).json({ found: false, message: 'Error al consultar censo', error: error.message });
    }
};

// ─── CARGA MASIVA DE CENSO ELECTORAL (EXCEL O CSV) ─────────────────────────
exports.importCenso = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No se recibió ningún archivo' });
    }

    try {
        const rows = [];
        const filename = (req.file.originalname || '').toLowerCase();

        if (filename.endsWith('.csv') || req.file.mimetype === 'text/csv' || req.file.mimetype === 'text/plain') {
            // Procesamiento de CSV
            const content = req.file.buffer.toString('utf-8');
            const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
            if (lines.length < 2) {
                return res.status(400).json({ message: 'El archivo CSV está vacío o no contiene filas de datos' });
            }

            // Detectar delimitador (, ; o \t)
            const firstLine = lines[0];
            const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';

            const rawHeaders = firstLine.split(delimiter).map(h => norm(h.replace(/^["']|["']$/g, '')));
            const colMap = {};
            rawHeaders.forEach((header, idx) => {
                for (const [field, variants] of Object.entries(CENSO_COLUMN_MAP)) {
                    if (variants.includes(header)) {
                        colMap[idx] = field;
                        break;
                    }
                }
            });

            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(delimiter).map(v => v.replace(/^["']|["']$/g, '').trim());
                const obj = {};
                parts.forEach((val, idx) => {
                    const field = colMap[idx];
                    if (field) obj[field] = val;
                });

                const ced = String(obj.cedula || '').replace(/\D/g, '').trim();
                if (ced.length >= 4) {
                    obj.cedula = ced;
                    rows.push(obj);
                }
            }
        } else {
            // Procesamiento de Excel (.xlsx, .xls)
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(req.file.buffer);

            const sheet = workbook.worksheets[0];
            if (!sheet) {
                return res.status(400).json({ message: 'El archivo Excel no contiene hojas de cálculo' });
            }

            const rawHeaders = [];
            sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colIdx) => {
                rawHeaders[colIdx - 1] = norm(cell.value);
            });

            const colFieldMap = {};
            rawHeaders.forEach((rawHeader, colIdx) => {
                for (const [field, variants] of Object.entries(CENSO_COLUMN_MAP)) {
                    if (variants.includes(rawHeader)) {
                        colFieldMap[colIdx] = field;
                        break;
                    }
                }
            });

            sheet.eachRow((row, rowNumber) => {
                if (rowNumber <= 1) return;
                const obj = {};
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    const fieldName = colFieldMap[colNumber - 1];
                    if (fieldName) {
                        let val = cell.value;
                        if (val !== null && val !== undefined) {
                            if (typeof val === 'number') val = String(Math.round(val));
                            else if (typeof val === 'object' && val.text) val = val.text;
                            else val = String(val).trim();
                        } else {
                            val = '';
                        }
                        obj[fieldName] = val;
                    }
                });

                const cedVal = String(obj.cedula || '').replace(/\D/g, '').trim();
                const isInstruction = cedVal.startsWith('⚠') || cedVal.toLowerCase().includes('instruc') || cedVal === '1234567890';
                if (cedVal.length >= 4 && !isInstruction) {
                    obj.cedula = cedVal;
                    rows.push(obj);
                }
            });
        }

        if (rows.length === 0) {
            return res.status(400).json({
                message: 'No se encontraron registros de censo válidos. Verifica que el archivo contenga la columna de Cédula y datos desde la fila 2.'
            });
        }

        // Eliminar duplicados en el lote actual (dejando el último)
        const uniqueMap = new Map();
        for (const item of rows) {
            uniqueMap.set(item.cedula, item);
        }
        const uniqueRows = Array.from(uniqueMap.values());

        // Guardar en lotes de 500 para alto rendimiento
        const BATCH_SIZE = 500;
        for (let i = 0; i < uniqueRows.length; i += BATCH_SIZE) {
            const batch = uniqueRows.slice(i, i + BATCH_SIZE);
            await CensoElectoral.bulkCreate(batch, {
                updateOnDuplicate: ['departamento', 'municipio', 'puesto_votacion', 'direccion', 'mesa', 'nombres', 'apellidos']
            });
        }

        const totalCenso = await CensoElectoral.count();

        return res.json({
            success: true,
            totalProcessed: uniqueRows.length,
            totalCenso,
            message: `¡Censo cargado con éxito! Se procesaron ${uniqueRows.length} registros. Total en censo: ${totalCenso}.`
        });
    } catch (error) {
        console.error('Error importando censo:', error);
        return res.status(500).json({ message: 'Error al procesar el archivo de censo', error: error.message });
    }
};

// ─── AUTODILIGENCIAR VOTANTES DESDE EL CENSO ───────────────────────────────
exports.autoAssignVoters = async (req, res) => {
    try {
        const { overwrite = false } = req.body;

        // Buscar votantes candidatos
        const whereCondition = overwrite
            ? {}
            : {
                [Op.or]: [
                    { lugar_votacion: null },
                    { lugar_votacion: '' }
                ]
            };

        const votersToUpdate = await Voter.findAll({ where: whereCondition });

        if (votersToUpdate.length === 0) {
            return res.json({
                success: true,
                updatedCount: 0,
                totalPending: 0,
                message: 'No hay votantes pendientes de asignación de puesto de votación.'
            });
        }

        let updatedCount = 0;
        const cedulas = votersToUpdate.map(v => String(v.cedula).trim());

        // Consultar censo para estas cédulas
        const censoRecords = await CensoElectoral.findAll({
            where: {
                cedula: { [Op.in]: cedulas }
            }
        });

        const censoMap = new Map();
        censoRecords.forEach(c => censoMap.set(String(c.cedula).trim(), c));

        // Actualizar votantes que coincidan
        for (const voter of votersToUpdate) {
            const censoInfo = censoMap.get(String(voter.cedula).trim());
            if (censoInfo) {
                await voter.update({
                    lugar_votacion: censoInfo.puesto_votacion || voter.lugar_votacion,
                    mesa: censoInfo.mesa || voter.mesa,
                    departamento: censoInfo.departamento || voter.departamento,
                    municipio: censoInfo.municipio || voter.municipio,
                    direccion: voter.direccion || censoInfo.direccion || ''
                });
                updatedCount++;
            }
        }

        return res.json({
            success: true,
            totalPending: votersToUpdate.length,
            updatedCount,
            notFoundCount: votersToUpdate.length - updatedCount,
            message: `Autodiligenciamiento completado: Se actualizaron ${updatedCount} votantes con su puesto y mesa desde el censo local.`
        });
    } catch (error) {
        console.error('Error auto-asignando puestos:', error);
        return res.status(500).json({ message: 'Error al autodiligenciar votantes', error: error.message });
    }
};

// ─── ESTADÍSTICAS DEL CENSO Y COBERTURA DE VOTANTES ────────────────────────
exports.getStats = async (req, res) => {
    try {
        const totalCenso = await CensoElectoral.count();
        const totalVoters = await Voter.count();
        const withPuesto = await Voter.count({
            where: {
                lugar_votacion: {
                    [Op.and]: [
                        { [Op.ne]: null },
                        { [Op.ne]: '' }
                    ]
                }
            }
        });
        const withoutPuesto = totalVoters - withPuesto;

        return res.json({
            totalCenso,
            totalVoters,
            withPuesto,
            withoutPuesto,
            coveragePercent: totalVoters > 0 ? Math.round((withPuesto / totalVoters) * 100) : 0
        });
    } catch (error) {
        console.error('Error en getStats censo:', error);
        return res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
};

// ─── DESCARGA DE PLANTILLA PARA CENSO ──────────────────────────────────────
exports.downloadTemplate = async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Sistema Electoral';
        const sheet = workbook.addWorksheet('Censo Electoral');

        sheet.columns = [
            { header: 'cedula',          key: 'cedula',          width: 16 },
            { header: 'departamento',    key: 'departamento',    width: 22 },
            { header: 'municipio',       key: 'municipio',       width: 22 },
            { header: 'puesto_votacion', key: 'puesto_votacion', width: 30 },
            { header: 'direccion',       key: 'direccion',       width: 28 },
            { header: 'mesa',            key: 'mesa',            width: 10 },
            { header: 'nombres',         key: 'nombres',         width: 22 },
            { header: 'apellidos',       key: 'apellidos',       width: 22 }
        ];

        const headerRow = sheet.getRow(1);
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
        headerRow.height = 24;

        sheet.addRow({
            cedula: '1012345678',
            departamento: 'CUNDINAMARCA',
            municipio: 'Bogotá D.C.',
            puesto_votacion: 'COLEGIO NACIONAL SAN JOSÉ',
            direccion: 'Cra 15 # 45-20',
            mesa: '12',
            nombres: 'CARLOS',
            apellidos: 'GÓMEZ'
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=plantilla_censo_electoral.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error generando plantilla censo:', error);
        res.status(500).json({ message: 'Error al generar la plantilla', error: error.message });
    }
};

// ─── VACIAR BASE DE CENSO ──────────────────────────────────────────────────
exports.clearCenso = async (req, res) => {
    try {
        await CensoElectoral.destroy({ where: {}, truncate: false });
        return res.json({ success: true, message: 'Censo electoral vaciado exitosamente' });
    } catch (error) {
        console.error('Error al vaciar censo:', error);
        return res.status(500).json({ message: 'Error al vaciar censo', error: error.message });
    }
};
