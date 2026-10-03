const sequelize = require('./database/db');

async function migratePosts() {
  const [cols] = await sequelize.query('PRAGMA table_info(SocialMediaPosts)');
  const colNames = cols.map(c => c.name);
  console.log('Existing columns in SocialMediaPosts:', colNames);

  const needed = [
    { name: 'video_url', type: 'TEXT' },
    { name: 'video_duration_seconds', type: 'INTEGER' },
    { name: 'video_resolution', type: 'TEXT' },
    { name: 'video_fps', type: 'INTEGER' },
    { name: 'video_aspect_ratio', type: 'TEXT' },
    { name: 'is_simulation', type: 'BOOLEAN DEFAULT 0' }
  ];

  for (const n of needed) {
    if (!colNames.includes(n.name)) {
      console.log('Adding column:', n.name);
      await sequelize.query(`ALTER TABLE SocialMediaPosts ADD COLUMN ${n.name} ${n.type};`);
    }
  }
  console.log('SocialMediaPosts migration complete!');
  process.exit(0);
}

migratePosts().catch(err => {
  console.error(err);
  process.exit(1);
});
