const sequelize = require('./database/db');

async function migrateDiaDAuditor() {
    try {
        console.log('--- INICIANDO MIGRACIÓN COMPARADOR AUDITOR E-14 ---');

        const [results] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'DiaDMesaReportes' OR table_name = 'diadmesareportes'
        `).catch(() => [[]]);

        const existingColumns = results.map(r => (r.column_name || r.COLUMN_NAME || '').toLowerCase());

        const columnsToAdd = [
            { name: 'boletin_registraduria_votos', type: 'INTEGER DEFAULT NULL' },
            { name: 'boletin_numero', type: 'VARCHAR(100) DEFAULT NULL' },
            { name: 'diferencia_votos', type: 'INTEGER DEFAULT 0' },
            { name: 'estado_auditoria', type: "VARCHAR(50) DEFAULT 'pendiente_boletin'" },
            { name: 'reclamacion_radicada', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'reclamacion_folio', type: 'VARCHAR(100) DEFAULT NULL' },
            { name: 'reclamacion_notas', type: 'TEXT DEFAULT NULL' }
        ];

        for (const col of columnsToAdd) {
            if (!existingColumns.includes(col.name.toLowerCase())) {
                try {
                    await sequelize.query(`ALTER TABLE "DiaDMesaReportes" ADD COLUMN "${col.name}" ${col.type};`);
                    console.log(`Columna ${col.name} agregada exitosamente.`);
                } catch (e) {
                    // Fallback para SQLite
                    try {
                        await sequelize.query(`ALTER TABLE DiaDMesaReportes ADD COLUMN ${col.name} ${col.type};`);
                        console.log(`Columna ${col.name} agregada (SQLite).`);
                    } catch (sqliteErr) {
                        console.log(`Columna ${col.name} ya existía o error:`, sqliteErr.message);
                    }
                }
            } else {
                console.log(`Columna ${col.name} ya existe.`);
            }
        }

        console.log('--- MIGRACIÓN AUDITOR E-14 COMPLETADA CON ÉXITO ---');
        process.exit(0);
    } catch (error) {
        console.error('Error durante la migración:', error);
        process.exit(1);
    }
}

migrateDiaDAuditor();
