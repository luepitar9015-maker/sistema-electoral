// Configuración de Endpoint:
// 1. Si se define VITE_API_URL en un hosting externo (ej. Vercel), usa esa URL.
// 2. Por defecto usa la ruta relativa '/api', que funciona automáticamente
//    en cualquier servidor, dominio o IP donde se cargue la web (ej. http://80.241.212.9:3000/api).
export const API = (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost'))
    ? import.meta.env.VITE_API_URL
    : '/api';

export default API;
