import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Users, CheckCircle2, ShieldAlert, Filter, Navigation, Compass } from 'lucide-react';
import { API } from '../../config/api';

// Corrección de iconos en Leaflet con Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function TerritorialHeatMap() {
    const [geoData, setGeoData] = useState({ puestos: [], total_votantes: 0, votantes_geolocalizados: [] });
    const [loading, setLoading] = useState(true);
    const [selectedPuesto, setSelectedPuesto] = useState(null);
    const [center, setCenter] = useState([4.570868, -74.297333]); // Centro Colombia por defecto
    const [zoom, setZoom] = useState(6);

    const token = localStorage.getItem('token');

    const fetchGeo = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API}/voters/geo-data`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setGeoData(data);

                // Auto-centrar en el primer puesto con coordenadas válidas si existe
                const primerPuestoConCoords = data.puestos?.find(p => p.latitud && p.longitud);
                if (primerPuestoConCoords) {
                    setCenter([primerPuestoConCoords.latitud, primerPuestoConCoords.longitud]);
                    setZoom(12);
                }
            }
        } catch (e) {
            console.error('Error fetching geo data:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGeo();
    }, []);

    // Color del marcador según fidelidad promedio
    const getScoreColor = (puesto) => {
        const scores = puesto.scores || {};
        const total = puesto.total_votantes || 1;
        const avgScore = ((scores[5] || 0) * 5 + (scores[4] || 0) * 4 + (scores[3] || 0) * 3 + (scores[2] || 0) * 2 + (scores[1] || 0) * 1) / total;

        if (avgScore >= 4.0) return '#10b981'; // Verde fuerte (Fidelizado)
        if (avgScore >= 3.0) return '#f59e0b'; // Amarillo (Simpatizante)
        return '#ef4444'; // Rojo (En riesgo)
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[750px]">
            {/* Panel Lateral de Control Territorial */}
            <div className="w-full md:w-80 bg-slate-950/80 border-r border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                    <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                        <Compass className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-white">Inteligencia GIS</h2>
                        <p className="text-xs text-slate-400">Mapas de calor y cobertura territorial</p>
                    </div>
                </div>

                {/* Leyenda de Semáforo Electoral */}
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <span className="font-bold text-slate-300 block mb-1">Firmeza del Voto:</span>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50"></span>
                        <span className="text-slate-300">Alta Fidelidad / Voto Seguro (Score 4-5)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-sm shadow-amber-500/50"></span>
                        <span className="text-slate-300">Voto Moderado / Simpatizante (Score 3)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500 inline-block shadow-sm shadow-red-500/50"></span>
                        <span className="text-slate-300">En Riesgo / Requiere Contacto (Score 1-2)</span>
                    </div>
                </div>

                {/* Resumen de Puestos */}
                <div className="space-y-2 flex-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        Puestos Registrados ({geoData.puestos?.length || 0})
                    </span>

                    <div className="space-y-2">
                        {geoData.puestos?.map((p, idx) => (
                            <div
                                key={idx}
                                onClick={() => {
                                    if (p.latitud && p.longitud) {
                                        setCenter([p.latitud, p.longitud]);
                                        setZoom(15);
                                    }
                                    setSelectedPuesto(p);
                                }}
                                className={`p-3 rounded-xl border cursor-pointer transition text-xs ${
                                    selectedPuesto?.puesto === p.puesto
                                        ? 'bg-amber-500/10 border-amber-500/50 text-white'
                                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-sm text-slate-100 line-clamp-1">{p.puesto}</span>
                                    <span
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: getScoreColor(p) }}
                                    ></span>
                                </div>
                                <div className="text-[11px] text-slate-400">{p.municipio} {p.departamento ? `(${p.departamento})` : ''}</div>
                                <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-slate-800/80 text-[11px]">
                                    <span className="text-amber-400 font-semibold">{p.total_votantes} votantes</span>
                                    <span className="text-emerald-400">{p.votos_efectivos} sufragaron</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mapa Interactivo Leaflet */}
            <div className="flex-1 relative h-full">
                <MapContainer
                    center={center}
                    zoom={zoom}
                    scrollWheelZoom={true}
                    className="w-full h-full z-0"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Marcadores de puestos */}
                    {geoData.puestos?.filter(p => p.latitud && p.longitud).map((p, idx) => (
                        <CircleMarker
                            key={idx}
                            center={[p.latitud, p.longitud]}
                            radius={Math.min(25, Math.max(10, Math.sqrt(p.total_votantes) * 3))}
                            fillColor={getScoreColor(p)}
                            color="#ffffff"
                            weight={2}
                            opacity={0.9}
                            fillOpacity={0.7}
                            eventHandlers={{
                                click: () => setSelectedPuesto(p)
                            }}
                        >
                            <Popup>
                                <div className="text-slate-900 p-1">
                                    <h4 className="font-bold text-sm">{p.puesto}</h4>
                                    <p className="text-xs text-slate-600">{p.municipio}, {p.departamento}</p>
                                    <hr className="my-1.5" />
                                    <div className="text-xs space-y-1">
                                        <p><strong>Total Votantes Campaña:</strong> {p.total_votantes}</p>
                                        <p><strong>Sufragaron Día D:</strong> {p.votos_efectivos}</p>
                                    </div>
                                </div>
                            </Popup>
                        </CircleMarker>
                    ))}
                </MapContainer>

                {/* Banner flotante de estadísticas */}
                <div className="absolute top-4 right-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-3 rounded-xl shadow-xl text-xs text-slate-200 space-y-1">
                    <div className="font-bold text-amber-400">Cobertura Territorial</div>
                    <div>Votantes comprometidos: <span className="font-bold text-white">{geoData.total_votantes}</span></div>
                    <div>Puestos georreferenciados: <span className="font-bold text-white">{geoData.puestos?.filter(p => p.latitud && p.longitud).length || 0}</span></div>
                </div>
            </div>
        </div>
    );
}
