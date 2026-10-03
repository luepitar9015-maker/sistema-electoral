import React, { useState, useEffect } from 'react';
import { Calculator, Award, TrendingUp, AlertTriangle, Plus, Trash2, RefreshCw, BarChart2 } from 'lucide-react';
import { API } from '../../config/api';

export default function DHondtSimulator() {
    const [censo, setCenso] = useState(120000);
    const [participacion, setParticipacion] = useState(58);
    const [escanos, setEscanos] = useState(19);
    const [umbralPct, setUmbralPct] = useState(50); // 50% del cociente electoral
    const [listas, setListas] = useState([
        { id: 1, nombre: 'Nuestra Lista (Campaña)', votos: 18500, esPropia: true },
        { id: 2, nombre: 'Coalición Conservadora / A', votos: 24200, esPropia: false },
        { id: 3, nombre: 'Partido Liberal / B', votos: 15300, esPropia: false },
        { id: 4, nombre: 'Alianza Verde / C', votos: 9800, esPropia: false },
        { id: 5, nombre: 'Movimiento Ciudadano', votos: 5400, esPropia: false },
        { id: 6, nombre: 'Otros Partidos Menores', votos: 3100, esPropia: false },
    ]);

    const [resultado, setResultado] = useState(null);
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem('token');

    const calcularSimulacion = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API}/reports/simulate-dhondt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    total_censo: Number(censo),
                    participacion_pct: Number(participacion),
                    escanos_disponibles: Number(escanos),
                    umbral_pct: Number(umbralPct),
                    listas: listas.map(l => ({ nombre: l.nombre, votos: Number(l.votos), esPropia: l.esPropia }))
                })
            });

            if (res.ok) {
                const data = await res.json();
                setResultado(data);
            }
        } catch (e) {
            console.error('Error calculando simulación:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        calcularSimulacion();
    }, [censo, participacion, escanos, umbralPct]);

    const handleUpdateVotos = (id, newVotos) => {
        setListas(prev => prev.map(l => l.id === id ? { ...l, votos: Number(newVotos) || 0 } : l));
    };

    const handleAddLista = () => {
        const newId = Date.now();
        setListas(prev => [...prev, { id: newId, nombre: `Nueva Lista ${prev.length + 1}`, votos: 4000, esPropia: false }]);
    };

    const handleRemoveLista = (id) => {
        setListas(prev => prev.filter(l => l.id !== id));
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 text-slate-100">
            {/* Header del Simulador */}
            <div className="flex flex-col md:flex-row justify-between md:items-center pb-4 border-b border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20 text-white">
                        <Calculator className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-400 bg-clip-text text-transparent">
                            Simulador Electoral D'Hondt & Cifra Repartidora
                        </h2>
                        <p className="text-xs text-slate-400">
                            Cálculo de umbral electoral, curules a proveer y análisis de votos para la siguiente curul
                        </p>
                    </div>
                </div>

                <button
                    onClick={calcularSimulacion}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-lg self-start"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Recalcular Curules</span>
                </button>
            </div>

            {/* Parámetros Generales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Censo Total Votantes</label>
                    <input
                        type="number"
                        value={censo}
                        onChange={e => setCenso(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm font-bold text-white"
                    />
                </div>

                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80">
                    <label className="block text-xs font-medium text-slate-400 mb-1">% Participación Estimada</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="20"
                            max="90"
                            value={participacion}
                            onChange={e => setParticipacion(e.target.value)}
                            className="flex-1 accent-indigo-500"
                        />
                        <span className="font-bold text-sm text-indigo-400 min-w-[36px]">{participacion}%</span>
                    </div>
                </div>

                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Escaños a Proveer (Curules)</label>
                    <input
                        type="number"
                        value={escanos}
                        onChange={e => setEscanos(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm font-bold text-white"
                    />
                </div>

                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Umbral (% Cociente Electoral)</label>
                    <input
                        type="number"
                        value={umbralPct}
                        onChange={e => setUmbralPct(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm font-bold text-white"
                    />
                </div>
            </div>

            {/* Tarjetas de Métricas de Cálculo */}
            {resultado && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl">
                        <span className="text-xs text-slate-400 block mb-1">Votos Válidos Proyectados</span>
                        <div className="text-2xl font-black text-white">
                            {resultado.parametros?.votosValidos?.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                            Cociente: {resultado.parametros?.cocienteElectoral?.toLocaleString()}
                        </div>
                    </div>

                    <div className="bg-amber-950/40 border border-amber-500/40 p-4 rounded-xl">
                        <span className="text-xs text-amber-400 block mb-1">Umbral Mínimo Requerido</span>
                        <div className="text-2xl font-black text-amber-300">
                            {resultado.parametros?.umbralVotos?.toLocaleString()} votos
                        </div>
                        <div className="text-[11px] text-amber-400/80 mt-1">
                            Listas bajo este valor no obtienen curul
                        </div>
                    </div>

                    <div className="bg-blue-950/40 border border-blue-500/40 p-4 rounded-xl">
                        <span className="text-xs text-blue-400 block mb-1">Cifra Repartidora Oficial</span>
                        <div className="text-2xl font-black text-blue-300">
                            {resultado.cifraRepartidora?.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-blue-400/80 mt-1">
                            Cociente del último escaño asignado
                        </div>
                    </div>

                    <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-xl">
                        <span className="text-xs text-emerald-400 block mb-1">Curules Lista Propia</span>
                        <div className="text-2xl font-black text-emerald-300">
                            {resultado.analisisListaPropia?.curules_obtenidas} Curules
                        </div>
                        <div className="text-[11px] text-emerald-400/80 mt-1">
                            {resultado.analisisListaPropia?.votos_para_siguiente_curul !== null
                                ? `+${resultado.analisisListaPropia?.votos_para_siguiente_curul?.toLocaleString()} votos para la sig. curul`
                                : 'Sin escaños adicionales'}
                        </div>
                    </div>
                </div>
            )}

            {/* Listas y Votación Editable */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Editor de Votos por Lista */}
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-3">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-white">Votación Proyectada por Partidos</h3>
                        <button
                            onClick={handleAddLista}
                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Agregar Lista</span>
                        </button>
                    </div>

                    <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                        {listas.map(l => (
                            <div
                                key={l.id}
                                className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-sm ${
                                    l.esPropia
                                        ? 'bg-emerald-950/30 border-emerald-500/40'
                                        : 'bg-slate-900/70 border-slate-800'
                                }`}
                            >
                                <div className="flex-1">
                                    <div className="font-semibold text-white text-xs mb-1 flex items-center gap-1.5">
                                        <span>{l.nombre}</span>
                                        {l.esPropia && (
                                            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold">
                                                Nuestra
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type="number"
                                        value={l.votos}
                                        onChange={e => handleUpdateVotos(l.id, e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-sm font-mono font-bold text-amber-400"
                                    />
                                </div>

                                {!l.esPropia && (
                                    <button
                                        onClick={() => handleRemoveLista(l.id)}
                                        className="p-1.5 text-slate-500 hover:text-red-400 transition"
                                        title="Eliminar lista"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Resultados y Curules Asignadas */}
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        <span>Distribución Final de Escaños</span>
                    </h3>

                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                        {resultado?.resultados?.map((r, i) => (
                            <div
                                key={i}
                                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                                    r.esPropia
                                        ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md'
                                        : 'bg-slate-900/60 border-slate-800'
                                }`}
                            >
                                <div>
                                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                        <span>{r.nombre}</span>
                                        {r.esPropia && (
                                            <span className="px-1.5 py-0.5 bg-emerald-500 text-slate-950 rounded text-[10px] font-black">
                                                CAMPAÑA
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">
                                        {r.votos.toLocaleString()} votos ({r.porcentajeVotos}%)
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-xl font-black text-amber-400">
                                        {r.curules} {r.curules === 1 ? 'Curul' : 'Curules'}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                        {r.curules > 0 ? 'Obtiene representación' : 'Sin curul'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
