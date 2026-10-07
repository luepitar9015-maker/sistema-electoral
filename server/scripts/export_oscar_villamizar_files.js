const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const ExcelJS = require('exceljs');
const SocialMediaPost = require('../models/SocialMediaPost');
const SocialPostComment = require('../models/SocialPostComment');
const SocialCompetitorAttack = require('../models/SocialCompetitorAttack');
const Campaign = require('../models/Campaign');

async function exportFiles() {
    console.log('📦 Generando archivos de exportación para las redes de Oscar Villamizar...');

    const campaign = await Campaign.findOne({
        where: { candidato: 'OSCAR VILLAMIZAR' }
    }) || await Campaign.findByPk(2);

    const campId = campaign ? campaign.id : 2;

    const posts = await SocialMediaPost.findAll({
        where: { campana_id: campId },
        order: [['createdAt', 'DESC']]
    });

    const postIds = posts.map(p => p.id);
    const comments = await SocialPostComment.findAll({
        where: { post_id: postIds },
        order: [['createdAt', 'DESC']]
    });

    const attacks = await SocialCompetitorAttack.findAll({
        where: { campana_id: campId },
        order: [['createdAt', 'DESC']]
    });

    console.log(`  - Publicaciones encontradas: ${posts.length}`);
    console.log(`  - Comentarios encontrados: ${comments.length}`);
    console.log(`  - Ataques War Room encontrados: ${attacks.length}`);

    const exportDir = path.join(__dirname, '../uploads/exports');
    if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
    }

    // 1. GENERAR ARCHIVO EXCEL (.XLSX)
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Electoral - Oscar Villamizar';
    workbook.created = new Date();

    // Sheet 1: Publicaciones
    const sheetPosts = workbook.addWorksheet('Publicaciones Oficiales');
    sheetPosts.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Plataforma', key: 'plataforma', width: 14 },
        { header: 'Autor', key: 'autor', width: 22 },
        { header: 'Título de la Publicación', key: 'titulo', width: 45 },
        { header: 'Tipo', key: 'tipo', width: 12 },
        { header: 'Alcance', key: 'alcance', width: 12 },
        { header: 'Impresiones', key: 'impresiones', width: 14 },
        { header: 'Reproducciones', key: 'reproducciones', width: 16 },
        { header: 'Likes', key: 'likes', width: 10 },
        { header: 'Comentarios', key: 'comentarios', width: 14 },
        { header: 'Compartidos', key: 'compartidos', width: 14 },
        { header: 'Tema Estratégico', key: 'tema', width: 32 },
        { header: 'Enlace Oficial', key: 'url', width: 45 },
        { header: 'Texto / Copy Completo', key: 'contenido', width: 70 }
    ];

    sheetPosts.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheetPosts.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B894' } };

    posts.forEach(p => {
        sheetPosts.addRow({
            id: p.id,
            plataforma: (p.plataforma || '').toUpperCase(),
            autor: p.autor_usuario || p.autor_nombre,
            titulo: p.titulo,
            tipo: p.tipo_contenido,
            alcance: p.alcance || 0,
            impresiones: p.impresiones || 0,
            reproducciones: p.reproducciones || 0,
            likes: p.likes || 0,
            comentarios: p.comentarios_conteo || 0,
            compartidos: p.compartidos || 0,
            tema: p.tema_estrategico || 'General',
            url: p.url_publicacion,
            contenido: p.contenido
        });
    });

    // Sheet 2: Comentarios
    const sheetComments = workbook.addWorksheet('Comentarios y Apoyo Equipo');
    sheetComments.columns = [
        { header: 'ID Post', key: 'post_id', width: 10 },
        { header: 'Plataforma', key: 'plataforma', width: 14 },
        { header: 'Usuario Red', key: 'usuario_red', width: 25 },
        { header: 'Nombre Mostrado', key: 'nombre_usuario', width: 25 },
        { header: 'Comentario', key: 'texto_comentario', width: 55 },
        { header: 'Sentimiento', key: 'sentimiento', width: 14 },
        { header: 'Tipo Reacción', key: 'tipo_reaccion', width: 16 },
        { header: '¿Es Miembro Equipo?', key: 'es_equipo', width: 22 },
        { header: 'Nombre en Equipo', key: 'equipo_nombre', width: 25 },
        { header: 'Rol en Campaña', key: 'equipo_rol', width: 25 },
        { header: 'Likes Comentario', key: 'likes', width: 16 }
    ];

    sheetComments.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheetComments.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };

    comments.forEach(c => {
        sheetComments.addRow({
            post_id: c.post_id,
            plataforma: (c.plataforma || '').toUpperCase(),
            usuario_red: c.usuario_red,
            nombre_usuario: c.nombre_usuario,
            texto_comentario: c.texto_comentario,
            sentimiento: c.sentimiento,
            tipo_reaccion: c.tipo_reaccion,
            es_equipo: c.es_equipo_campana ? 'SÍ (IDENTIFICADO)' : 'NO (CIUDADANO)',
            equipo_nombre: c.equipo_nombre || '-',
            equipo_rol: c.equipo_rol || '-',
            likes: c.likes_comentario || 0
        });
    });

    // Sheet 3: War Room
    const sheetAttacks = workbook.addWorksheet('Radar Oposición y War Room');
    sheetAttacks.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Adversario', key: 'adversario', width: 30 },
        { header: 'Plataforma', key: 'plataforma', width: 14 },
        { header: 'Blanco Ataque', key: 'blanco', width: 20 },
        { header: 'Descripción Blanco', key: 'desc_blanco', width: 35 },
        { header: 'Contenido del Ataque', key: 'contenido', width: 60 },
        { header: 'Nivel Amenaza', key: 'amenaza', width: 14 },
        { header: 'Táctica Recomendada', key: 'tactica', width: 20 },
        { header: 'Guion Candidato', key: 'guion_candidato', width: 50 },
        { header: 'Guion Voceros', key: 'guion_voceros', width: 50 },
        { header: 'Guion Tropa Digital', key: 'guion_tropa', width: 50 },
        { header: 'Guion Debates en Vivo', key: 'guion_debate', width: 50 }
    ];

    sheetAttacks.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheetAttacks.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };

    attacks.forEach(a => {
        sheetAttacks.addRow({
            id: a.id,
            adversario: a.adversario_nombre,
            plataforma: (a.plataforma || '').toUpperCase(),
            blanco: a.blanco_ataque,
            desc_blanco: a.descripcion_blanco,
            contenido: a.contenido_ataque,
            amenaza: a.nivel_amenaza,
            tactica: a.tactica_recomendada,
            guion_candidato: a.guion_candidato,
            guion_voceros: a.guion_voceros,
            guion_tropa: a.guion_tropa_digital,
            guion_debate: a.guion_debates
        });
    });

    const xlsxPath = path.join(exportDir, 'publicaciones_oscar_villamizar.xlsx');
    await workbook.xlsx.writeFile(xlsxPath);
    console.log(`✅ Archivo Excel generado: ${xlsxPath}`);

    // 2. GENERAR ARCHIVO CSV
    const csvRows = [
        ['ID', 'Plataforma', 'Autor', 'Titulo', 'Alcance', 'Impresiones', 'Reproducciones', 'Likes', 'Comentarios', 'Compartidos', 'Tema', 'Enlace', 'Contenido']
    ];
    posts.forEach(p => {
        csvRows.push([
            p.id,
            `"${(p.plataforma || '').replace(/"/g, '""')}"`,
            `"${(p.autor_usuario || p.autor_nombre || '').replace(/"/g, '""')}"`,
            `"${(p.titulo || '').replace(/"/g, '""')}"`,
            p.alcance || 0,
            p.impresiones || 0,
            p.reproducciones || 0,
            p.likes || 0,
            p.comentarios_conteo || 0,
            p.compartidos || 0,
            `"${(p.tema_estrategico || '').replace(/"/g, '""')}"`,
            `"${(p.url_publicacion || '').replace(/"/g, '""')}"`,
            `"${(p.contenido || '').replace(/"/g, '""')}"`
        ]);
    });
    const csvContent = csvRows.map(r => r.join(';')).join('\n');
    const csvPath = path.join(exportDir, 'publicaciones_oscar_villamizar.csv');
    fs.writeFileSync(csvPath, '\ufeff' + csvContent, 'utf8'); // BOM para apertura nativa en Excel
    console.log(`✅ Archivo CSV generado: ${csvPath}`);

    // 3. GENERAR ARCHIVO JSON
    const jsonOutput = {
        campana: {
            id: campId,
            candidato: campaign?.candidato || 'OSCAR VILLAMIZAR',
            cargo: campaign?.tipo_cargo || 'senado',
            fecha_exportacion: new Date().toISOString(),
            redes_oficiales: {
                facebook: campaign?.link_facebook || 'https://www.facebook.com/OscarVillamiz/?locale=es_LA',
                instagram: campaign?.link_instagram || 'https://www.instagram.com/oscarvillamiz/?hl=es',
                twitter: campaign?.link_twitter || 'https://x.com/OscarVillamiz'
            }
        },
        estadisticas_generales: {
            total_publicaciones: posts.length,
            total_alcance: posts.reduce((sum, p) => sum + (p.alcance || 0), 0),
            total_likes: posts.reduce((sum, p) => sum + (p.likes || 0), 0),
            total_comentarios: comments.length,
            apoyos_equipo_identificados: comments.filter(c => c.es_equipo_campana).length
        },
        publicaciones: posts.map(p => ({
            id: p.id,
            plataforma: p.plataforma,
            autor: p.autor_usuario || p.autor_nombre,
            titulo: p.titulo,
            enlace: p.url_publicacion,
            tipo_contenido: p.tipo_contenido,
            metricas: {
                alcance: p.alcance,
                impresiones: p.impresiones,
                reproducciones: p.reproducciones,
                likes: p.likes,
                comentarios: p.comentarios_conteo,
                compartidos: p.compartidos
            },
            tema_estrategico: p.tema_estrategico,
            contenido: p.contenido,
            comentarios: comments.filter(c => c.post_id === p.id).map(c => ({
                usuario: c.usuario_red,
                nombre: c.nombre_usuario,
                texto: c.texto_comentario,
                sentimiento: c.sentimiento,
                es_equipo_campana: c.es_equipo_campana,
                equipo_rol: c.equipo_rol,
                likes: c.likes_comentario
            }))
        })),
        radar_oposicion_ataques: attacks.map(a => ({
            id: a.id,
            adversario: a.adversario_nombre,
            plataforma: a.plataforma,
            blanco_ataque: a.blanco_ataque,
            contenido: a.contenido_ataque,
            nivel_amenaza: a.nivel_amenaza,
            es_fake_news: a.es_fake_news,
            tactica_recomendada: a.tactica_recomendada,
            guiones_estrategicos_ia: {
                candidato: a.guion_candidato,
                voceros: a.guion_voceros,
                tropa_digital: a.guion_tropa_digital,
                debate_en_vivo: a.guion_debates
            }
        }))
    };

    const jsonPath = path.join(exportDir, 'publicaciones_oscar_villamizar.json');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2), 'utf8');
    console.log(`✅ Archivo JSON generado: ${jsonPath}`);

    console.log('🎉 TODOS LOS FORMATOS FUERON GENERADOS CORRECTAMENTE.');
    process.exit(0);
}

exportFiles().catch(err => {
    console.error('Error generando exportación:', err);
    process.exit(1);
});
