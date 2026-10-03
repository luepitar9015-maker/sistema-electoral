import React, { useState, useEffect } from 'react';
import { 
    Headphones, Phone, PhoneCall, PhoneForwarded, PhoneOff, 
    CheckCircle2, Truck, AlertCircle, MessageSquare, ChevronRight, 
    RotateCcw, Sparkles, User, MapPin, Award
} from 'lucide-react';
import { API } from '../../config/api';

export default function CallCenterOperator() {
    const [currentVoter, setCurrentVoter] = useState(null);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);

    // Filtros de cola
    const [soloPendientes, setSoloPendientes] = useState(true);
    const [filterPuesto, setFilterPuesto] = useState('');
    const [minFidelidad, setMinFidelidad] = useState(1);

    // Formulario de llamada
    const [notasLlamada, setNotasLlamada] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showTransporteModal, setShowTransporteModal] = useState(false);
    const [direccionRecogida, setDireccionRecogida] = useState('');

    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API}/callcenter/stats`, { headers });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (e) {}
    };

    const fetchNextVoter = async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams({
                soloPendientesDiaD: soloPendientes,
                puesto: filterPuesto,
                minFidelidad
            });
            const res = await fetch(`${API}/callcenter/next?${q.toString()}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setCurrentVoter(data.voter || null);
                setNotasLlamada('');
                if (data.voter?.direccion) {
                    setDireccionRecogida(data.voter.direccion.replace(/Tel:.*$/, '').trim());
                }
            }
        } catch (e) {
            console.error('Error fetching next voter:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchNextVoter();
    }, [soloPendientes, filterPuesto, minFidelidad]);

    const handleTipificar = async (resultado) => {
        if (!currentVoter) return;

        if (resultado === 'requiere_transporte') {
            setShowTransporteModal(true);
            return;
        }

        try {
            setSubmitting(true);
            await fetch(`${API}/callcenter/record`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    voter_id: currentVoter.id,
                    resultado,
                    notas: notasLlamada
                })
            });
            fetchStats();
            fetchNextVoter();
        } catch (e) {
            alert('Error al registrar llamada');
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmarTransporte = async () => {
        try {
            setSubmitting(true);
            await fetch(`${API}/callcenter/record`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    voter_id: currentVoter.id,
                    resultado: 'requiere_transporte',
                    notas: notasLlamada,
                    origen_direccion: direccionRecogida || currentVoter.direccion || 'Domicilio votante',
                    destino_puesto: currentVoter.lugar_votacion || 'Puesto asignado'
                })
            });
            setShowTransporteModal(false);
            fetchStats();
            fetchNextVoter();
        } catch (e) {
            alert('Error al programar transporte');
        } finally {
            setSubmitting(false);
        }
    };

    const getTelefono = () => {
        if (!currentVoter) return '';
        if (currentVoter.direccion && currentVoter.direccion.includes('Tel:')) {
            return currentVoter.direccion.replace(/.*Tel:\s*/, '').trim();
        }
        return currentVoter.cedula;
    };

    const tel = getTelefono();

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 space-y-6">
            {/* Header del Call Center */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-5 border-b border-slate-800 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20 text-white">
                        <Headphones className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-400 bg-clip-text text-transparent">
                            Central de Telemarketing Electoral & GOTV
                        </h1>
                        <p className="text-xs text-slate-400">
                            Marcador telefónico con guión dinámico, verificación de voto y coordinación de movilización
                        </p>
                    </div>
                </div>

                {/* Filtros rápidos de cola */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-800/80 p-2 rounded-xl border border-slate-700 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                        <input
                            type="checkbox"
                            checked={soloPendientes}
                            onChange={e => setSoloPendientes(e.target.checked)}
                            className="rounded accent-amber-500"
                        />
                        <span>Solo Pendientes Día D</span>
                    </label>

                    <input
                        type="text"
                        placeholder="Filtrar puesto..."
                        value={filterPuesto}
                        onChange={e => setFilterPuesto(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 w-32"
                    />

                    <button
                        onClick={fetchNextVoter}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition"
                    >
                        Siguiente
                    </button>
                </div>
            </div>

            {/* Métricas de Operador */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                <div className="bg-slate-800/80 border border-slate-700/80 p-3.5 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-1">Mis Llamadas Hoy</span>
                    <div className="text-2xl font-black text-indigo-400">{stats?.mis_llamadas || 0}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Total campaña: {stats?.total_llamadas || 0}</div>
                </div>

                <div className="bg-emerald-950/40 border border-emerald-500/40 p-3.5 rounded-xl">
                    <span className="text-xs text-emerald-400 block mb-1">Votos Confirmados</span>
                    <div className="text-2xl font-black text-emerald-300">{stats?.confirmados || 0}</div>
                    <div className="text-[10px] text-emerald-400/80 mt-0.5">Compromiso firme</div>
                </div>

                <div className="bg-amber-950/40 border border-amber-500/40 p-3.5 rounded-xl">
                    <span className="text-xs text-amber-400 block mb-1">Transportes Generados</span>
                    <div className="text-2xl font-black text-amber-300">{stats?.transporte_solicitado || 0}</div>
                    <div className="text-[10px] text-amber-400/80 mt-0.5">Enviados a flota</div>
                </div>

                <div className="bg-blue-950/40 border border-blue-500/40 p-3.5 rounded-xl">
                    <span className="text-xs text-blue-400 block mb-1">Tasa de Efectividad</span>
                    <div className="text-2xl font-black text-blue-300">{stats?.tasa_efectividad_pct || 0}%</div>
                    <div className="text-[10px] text-blue-400/80 mt-0.5">Contactos positivos</div>
                </div>

                <div className="bg-purple-950/40 border border-purple-500/40 p-3.5 rounded-xl col-span-2 md:col-span-1">
                    <span className="text-xs text-purple-400 block mb-1">No Contestaron</span>
                    <div className="text-2xl font-black text-purple-300">{stats?.no_contesta || 0}</div>
                    <div className="text-[10px] text-purple-400/80 mt-0.5">Reagendados para tarde</div>
                </div>
            </div>

            {/* Espacio de Llamada Activa */}
            {currentVoter ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Ficha del Votante (Col 5) */}
                    <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                                    Votante en Línea
                                </span>
                                <h2 className="text-xl font-bold text-white mt-1">
                                    {currentVoter.nombres} {currentVoter.apellidos}
                                </h2>
                                <span className="text-xs font-mono text-slate-400">CC: {currentVoter.cedula}</span>
                            </div>

                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                currentVoter.ha_votado
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                            }`}>
                                {currentVoter.ha_votado ? 'SUFRAGÓ' : 'FALTA POR VOTAR'}
                            </span>
                        </div>

                        <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-700/60 space-y-2.5 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Puesto de Votación:</span>
                                <span className="font-bold text-white text-right">{currentVoter.lugar_votacion || 'Principal'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Mesa Asignada:</span>
                                <span className="font-bold text-amber-400">Mesa {currentVoter.mesa || '1'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Municipio:</span>
                                <span className="text-slate-200">{currentVoter.municipio} ({currentVoter.departamento})</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Líder Asignado:</span>
                                <span className="text-indigo-300 font-semibold">{currentVoter.lider_nombre || 'Directo'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Fidelidad Histórica:</span>
                                <span className="font-bold text-emerald-400">{currentVoter.fidelidad_score || 3} / 5 ⭐</span>
                            </div>
                        </div>

                        {/* Botones de Marcación Directa */}
                        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                            <a
                                href={`tel:${tel}`}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/20 transition"
                            >
                                <PhoneCall className="w-4 h-4" />
                                <span>Llamar ({tel})</span>
                            </a>

                            <a
                                href={`https://wa.me/?text=Hola%20${encodeURIComponent(currentVoter.nombres)},%20te%20saluda%20el%20equipo%20de%20campa%C3%B1a.%20Recuerda%20que%20tu%20puesto%20es%20${encodeURIComponent(currentVoter.lugar_votacion || '')}%20Mesa%20${encodeURIComponent(currentVoter.mesa || '1')}.%20%C2%A1Te%20esperamos!`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-700/40 hover:bg-emerald-700/60 text-emerald-300 border border-emerald-500/40 font-bold rounded-xl text-xs transition"
                            >
                                <MessageSquare className="w-4 h-4" />
                                <span>WhatsApp</span>
                            </a>
                        </div>
                    </div>

                    {/* Guión Telefónico y Tipificación Rápida (Col 7) */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* Guión Dinámico en Pantalla */}
                        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                                    <Sparkles className="w-4 h-4" />
                                    <span>Guión Recomendado de Movilización</span>
                                </div>
                                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/40">
                                    Paso a Paso
                                </span>
                            </div>

                            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/60 text-xs text-slate-200 leading-relaxed space-y-2">
                                <p>
                                    🗣️ <strong>Saludo:</strong> <em>"Hola buenos días/tardes, ¿hablo con {currentVoter.nombres}? Te saluda el equipo de apoyo de la campaña..."</em>
                                </p>
                                <p>
                                    🗳️ <strong>Recordatorio de Mesa:</strong> <em>"Te llamamos para recordarte que tu mesa asignada es la <strong>Mesa {currentVoter.mesa || '1'}</strong> en <strong>{currentVoter.lugar_votacion || 'tu puesto habitual'}</strong>."</em>
                                </p>
                                <p>
                                    🚖 <strong>Pregunta Clave GOTV:</strong> <em>"¿Ya lograste votar o necesitas que te enviemos un vehículo de apoyo para acercarte al colegio?"</em>
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Notas u Observación del Operador</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Dijo que va a las 2:00 PM con su hermano..."
                                    value={notasLlamada}
                                    onChange={e => setNotasLlamada(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500"
                                />
                            </div>
                        </div>

                        {/* Botones de Tipificación en 1 Toque */}
                        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-3">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                                Tipificación del Resultado (1 Clic)
                            </span>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                <button
                                    onClick={() => handleTipificar('confirmo_voto')}
                                    disabled={submitting}
                                    className="p-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95"
                                >
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                    <span>Confirmó Voto Seguro</span>
                                </button>

                                <button
                                    onClick={() => handleTipificar('requiere_transporte')}
                                    disabled={submitting}
                                    className="p-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95"
                                >
                                    <Truck className="w-5 h-5 text-amber-400" />
                                    <span>Requiere Transporte</span>
                                </button>

                                <button
                                    onClick={() => handleTipificar('indeciso')}
                                    disabled={submitting}
                                    className="p-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/50 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95"
                                >
                                    <AlertCircle className="w-5 h-5 text-blue-400" />
                                    <span>Indeciso / Por Visitar</span>
                                </button>

                                <button
                                    onClick={() => handleTipificar('no_contesta')}
                                    disabled={submitting}
                                    className="p-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95"
                                >
                                    <PhoneOff className="w-5 h-5 text-slate-400" />
                                    <span>No Contesta / Buzón</span>
                                </button>

                                <button
                                    onClick={() => handleTipificar('numero_equivocado')}
                                    disabled={submitting}
                                    className="p-3 bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/50 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95"
                                >
                                    <RotateCcw className="w-5 h-5 text-orange-400" />
                                    <span>Número Equivocado</span>
                                </button>

                                <button
                                    onClick={() => handleTipificar('en_contra')}
                                    disabled={submitting}
                                    className="p-3 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/50 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95"
                                >
                                    <PhoneOff className="w-5 h-5 text-red-400" />
                                    <span>En Contra / Oposición</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-12 text-center space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                    <h3 className="text-lg font-bold text-white">¡No hay más votantes en cola de llamadas!</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Has completado la lista de contactos para los filtros actuales. Puedes ajustar los filtros de puesto o refrescar la lista.
                    </p>
                    <button
                        onClick={fetchNextVoter}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
                    >
                        Volver a Verificar Cola
                    </button>
                </div>
            )}

            {/* MODAL PROGRAMAR TRANSPORTE INMEDIATO */}
            {showTransporteModal && currentVoter && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                            <h3 className="font-bold text-white text-base flex items-center gap-2">
                                <Truck className="w-5 h-5 text-amber-400" />
                                <span>Confirmar Transporte para Votante</span>
                            </h3>
                            <button onClick={() => setShowTransporteModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <div className="text-xs text-slate-300 space-y-2">
                            <p>Se creará automáticamente una orden de recogida en la central de flota:</p>
                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 space-y-1">
                                <div><strong>Pasajero:</strong> {currentVoter.nombres} {currentVoter.apellidos}</div>
                                <div><strong>Destino:</strong> {currentVoter.lugar_votacion || 'Puesto asignado'}</div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Dirección Exacta de Recogida *</label>
                                <input
                                    type="text"
                                    required
                                    value={direccionRecogida}
                                    onChange={e => setDireccionRecogida(e.target.value)}
                                    placeholder="Calle, número, barrio o punto de referencia..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                            <button
                                onClick={() => setShowTransporteModal(false)}
                                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-xs"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmarTransporte}
                                disabled={submitting || !direccionRecogida.trim()}
                                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs shadow-lg"
                            >
                                Confirmar y Despachar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
