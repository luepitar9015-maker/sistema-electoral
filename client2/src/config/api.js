// Configuración dinámica del Endpoint del Backend
// En Vercel o producción se configura mediante la variable VITE_API_URL
// Localmente toma 'http://localhost:3000/api' como fallback por defecto
export const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export default API;
