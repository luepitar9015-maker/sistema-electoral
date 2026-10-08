import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Users, CheckCircle2, ShieldAlert, Filter, Navigation, Compass, Layers, ZoomIn } from 'lucide-react';
import { API } from '../../config/api';
import { useCampaign } from '../../context/CampaignContext';

// Corrección de iconos en Leaflet con Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente para re-centrar el mapa suavemente (flyTo) cuando cambia la selección
function RecenterMap({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center && center[0] && center[1]) {
            map.flyTo(center, zoom, { duration: 1.2 });
        }
    }, [center, zoom, map]);
    return null;
}

export default function TerritorialHeatMap() {
    const { activeCampaign } = useCampaign();
    const [geoData, setGeoData] = useState({ puestos: [], total_votantes: 0, votantes_geolocalizados: [] });
    const [loading, setLoading] = useState(true);
    const [selectedPuesto, setSelectedPuesto] = useState(null);
    const [center, setCenter] = useState([7.1254, -73.1198]); // Bucaramanga / Santander por defecto
    const [zoom, setZoom] = useState(8);

    const token = localStorage.getItem('token');

    const fetchGeo = async () => {
        try {
            setLoading(true);
            const campParam = activeCampaign?.id ? `?campana_id=${activeCampaign.id}` : '';
            const res = await fetch(`${API}/voters/geo-data${campParam}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setGeoData(data);

                // Auto-centrar en el primer puesto con coordenadas válidas si existe
                const primerPuestoConCoords = data.puestos?.find(p => p.latitud && p.longitud);
                if (primerPuestoConCoords) {
                    setCenter([primerPuestoConCoords.latitud, primerPuestoConCoords.longitud]);
                    setZoom(10);
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
    }, [activeCampaign?.id]);

    // Color del marcador según fidelidad promedio
    const getScoreColor = (puesto) => {
        const scores = puesto.scores || {};
        const total = puesto.total_votantes || 1;
        const avgScore = ((scores[5] || 0) * 5 + (scores[4] || 0) * 4 + (scores[3] || 0) * 3 + (scores[2] || 0) * 2 + (scores[1] || 0) * 1) / total;

        if (avgScore >= 4.0) return '#10b981'; // Verde (Alta Fidelidad / Voto Seguro)
        if (avgScore >= 3.0) return '#f59e0b'; // Amarillo / Ámbar (Simpatizante)
        return '#ef4444'; // Rojo (En riesgo)
    };

    // Crear icono personalizado con badge y número de votantes
    const createPuestoIcon = (puesto, isSelected) => {
        const color = getScoreColor(puesto);
        return L.divIcon({
            className: 'custom-puesto-pin',
            html: `
                <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer;">
                    <div style="
                        background: ${color};
                        color: white;
                        font-weight: 800;
                        font-size: 11px;
                        padding: 3px 8px;
                        border-radius: 9999px;
                        border: 2px solid white;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.6);
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        white-space: nowrap;
                        transform: ${isSelected ? 'scale(1.25)' : 'scale(1)'};
                        transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    ">
                        <span>📍</span>
                        <span>${puesto.total_votantes}</span>
                    </div>
                    <div style="
                        width: 0; 
                        height: 0; 
                        border-left: 5px solid transparent;
                        border-right: 5px solid transparent;
                        border-top: 5px solid ${color};
                    "></div>
                    <div style="
                        width: 6px;
                        height: 6px;
                        border-radius: 50%;
                        background: ${color};
                        box-shadow: 0 0 6px ${color};
                    "></div>
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 38]
        });
    };

    const puestosValidos = geoData.puestos?.filter(p => !!p.latitud && !!p.longitud) || [];

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
                        <span className="text-slate-300">Alta Fidelidad / Seguro (Score 4-5)</span>
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
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                            Puestos Registrados ({puestosValidos.length})
                        </span>
                        {activeCampaign && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                {activeCampaign.candidato}
                            </span>
                        )}
                    </div>

                    <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                        {puestosValidos.map((p, idx) => (
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
                                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-sm text-slate-100 line-clamp-1">{p.puesto}</span>
                                    <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                                        style={{ backgroundColor: getScoreColor(p) }}
                                    ></span>
                                </div>
                                <div className="text-[11px] text-slate-400">{p.municipio} {p.departamento ? `(${p.departamento})` : ''}</div>
                                <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-slate-800/80 text-[11px]">
                                    <span className="text-amber-400 font-bold">{p.total_votantes} votantes</span>
                                    <span className="text-emerald-400 font-semibold">{p.votos_efectivos} sufragaron</span>
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
                    <RecenterMap center={center} zoom={zoom} />

                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Halos de cobertura y Pines interactivos */}
                    {puestosValidos.map((p, idx) => {
                        const isSelected = selectedPuesto?.puesto === p.puesto;
                        const color = getScoreColor(p);
                        return (
                            <React.Fragment key={idx}>
                                {/* Halo de cobertura de votantes (Área de influencia) */}
                                <CircleMarker
                                    center={[p.latitud, p.longitud]}
                                    radius={Math.min(35, Math.max(12, Math.sqrt(p.total_votantes) * 4))}
                                    fillColor={color}
                                    color={color}
                                    weight={isSelected ? 3 : 1}
                                    opacity={0.8}
                                    fillOpacity={0.25}
                                />

                                {/* Pin interactivo con número de votos y popup */}
                                <Marker
                                    position={[p.latitud, p.longitud]}
                                    icon={createPuestoIcon(p, isSelected)}
                                    eventHandlers={{
                                        click: () => {
                                            setSelectedPuesto(p);
                                            setCenter([p.latitud, p.longitud]);
                                            setZoom(15);
                                        }
                                    }}
                                >
                                    <Popup>
                                        <div className="text-slate-900 p-1 min-w-[200px]">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }}></span>
                                                <h4 className="font-bold text-sm text-slate-900">{p.puesto}</h4>
                                            </div>
                                            <p className="text-xs text-slate-600 font-medium">{p.municipio}, {p.departamento}</p>
                                            <hr className="my-2 border-slate-200" />
                                            <div className="text-xs space-y-1.5">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-600">Votantes Comprometidos:</span>
                                                    <strong className="text-indigo-600">{p.total_votantes}</strong>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-600">Sufragaron (Día D):</span>
                                                    <strong className="text-emerald-600">{p.votos_efectivos}</strong>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-600">Afluencia Día D:</span>
                                                    <strong className="text-slate-800">
                                                        {p.total_votantes > 0 ? Math.round((p.votos_efectivos / p.total_votantes) * 100) : 0}%
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            </React.Fragment>
                        );
                    })}
                </MapContainer>

                {/* Banner flotante de estadísticas */}
                <div className="absolute top-4 right-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-3 rounded-xl shadow-xl text-xs text-slate-200 space-y-1">
                    <div className="font-bold text-amber-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>Cobertura Territorial</span>
                    </div>
                    <div>Votantes comprometidos: <span className="font-bold text-white">{geoData.total_votantes}</span></div>
                    <div>Puestos georreferenciados: <span className="font-bold text-emerald-400">{puestosValidos.length}</span></div>
                </div>
            </div>
        </div>
    );
}
