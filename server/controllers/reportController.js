const Voter = require('../models/Voter');
const User = require('../models/User');
// const ExcelJS = require('exceljs');
// const { jsPDF } = require('jspdf');
// require('jspdf-autotable');

const getFilteredVoters = async (req) => {
    const { departamento, municipio, lider_cedula } = req.query;
    let whereClause = {};

    const campanaId = req.campana_id || (req.query.campana_id ? parseInt(req.query.campana_id, 10) : null);
    if (campanaId) whereClause.campana_id = campanaId;
    if (departamento) whereClause.departamento = departamento;
    if (municipio) whereClause.municipio = municipio;
    if (lider_cedula) whereClause.lider_cedula = lider_cedula;

    return await Voter.findAll({
        where: whereClause,
        include: [{ model: User, attributes: ['email'] }],
        raw: true,
        nest: true
    });
};

exports.exportExcel = async (req, res) => {
    // try {
    //     const voters = await getFilteredVoters(req);
    //     const workbook = new ExcelJS.Workbook();
    //     // ... implementación ...
    //     await workbook.xlsx.write(res);
    //     res.end();
    // } catch (error) {
    res.status(500).json({ message: 'Exportación a Excel deshabilitada temporalmente por error en servidor.' });
    // }
};

exports.exportPDF = async (req, res) => {
    // try {
    //     const voters = await getFilteredVoters(req);
    //     const doc = new jsPDF();
    //     // ...
    //     res.send(Buffer.from(doc.output('arraybuffer')));
    // } catch (error) {
    res.status(500).json({ message: 'Exportación a PDF deshabilitada temporalmente por error en servidor.' });
    // }
};

exports.getGeoStats = async (req, res) => {
    try {
        const Voter = require('../models/Voter');
        const sequelize = require('../database/db');

        const campanaId = req.campana_id || (req.query.campana_id ? parseInt(req.query.campana_id, 10) : null);
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
        const Voter = require('../models/Voter');

        const campanaId = req.campana_id || (req.query.campana_id ? parseInt(req.query.campana_id, 10) : null);
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
            group: ['lider_cedula', 'lider_nombre'],
            order: [[sequelize.col('total_votos'), 'DESC']],
            limit: 100
        });

        res.json(stats);
    } catch (error) {
        console.error("Error leader stats:", error);
        res.status(500).json({ message: 'Error al obtener líderes', error: error.message });
    }
};



