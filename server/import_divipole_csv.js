const fs = require('fs');
const readline = require('readline');
const path = require('path');
const DivipolePuesto = require('./models/DivipolePuesto');
const sequelize = require('./database/db');

// Función para parsear una línea CSV respetando comillas
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
}

async function importDivipole(csvPath) {
    const targetFile = csvPath || 'C:/Users/Usuario/Downloads/Divipole_Elecciones_Territoritoriales_2023_con_georreferenciación_20261008.csv';

    if (!fs.existsSync(targetFile)) {
        console.error('❌ Archivo DIVIPOLE no encontrado en:', targetFile);
        process.exit(1);
    }

    console.log('================================================================');
    console.log('   INICIANDO IMPORTACIÓN MASIVA DE PUESTOS DIVIPOLE (COLOMBIA)  ');
    console.log('================================================================');
    console.log(`📁 Leyendo archivo: ${targetFile}`);

    try {
        await DivipolePuesto.sync({ alter: true });
        console.log('✅ Tabla divipole_puestos sincronizada en la base de datos.');

        // Opcional: vaciar antes de recargar
        await DivipolePuesto.destroy({ where: {}, truncate: true, cascade: true });
        console.log('🧹 Tabla preparada para carga limpia.');

        const fileStream = fs.createReadStream(targetFile, { encoding: 'utf8' });
        const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

        let isHeader = true;
        let batch = [];
        let totalInserted = 0;
        const departamentosSet = new Set();
        const municipiosSet = new Set();

        for await (const line of rl) {
            if (!line.trim()) continue;

            if (isHeader) {
                isHeader = false;
                continue;
            }

            const cols = parseCSVLine(line);
            if (cols.length < 7) continue;

            const depto = cols[0]?.trim();
            const muni = cols[1]?.trim();
            const puesto = cols[2]?.trim();
            const comuna = cols[3]?.trim();
            const direccion = cols[4]?.trim();
            const lat = parseFloat(cols[5]) || null;
            const lng = parseFloat(cols[6]) || null;
            const alcalde = cols[7] === '1';
            const gobernacion = cols[8] === '1';
            const concejo = cols[9] === '1';
            const asamblea = cols[10] === '1';
            const jal = cols[11] === '1';
            const cantidadElecciones = parseInt(cols[12] || '0', 10) || 0;

            if (depto) departamentosSet.add(depto);
            if (muni) municipiosSet.add(`${depto}-${muni}`);

            batch.push({
                departamento: depto,
                municipio: muni,
                puesto: puesto,
                comuna: comuna,
                direccion: direccion,
                latitud: lat,
                longitud: lng,
                alcalde: alcalde,
                gobernacion: gobernacion,
                concejo: concejo,
                asamblea: asamblea,
                jal: jal,
                cantidad_elecciones: cantidadElecciones
            });

            if (batch.length >= 1000) {
                await DivipolePuesto.bulkCreate(batch);
                totalInserted += batch.length;
                process.stdout.write(`   ⏳ Importados ${totalInserted.toLocaleString()} puestos...\r`);
                batch = [];
            }
        }

        if (batch.length > 0) {
            await DivipolePuesto.bulkCreate(batch);
            totalInserted += batch.length;
        }

        console.log(`\n🎉 ¡CARGA EXITOSA DE PUESTOS ELECTORALES DIVIPOLE!`);
        console.log(`   📍 Total Puestos Registrados:     ${totalInserted.toLocaleString()}`);
        console.log(`   🏛️ Departamentos Cubiertos:      ${departamentosSet.size}`);
        console.log(`   🏙️ Municipios Cubiertos:         ${municipiosSet.size}`);
        console.log('================================================================');

        process.exit(0);

    } catch (err) {
        console.error('❌ Error durante la importación:', err);
        process.exit(1);
    }
}

const inputPath = process.argv[2];
importDivipole(inputPath);
