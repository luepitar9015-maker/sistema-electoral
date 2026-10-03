const Voter = require('../models/Voter');
const User = require('../models/User');
const ExcelJS = require('exceljs');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');

const getFilteredVoters = async (req) => {
    const { departamento, municipio, lider_cedula } = req.query;
    let whereClause = {};

    const campanaId = req.campaignId || req.campana_id || (req.query.campana_id ? parseInt(req.query.campana_id, 10) : null);
    if (campanaId) whereClause.campana_id = campanaId;
    if (departamento) whereClause.departamento = departamento;
    if (municipio) whereClause.municipio = municipio;
    if (lider_cedula) whereClause.lider_cedula = lider_cedula;

    // Restricción si es líder
    if (req.user && req.user.role === 'lider') {
        const { Op } = require('sequelize');
        whereClause[Op.or] = [
            { lider_cedula: req.user.cedula },
            { usuario_registro_id: req.user.id }
        ];
    }

    return await Voter.findAll({
        where: whereClause,
        include: [{ model: User, attributes: ['email'] }],
        raw: true,
        nest: true,
        order: [['apellidos', 'ASC']]
    });
};

// Exportación a Excel con Marca de Agua de Seguridad Anti-Fugas
exports.exportExcel = async (req, res) => {
    try {
        const voters = await getFilteredVoters(req);
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Censo Votantes Campaña');

        const userIdent = req.user ? `${req.user.email || 'Usuario'} (ID: ${req.user.id}, Cédula: ${req.user.cedula || 'N/A'})` : 'Usuario Anónimo';
        const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
        const now = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });

        // Banner de Seguridad Anti-Fugas
        sheet.mergeCells('A1:J1');
        const titleRow = sheet.getCell('A1');
        titleRow.value = '⚠️ DOCUMENTO CONFIDENCIAL - PROPIEDAD EXCLUSIVA DE LA CAMPAÑA ELECTORAL';
        titleRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB91C1C' } }; // Rojo seguridad
        titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 28;

        sheet.mergeCells('A2:J2');
        const metaRow = sheet.getCell('A2');
        metaRow.value = `TRAZABILIDAD: Descargado por: ${userIdent} | Fecha: ${now} | IP: ${clientIp} | PROHIBIDA SU DISTRIBUCIÓN`;
        metaRow.font = { italic: true, size: 9, color: { argb: 'FF374151' } };
        metaRow.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(2).height = 20;

        // Encabezados de Datos
        const headers = [
            'Cédula', 'Nombres', 'Apellidos', 'Teléfono / Celular', 
            'Departamento', 'Municipio', 'Puesto de Votación', 'Mesa', 
            'Líder Responsable', 'Fidelidad (1-5)'
        ];
        sheet.getRow(4).values = headers;
        sheet.getRow(4).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }; // Azul oscuro
        sheet.getRow(4).height = 24;

        // Agregar Votantes
        voters.forEach((v, index) => {
            const rowNumber = index + 5;
            sheet.getRow(rowNumber).values = [
                v.cedula || '',
                v.nombres || '',
                v.apellidos || '',
                v.telefono || v.direccion || '',
                v.departamento || '',
                v.municipio || '',
                v.lugar_votacion || '',
                v.mesa || '',
                v.lider_nombre || 'Directo',
                v.fidelidad_score || 3
            ];
        });

        // Ajuste automático de ancho de columnas
        sheet.columns.forEach((col) => {
            let maxLen = 14;
            col.eachCell({ includeEmpty: false }, (cell) => {
                const len = cell.value ? cell.value.toString().length : 0;
                if (len > maxLen) maxLen = Math.min(len + 2, 45);
            });
            col.width = maxLen;
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="censo_electoral_${Date.now()}.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error al exportar Excel:', error);
        res.status(500).json({ message: 'Error al generar archivo Excel', error: error.message });
    }
};

// Exportación a PDF con Marca de Agua Diagonal Anti-Espionaje
exports.exportPDF = async (req, res) => {
    try {
        const voters = await getFilteredVoters(req);
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });

        const userIdent = req.user ? `${req.user.email} (Cédula: ${req.user.cedula || 'N/A'})` : 'Usuario';
        const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
        const now = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
        const watermarkText = `CONFIDENCIAL - ${userIdent} - ${now} - IP: ${clientIp}`;

        const tableColumn = ['Cédula', 'Nombres', 'Apellidos', 'Departamento', 'Municipio', 'Puesto', 'Mesa', 'Líder'];
        const tableRows = voters.map(v => [
            v.cedula,
            v.nombres,
            v.apellidos,
            v.departamento,
            v.municipio,
            v.lugar_votacion,
            v.mesa,
            v.lider_nombre || 'Directo'
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 50,
            theme: 'striped',
            headStyles: { fillColor: [30, 58, 138] },
            styles: { fontSize: 8, cellPadding: 3 },
            didDrawPage: (data) => {
                // Título superior
                doc.setFontSize(12);
                doc.setTextColor(30, 58, 138);
                doc.text('LISTADO OFICIAL DE VOTANTES DE CAMPAÑA', 40, 30);

                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(`Trazabilidad: ${userIdent} | ${now}`, 40, 42);

                // Marca de agua diagonal en cada página (Anti-Fugas / Anti-Espionaje)
                doc.saveGraphicsState();
                doc.setFontSize(14);
                doc.setTextColor(220, 38, 38); // Rojo translúcido
                doc.setGState(new doc.GState({ opacity: 0.18 }));
                // Rotación diagonal en el centro de la página
                doc.text(watermarkText, 180, 450, { angle: 35 });
                doc.text(watermarkText, 100, 250, { angle: 35 });
                doc.restoreGraphicsState();
            }
        });

        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="censo_votantes_${Date.now()}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error al generar PDF:', error);
        res.status(500).json({ message: 'Error al generar reporte PDF', error: error.message });
    }
};

// Simulador Electoral D'Hondt y Umbral / Cifra Repartidora
exports.simulateDHondt = (req, res) => {
    try {
        const {
            total_censo = 100000,
            participacion_pct = 55,
            escanos_disponibles = 19, // Ej: Concejo municipal estándar
            umbral_pct = 50, // 50% del cociente electoral o porcentaje fijo
            votos_en_blanco = 3500,
            votos_nulos = 1200,
            listas = [
                { nombre: 'Nuestra Lista (Campaña)', votos: 14500, esPropia: true },
                { nombre: 'Partido Conservador / Coalición A', votos: 18200 },
                { nombre: 'Partido Liberal / Coalición B', votos: 12100 },
                { nombre: 'Alianza Verde / Coalición C', votos: 8900 },
                { nombre: 'Movimiento Independiente', votos: 4200 },
                { nombre: 'Otros Partidos Menores', votos: 2800 }
            ]
        } = req.body;

        const totalVotantesEstimados = Math.round(total_censo * (participacion_pct / 100));
        const votosValidos = totalVotantesEstimados - (votos_nulos || 0);

        // Cociente electoral = Votos válidos / Escaños a proveer
        const cocienteElectoral = votosValidos / escanos_disponibles;

        // Umbral = En Colombia Concejo/Asamblea suele ser el 50% del cociente electoral
        const umbralVotos = Math.round(cocienteElectoral * (umbral_pct / 100));

        // Filtrar listas que superan el umbral
        const listasValidas = listas
            .map(l => ({ ...l, votos: Number(l.votos) || 0 }))
            .filter(l => l.votos >= umbralVotos);

        const listasBajoUmbral = listas.filter(l => (Number(l.votos) || 0) < umbralVotos);

        // Algoritmo D'Hondt: Dividir votos de cada lista entre 1, 2, 3... hasta N escaños
        const cocientes = [];
        listasValidas.forEach(lista => {
            for (let i = 1; i <= escanos_disponibles; i++) {
                cocientes.push({
                    partido: lista.nombre,
                    divisor: i,
                    valor: lista.votos / i,
                    esPropia: !!lista.esPropia
                });
            }
        });

        // Ordenar cocientes de mayor a menor
        cocientes.sort((a, b) => b.valor - a.valor);

        // Los primeros N cocientes obtienen escaño
        const escanosAsignados = cocientes.slice(0, escanos_disponibles);
        const cifraRepartidora = escanosAsignados[escanosAsignados.length - 1]?.valor || 0;

        // Conteo de curules por partido
        const resultadosPartidos = listasValidas.map(lista => {
            const curules = escanosAsignados.filter(c => c.partido === lista.nombre).length;
            return {
                nombre: lista.nombre,
                votos: lista.votos,
                curules,
                porcentajeVotos: ((lista.votos / votosValidos) * 100).toFixed(2),
                esPropia: !!lista.esPropia
            };
        });

        // Votos que le faltaron a la lista propia para ganar el siguiente escaño
        const listaPropia = resultadosPartidos.find(p => p.esPropia);
        let votosFaltantesSiguienteCurul = null;

        if (listaPropia) {
            const siguienteDivisor = listaPropia.curules + 1;
            // Para superar la cifra repartidora, (Votos + X) / siguienteDivisor > CifraRepartidora
            const votosNecesarios = Math.ceil(cifraRepartidora * siguienteDivisor) + 1;
            votosFaltantesSiguienteCurul = Math.max(0, votosNecesarios - listaPropia.votos);
        }

        return res.json({
            parametros: {
                total_censo,
                participacion_pct,
                totalVotantesEstimados,
                votosValidos,
                escanos_disponibles,
                cocienteElectoral: Math.round(cocienteElectoral),
                umbralVotos
            },
            cifraRepartidora: Math.round(cifraRepartidora),
            resultados: resultadosPartidos.sort((a, b) => b.curules - a.curules || b.votos - a.votos),
            listasBajoUmbral,
            analisisListaPropia: {
                curules_obtenidas: listaPropia?.curules || 0,
                votos_actuales: listaPropia?.votos || 0,
                votos_para_siguiente_curul: votosFaltantesSiguienteCurul
            }
        });
    } catch (error) {
        console.error('Error en simulador DHondt:', error);
        return res.status(500).json({ message: 'Error en cálculo de simulación electoral' });
    }
};

exports.getGeoStats = async (req, res) => {
    try {
        const sequelize = require('../database/db');
        const campanaId = req.campaignId || req.campana_id || (req.query.campana_id ? parseInt(req.query.campana_id, 10) : null);
        const where = {};
        if (campanaId) where.campana_id = campanaId;

        const stats = await Voter.findAll({
            where,
            attributes: [
                'departamento',
                'municipio',
                [sequelize.fn('COUNT', sequelize.col('cedula')), 'total']
            ],
            group: ['departamento', 'municipio'],
            order: [['departamento', 'ASC'], ['municipio', 'ASC']],
            raw: true
        });
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener estadísticas geográficas', error: error.message });
    }
};

exports.getLeaderStats = async (req, res) => {
    try {
        const sequelize = require('../database/db');
        const campanaId = req.campaignId || req.campana_id || (req.query.campana_id ? parseInt(req.query.campana_id, 10) : null);
        const where = { isLeader: false };
        if (campanaId) where.campana_id = campanaId;

        const stats = await Voter.findAll({
            attributes: [
                'lider_nombre',
                'lider_cedula',
                'departamento',
                'municipio',
                [sequelize.fn('COUNT', sequelize.col('id')), 'total_votos']
            ],
            where,
            group: ['lider_cedula', 'lider_nombre', 'departamento', 'municipio'],
            order: [[sequelize.col('total_votos'), 'DESC']],
            limit: 100
        });

        res.json(stats);
    } catch (error) {
        console.error("Error leader stats:", error);
        res.status(500).json({ message: 'Error al obtener líderes', error: error.message });
    }
};
