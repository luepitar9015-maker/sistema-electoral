import React, { useState } from 'react';
import axios from 'axios';
import { 
    Palette, Sparkles, Image, Check, X, Flag, User, 
    Save, RefreshCw, Sliders, Type, ExternalLink
} from 'lucide-react';
import { API } from '../../config/api';

// Paletas preconfiguradas de partidos y movimientos políticos
const PARTIDOS_PRESETS = [
    {
        nombre: 'Partido Liberal / Progresista',
        partido: 'Partido Liberal Colombiano',
        color: '#EF4444', // Rojo
        badge: 'Rojo',
        esloganSugerido: '¡Libertad, Equidad y Justicia Social!'
    },
    {
        nombre: 'Partido Conservador',
        partido: 'Partido Conservador Colombiano',
        color: '#1D4ED8', // Azul Rey
        badge: 'Azul',
        esloganSugerido: '¡Orden, Tradición y Desarrollo Económico!'
    },
    {
        nombre: 'Alianza Verde',
        partido: 'Partido Alianza Verde',
        color: '#10B981', // Verde Esmeralda
        badge: 'Verde',
        esloganSugerido: '¡Esperanza, Transparencia y Sostenibilidad!'
    },
    {
        nombre: 'Centro Democrático',
        partido: 'Centro Democrático',
        color: '#0284C7', // Azul Celeste
        badge: 'Azul Claro',
        esloganSugerido: '¡Seguridad Democrática y Confianza Inversionista!'
    },
    {
        nombre: 'Polo / Nuevo Liberalismo',
        partido: 'Polo Democrático / Nuevo Liberalismo',
        color: '#F59E0B', // Amarillo / Dorado
        badge: 'Amarillo',
        esloganSugerido: '¡Unidos por los Derechos de la Gente!'
    },
    {
        nombre: 'Partido de la U / Mov. Ciudadano',
        partido: 'Partido de la U',
        color: '#F97316', // Naranja
        badge: 'Naranja',
        esloganSugerido: '¡Unidos Somos Más Fuertes por el País!'
    },
    {
        nombre: 'Pacto Histórico / Movimientos Sociales',
        partido: 'Pacto Histórico',
        color: '#8B5CF6', // Violeta / Púrpura
        badge: 'Púrpura',
        esloganSugerido: '¡El Poder de la Transformación Popular!'
    },
    {
        nombre: 'Movimiento Independiente / Ciudadano',
        partido: 'Movimiento Significativo de Ciudadanos',
        color: '#00B894', // Teal Verde Agua
        badge: 'Teal',
        esloganSugerido: '¡Cero Corrupción, 100% con la Comunidad!'
    }
];

export default function ModalPersonalizarMarca({ campaign, isOpen, onClose, onUpdated }) {
    if (!isOpen || !campaign) return null;

    const [form, setForm] = useState({
        candidato: campaign.candidato || '',
        partido_politico: campaign.partido_politico || '',
        eslogan: campaign.eslogan || '',
        color: campaign.color || '#00B894',
        logo_campana: campaign.logo_campana || '',
        foto_candidato: campaign.foto_candidato || '',
        descripcion: campaign.descripcion || ''
    });

    const [saving, setSaving] = useState(false);
    const token = localStorage.getItem('token');

    const handleSelectPreset = (preset) => {
        setForm(prev => ({
            ...prev,
            color: preset.color,
            partido_politico: preset.partido,
            eslogan: prev.eslogan || preset.esloganSugerido
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await axios.put(`${API}/campaigns/${campaign.id}`, form, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (onUpdated) {
                onUpdated(res.data.campaign || form);
            }
            onClose();
        } catch (err) {
            console.error('Error al actualizar marca de campaña:', err);
            alert('Error al guardar la personalización de marca');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-6 my-auto max-h-[92vh] overflow-y-auto">
                
                {/* Header Modal */}
                <div className="flex justify-between items-start pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div 
                            className="p-3 rounded-2xl text-white shadow-lg flex items-center justify-center transition-all"
                            style={{ backgroundColor: form.color }}
                        >
                            <Palette className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white flex items-center gap-2">
                                <span>Personalización de Partido, Marca e Identidad</span>
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Define los colores del partido, logo de campaña, eslogan oficial y foto del político
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 text-xs">

                    {/* Previsualización en Tiempo Real */}
                    <div className="p-4 rounded-2xl border border-slate-700 bg-slate-800/70 shadow-inner space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                            Vista Previa en Vivo (Encabezado y Barra Lateral)
                        </span>
                        <div 
                            className="p-4 rounded-xl text-white flex items-center gap-4 border shadow-xl relative overflow-hidden"
                            style={{ 
                                backgroundColor: '#1e293b', 
                                borderLeftWidth: '6px',
                                borderLeftColor: form.color 
                            }}
                        >
                            {form.logo_campana ? (
                                <img 
                                    src={form.logo_campana} 
                                    alt="Logo" 
                                    className="w-14 h-14 object-contain rounded-xl p-1 bg-white/10 border border-white/20 shadow-md shrink-0" 
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            ) : (
                                <div 
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg shrink-0"
                                    style={{ backgroundColor: form.color }}
                                >
                                    {form.candidato?.charAt(0) || 'C'}
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-black text-base text-white truncate">
                                        {form.candidato || 'Nombre del Político / Candidato'}
                                    </h3>
                                    <span 
                                        className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase text-white shadow"
                                        style={{ backgroundColor: form.color }}
                                    >
                                        {form.partido_politico || 'Partido Político'}
                                    </span>
                                </div>
                                <p className="text-slate-300 italic text-xs mt-1 truncate">
                                    "{form.eslogan || 'Tu eslogan oficial aquí...'}"
                                </p>
                            </div>

                            {form.foto_candidato && (
                                <img 
                                    src={form.foto_candidato} 
                                    alt="Foto Candidato" 
                                    className="w-12 h-12 object-cover rounded-full border-2 shadow-md hidden sm:block shrink-0"
                                    style={{ borderColor: form.color }}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Presets de Partidos Políticos de Colombia */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Flag className="w-3.5 h-3.5 text-indigo-400" />
                            <span>1. Seleccionar Partido Político (Colores Prediseñados 1-Clic)</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {PARTIDOS_PRESETS.map((preset, idx) => {
                                const isSelected = form.color === preset.color;
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleSelectPreset(preset)}
                                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                                            isSelected 
                                                ? 'bg-slate-800 border-white text-white shadow-lg ring-2 ring-white/30 scale-[1.02]' 
                                                : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                                        }`}
                                    >
                                        <div 
                                            className="w-4 h-4 rounded-full shadow shrink-0"
                                            style={{ backgroundColor: preset.color }}
                                        />
                                        <div className="min-w-0">
                                            <div className="font-bold text-[11px] truncate">{preset.badge}</div>
                                            <div className="text-[9px] text-slate-400 truncate">{preset.partido.split(' ')[0]}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Color Picker Personalizado */}
                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-slate-400" />
                            <span className="font-semibold text-slate-200">Color Primario Personalizado:</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={form.color}
                                onChange={e => setForm({ ...form, color: e.target.value })}
                                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                            />
                            <input
                                type="text"
                                value={form.color}
                                onChange={e => setForm({ ...form, color: e.target.value })}
                                className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-white text-xs"
                            />
                        </div>
                    </div>

                    {/* Datos del Político y Eslogan */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                                Nombre del Político / Candidato *
                            </label>
                            <input
                                type="text"
                                required
                                value={form.candidato}
                                onChange={e => setForm({ ...form, candidato: e.target.value })}
                                placeholder="Ej: Dr. Carlos Andrés Gómez"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                                Partido Político o Movimiento *
                            </label>
                            <input
                                type="text"
                                required
                                value={form.partido_politico}
                                onChange={e => setForm({ ...form, partido_politico: e.target.value })}
                                placeholder="Ej: Partido Conservador Colombiano"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Eslogan Oficial */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                            <Type className="w-3.5 h-3.5 text-amber-400" />
                            <span>Eslogan de Campaña o Gobierno *</span>
                        </label>
                        <input
                            type="text"
                            value={form.eslogan}
                            onChange={e => setForm({ ...form, eslogan: e.target.value })}
                            placeholder="Ej: ¡El Poder de la Transformación con la Gente!"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-semibold"
                        />
                    </div>

                    {/* Enlaces de Logo y Foto */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                                <Image className="w-3.5 h-3.5 text-indigo-400" />
                                <span>URL Logo de Campaña / Partido</span>
                            </label>
                            <input
                                type="url"
                                value={form.logo_campana}
                                onChange={e => setForm({ ...form, logo_campana: e.target.value })}
                                placeholder="https://ejemplo.com/logo.png"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                            />
                            <span className="text-[10px] text-slate-500 mt-1 block">
                                Se muestra en el menú lateral y en el encabezado
                            </span>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-purple-400" />
                                <span>URL Foto Oficial del Candidato / Político</span>
                            </label>
                            <input
                                type="url"
                                value={form.foto_candidato}
                                onChange={e => setForm({ ...form, foto_candidato: e.target.value })}
                                placeholder="https://ejemplo.com/foto_perfil.jpg"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                            />
                            <span className="text-[10px] text-slate-500 mt-1 block">
                                Fotografía oficial para el centro de mando
                            </span>
                        </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 active:scale-95"
                            style={{ backgroundColor: form.color }}
                        >
                            <Save className="w-4 h-4" />
                            <span>{saving ? 'Guardando...' : 'Aplicar Marca al Sistema'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
