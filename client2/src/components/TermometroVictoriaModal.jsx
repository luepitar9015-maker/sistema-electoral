import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../config/api';
import { 
    X, AlertTriangle, TrendingUp, Target, Users, Calendar, 
    Compass, CheckCircle2, ChevronRight, BarChart3, Flame
} from 'lucide-react';

export default function TermometroVictoriaModal({ campaign, isOpen, onClose }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const token = localStorage.getItem('token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        if (!isOpen || !campaign) return;
        fetchTermometro();
    }, [isOpen, campaign]);

    const fetchTermometro = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API}/campaigns/${campaign.id}/termometro`, authHeaders);
            setData(res.data);
        } catch (err) {
            console.error('Error fetching termometro:', err);
            setError(err.response?.data?.message || 'Error al calcular termómetro de victoria');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const pct = data?.porcentajeCumplimiento || 0;
    const isSuccess = pct >= 100;
    const isWarning = pct >= 50 && pct < 100;
    const isCritical = pct < 50;

    const gaugeColor = isSuccess ? '#10B981' : isWarning ? '#F59E0B' : '#EF4444';
    const gaugeBg = isSuccess ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500';

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-4xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-400">
                            <Flame size={24} className="animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500/30 text-rose-300 px-2 py-0.5 rounded-md border border-rose-500/40">
                                    Inteligencia Electoral
                                </span>
                                <span className="text-xs text-slate-400 font-mono">
                                    {campaign?.candidato}
                                </span>
                            </div>
                            <h3 className="font-black text-xl uppercase tracking-wide text-white mt-0.5">
                                Termómetro de Victoria & Déficit Territorial
                            </h3>
                            <p className="text-slate-300 text-xs">
                                Monitoreo matemático del umbral de victoria, ritmo diario requerido y balance por municipio/zona.
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                    {loading && (
                        <div className="py-16 text-center space-y-3">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-sm font-bold text-gray-500">Calculando proyecciones territoriales y déficit electoral...</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-3">
                            <AlertTriangle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {!loading && data && (
                        <>
                            {/* Alerta del Termómetro */}
                            <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                                isSuccess 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                                    : isWarning 
                                        ? 'bg-amber-50 border-amber-200 text-amber-900' 
                                        : 'bg-rose-50 border-rose-200 text-rose-900'
                            }`}>
                                <div className="mt-0.5">
                                    {isSuccess ? <CheckCircle2 className="text-emerald-600" size={20} /> : <AlertTriangle className={isWarning ? 'text-amber-600' : 'text-rose-600'} size={20} />}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-black text-sm uppercase tracking-wide">
                                        Diagnóstico Electoral: {data.alertaDeficit?.nivel?.toUpperCase() || 'EVALUANDO'}
                                    </h4>
                                    <p className="text-xs font-medium mt-0.5">
                                        {data.alertaDeficit?.mensaje}
                                    </p>
                                </div>
                            </div>

                            {/* Panel Central del Termómetro (Medidor Visual) */}
                            <div className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl space-y-5">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    {/* Gráfico / Porcentaje */}
                                    <div className="flex items-center gap-6">
                                        <div className="relative w-32 h-32 flex items-center justify-center">
                                            {/* Circular Progress SVG */}
                                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="40"
                                                    className="stroke-slate-800"
                                                    strokeWidth="10"
                                                    fill="transparent"
                                                />
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="40"
                                                    stroke={gaugeColor}
                                                    strokeWidth="10"
                                                    fill="transparent"
                                                    strokeDasharray="251.2"
                                                    strokeDashoffset={251.2 - (251.2 * Math.min(100, pct)) / 100}
                                                    strokeLinecap="round"
                                                    className="transition-all duration-1000 ease-out"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-3xl font-black tracking-tight" style={{ color: gaugeColor }}>
                                                    {pct}%
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Meta
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-1 text-left">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                                                Capacidad de Victoria Proyectada
                                            </span>
                                            <h2 className="text-2xl font-black text-white">
                                                {data.totalVoters?.toLocaleString()} <span className="text-sm font-normal text-slate-400">/ {data.metaVotos?.toLocaleString()} votos</span>
                                            </h2>
                                            <p className="text-xs text-slate-300">
                                                {data.deficitVotos > 0 ? (
                                                    <span className="text-rose-400 font-bold">
                                                        Déficit actual: -{data.deficitVotos?.toLocaleString()} votos para asegurar curul
                                                    </span>
                                                ) : (
                                                    <span className="text-emerald-400 font-bold">
                                                        ¡Meta de victoria alcanzada y superada por +{Math.abs(data.deficitVotos)?.toLocaleString()} votos!
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Ritmo y Días */}
                                    <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                                        <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 text-center">
                                            <Calendar className="mx-auto text-indigo-400 mb-1" size={18} />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Días al Día D</span>
                                            <span className="text-xl font-black text-white">{data.diasRestantes}</span>
                                            <span className="text-[10px] text-slate-400 block mt-0.5">días de campaña</span>
                                        </div>

                                        <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 text-center">
                                            <TrendingUp className="mx-auto text-amber-400 mb-1" size={18} />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Ritmo Requerido</span>
                                            <span className="text-xl font-black text-amber-400">+{data.ritmoDiarioRequerido}</span>
                                            <span className="text-[10px] text-slate-400 block mt-0.5">votos / día</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Barra de Progreso Lineal */}
                                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                                    <div className="flex justify-between text-xs text-slate-400 font-medium">
                                        <span>0 votos</span>
                                        <span>50% (Punto de inflexión)</span>
                                        <span>100% Meta ({data.metaVotos?.toLocaleString()})</span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-700 ${gaugeBg}`}
                                            style={{ width: `${Math.min(100, pct)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Desglose Territorial y Análisis de Déficit */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Compass className="text-indigo-600" size={18} />
                                        <h4 className="font-black text-slate-900 text-sm uppercase tracking-wide">
                                            Déficit Territorial por Municipio / Comuna
                                        </h4>
                                    </div>
                                    <span className="text-xs text-gray-500 font-bold">
                                        {data.territorios?.length || 0} zonas monitoreadas
                                    </span>
                                </div>

                                <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-slate-50 border-b border-gray-200 text-gray-500 font-black uppercase text-[10px] tracking-wider">
                                                <tr>
                                                    <th className="py-3 px-4">Territorio / Municipio</th>
                                                    <th className="py-3 px-4 text-center">Inscritos Actuales</th>
                                                    <th className="py-3 px-4 text-center">Meta Asignada</th>
                                                    <th className="py-3 px-4 text-center">Balance / Déficit</th>
                                                    <th className="py-3 px-4 text-center">Estado Territorial</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {data.territorios && data.territorios.length > 0 ? (
                                                    data.territorios.map((t, idx) => {
                                                        const isDeficit = t.deficit > 0;
                                                        return (
                                                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                                <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                                                                    <div className={`w-2 h-2 rounded-full ${isDeficit ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                                                    <span>{t.territorio}</span>
                                                                </td>
                                                                <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                                                                    {t.total_inscritos.toLocaleString()}
                                                                </td>
                                                                <td className="py-3 px-4 text-center font-mono text-gray-500">
                                                                    {t.meta_sugerida.toLocaleString()}
                                                                </td>
                                                                <td className="py-3 px-4 text-center font-mono font-bold">
                                                                    {isDeficit ? (
                                                                        <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                                                                            -{t.deficit.toLocaleString()}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                                            +{Math.abs(t.deficit).toLocaleString()} (Superávit)
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="py-3 px-4 text-center">
                                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                                                        t.estado === 'alerta_critica' 
                                                                            ? 'bg-rose-100 text-rose-700' 
                                                                            : t.estado === 'en_riesgo' 
                                                                                ? 'bg-amber-100 text-amber-700' 
                                                                                : 'bg-emerald-100 text-emerald-700'
                                                                    }`}>
                                                                        {t.estado === 'alerta_critica' ? 'Déficit Alto' : t.estado === 'en_riesgo' ? 'En Riesgo' : 'Meta Cumplida'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="py-8 text-center text-gray-400">
                                                            No hay datos de votantes segmentados por territorio aún.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Plan de Acción Estratégico */}
                            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 text-indigo-950 space-y-2">
                                <h5 className="font-black text-xs uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                                    <BarChart3 size={15} className="text-indigo-600" />
                                    Recomendación Estratégica del Director de Campaña
                                </h5>
                                <p className="text-xs leading-relaxed text-indigo-900/90 font-medium">
                                    {isCritical && `Se detecta un rezago crítico. Se recomienda desplegar brigadas de inscripción focalizadas en los municipios con mayor déficit y convocar de inmediato a los líderes zonales para reactivar el ritmo diario de +${data.ritmoDiarioRequerido} apoyos.`}
                                    {isWarning && `La campaña avanza a buen ritmo pero requiere consolidar los territorios en riesgo. Active a los coequiperos para garantizar que la meta de ${data.metaVotos?.toLocaleString()} votos se cumpla al menos 15 días antes de los comicios.`}
                                    {isSuccess && `Campaña en zona de victoria asegurada. Enfoque los esfuerzos en la pedagogía electoral del tarjetón (${campaign?.numero_tarjeton ? '#' + campaign.numero_tarjeton : 'candidato'}) y en la defensa del voto con testigos electorales en todas las mesas.`}
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 font-medium">
                        Cálculo en tiempo real basado en el censo de votantes de la campaña
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
                    >
                        Cerrar Termómetro
                    </button>
                </div>
            </div>
        </div>
    );
}
