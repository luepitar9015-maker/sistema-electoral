const sequelize = require('./database/db');

async function migrate() {
    try {
        const qi = sequelize.getQueryInterface();
        const postsTable = await qi.describeTable('SocialMediaPosts');
        console.log('Posts columns count:', Object.keys(postsTable).length);

        if (!postsTable.clics_link_candidato) {
            await sequelize.query('ALTER TABLE SocialMediaPosts ADD COLUMN clics_link_candidato INTEGER DEFAULT 0;');
            console.log('Added clics_link_candidato to SocialMediaPosts');
        } else {
            console.log('clics_link_candidato already exists');
        }

        if (!postsTable.link_candidato) {
            await sequelize.query('ALTER TABLE SocialMediaPosts ADD COLUMN link_candidato TEXT;');
            console.log('Added link_candidato to SocialMediaPosts');
        } else {
            console.log('link_candidato already exists');
        }

        const campTable = await qi.describeTable('Campaigns');
        console.log('Campaign columns count:', Object.keys(campTable).length);
        const campCols = [
            'link_instagram', 'link_tiktok', 'link_facebook', 'link_twitter', 'link_youtube', 'link_whatsapp'
        ];
        for (const col of campCols) {
            if (!campTable[col]) {
                await sequelize.query(`ALTER TABLE Campaigns ADD COLUMN ${col} TEXT;`);
                console.log(`Added ${col} to Campaigns`);
            } else {
                console.log(`${col} already exists`);
            }
        }

        // Set default candidate links for active campaign (e.g. ID 1) if null
        await sequelize.query(`
            UPDATE Campaigns 
            SET link_instagram = COALESCE(link_instagram, 'https://instagram.com/agaviriau'),
                link_tiktok = COALESCE(link_tiktok, 'https://tiktok.com/@campanacolombia'),
                link_facebook = COALESCE(link_facebook, 'https://facebook.com/AlejandroGaviriaOficial'),
                link_twitter = COALESCE(link_twitter, 'https://x.com/agaviriau'),
                link_youtube = COALESCE(link_youtube, 'https://youtube.com/@alejandrogaviria'),
                link_whatsapp = COALESCE(link_whatsapp, 'https://whatsapp.com/channel/0029Va...')
            WHERE id = 1;
        `);
        console.log('Default candidate links updated for Campaign 1');

        console.log('MIGRATION COMPLETED SUCCESSFULLY!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
