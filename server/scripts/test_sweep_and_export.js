require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Campaign = require('../models/Campaign');
const jwt = require('jsonwebtoken');

(async () => {
    try {
        const camp = await Campaign.findOne({ where: { candidato: 'Oscar Villamizar' } });
        if (!camp) {
            console.log('❌ No se encontró campaña de Oscar Villamizar');
            process.exit(1);
        }
        const campId = camp.id;
        console.log(`Campaña de Oscar Villamizar ID: ${campId}`);

        const secret = process.env.JWT_SECRET || 'secret123';
        const token = jwt.sign({ id: 1, email: 'admin@sistema.com', role: 'superadmin', campana_id: campId }, secret);

        console.log(`1. Probando Barrido de Redes Sociales para Oscar Villamizar (ID ${campId})...`);
        const sweepRes = await fetch('http://localhost:5000/api/social/candidate-sweep', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ campana_id: campId })
        });
        const sweepData = await sweepRes.json();
        console.log('✅ BARRIDO RESPUESTA:', sweepData);

        console.log('\n2. Probando Obtención de Publicaciones (solo Oscar)...');
        const postsRes = await fetch(`http://localhost:5000/api/social/posts?campana_id=${campId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const postsData = await postsRes.json();
        console.log(`✅ TOTAL PUBLICACIONES: ${postsData.length}`);
        postsData.slice(0, 5).forEach(p => {
            console.log(`- [${p.plataforma.toUpperCase()}] ${p.titulo.slice(0, 55)}... | Likes: ${p.likes} | Comentarios: ${p.comentarios_conteo}`);
        });

        console.log('\n3. Probando Comentarios y Auditoría del Primer Post...');
        const firstPost = postsData[0];
        const commentsRes = await fetch(`http://localhost:5000/api/social/posts/${firstPost.id}/comments?campana_id=${campId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const commentsData = await commentsRes.json();
        console.log(`✅ COMENTARIOS ENCONTRADOS: ${commentsData.comments?.length}`);
        console.log('Auditoría del equipo:', commentsData.audit);

        console.log('\n4. Probando Exportación a Excel con Token por URL...');
        const excelRes = await fetch(`http://localhost:5000/api/social/export/excel?campana_id=${campId}&token=${token}`);
        const buf = await excelRes.arrayBuffer();
        console.log(`✅ EXCEL GENERADO: ${buf.byteLength} bytes`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Error en test:', err);
        process.exit(1);
    }
})();
