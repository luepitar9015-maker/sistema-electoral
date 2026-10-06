import React, { useState, useEffect, useRef } from 'react';
import { 
    Bell, 
    AlertTriangle, 
    Car, 
    Users, 
    FileText, 
    ShieldAlert, 
    ExternalLink, 
    Check, 
    RefreshCw, 
    Sparkles, 
    X,
    Radio
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../../config/api';
import { useCampaign } from '../../context/CampaignContext';

const NotificationCenter = () => {
    const { activeCampaign } = useCampaign();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('todas');
    const [readAlertIds, setReadAlertIds] = useState(() => {
        try {
            const saved = localStorage.getItem('electoral_read_alerts');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });
    const dropdownRef = useRef(null);

    // Cargar alertas desde el servidor
    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await axios.get(`${API}/notifications`, {
                headers,
                params: activeCampaign?.id ? { campana_id: activeCampaign.id } : {}
            });
            if (res.data && res.data.alerts) {
                setAlerts(res.data.alerts);
            }
        } catch (error) {
            console.error('Error cargando alertas de inteligencia:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
        // Polling discreto cada 45 segundos para monitoreo continuo
        const interval = setInterval(fetchAlerts, 45000);
        return () => clearInterval(interval);
    }, [activeCampaign?.id]);

    // Cerrar al hacer clic afuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Guardar leídos en localStorage
    const markAsRead = (id) => {
        if (!readAlertIds.includes(id)) {
            const updated = [...readAlertIds, id];
            setReadAlertIds(updated);
            localStorage.setItem('electoral_read_alerts', JSON.stringify(updated));
        }
    };

    const markAllAsRead = () => {
        const allIds = alerts.map(a => a.id);
        setReadAlertIds(allIds);
        localStorage.setItem('electoral_read_alerts', JSON.stringify(allIds));
    };

    // Navegar y resolver alerta
    const handleActionClick = (alert) => {
        markAsRead(alert.id);
        setIsOpen(false);
        if (alert.ruta) {
            navigate(alert.ruta);
        }
    };

    // Simular alerta entrante en vivo para pruebas operativas
    const handleSimulateAlert = () => {
        const simId = `sim-${Date.now()}`;
        const newSimAlert = {
            id: simId,
            categoria: 'escrutinio',
            nivel: 'critico',
            titulo: '🚨 Alerta Roja Escrutinio (Simulada)',
            mensaje: 'Puesto Comuna 13 - Mesa 8: Inconsistencia detectada entre Acta E-14 física (92 votos) y Transmisión Registraduría (18 votos). ¡Interponer reclamación inmediata!',
            fecha: new Date(),
            ruta: '/dia-d',
            accionTexto: 'Ver Auditor E-14'
        };
        setAlerts(prev => [newSimAlert, ...prev]);
        // Remover de leídos si estaba
        setReadAlertIds(prev => prev.filter(id => id !== simId));
    };

    // Filtros
    const unreadCount = alerts.filter(a => !readAlertIds.includes(a.id)).length;
    const hasCriticalUnread = alerts.some(a => !readAlertIds.includes(a.id) && a.nivel === 'critico');

    const filteredAlerts = alerts.filter(a => {
        if (filter === 'todas') return true;
        if (filter === 'criticas') return a.nivel === 'critico' || a.nivel === 'urgente';
        return a.categoria === filter;
    });

    const getIconForCategory = (categoria) => {
        switch (categoria) {
            case 'escrutinio':
                return <AlertTriangle size={18} className="text-red-400" />;
            case 'logistica':
                return <Car size={18} className="text-amber-400" />;
            case 'eventos':
                return <Users size={18} className="text-blue-400" />;
            case 'ciudadania':
                return <FileText size={18} className="text-emerald-400" />;
            case 'censo':
                return <ShieldAlert size={18} className="text-purple-400" />;
            default:
                return <Bell size={18} className="text-gray-400" />;
        }
    };

    const getNivelBadge = (nivel) => {
        switch (nivel) {
            case 'critico':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-950/80 text-red-300 border border-red-500/50 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
                    Crítico / E-14
                </span>;
            case 'urgente':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-500/50">
                    Urgente
                </span>;
            case 'preventivo':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-950/80 text-blue-300 border border-blue-500/50">
                    Preventivo
                </span>;
            default:
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">
                    Informativo
                </span>;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Botón de la Campana */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl text-gray-200 hover:text-white hover:bg-white/10 transition-all duration-200 focus:outline-none"
                title="Centro de Alertas Tempranas e Inteligencia Operativa"
            >
                <Bell size={21} className={`transition-transform duration-200 ${isOpen ? 'rotate-12 text-[#00B894]' : ''}`} />
                
                {unreadCount > 0 && (
                    <span className={`absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 text-[10px] font-extrabold text-white rounded-full flex items-center justify-center border-2 border-[#2D3436] shadow-lg ${
                        hasCriticalUnread 
                            ? 'bg-red-600 animate-pulse ring-2 ring-red-400/50' 
                            : 'bg-[#00B894]'
                    }`}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Panel Desplegable (Dropdown) */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-[420px] max-w-[92vw] bg-[#1E252B] border border-gray-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    
                    {/* Header del Panel */}
                    <div className="p-4 bg-gradient-to-r from-[#242C33] to-[#1E252B] border-b border-gray-700/80 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#00B894]/20 border border-[#00B894]/30 flex items-center justify-center text-[#00B894]">
                                <Radio size={16} className="animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                                    Alertas e Inteligencia
                                    {unreadCount > 0 && (
                                        <span className="px-1.5 py-0.2 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full border border-red-500/30">
                                            {unreadCount} nuevas
                                        </span>
                                    )}
                                </h3>
                                <p className="text-[11px] text-gray-400">
                                    Centro de Mando Día D y Gobernanza 365
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={fetchAlerts}
                                disabled={loading}
                                title="Actualizar alertas"
                                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <RefreshCw size={14} className={loading ? 'animate-spin text-[#00B894]' : ''} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Filtros por Categoría */}
                    <div className="px-4 py-2 bg-[#171D22] border-b border-gray-800 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
                        <button
                            type="button"
                            onClick={() => setFilter('todas')}
                            className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-all ${
                                filter === 'todas'
                                    ? 'bg-[#00B894] text-white shadow-sm'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                            }`}
                        >
                            Todas ({alerts.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter('criticas')}
                            className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-all ${
                                filter === 'criticas'
                                    ? 'bg-red-600 text-white shadow-sm'
                                    : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                            }`}
                        >
                            🚨 Urgentes
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter('escrutinio')}
                            className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-all ${
                                filter === 'escrutinio'
                                    ? 'bg-[#00B894] text-white'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                            }`}
                        >
                            E-14
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter('logistica')}
                            className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-all ${
                                filter === 'logistica'
                                    ? 'bg-[#00B894] text-white'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                            }`}
                        >
                            Logística
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter('eventos')}
                            className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-all ${
                                filter === 'eventos'
                                    ? 'bg-[#00B894] text-white'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                            }`}
                        >
                            Eventos
                        </button>
                    </div>

                    {/* Lista de Alertas */}
                    <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-800/80">
                        {filteredAlerts.length === 0 ? (
                            <div className="py-12 px-6 text-center text-gray-400">
                                <Check size={32} className="mx-auto text-emerald-400 mb-2 opacity-80" />
                                <p className="text-sm font-semibold text-gray-300">¡Todo bajo control!</p>
                                <p className="text-xs text-gray-500 mt-1">No hay alertas pendientes en esta categoría.</p>
                            </div>
                        ) : (
                            filteredAlerts.map((alert) => {
                                const isRead = readAlertIds.includes(alert.id);
                                return (
                                    <div
                                        key={alert.id}
                                        className={`p-3.5 transition-colors duration-150 hover:bg-white/[0.03] ${
                                            !isRead ? 'bg-white/[0.02]' : 'opacity-70'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 p-2 rounded-lg bg-black/30 border border-gray-700/60 shrink-0">
                                                {getIconForCategory(alert.categoria)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    {getNivelBadge(alert.nivel)}
                                                    <span className="text-[10px] text-gray-500">
                                                        {alert.fecha ? new Date(alert.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Reciente'}
                                                    </span>
                                                </div>

                                                <h4 className="text-xs font-bold text-gray-100 leading-snug">
                                                    {alert.titulo}
                                                </h4>

                                                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                                                    {alert.mensaje}
                                                </p>

                                                {/* Acciones de la alerta */}
                                                <div className="mt-2.5 flex items-center justify-between">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleActionClick(alert)}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#00B894]/20 hover:bg-[#00B894] text-[#00B894] hover:text-white border border-[#00B894]/40 rounded-lg text-[11px] font-semibold transition-all duration-150"
                                                    >
                                                        {alert.accionTexto || 'Resolver'}
                                                        <ExternalLink size={12} />
                                                    </button>

                                                    {!isRead && (
                                                        <button
                                                            type="button"
                                                            onClick={() => markAsRead(alert.id)}
                                                            className="text-[10px] text-gray-500 hover:text-gray-300 underline"
                                                        >
                                                            Marcar leída
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer con Acciones Globales */}
                    <div className="p-3 bg-[#171D22] border-t border-gray-800 flex items-center justify-between text-[11px]">
                        <button
                            type="button"
                            onClick={handleSimulateAlert}
                            className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 font-medium"
                            title="Simula una alerta de escrutinio E-14 para probar la reacción operativa"
                        >
                            <Sparkles size={13} />
                            Simular Alerta E-14
                        </button>

                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={markAllAsRead}
                                className="text-gray-400 hover:text-white font-medium hover:underline"
                            >
                                Marcar todas leídas
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
