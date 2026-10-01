const sequelize = require('./database/db');

async function migrateLiveColumns() {
    try {
        const qi = sequelize.getQueryInterface();
        const postsTable = await qi.describeTable('SocialMediaPosts');

        const liveCols = [
            { name: 'espectadores_en_vivo', type: 'INTEGER DEFAULT 0' },
            { name: 'pico_espectadores', type: 'INTEGER DEFAULT 0' },
            { name: 'duracion_en_vivo', type: "TEXT DEFAULT '00:00'" },
            { name: 'estado_en_vivo', type: "TEXT DEFAULT 'finalizado'" }
        ];

        for (const col of liveCols) {
            if (!postsTable[col.name]) {
                await sequelize.query(`ALTER TABLE SocialMediaPosts ADD COLUMN ${col.name} ${col.type};`);
                console.log(`Added column ${col.name} to SocialMediaPosts`);
            } else {
                console.log(`Column ${col.name} already exists`);
            }
        }

        // Add or update active live streams across networks for testing/demo
        // If no post has en_vivo = 1, let's create or update live posts
        await sequelize.query(`
            UPDATE SocialMediaPosts 
            SET en_vivo = 1,
                estado_en_vivo = 'en_directo',
                espectadores_en_vivo = 4850,
                pico_espectadores = 6200,
                duracion_en_vivo = '00:41:25'
            WHERE plataforma = 'tiktok' AND id = 2;
        `);

        // Check if there are live posts for Facebook, Instagram, YouTube
        const [existingLives] = await sequelize.query(`SELECT COUNT(*) as count FROM SocialMediaPosts WHERE en_vivo = 1;`);
        console.log('Total live posts currently:', existingLives[0].count);

        console.log('MIGRATION OF LIVE COLUMNS SUCCESSFUL');
        process.exit(0);
    } catch (e) {
        console.error('Migration error:', e);
        process.exit(1);
    }
}

migrateLiveColumns();
