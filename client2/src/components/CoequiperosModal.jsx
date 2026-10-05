import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../config/api';
import { 
    X, Users, Plus, Trash2, ArrowUpRight, ShieldCheck, 
    Network, Building2, MapPin, Globe, CheckCircle2, AlertCircle, Share2
} from 'lucide-react';

export default function CoequiperosModal({ campaign, isOpen, onClose, onUpdated }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [selectedHijoId, setSelectedHijoId] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const token = localStorage.getItem('token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        if (!isOpen || !campaign) return;
        fetchCoequiperos();
    }, [isOpen, campaign]);

    const fetchCoequiperos = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API}/campaigns/${campaign.id}/coequiperos`, authHeaders);
            setData(res.data);
            setSelectedHijoId('');
        } catch (err) {
            console.error('Error fetching coequiperos:', err);
            setError(err.response?.data?.message || 'Error al cargar la red de coequiperos');
        } finally {
            setLoading(false);
        }
    };

    const handleLinkCoequipero = async (e) => {
        e.preventDefault();
        if (!selectedHijoId) return;

        setActionLoading(true);
        try {
            await axios.post(`${API}/campaigns/${campaign.id}/coequiperos`, {
                hijo_campaign_id: selectedHijoId
            }, authHeaders);
            await fetchCoequiperos();
            if (onUpdated) onUpdated();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al vincular campaña coequipera');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnlink = async (hijoId, hijoNombre) => {
        if (!window.confirm(`¿Deseas desvincular a "${hijoNombre}" de esta red de coequiperos?`)) return;

        setActionLoading(true);
        try {
            await axios.delete(`${API}/campaigns/${campaign.id}/coequiperos/${hijoId}`, authHeaders);
            await fetchCoequiperos();
            if (onUpdated) onUpdated();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al desvincular coequipero');
        } finally {
            setActionLoading(false);
        }
    };

    if (!isOpen) return null;

    const totalVotantesRed = (data?.campanas_hijas || []).reduce((acc, c) => acc + (c.totalVoters || 0), 0);

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-4xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-teal-500/20 border border-teal-500/40 rounded-2xl text-teal-400">
                            <Network size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider bg-teal-500/30 text-teal-300 px-2 py-0.5 rounded-md border border-teal-500/40">
                                    Estructura Multinivel & Alianzas
                                </span>
                                <span className="text-xs text-slate-400 font-mono">
                                    {campaign?.candidato} ({campaign?.tipo_cargo})
                                </span>
                            </div>
                            <h3 className="font-black text-xl uppercase tracking-wide text-white mt-0.5">
                                Red de Coequiperos (Campañas Hijas & Aliadas)
                            </h3>
                            <p className="text-slate-300 text-xs">
                                Federación de campañas interelecciones (Senado ↔ Alcaldías ↔ Concejos) para sumar bases y fidelizar votos en 4 años.
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

                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                    {loading && (
                        <div className="py-16 text-center space-y-3">
                            <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-sm font-bold text-gray-500">Cargando red de coequiperos...</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-3">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {!loading && data && (
                        <>
                            {/* Si tiene campaña superior / padre */}
                            {data.campana_padre && (
                                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-white flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider block">
                                                Campaña Superior / Patrocinador Político
                                            </span>
                                            <h4 className="font-bold text-sm text-white">
                                                {data.campana_padre.nombre} — <span className="text-gray-300">{data.campana_padre.candidato}</span>
                                            </h4>
                                            <span className="text-[11px] text-gray-400 capitalize">
                                                Cargo superior: {data.campana_padre.tipo_cargo}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase bg-indigo-600/40 text-indigo-200 px-3 py-1 rounded-xl border border-indigo-500/40">
                                        Subordinada a Nivel Superior
                                    </span>
                                </div>
                            )}

                            {/* Tarjetas KPI de la Red */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                        Campaña Matriz
                                    </span>
                                    <h4 className="text-lg font-black text-slate-800 mt-1">
                                        {campaign.candidato}
                                    </h4>
                                    <span className="text-xs text-gray-500 font-medium">
                                        {campaign.tipo_cargo?.toUpperCase()} · {campaign.departamento || 'Nacional'}
                                    </span>
                                </div>

                                <div className="bg-teal-50 border border-teal-200 p-4 rounded-2xl">
                                    <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                                        Coequiperos Vinculados
                                    </span>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <h4 className="text-2xl font-black text-teal-900">
                                            {data.campanas_hijas?.length || 0}
                                        </h4>
                                        <span className="text-xs text-teal-700 font-bold">candidaturas aliadas</span>
                                    </div>
                                    <span className="text-[11px] text-teal-600 block mt-0.5">
                                        Alcaldías, Concejos y Asambleas
                                    </span>
                                </div>

                                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl">
                                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                                        Votantes Red de Coequiperos
                                    </span>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <h4 className="text-2xl font-black text-indigo-900">
                                            {totalVotantesRed.toLocaleString()}
                                        </h4>
                                        <span className="text-xs text-indigo-700 font-bold">inscritos en total</span>
                                    </div>
                                    <span className="text-[11px] text-indigo-600 block mt-0.5">
                                        Fuerza electoral combinada
                                    </span>
                                </div>
                            </div>

                            {/* Formulario Vincular Nuevo Coequipero */}
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                                <h4 className="font-black text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                                    <Plus size={16} className="text-teal-600" />
                                    Vincular Nueva Campaña Coequipera a esta Estructura
                                </h4>
                                <form onSubmit={handleLinkCoequipero} className="flex flex-col sm:flex-row gap-3">
                                    <select
                                        value={selectedHijoId}
                                        onChange={(e) => setSelectedHijoId(e.target.value)}
                                        className="flex-1 bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-teal-500"
                                        disabled={actionLoading || !data.campanas_disponibles || data.campanas_disponibles.length === 0}
                                    >
                                        <option value="">
                                            {data.campanas_disponibles && data.campanas_disponibles.length > 0
                                                ? '-- SELECCIONE UNA CAMPAÑA DISPONIBLE PARA VINCULAR --'
                                                : 'No hay más campañas disponibles en el sistema'}
                                        </option>
                                        {data.campanas_disponibles?.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.nombre} — {c.candidato} ({c.tipo_cargo.toUpperCase()}{c.municipio ? ` · ${c.municipio}` : ''})
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="submit"
                                        disabled={actionLoading || !selectedHijoId}
                                        className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
                                    >
                                        <Plus size={15} />
                                        <span>Vincular Coequipero</span>
                                    </button>
                                </form>
                            </div>

                            {/* Lista de Coequiperos Actuales */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-black text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
                                        <Users size={16} className="text-teal-600" />
                                        Campañas Coequiperas Vinculadas ({data.campanas_hijas?.length || 0})
                                    </h4>
                                    <span className="text-[11px] text-gray-500">
                                        Estructura activa para el cuatrienio
                                    </span>
                                </div>

                                {data.campanas_hijas && data.campanas_hijas.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {data.campanas_hijas.map(hijo => (
                                            <div
                                                key={hijo.id}
                                                className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:border-teal-300 transition-all space-y-3 relative overflow-hidden"
                                            >
                                                <div className="h-1.5 absolute top-0 left-0 right-0" style={{ backgroundColor: hijo.color || '#00B894' }} />
                                                
                                                <div className="flex items-start justify-between gap-3 pt-1">
                                                    <div>
                                                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 inline-block mb-1">
                                                            {hijo.tipo_cargo}
                                                        </span>
                                                        <h5 className="font-black text-slate-800 text-sm leading-snug">
                                                            {hijo.nombre}
                                                        </h5>
                                                        <p className="text-xs text-gray-500 font-bold mt-0.5">
                                                            Candidato: <span className="text-slate-700">{hijo.candidato}</span>
                                                        </p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleUnlink(hijo.id, hijo.nombre)}
                                                        disabled={actionLoading}
                                                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                                        title="Desvincular coequipero"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                    <div className="flex items-center gap-1 text-gray-500">
                                                        <MapPin size={12} className="text-gray-400" />
                                                        <span>{hijo.municipio || hijo.departamento || 'Nacional'}</span>
                                                    </div>
                                                    <span className="font-mono font-bold text-slate-800">
                                                        {hijo.totalVoters?.toLocaleString()} votantes
                                                    </span>
                                                </div>

                                                {/* Progreso de la campaña hija */}
                                                {hijo.meta_votos > 0 && (
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[10px] text-gray-400">
                                                            <span>Meta: {hijo.meta_votos.toLocaleString()}</span>
                                                            <span className="font-bold text-slate-700">{hijo.progressPercent}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full bg-teal-500"
                                                                style={{ width: `${Math.min(100, hijo.progressPercent)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center space-y-2">
                                        <Network className="mx-auto text-gray-300" size={32} />
                                        <p className="text-xs font-bold text-gray-500">
                                            No tienes campañas coequiperas vinculadas todavía.
                                        </p>
                                        <p className="text-[11px] text-gray-400 max-w-md mx-auto">
                                            Usa el selector superior para conectar candidatos a alcaldías, concejos o asambleas aliadas a tu candidatura.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Banner Estratégico Cuatrienio */}
                            <div className="p-4 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl text-teal-950 text-xs space-y-1">
                                <span className="font-black text-[11px] uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                                    <Share2 size={13} className="text-teal-600" />
                                    ¿Por qué es clave la Red de Coequiperos durante los 4 años?
                                </span>
                                <p className="text-[11px] leading-relaxed text-teal-900/90 font-medium">
                                    Permite a un Senador, Representante o Gobernador apalancar candidatos en elecciones regionales intermedias, sincronizar agendas territoriales y consolidar una estructura política sólida que se mantiene activa y leal hasta la siguiente reelección o salto a un cargo superior.
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
                    >
                        Cerrar Red
                    </button>
                </div>
            </div>
        </div>
    );
}
