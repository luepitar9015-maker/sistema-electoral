// Configuración dinámica del Endpoint del Backend
// 1. Si hay una variable VITE_API_URL configurada (ej. en Vercel) y no es un placeholder, se usa esa.
// 2. Si se accede desde el navegador en producción (ej. http://80.241.212.9:3000), usa el mismo origen: /api
// 3. En entorno local de desarrollo (puerto 5173), apunta a http://localhost:3000/api

const rawEnv = import.meta.env.VITE_API_URL;
const isValidEnv = rawEnv && !rawEnv.includes('glitch.me') && !rawEnv.includes('TU-PROYECTO');

function getBaseUrl() {
    if (isValidEnv) {
        return rawEnv;
    }
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
        const origin = window.location.origin;
        // Si estamos en Vite dev server (localhost:5173), el backend está en localhost:3000
        if (origin.includes(':5173')) {
            return 'http://localhost:3000/api';
        }
        // En cualquier servidor o IP (ej. http://80.241.212.9:3000), usa el mismo origen
        return `${origin}/api`;
    }
    return 'http://localhost:3000/api';
}

export const API = getBaseUrl();
export default API;
