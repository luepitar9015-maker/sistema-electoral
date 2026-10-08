require('dotenv').config();
const jwt = require('jsonwebtoken');
const { getSecretKey } = require('../middleware/authMiddleware');

async function test() {
    const token = jwt.sign({ id: 1, role: 'admin' }, getSecretKey());
    const res = await fetch('http://127.0.0.1:5000/api/social/posts?campana_id=7', {
        headers: { Authorization: 'Bearer ' + token }
    });
    console.log('HTTP Status on VPS:', res.status);
    const text = await res.text();
    console.log('Response text on VPS:', text.slice(0, 300));
    const posts = JSON.parse(text);
    console.log('Posts count for Campaign 7 on VPS:', posts.length);
    if (posts.length > 0) {
        console.log('First post sample:');
        console.log('ID:', posts[0].id);
        console.log('Titulo:', posts[0].titulo);
        console.log('Comentarios Conteo:', posts[0].comentarios_conteo);
        console.log('Reacciones Desglose:', posts[0].reacciones_desglose);
    }
}

test().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
