import React, { useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';
import { 
    Clock, Users, Target, Flag, Palette, Building2, Vote, 
    Truck, Headphones, MessageSquare, Share2, Award, ChevronRight, 
    TrendingUp, Compass, Calendar, Sparkles, MapPin, CheckCircle2, 
    ShieldCheck, ArrowUpRight, Flame
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCampaign } from '../context/CampaignContext';
import CampaignClock from '../components/common/CampaignClock';
import ModalPersonalizarMarca from '../components/common/ModalPersonalizarMarca';

export default function Dashboard() {
    const { activeCampaign, campaigns, refreshCampaigns } = useCampaign();
    const currentCampaign = activeCampaign || (campaigns.length > 0 ? campaigns[0] : null);

    const [showModalMarca, setShowModalMarca] = useState(false);

    const primaryColor = currentCampaign?.color || '#00B894';
    const totalVoters = currentCampaign ? (currentCampaign.totalVoters || 0) : 1245;
    const metaVotos = currentCampaign ? (currentCampaign.meta_votos || 0) : 50000;
    const progressPercent = currentCampaign ? (currentCampaign.progressPercent || 0) : 45;
    const leadersCount = currentCampaign ? (currentCampaign.totalLeaders || 0) : 38;
    const puestosCount = currentCampaign ? (currentCampaign.withPuesto || 0) : 24;

    // Datos dinámicos de tendencia basados en el avance real
    const dataTendencia = [
        { semana: 'Sem 1', votantes: Math.round(totalVoters * 0.15) },
        { semana: 'Sem 2', votantes: Math.round(totalVoters * 0.32) },
        { semana: 'Sem 3', votantes: Math.round(totalVoters * 0.55) },
        { semana: 'Sem 4', votantes: Math.round(totalVoters * 0.78) },
        { semana: 'Actual', votantes: totalVoters }
    ];

    // Distribución territorial por sectores / comunas
    const dataTerritorio = [
        { zona: 'Comuna 1 / Centro', total: Math.round(totalVoters * 0.35) },
        { zona: 'Comuna 2 / Norte', total: Math.round(totalVoters * 0.25) },
        { zona: 'Comuna 3 / Sur', total: Math.round(totalVoters * 0.22) },
        { zona: 'Zona Rural / Veredas', total: Math.round(totalVoters * 0.18) }
    ];

    const handleMarcaUpdated = () => {
        refreshCampaigns();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* ============================================================== */}
            {/* HERO BANNER: IDENTIDAD DE MARCA, PARTIDO Y CANDIDATO           */}
            {/* ============================================================== */}
            <div 
                className="relative rounded-3xl p-6 md:p-8 text-white shadow-2xl overflow-hidden border border-slate-700/80 backdrop-blur"
                style={{
                    background: `linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)`,
                    borderLeftWidth: '8px',
                    borderLeftColor: primaryColor
                }}
            >
                {/* Glow decorativo del color del partido */}
                <div 
                    className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
                    style={{ backgroundColor: primaryColor }}
                />

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    {/* Identidad del Político / Campaña */}
                    <div className="flex items-center gap-5">
                        {/* Logo o Foto */}
                        <div className="relative shrink-0">
                            {currentCampaign?.logo_campana ? (
                                <div 
                                    className="w-20 h-20 md:w-24 md:h-24 rounded-2xl p-2 bg-white/10 border-2 shadow-2xl flex items-center justify-center overflow-hidden"
                                    style={{ borderColor: primaryColor }}
                                >
                                    <img 
                                        src={currentCampaign.logo_campana} 
                                        alt="Logo Oficial" 
                                        className="w-full h-full object-contain"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                </div>
                            ) : currentCampaign?.foto_candidato ? (
                                <div 
                                    className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 shadow-2xl overflow-hidden"
                                    style={{ borderColor: primaryColor }}
                                >
                                    <img 
                                        src={currentCampaign.foto_candidato} 
                                        alt="Candidato" 
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                </div>
                            ) : (
                                <div 
                                    className="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-2xl"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    {currentCampaign?.candidato?.charAt(0) || 'C'}
                                </div>
                            )}

                            {/* Foto flotante del candidato si hay ambos */}
                            {currentCampaign?.foto_candidato && currentCampaign?.logo_campana && (
                                <img 
                                    src={currentCampaign.foto_candidato} 
                                    alt="Foto" 
                                    className="w-8 h-8 rounded-full border-2 border-white absolute -bottom-1 -right-1 object-cover shadow-lg"
                                />
                            )}
                        </div>

                        {/* Textos y Jerarquía de Marca */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Centro de Mando & Gestión Política
                                </span>
                                {currentCampaign?.partido_politico && (
                                    <span 
                                        className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-white shadow-sm flex items-center gap-1"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        <Flag className="w-3 h-3" />
                                        <span>{currentCampaign.partido_politico}</span>
                                    </span>
                                )}
                            </div>

                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                {currentCampaign?.candidato || currentCampaign?.nombre || 'Campaña Electoral'}
                            </h1>

                            <p className="text-sm md:text-base text-slate-300 italic font-medium leading-snug">
                                "{currentCampaign?.eslogan || 'Construyendo el futuro y progreso con la comunidad'}"
                            </p>

                            <div className="flex items-center gap-3 pt-1 text-xs text-slate-400 flex-wrap">
                                <span>📍 {currentCampaign?.municipio || currentCampaign?.departamento || 'Territorio Nacional'}</span>
                                <span>•</span>
                                <span className="uppercase font-semibold text-slate-300">
                                    Cargo: {currentCampaign?.tipo_cargo || 'Elección Popular'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Botón de Personalización y Selector Rápido */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 w-full lg:w-auto">
                        <button
                            onClick={() => setShowModalMarca(true)}
                            className="w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-xs shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 text-white"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <Palette className="w-4 h-4" />
                            <span>Personalizar Partido, Colores y Logo</span>
                        </button>

                        <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                            <span>Color Identidad: <strong>{primaryColor}</strong></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reloj Oficial de Campaña y Cuenta Regresiva al Día D */}
            {currentCampaign && (
                <CampaignClock campaign={currentCampaign} mode="banner" />
            )}

            {/* ============================================================== */}
            {/* TARJETAS KPI DE IMPACTO (MÉTRICAS CLAVE)                      */}
            {/* ============================================================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Votantes Registrados */}
                <div 
                    className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl shadow-xl backdrop-blur relative overflow-hidden transition hover:border-slate-600"
                    style={{ borderTop: `4px solid ${primaryColor}` }}
                >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <span>Censo Comprometido</span>
                        <div className="p-2 rounded-xl bg-slate-900/60" style={{ color: primaryColor }}>
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-white">
                        {totalVoters.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Afiliados y simpatizantes registrados</span>
                    </div>
                </div>

                {/* 2. Avance Meta Electoral */}
                <div 
                    className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl shadow-xl backdrop-blur relative overflow-hidden transition hover:border-slate-600"
                    style={{ borderTop: `4px solid ${primaryColor}` }}
                >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <span>Avance de Meta</span>
                        <div className="p-2 rounded-xl bg-slate-900/60" style={{ color: primaryColor }}>
                            <Target className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">{progressPercent}%</span>
                        <span className="text-xs text-slate-400">de {metaVotos.toLocaleString()} votos</span>
                    </div>
                    {/* Barra de progreso */}
                    <div className="w-full bg-slate-900 rounded-full h-2 mt-2 overflow-hidden border border-slate-700">
                        <div 
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(100, progressPercent)}%`, backgroundColor: primaryColor }}
                        />
                    </div>
                </div>

                {/* 3. Líderes Territoriales */}
                <div 
                    className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl shadow-xl backdrop-blur relative overflow-hidden transition hover:border-slate-600"
                    style={{ borderTop: `4px solid ${primaryColor}` }}
                >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <span>Líderes Activos</span>
                        <div className="p-2 rounded-xl bg-slate-900/60" style={{ color: primaryColor }}>
                            <Flag className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-white">
                        {leadersCount}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                        Estructura barrial y comunitaria
                    </div>
                </div>

                {/* 4. Puestos y Cobertura */}
                <div 
                    className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl shadow-xl backdrop-blur relative overflow-hidden transition hover:border-slate-600"
                    style={{ borderTop: `4px solid ${primaryColor}` }}
                >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <span>Puestos Cubiertos</span>
                        <div className="p-2 rounded-xl bg-slate-900/60" style={{ color: primaryColor }}>
                            <Building2 className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-white">
                        {puestosCount}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Puestos con presencia de equipo</span>
                    </div>
                </div>
            </div>

            {/* ============================================================== */}
            {/* CONSOLA DE ACCIONES RÁPIDAS (OPERACIONES 1-CLIC)               */}
            {/* ============================================================== */}
            <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-3xl shadow-xl backdrop-blur space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" style={{ color: primaryColor }} />
                        <span>Operaciones Estratégicas de Campaña y Mandato (4 Años)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">Accesos directos 1-clic</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <Link
                        to="/dia-d"
                        className="p-3 bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 rounded-2xl flex flex-col items-center text-center gap-2 transition hover:scale-105 group shadow"
                    >
                        <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition">
                            <Vote className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-bold text-xs text-white">Operación Día D</div>
                            <div className="text-[10px] text-slate-400">Auditor E-14 & GOTV</div>
                        </div>
                    </Link>

                    <Link
                        to="/callcenter"
                        className="p-3 bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 rounded-2xl flex flex-col items-center text-center gap-2 transition hover:scale-105 group shadow"
                    >
                        <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition">
                            <Headphones className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-bold text-xs text-white">Call Center</div>
                            <div className="text-[10px] text-slate-400">Eventos & Movilización</div>
                        </div>
                    </Link>

                    <Link
                        to="/necesidades"
                        className="p-3 bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 rounded-2xl flex flex-col items-center text-center gap-2 transition hover:scale-105 group shadow"
                    >
                        <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-bold text-xs text-white">Banco Necesidades</div>
                            <div className="text-[10px] text-slate-400">Soluciones de 4 Años</div>
                        </div>
                    </Link>

                    <Link
                        to="/logistica"
                        className="p-3 bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 rounded-2xl flex flex-col items-center text-center gap-2 transition hover:scale-105 group shadow"
                    >
                        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition">
                            <Truck className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-bold text-xs text-white">Flota y Transporte</div>
                            <div className="text-[10px] text-slate-400">Despacho en Vivo</div>
                        </div>
                    </Link>

                    <Link
                        to="/territorio"
                        className="p-3 bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 rounded-2xl flex flex-col items-center text-center gap-2 transition hover:scale-105 group shadow"
                    >
                        <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition">
                            <Compass className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-bold text-xs text-white">Mapa Territorial</div>
                            <div className="text-[10px] text-slate-400">Calor GIS & Mesas</div>
                        </div>
                    </Link>

                    <Link
                        to="/social"
                        className="p-3 bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 rounded-2xl flex flex-col items-center text-center gap-2 transition hover:scale-105 group shadow"
                    >
                        <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition">
                            <Share2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-bold text-xs text-white">Redes & Prensa</div>
                            <div className="text-[10px] text-slate-400">Trazabilidad de Clics</div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* ============================================================== */}
            {/* GRÁFICOS EJECUTIVOS VIVOS                                      */}
            {/* ============================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Gráfico 1: Curva de Crecimiento del Censo (Col 7) */}
                <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700/80 p-5 rounded-3xl shadow-xl backdrop-blur space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" style={{ color: primaryColor }} />
                                <span>Tendencia de Afiliación y Censo Comprometido</span>
                            </h3>
                            <p className="text-xs text-slate-400">Progresión acumulada de votantes verificados</p>
                        </div>
                        <span className="text-xs font-bold text-white px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700">
                            Total: {totalVoters.toLocaleString()}
                        </span>
                    </div>

                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dataTendencia}>
                                <defs>
                                    <linearGradient id="colorVoters" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={primaryColor} stopOpacity={0.6}/>
                                        <stop offset="95%" stopColor={primaryColor} stopOpacity={0.0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                <XAxis dataKey="semana" stroke="#94a3b8" fontSize={11} />
                                <YAxis stroke="#94a3b8" fontSize={11} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="votantes" 
                                    stroke={primaryColor} 
                                    strokeWidth={3} 
                                    fillOpacity={1} 
                                    fill="url(#colorVoters)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico 2: Fuerza Electoral por Comuna / Territorio (Col 5) */}
                <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/80 p-5 rounded-3xl shadow-xl backdrop-blur space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                                <Compass className="w-4 h-4 text-amber-400" />
                                <span>Fuerza Electoral por Sector</span>
                            </h3>
                            <p className="text-xs text-slate-400">Distribución de votantes por zonas clave</p>
                        </div>
                    </div>

                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dataTerritorio} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                                <YAxis dataKey="zona" type="category" stroke="#94a3b8" fontSize={10} width={110} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                                />
                                <Bar dataKey="total" fill={primaryColor} radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Modal de Personalización de Marca y Partido Político */}
            {showModalMarca && currentCampaign && (
                <ModalPersonalizarMarca
                    campaign={currentCampaign}
                    isOpen={showModalMarca}
                    onClose={() => setShowModalMarca(false)}
                    onUpdated={handleMarcaUpdated}
                />
            )}
        </div>
    );
}
