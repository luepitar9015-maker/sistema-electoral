import { useState, useRef, useEffect } from 'react';
import { useCampaign } from '../../context/CampaignContext';
import { ChevronDown, Flag, Check, Plus, Globe, Building2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CampaignSelector() {
    const { campaigns, activeCampaign, setActiveCampaign } = useCampaign();
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getScopeIcon = (nivel) => {
        switch (nivel) {
            case 'nacional':
                return <Globe size={14} className="text-blue-400" />;
            case 'departamental':
                return <Building2 size={14} className="text-emerald-400" />;
            case 'municipal':
            default:
                return <MapPin size={14} className="text-amber-400" />;
        }
    };

    const getScopeLabel = (c) => {
        if (!c) return 'Global';
        if (c.nivel_territorial === 'nacional') return 'Nacional (Colombia)';
        if (c.nivel_territorial === 'departamental') return `${c.departamento}`;
        return `${c.municipio} (${c.departamento})`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2.5 bg-gray-800/90 hover:bg-gray-800 text-white px-3.5 py-1.5 rounded-full border border-gray-600/70 text-xs font-semibold shadow-inner transition-all group"
            >
                {activeCampaign?.foto_candidato ? (
                    <img
                        src={activeCampaign.foto_candidato}
                        alt={activeCampaign.candidato}
                        className="w-5 h-5 rounded-full object-cover border border-white/40 flex-shrink-0"
                    />
                ) : (
                    <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse"
                        style={{ backgroundColor: activeCampaign?.color || '#00B894' }}
                    />
                )}

                <div className="flex items-center gap-1.5 max-w-[240px] truncate text-left">
                    <span className="font-black text-gray-200 uppercase tracking-wider text-[11px] truncate">
                        {activeCampaign ? activeCampaign.nombre : 'TODAS LAS CAMPAÑAS'}
                    </span>
                    {activeCampaign && (
                        <span className="text-[10px] bg-gray-700/80 text-gray-300 px-1.5 py-0.5 rounded font-mono">
                            {activeCampaign.tipo_cargo.toUpperCase()}
                        </span>
                    )}
                </div>

                <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-[#1E232A] border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden py-2 text-xs backdrop-blur-md">
                    <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            CAMBIAR CAMPAÑA ACTIVA
                        </span>
                        <button
                            onClick={() => { setOpen(false); navigate('/campaigns'); }}
                            className="text-[#00B894] hover:underline font-bold text-[11px] flex items-center gap-1"
                        >
                            <Plus size={12} /> Nueva
                        </button>
                    </div>

                    {/* Opción Global */}
                    <button
                        onClick={() => { setActiveCampaign(null); setOpen(false); }}
                        className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-gray-800/80 transition-colors ${!activeCampaign ? 'bg-gray-800 text-[#00B894]' : 'text-gray-300'}`}
                    >
                        <div className="flex items-center gap-2.5">
                            <Flag size={14} className="text-gray-400" />
                            <div>
                                <p className="font-bold text-gray-200">Todas las Campañas</p>
                                <p className="text-[10px] text-gray-400">Vista consolidada global del sistema</p>
                            </div>
                        </div>
                        {!activeCampaign && <Check size={14} className="text-[#00B894]" />}
                    </button>

                    <div className="my-1 border-t border-gray-800/60" />

                    {/* Lista de Campañas */}
                    <div className="max-h-64 overflow-y-auto space-y-0.5">
                        {campaigns.map(camp => {
                            const isSelected = activeCampaign?.id === camp.id;
                            return (
                                <button
                                    key={camp.id}
                                    onClick={() => { setActiveCampaign(camp); setOpen(false); }}
                                    className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-gray-800/80 transition-colors ${isSelected ? 'bg-gray-800/90' : ''}`}
                                >
                                    <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                                        {camp.foto_candidato ? (
                                            <img
                                                src={camp.foto_candidato}
                                                alt={camp.candidato}
                                                className="w-6 h-6 rounded-full object-cover border border-gray-600 flex-shrink-0"
                                            />
                                        ) : (
                                            <div
                                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: camp.color || '#00B894' }}
                                            />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <p className="font-bold text-gray-100 truncate text-[11px]">{camp.nombre}</p>
                                                <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-gray-700/80 font-black text-gray-300">
                                                    {camp.tipo_cargo}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                                                {getScopeIcon(camp.nivel_territorial)}
                                                <span>{getScopeLabel(camp)}</span>
                                                <span className="text-gray-500">· {camp.candidato}</span>
                                            </p>
                                            {camp.eslogan && (
                                                <p className="text-[9px] text-emerald-400 italic truncate mt-0.5">
                                                    "{camp.eslogan}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {isSelected && <Check size={14} className="text-[#00B894] flex-shrink-0" />}
                                </button>
                            );
                        })}
                    </div>

                    <div className="p-2 border-t border-gray-800 mt-1">
                        <button
                            onClick={() => { setOpen(false); navigate('/campaigns'); }}
                            className="w-full text-center py-2 bg-gray-800 hover:bg-gray-750 text-gray-300 font-bold rounded-xl text-[11px] uppercase tracking-wider transition-colors"
                        >
                            Ver Módulo de Campañas
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
