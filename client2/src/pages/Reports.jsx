import { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleQuantile } from "d3-scale";
import axios from 'axios';
import { Loader } from 'lucide-react';

// GeoJSON público de Colombia (simplificado)
const GEO_URL = "https://gist.githubusercontent.com/john-guerra/43c7656821069d00dcbc/raw/be6a6e239cd5b5b803c6e7c2ec905b2620e90848/colombia.geo.json";

const Reports = () => {
    const [geoData, setGeoData] = useState([]);
    const [leaderData, setLeaderData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('geo'); // 'geo' | 'leaders'

    // Geo States
    const [selectedDept, setSelectedDept] = useState(null);
    const [tooltipContent, setTooltipContent] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log("Fetching data...");
            const [geoRes, leaderRes] = await Promise.all([
                axios.get('http://localhost:3000/api/reports/geo'),
                axios.get('http://localhost:3000/api/reports/leaders')
            ]);
            console.log("Data received", geoRes.data, leaderRes.data);
            setGeoData(geoRes.data);
            setLeaderData(leaderRes.data);
        } catch (err) {
            console.error("Error fetching report data", err);
            setError(`Error cargando datos: ${err.message}. Asegúrese de que el backend esté corriendo en puerto 3000.`);
        } finally {
            setLoading(false);
        }
    };

    // --- Lógica Geográfica ---
    const normalizeName = (name) => {
        return name ? name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() : "";
    };

    const deptData = geoData.reduce((acc, curr) => {
        const deptNorm = normalizeName(curr.departamento);
        acc[deptNorm] = (acc[deptNorm] || 0) + curr.total;
        return acc;
    }, {});

    const totalVotes = geoData.reduce((acc, curr) => acc + curr.total, 0);

    const colorScale = scaleQuantile()
        .domain(Object.values(deptData))
        .range([
            "#E6FFFA", "#B2F5EA", "#81E6D9", "#4FD1C5",
            "#38B2AC", "#319795", "#2C7A7B", "#285E61", "#234E52"
        ]);

    if (error) {
        return (
            <div className="p-8 text-center animate-in fade-in">
                <div className="text-red-500 text-xl font-bold mb-4">{error}</div>
                <button
                    onClick={fetchData}
                    className="bg-[#00B894] text-white px-6 py-2 rounded shadow hover:bg-[#00a180]"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center border-b pb-4 gap-4">
                <h2 className="text-2xl font-bold text-[#00B894] uppercase tracking-wider">
                    {activeTab === 'geo' ? 'Informe Geográfico' : 'Ranking de Líderes'}
                </h2>

                <div className="flex items-center gap-4">
                    <div className="bg-[#2D3436] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md">
                        TOTAL VOTOS: <span className="text-[#00B894] text-lg ml-2">{totalVotes.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('geo')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'geo' ? 'bg-white text-[#00B894] shadow' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    MAPA INTERACTIVO
                </button>
                <button
                    onClick={() => setActiveTab('leaders')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'leaders' ? 'bg-white text-[#00B894] shadow' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    TOP LÍDERES
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader className="animate-spin text-[#00B894]" size={40} />
                </div>
            ) : (
                <>
                    {/* VISTA GEOGRÁFICA */}
                    {activeTab === 'geo' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Mapa */}
                            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 relative h-[600px] flex flex-col">
                                <h3 className="text-sm font-bold text-gray-700 uppercase mb-4 text-center">Distribución Nacional</h3>
                                <ComposableMap
                                    projection="geoMercator"
                                    projectionConfig={{ scale: 2200, center: [-74, 4] }}
                                    className="w-full h-full"
                                >
                                    <ZoomableGroup>
                                        <Geographies geography={GEO_URL}>
                                            {({ geographies }) =>
                                                geographies.map((geo) => {
                                                    const geoNameNorm = normalizeName(geo.properties.NOMBRE_DPT);
                                                    const cur = deptData[geoNameNorm];
                                                    return (
                                                        <Geography
                                                            key={geo.rsmKey}
                                                            geography={geo}
                                                            fill={cur ? colorScale(cur) : "#EEE"}
                                                            stroke="#FFF"
                                                            strokeWidth={0.5}
                                                            style={{
                                                                default: { outline: "none" },
                                                                hover: { fill: "#00B894", outline: "none", cursor: "pointer" },
                                                                pressed: { fill: "#00B894", outline: "none" }
                                                            }}
                                                            onMouseEnter={() => {
                                                                const { NOMBRE_DPT } = geo.properties;
                                                                setTooltipContent(`${NOMBRE_DPT}: ${cur || 0} Votantes`);
                                                            }}
                                                            onMouseLeave={() => setTooltipContent("")}
                                                            onClick={() => {
                                                                const { NOMBRE_DPT } = geo.properties;
                                                                setSelectedDept(normalizeName(NOMBRE_DPT));
                                                            }}
                                                        />
                                                    );
                                                })
                                            }
                                        </Geographies>
                                    </ZoomableGroup>
                                </ComposableMap>
                                {tooltipContent && (
                                    <div className="absolute top-4 right-4 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow pointer-events-none z-10">
                                        {tooltipContent}
                                    </div>
                                )}
                            </div>

                            {/* Tabla Detalles Geo */}
                            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-[600px] overflow-hidden flex flex-col">
                                <h3 className="text-sm font-bold text-[#00B894] uppercase mb-4 sticky top-0 bg-white border-b pb-2">
                                    {selectedDept ? `Detalle: ${selectedDept}` : 'Resumen por Departamento'}
                                </h3>

                                <div className="flex-1 overflow-y-auto pr-2">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-6 py-3">Lugar</th>
                                                <th className="px-6 py-3 text-right">Votantes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedDept ? (
                                                geoData
                                                    .filter(d => normalizeName(d.departamento) === selectedDept)
                                                    .map((item, index) => (
                                                        <tr key={index} className="bg-white border-b hover:bg-gray-50">
                                                            <td className="px-6 py-4 font-medium text-gray-900">{item.municipio}</td>
                                                            <td className="px-6 py-4 text-right font-bold text-[#00B894]">{item.total}</td>
                                                        </tr>
                                                    ))
                                            ) : (
                                                Object.entries(deptData)
                                                    .sort(([, a], [, b]) => b - a)
                                                    .map(([dept, total], index) => {
                                                        const originalName = geoData.find(d => normalizeName(d.departamento) === dept)?.departamento || dept;
                                                        return (
                                                            <tr key={index} className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedDept(dept)}>
                                                                <td className="px-6 py-4 font-medium text-gray-900">{originalName}</td>
                                                                <td className="px-6 py-4 text-right font-bold text-[#2D3436]">{total}</td>
                                                            </tr>
                                                        );
                                                    })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {selectedDept && (
                                    <button
                                        onClick={() => setSelectedDept(null)}
                                        className="mt-4 w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded text-xs uppercase transition-colors"
                                    >
                                        Ver Todo
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* VISTA LÍDERES */}
                    {activeTab === 'leaders' && (
                        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-700 uppercase mb-6 flex items-center">
                                <span className="bg-[#00B894] w-2 h-8 rounded mr-3"></span>
                                Top Líderes con Mayor Reclutamiento
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 rounded-tl-lg">#</th>
                                            <th className="px-6 py-4">Nombre del Líder</th>
                                            <th className="px-6 py-4">Cédula</th>
                                            <th className="px-6 py-4">Ubicación (Base)</th>
                                            <th className="px-6 py-4 text-right rounded-tr-lg">Votos Reclutados</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderData.map((leader, index) => (
                                            <tr key={index} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-gray-400">{index + 1}</td>
                                                <td className="px-6 py-4 font-bold text-[#2D3436]">{leader.lider_nombre || 'Sin Asignar'}</td>
                                                <td className="px-6 py-4 text-gray-500">{leader.lider_cedula || '-'}</td>
                                                <td className="px-6 py-4 text-gray-500">{leader.municipio}, {leader.departamento}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="bg-[#E6FFFA] text-[#00B894] py-1 px-3 rounded-full font-bold border border-[#B2F5EA]">
                                                        {leader.total_votos}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {leaderData.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="text-center py-8 text-gray-400">
                                                    No hay datos de líderes registrados aún.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Reports;
