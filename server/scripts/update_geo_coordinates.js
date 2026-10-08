const sequelize = require('../database/db');
const Voter = require('../models/Voter');

const puestoCoords = {
    // Santander - Bucaramanga
    'UIS - Campus Central': { lat: 7.1404, lng: -73.1205 },
    'Coliseo Bicentenario': { lat: 7.1332, lng: -73.1167 },
    'Colegio Santander': { lat: 7.1380, lng: -73.1250 },
    'I.E. Dámaso Zapata': { lat: 7.1350, lng: -73.1220 },
    'Colegio La Salle': { lat: 7.1180, lng: -73.1110 },

    // Floridablanca
    'Colegio José Elías Puyana': { lat: 7.0620, lng: -73.0870 },
    'Coliseo La Cumbre': { lat: 7.0710, lng: -73.0920 },
    'Colegio Pan de Azúcar': { lat: 7.0850, lng: -73.1010 },

    // Piedecuesta
    'Colegio Balbino García': { lat: 6.9880, lng: -73.0510 },
    'Polideportivo Villabel': { lat: 6.9920, lng: -73.0550 },

    // Girón
    'Colegio San Juan de Girón': { lat: 7.0730, lng: -73.1690 },
    'Coliseo Santa Cruz': { lat: 7.0700, lng: -73.1650 },

    // Barrancabermeja
    'Colegio Diego Hernández de Gallegos': { lat: 7.0650, lng: -73.8540 },
    'Club Infantas': { lat: 7.0610, lng: -73.8590 },
    'Colegio Camilo Torres': { lat: 7.0700, lng: -73.8610 },

    // San Gil
    'Colegio San José Guanentá': { lat: 6.5540, lng: -73.1340 },
    'Coliseo Lorenzo Alcantuz': { lat: 6.5580, lng: -73.1360 },

    // Socorro y Vélez
    'Colegio Universitario': { lat: 6.4670, lng: -73.2610 },
    'Colegio Nacional Universitario': { lat: 6.0120, lng: -73.6730 },

    // Bogotá D.C.
    'Corferias (Pabellón 4)': { lat: 4.6295, lng: -74.0898 },
    'Unicentro (Entrada 5)': { lat: 4.7018, lng: -74.0416 },
    'Plaza de las Américas': { lat: 4.6210, lng: -74.1350 },
    'Coliseo El Campín': { lat: 4.6490, lng: -74.0770 },
    'Colegio Cafam La Floresta': { lat: 4.6850, lng: -74.0750 },

    // Norte de Santander
    'Estadio General Santander': { lat: 7.8939, lng: -72.5078 },
    'Colegio Calasanz': { lat: 7.9010, lng: -72.4980 },
    'Colegio Municipal': { lat: 7.8870, lng: -72.5010 },
    'Colegio José Eusebio Caro': { lat: 8.2380, lng: -73.3540 },
    'Colegio Provincial San José': { lat: 7.3760, lng: -72.6480 },
    'Colegio General Santander': { lat: 7.8340, lng: -72.4760 },

    // Antioquia
    'Plaza Mayor': { lat: 6.2425, lng: -75.5768 },
    'Colegio San Ignacio': { lat: 6.2480, lng: -75.5650 },
    'I.E. San Javier': { lat: 6.2520, lng: -75.6120 },
    'Colegio Manuel Uribe Ángel': { lat: 6.1730, lng: -75.5860 },
    'Colegio San José de las Cuchillas': { lat: 6.1550, lng: -75.3740 },

    // Boyacá
    'Colegio de Boyacá': { lat: 5.5350, lng: -73.3670 },
    'Coliseo San Antonio': { lat: 5.5410, lng: -73.3590 },
    'Colegio Guillermo León Valencia': { lat: 5.8270, lng: -73.0340 }
};

async function updateCoords() {
    console.log('--- ACTUALIZANDO COORDENADAS GEOESPACIALES DE PUESTOS ---');
    try {
        await sequelize.authenticate();

        const voters = await Voter.findAll();
        let updated = 0;

        for (const v of voters) {
            const puesto = v.lugar_votacion;
            if (puesto && puestoCoords[puesto]) {
                v.latitud = puestoCoords[puesto].lat;
                v.longitud = puestoCoords[puesto].lng;
                await v.save();
                updated++;
            } else if (v.municipio === 'Bucaramanga') {
                v.latitud = 7.1254 + (Math.random() * 0.02 - 0.01);
                v.longitud = -73.1198 + (Math.random() * 0.02 - 0.01);
                await v.save();
                updated++;
            } else if (v.municipio === 'Bogotá D.C.') {
                v.latitud = 4.6500 + (Math.random() * 0.05 - 0.025);
                v.longitud = -74.0800 + (Math.random() * 0.05 - 0.025);
                await v.save();
                updated++;
            } else if (v.municipio === 'Medellín') {
                v.latitud = 6.2442 + (Math.random() * 0.03 - 0.015);
                v.longitud = -75.5812 + (Math.random() * 0.03 - 0.015);
                await v.save();
                updated++;
            }
        }

        console.log(`✅ Coordenadas asignadas a ${updated} de ${voters.length} votantes.`);
        process.exit(0);
    } catch (e) {
        console.error('Error actualizando coords:', e);
        process.exit(1);
    }
}

updateCoords();
