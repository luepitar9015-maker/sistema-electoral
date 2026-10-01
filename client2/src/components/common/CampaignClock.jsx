import { useState, useEffect } from 'react';
import { Clock, Calendar, AlertCircle, CheckCircle2, TrendingUp, Flame, Sparkles } from 'lucide-react';

/**
 * Utilidad para desglosar el tiempo restante
 */
export function getRemainingTimeBreakdown(targetDateStr) {
    if (!targetDateStr) return null;

    const target = new Date(targetDateStr).getTime();
    if (isNaN(target)) return null;

    const now = new Date().getTime();
    const difference = target - now;

    if (difference <= 0) {
        return {
            totalMs: difference,
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            isFinished: true,
            isToday: Math.abs(difference) < 24 * 60 * 60 * 1000
        };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return {
        totalMs: difference,
        days,
        hours,
        minutes,
        seconds,
        isFinished: false,
        isToday: days === 0
    };
}

/**
 * Formatea fechas a formato legible colombiano (ej: 25 oct 2026)
 */
export function formatDateCO(dateStr) {
    if (!dateStr) return 'Sin definir';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

/**
 * Componente de Reloj de Campaña en varios modos:
 * - 'compact' (para Header)
 * - 'banner' (para Dashboard)
 * - 'card' (para tarjetas en CampaignsPage)
 */
export default function CampaignClock({ campaign, mode = 'compact', onEditDates }) {
    const [timeLeft, setTimeLeft] = useState(() => getRemainingTimeBreakdown(campaign?.fecha_elecciones));

    useEffect(() => {
        if (!campaign?.fecha_elecciones) {
            setTimeLeft(null);
            return;
        }

        const updateTimer = () => {
            setTimeLeft(getRemainingTimeBreakdown(campaign.fecha_elecciones));
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [campaign?.fecha_elecciones]);

    if (!campaign) return null;

    const fechaInicio = campaign.fecha_inicio;
    const fechaElecciones = campaign.fecha_elecciones;

    // Si la campaña no tiene fecha de elecciones configurada
    if (!fechaElecciones) {
        if (mode === 'compact') {
            return (
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-300 text-xs font-medium">
                    <Clock size={13} className="text-amber-400" />
                    <span>Sin fecha de elecciones</span>
                </div>
            );
        }

        return (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider mb-1">
                    <AlertCircle size={16} className="text-amber-600" />
                    <span>Reloj de Campaña Inactivo</span>
                </div>
                <p className="text-xs text-amber-700">
                    Configura la fecha de inicio y día de elecciones para activar el reloj electoral y ritmo diario de votos.
                </p>
            </div>
        );
    }

    const { days, hours, minutes, seconds, isFinished, isToday } = timeLeft || {};

    // Métricas del reloj calculadas
    const now = new Date();
    const startDate = fechaInicio ? new Date(fechaInicio) : new Date(campaign.createdAt);
    const electionDate = new Date(fechaElecciones);

    const totalCampaignMs = Math.max(1, electionDate.getTime() - startDate.getTime());
    const elapsedCampaignMs = Math.max(0, now.getTime() - startDate.getTime());
    const timeProgressPercent = Math.min(100, Math.max(0, Math.round((elapsedCampaignMs / totalCampaignMs) * 100)));

    const meta = campaign.meta_votos || 0;
    const currentVoters = campaign.totalVoters || 0;
    const remainingVotes = Math.max(0, meta - currentVoters);
    const remainingDaysCalc = Math.max(1, days || 1);
    const dailyPaceNeeded = !isFinished && remainingVotes > 0 ? Math.ceil(remainingVotes / remainingDaysCalc) : 0;

    // Semáforo de urgencia
    const getUrgencyBadge = () => {
        if (isFinished) {
            return {
                bg: 'bg-gray-100 text-gray-700 border-gray-300',
                label: 'Jornada Electoral Concluida',
                icon: CheckCircle2
            };
        }
        if (isToday) {
            return {
                bg: 'bg-rose-500 text-white border-rose-600 animate-pulse',
                label: '¡HOY ES EL DÍA D! ELECCIONES',
                icon: Flame
            };
        }
        if (days <= 7) {
            return {
                bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
                label: '¡Recta Final!',
                icon: Flame
            };
        }
        if (days <= 30) {
            return {
                bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                label: 'Fase Decisiva',
                icon: Clock
            };
        }
        return {
            bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
            label: 'En Campaña Activa',
            icon: Sparkles
        };
    };

    const urgency = getUrgencyBadge();
    const UrgencyIcon = urgency.icon;

    // ─── MODO 1: COMPACT (Para Header) ──────────────────────────────────────
    if (mode === 'compact') {
        if (isFinished) {
            return (
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-gray-400 text-xs font-semibold">
                    <CheckCircle2 size={13} className="text-gray-400" />
                    <span>Elecciones Concluidas</span>
                </div>
            );
        }

        return (
            <div
                title={`Inicio: ${formatDateCO(fechaInicio)} | Día D: ${formatDateCO(fechaElecciones)}`}
                className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700/80 rounded-full text-xs font-mono shadow-inner group hover:border-[#00B894]/60 transition-all cursor-pointer"
            >
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold font-sans">
                    <Clock size={13} className="animate-spin" style={{ animationDuration: '6s' }} />
                    <span className="text-[10px] uppercase tracking-wider font-black text-gray-300">Día D:</span>
                </div>

                <div className="flex items-center gap-1 font-black text-white">
                    <span className="text-emerald-400 font-bold">{days}d</span>
                    <span className="text-gray-500">:</span>
                    <span>{String(hours).padStart(2, '0')}h</span>
                    <span className="text-gray-500">:</span>
                    <span>{String(minutes).padStart(2, '0')}m</span>
                    <span className="text-gray-500">:</span>
                    <span className="text-gray-400 text-[11px] w-5 text-right">{String(seconds).padStart(2, '0')}s</span>
                </div>

                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
        );
    }

    // ─── MODO 2: CARD (Para las tarjetas de Campaña en CampaignsPage) ────────
    if (mode === 'card') {
        return (
            <div className="bg-gradient-to-br from-slate-900 to-gray-900 text-white rounded-2xl p-3.5 border border-gray-800 shadow-md space-y-2.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-[#00B894]" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-300">
                            Reloj Oficial de Campaña
                        </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${urgency.bg}`}>
                        <UrgencyIcon size={11} />
                        {urgency.label}
                    </span>
                </div>

                {isFinished ? (
                    <div className="p-2 bg-gray-800/80 rounded-xl text-center text-xs text-gray-300 font-semibold">
                        Jornada de votación finalizada ({formatDateCO(fechaElecciones)})
                    </div>
                ) : (
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                        <div className="bg-gray-800/90 border border-gray-700/60 p-1.5 rounded-xl">
                            <span className="block text-base font-black text-emerald-400 leading-tight">{days}</span>
                            <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Días</span>
                        </div>
                        <div className="bg-gray-800/90 border border-gray-700/60 p-1.5 rounded-xl">
                            <span className="block text-base font-black text-gray-200 leading-tight">{String(hours).padStart(2, '0')}</span>
                            <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Horas</span>
                        </div>
                        <div className="bg-gray-800/90 border border-gray-700/60 p-1.5 rounded-xl">
                            <span className="block text-base font-black text-gray-200 leading-tight">{String(minutes).padStart(2, '0')}</span>
                            <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Min</span>
                        </div>
                        <div className="bg-gray-800/90 border border-gray-700/60 p-1.5 rounded-xl">
                            <span className="block text-base font-black text-gray-400 leading-tight">{String(seconds).padStart(2, '0')}</span>
                            <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Seg</span>
                        </div>
                    </div>
                )}

                {/* Línea de tiempo de la campaña */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                        <span>Inicio: {formatDateCO(fechaInicio)}</span>
                        <span className="text-emerald-400 font-bold">Día D: {formatDateCO(fechaElecciones)}</span>
                    </div>

                    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                            style={{ width: `${timeProgressPercent}%` }}
                        />
                    </div>

                    <div className="flex justify-between text-[9px] text-gray-400">
                        <span>Tiempo transcurrido: <strong className="text-gray-200">{timeProgressPercent}%</strong></span>
                        {dailyPaceNeeded > 0 && (
                            <span className="text-amber-300 font-bold">
                                Ritmo: +{dailyPaceNeeded.toLocaleString()} votos/día
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ─── MODO 3: BANNER HERO (Para Dashboard) ────────────────────────────────
    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 text-white rounded-3xl p-6 shadow-2xl border border-gray-800">
            {/* Resplandor decorativo de fondo */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#00B894]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">

                {/* Izquierda: Info de la campaña y lapso */}
                <div className="space-y-2 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                        <Clock size={13} className="animate-spin" style={{ animationDuration: '8s' }} />
                        <span>Reloj Oficial de la Campaña</span>
                        <span className="mx-1 text-emerald-500">·</span>
                        <span>{campaign.nombre}</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                        Cuenta Regresiva al Día de las Elecciones
                    </h2>

                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-gray-300">
                        <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-gray-400" />
                            <span>Inicio de Campaña: <strong>{formatDateCO(fechaInicio)}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                            <Calendar size={14} className="text-emerald-400" />
                            <span>Día D (Elecciones): <strong>{formatDateCO(fechaElecciones)}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Centro / Derecha: Contadores Digitales */}
                {isFinished ? (
                    <div className="p-4 bg-gray-800/80 border border-gray-700 rounded-2xl text-center">
                        <CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-1" />
                        <h4 className="font-black text-sm uppercase">Jornada Electoral Concluida</h4>
                        <p className="text-xs text-gray-400">Las urnas se cerraron el {formatDateCO(fechaElecciones)}</p>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="bg-gray-800/90 border border-gray-700/80 rounded-2xl p-3 sm:p-4 min-w-[70px] sm:min-w-[85px] text-center shadow-lg backdrop-blur-md">
                            <span className="block text-2xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight">
                                {days}
                            </span>
                            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-gray-400 font-bold">
                                Días
                            </span>
                        </div>

                        <span className="text-2xl font-bold text-gray-600">:</span>

                        <div className="bg-gray-800/90 border border-gray-700/80 rounded-2xl p-3 sm:p-4 min-w-[70px] sm:min-w-[85px] text-center shadow-lg backdrop-blur-md">
                            <span className="block text-2xl sm:text-4xl font-black text-white font-mono tracking-tight">
                                {String(hours).padStart(2, '0')}
                            </span>
                            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-gray-400 font-bold">
                                Horas
                            </span>
                        </div>

                        <span className="text-2xl font-bold text-gray-600">:</span>

                        <div className="bg-gray-800/90 border border-gray-700/80 rounded-2xl p-3 sm:p-4 min-w-[70px] sm:min-w-[85px] text-center shadow-lg backdrop-blur-md">
                            <span className="block text-2xl sm:text-4xl font-black text-white font-mono tracking-tight">
                                {String(minutes).padStart(2, '0')}
                            </span>
                            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-gray-400 font-bold">
                                Min
                            </span>
                        </div>

                        <span className="text-2xl font-bold text-gray-600">:</span>

                        <div className="bg-gray-800/90 border border-gray-700/80 rounded-2xl p-3 sm:p-4 min-w-[70px] sm:min-w-[85px] text-center shadow-lg backdrop-blur-md">
                            <span className="block text-2xl sm:text-4xl font-black text-emerald-400/90 font-mono tracking-tight">
                                {String(seconds).padStart(2, '0')}
                            </span>
                            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-gray-400 font-bold">
                                Seg
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Barra Inferior: Progreso del Periodo de Campaña y Ritmo */}
            <div className="mt-5 pt-4 border-t border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Progreso del Lapso */}
                <div className="space-y-1.5 md:col-span-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-400 flex items-center gap-1.5">
                            <span>Lapso de campaña consumido:</span>
                            <strong className="text-emerald-400">{timeProgressPercent}%</strong>
                        </span>
                        <span className="text-gray-400">
                            Faltan <strong>{days} días</strong> para la votación
                        </span>
                    </div>

                    <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-gray-700/60">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-[#00B894] transition-all duration-700"
                            style={{ width: `${timeProgressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Ritmo de Votantes Requerido por Día */}
                <div className="bg-gray-800/70 border border-gray-700/70 rounded-2xl p-3 flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                            Ritmo de Movilización
                        </span>
                        <span className="text-sm font-black text-white">
                            {dailyPaceNeeded > 0 ? (
                                <>+{dailyPaceNeeded.toLocaleString()} <span className="text-xs text-amber-300 font-normal">votos/día</span></>
                            ) : (
                                <span className="text-emerald-400 text-xs">Meta alcanzada o sin definir</span>
                            )}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
