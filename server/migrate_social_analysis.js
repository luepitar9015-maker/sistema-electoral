const sequelize = require('./database/db');

async function migrate() {
  const [cols] = await sequelize.query('PRAGMA table_info(SocialContentAnalyses)');
  const colNames = cols.map(c => c.name);
  console.log('Existing columns:', colNames);

  const needed = [
    { name: 'recommendations_json', type: 'TEXT' },
    { name: 'audience_retention_score', type: 'FLOAT' },
    { name: 'hook_retention_score', type: 'FLOAT' },
    { name: 'fatigue_score', type: 'FLOAT' },
    { name: 'is_simulation', type: 'BOOLEAN DEFAULT 0' }
  ];

  for (const n of needed) {
    if (!colNames.includes(n.name)) {
      console.log('Adding column:', n.name);
      await sequelize.query(`ALTER TABLE SocialContentAnalyses ADD COLUMN ${n.name} ${n.type};`);
    }
  }
  console.log('Migration complete!');
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
