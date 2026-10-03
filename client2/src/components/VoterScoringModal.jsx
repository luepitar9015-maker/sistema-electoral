import React, { useState, useEffect } from 'react';
import { Star, ShieldAlert, Phone, MapPin, MessageSquare, Plus, Clock, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';
import { API } from '../config/api';

export default function VoterScoringModal({ voter, onClose, onUpdated }) {
    if (!voter) return null;

    const [fidelidad, setFidelidad] = useState(voter.fidelidad_score || 3);
    const [intencion, setIntencion] = useState(voter.intencion_voto || 'probable');
    const [observaciones, setObservaciones] = useState(voter.observaciones_seguimiento || '');
    const [lat, setLat] = useState(voter.latitud || '');
    const [lng, setLng] = useState(voter.longitud || '');
    const [saving, setSaving] = useState(false);

    // Interacciones
    const [interactions, setInteractions] = useState([]);
    const [newInteraction, setNewInteraction] = useState({
        tipo: 'llamada',
        resultado: 'positivo',
        notas: ''
    });
    const [savingInteraction, setSavingInteraction] = useState(false);

    const token = localStorage.getItem('token');

    const fetchInteractions = async () => {
        try {
            const res = await fetch(`${API}/voters/${voter.id}/interactions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setInteractions(data || []);
            }
        } catch (e) {
            console.error('Error fetching interactions:', e);
        }
    };

    useEffect(() => {
        fetchInteractions();
    }, [voter.id]);

    const handleSaveScoring = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const res = await fetch(`${API}/voters/${voter.id}/scoring`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fidelidad_score: fidelidad,
                    intencion_voto: intencion,
                    observaciones_seguimiento: observaciones,
                    latitud: lat ? parseFloat(lat) : null,
                    longitud: lng ? parseFloat(lng) : null
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (onUpdated) onUpdated(data.voter);
                onClose();
            }
        } catch (e) {
            alert('Error al guardar scoring');
        } finally {
            setSaving(false);
        }
    };

    const handleAddInteraction = async (e) => {
        e.preventDefault();
        if (!newInteraction.notas.trim()) return;
        try {
            setSavingInteraction(true);
            const res = await fetch(`${API}/voters/${voter.id}/interactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newInteraction)
            });

            if (res.ok) {
                setNewInteraction({ tipo: 'llamada', resultado: 'positivo', notas: '' });
                fetchInteractions();
            }
        } catch (e) {
            alert('Error al registrar interacción');
        } finally {
            setSavingInteraction(false);
        }
    };

    const handleGetCurrentLocation = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLat(pos.coords.latitude.toFixed(6));
                    setLng(pos.coords.longitude.toFixed(6));
                },
                (err) => alert('No se pudo obtener la ubicación GPS: ' + err.message)
            );
        } else {
            alert('Geolocalización no soportada en este navegador');
        }
    };

    const scoreLabels = {
        1: { text: 'En Riesgo / Crítico', color: 'bg-red-500/20 text-red-400 border-red-500/40' },
        2: { text: 'Indeciso / Por Convencer', color: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
        3: { text: 'Simpatizante Moderado', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
        4: { text: 'Comprometido Fuerte', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
        5: { text: 'Militante / Voto Seguro', color: 'bg-emerald-600/30 text-emerald-300 border-emerald-400 font-bold' }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto text-slate-100">
                {/* Header */}
                <div className="flex justify-between items-start pb-3 border-b border-slate-700">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-white">{voter.nombres} {voter.apellidos}</h3>
                            <span className="text-xs font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-slate-300">
                                CC {voter.cedula}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            Puesto: <span className="text-amber-400 font-semibold">{voter.lugar_votacion || 'Sin asignar'}</span> | Mesa: {voter.mesa || '1'} | Líder: {voter.lider_nombre || 'Directo'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-1">✕</button>
                </div>

                {/* Scoring y Firmeza */}
                <form onSubmit={handleSaveScoring} className="space-y-4">
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/70 space-y-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                            Firmeza del Voto (Scoring 1 a 5)
                        </label>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setFidelidad(star)}
                                    className={`p-2 rounded-xl border flex-1 flex flex-col items-center transition ${
                                        fidelidad >= star
                                            ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                                            : 'bg-slate-800 border-slate-700 text-slate-600'
                                    }`}
                                >
                                    <Star className={`w-5 h-5 ${fidelidad >= star ? 'fill-amber-400' : ''}`} />
                                    <span className="text-[10px] font-bold mt-1">{star}</span>
                                </button>
                            ))}
                        </div>
                        <div className="text-xs text-center font-medium">
                            <span className={`px-2.5 py-1 rounded-full border inline-block ${scoreLabels[fidelidad]?.color}`}>
                                {scoreLabels[fidelidad]?.text}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Intención de Voto Declarada</label>
                            <select
                                value={intencion}
                                onChange={e => setIntencion(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
                            >
                                <option value="seguro">✅ Seguro por la campaña</option>
                                <option value="probable">🟡 Probable / Simpatiza</option>
                                <option value="dudoso">❓ Dudoso / Requiere contacto</option>
                                <option value="en_contra">❌ En contra / Otra campaña</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Geolocalización Hogar (GPS)</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Lat, Lng"
                                    value={lat && lng ? `${lat}, ${lng}` : ''}
                                    readOnly
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-300"
                                />
                                <button
                                    type="button"
                                    onClick={handleGetCurrentLocation}
                                    className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-lg border border-blue-500/40 text-xs flex items-center gap-1 font-semibold"
                                >
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>GPS</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Observaciones Estratégicas y Compromisos</label>
                        <textarea
                            rows="2"
                            placeholder="Ej: Asistió a la reunión del barrio, solicitó apoyo para vía comunal..."
                            value={observaciones}
                            onChange={e => setObservaciones(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white placeholder-slate-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm"
                        >
                            Cerrar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-sm shadow-lg"
                        >
                            {saving ? 'Guardando...' : 'Guardar Scoring'}
                        </button>
                    </div>
                </form>

                {/* Historial de Interacciones */}
                <div className="pt-4 border-t border-slate-700 space-y-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-indigo-400" />
                        <span>Historial de Contacto y Visitas ({interactions.length})</span>
                    </h4>

                    {/* Formulario rápida de nueva interacción */}
                    <form onSubmit={handleAddInteraction} className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60 flex flex-wrap gap-2 items-center">
                        <select
                            value={newInteraction.tipo}
                            onChange={e => setNewInteraction({ ...newInteraction, tipo: e.target.value })}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        >
                            <option value="llamada">📞 Llamada</option>
                            <option value="visita">🏡 Visita Hogar</option>
                            <option value="reunion">👥 Reunión</option>
                            <option value="whatsapp">💬 WhatsApp</option>
                            <option value="compromiso">🤝 Compromiso</option>
                        </select>

                        <select
                            value={newInteraction.resultado}
                            onChange={e => setNewInteraction({ ...newInteraction, resultado: e.target.value })}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        >
                            <option value="positivo">🟢 Positivo</option>
                            <option value="neutral">🟡 Neutral</option>
                            <option value="requiere_atencion">🟠 Requiere Atención</option>
                            <option value="negativo">🔴 Negativo</option>
                        </select>

                        <input
                            type="text"
                            placeholder="Detalle del contacto..."
                            value={newInteraction.notas}
                            onChange={e => setNewInteraction({ ...newInteraction, notas: e.target.value })}
                            className="flex-1 min-w-[200px] bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500"
                        />

                        <button
                            type="submit"
                            disabled={savingInteraction || !newInteraction.notas.trim()}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs disabled:opacity-50"
                        >
                            Registrar
                        </button>
                    </form>

                    {/* Timeline de interacciones */}
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                        {interactions.map(it => (
                            <div key={it.id} className="p-2.5 bg-slate-900/40 rounded-lg border border-slate-800 text-xs flex justify-between items-start gap-2">
                                <div>
                                    <span className="font-semibold text-white capitalize mr-2">{it.tipo}:</span>
                                    <span className="text-slate-300">{it.notas}</span>
                                    <div className="text-[10px] text-slate-500 mt-1">
                                        Por: {it.responsable?.email || 'Coordinador'} • {new Date(it.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    it.resultado === 'positivo' ? 'bg-emerald-500/20 text-emerald-400' :
                                    it.resultado === 'negativo' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                    {it.resultado}
                                </span>
                            </div>
                        ))}
                        {interactions.length === 0 && (
                            <div className="text-xs text-slate-500 text-center py-2">
                                No hay contactos previos registrados para este votante.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
