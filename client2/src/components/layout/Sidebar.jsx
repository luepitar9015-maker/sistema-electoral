import { useState } from 'react';
import {
    LayoutDashboard, Users, FileText, UserPlus, LogOut,
    Search, User as UserIcon, Circle, ChevronRight, List, Database, Flag,
    MessageSquare, Sparkles, CalendarDays, Share2, Vote, Compass, Calculator,
    Truck, Headphones, Building2, Landmark
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCampaign } from '../../context/CampaignContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { activeCampaign } = useCampaign();

    const primaryColor = activeCampaign?.color || '#00B894';

    // Módulos generales del sistema
    const allMenuItems = [
        { icon: LayoutDashboard, label: 'INICIO',               path: '/dashboard' },
        { icon: Landmark,       label: 'CASA POLÍTICA / MANDATO', path: '/gobernanza', badge: 'MANDATO' },
        { icon: Vote,           label: 'OPERACIÓN DÍA D',      path: '/dia-d',       badge: 'GOTV' },
        { icon: Truck,          label: 'FLOTA Y TRANSPORTE',   path: '/logistica',   badge: 'LOGÍSTICA' },
        { icon: Headphones,     label: 'CALL CENTER GOTV',     path: '/callcenter',  badge: 'EN VIVO' },
        { icon: Compass,        label: 'MAPA TERRITORIAL',     path: '/territorio',  badge: 'GIS' },
        { icon: Building2,      label: 'BANCO NECESIDADES',    path: '/necesidades', badge: 'IA / 4 AÑOS' },
        { icon: Landmark,       label: 'BANCO PROYECTOS & MGA', path: '/proyectos-mga', badge: 'MINISTERIOS' },
        { icon: Calculator,     label: 'SIMULADOR CURULES',    path: '/simulador' },
        { icon: CalendarDays,   label: 'REUNIONES Y AGENDA',   path: '/meetings',    badge: 'EVENTOS' },
        { icon: Share2,         label: 'REDES SOCIALES',       path: '/social',      badge: 'EN VIVO' },
        { icon: Flag,           label: 'CAMPAÑAS',             path: '/campaigns' },
        { icon: MessageSquare,  label: 'AGENTE WHATSAPP',      path: '/whatsapp',    badge: 'IA' },
        { icon: UserPlus,       label: 'REGISTRO',             path: '/register'  },
        { icon: List,           label: 'VOTANTES',             path: '/voters'    },
        { icon: Database,       label: 'CENSO / PUESTOS',      path: '/censo'     },
        { icon: FileText,       label: 'INFORMES',             path: '/reports'   },
    ];

    // Permisos de navegación por rol
    const ROLE_ALLOWED_PATHS = {
        superadmin: ['*'],
        admin: ['*'],
        director_estrategico: ['*'],
        candidato: ['*'],
        gerente: ['*'],
        coordinador_zonal: [
            '/dashboard', '/gobernanza', '/territorio', '/voters', '/register', 
            '/necesidades', '/proyectos-mga', '/meetings', '/dia-d', '/reports'
        ],
        comunicaciones_prensa: [
            '/dashboard', '/social', '/whatsapp', '/necesidades', '/meetings'
        ],
        testigo_electoral: [
            '/dia-d', '/censo'
        ],
        lider: [
            '/dashboard', '/register', '/voters', '/necesidades', '/proyectos-mga', '/meetings', '/reports'
        ],
        apoyo_bd: [
            '/dashboard', '/register', '/voters', '/censo', '/necesidades'
        ],
        orador: [
            '/dashboard', '/meetings', '/necesidades'
        ],
        lider_avanzada: [
            '/dashboard', '/meetings', '/logistica', '/necesidades'
        ]
    };

    const allowed = ROLE_ALLOWED_PATHS[user?.role] || ['/dashboard', '/gobernanza', '/voters', '/register'];
    const menuItems = allMenuItems.filter(item => {
        if (allowed.includes('*')) return true;
        return allowed.includes(item.path);
    });

    // Módulo de usuarios exclusivo para superadmin y admin
    if (user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'director_estrategico') {
        menuItems.push({ icon: Users, label: 'USUARIOS / ROLES', path: '/users' });
    }

    const isActive = (path) => location.pathname === path;

    const handleLogoutClick = () => {
        logout();
        navigate('/login');
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'superadmin':
            case 'admin':
                return 'SUPERUSUARIO / SOPORTE';
            case 'director_estrategico':
                return 'DIRECTOR ESTRATÉGICO & CASA POLÍTICA';
            case 'candidato':
                return 'CANDIDATO DE CAMPAÑA';
            case 'gerente':
                return 'GERENTE DE CAMPAÑA';
            case 'coordinador_zonal':
                return 'COORDINADOR ZONAL';
            case 'comunicaciones_prensa':
                return 'COMUNICACIONES & PRENSA';
            case 'testigo_electoral':
                return 'TESTIGO ELECTORAL (DÍA D)';
            case 'orador':
                return 'ORADOR DELEGADO';
            case 'lider_avanzada':
                return 'LÍDER DE AVANZADA';
            case 'apoyo_bd':
                return 'APOYO BASES DE DATOS';
            case 'lider':
                return 'LÍDER TERRITORIAL';
            default:
                return role?.toUpperCase() || 'USUARIO';
        }
    };

    return (
        <div className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-[#2D3436] text-gray-300 flex flex-col font-sans transition-transform duration-300 transform
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            md:relative md:translate-x-0
        `}>
            {/* Perfil de Usuario e Identidad de Campaña */}
            <div className="p-5 flex flex-col items-center border-b border-gray-700/60 bg-gray-900/40">
                {/* Logo de Campaña / Partido o Foto del Político */}
                <div className="relative mb-2">
                    {activeCampaign?.logo_campana ? (
                        <div className="w-16 h-16 rounded-2xl p-1 bg-white/10 border-2 shadow-xl flex items-center justify-center overflow-hidden" style={{ borderColor: primaryColor }}>
                            <img 
                                src={activeCampaign.logo_campana} 
                                alt="Logo Campaña" 
                                className="w-full h-full object-contain"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        </div>
                    ) : activeCampaign?.foto_candidato ? (
                        <div className="w-16 h-16 rounded-2xl border-2 shadow-xl overflow-hidden" style={{ borderColor: primaryColor }}>
                            <img 
                                src={activeCampaign.foto_candidato} 
                                alt="Foto Político" 
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        </div>
                    ) : (
                        <div 
                            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl transition-all"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {activeCampaign?.candidato?.charAt(0) || user?.nombre?.charAt(0) || 'C'}
                        </div>
                    )}

                    {/* Mini badge flotante con foto o partido si hay ambos */}
                    {activeCampaign?.foto_candidato && activeCampaign?.logo_campana && (
                        <img 
                            src={activeCampaign.foto_candidato} 
                            alt="Candidato" 
                            className="w-6 h-6 rounded-full border border-white absolute -bottom-1 -right-1 object-cover shadow"
                        />
                    )}
                </div>

                {/* Nombre de la Campaña / Candidato */}
                <h3 className="font-black text-sm text-white text-center leading-tight">
                    {activeCampaign?.candidato || activeCampaign?.nombre || 'SISTEMA ELECTORAL'}
                </h3>

                {/* Partido Político Badge Dinámico */}
                {activeCampaign?.partido_politico && (
                    <span 
                        className="text-[9px] font-black uppercase tracking-wider text-white px-2.5 py-0.5 rounded-full mt-1.5 text-center shadow-sm"
                        style={{ backgroundColor: primaryColor }}
                    >
                        {activeCampaign.partido_politico}
                    </span>
                )}

                {/* Eslogan Oficial */}
                {activeCampaign?.eslogan && (
                    <p className="text-[10px] text-gray-400 italic text-center mt-1 max-w-[200px] truncate leading-tight">
                        "{activeCampaign.eslogan}"
                    </p>
                )}

                {/* Rol del Usuario Logueado */}
                <span className="text-[9px] font-mono text-gray-500 uppercase mt-2">
                    {user?.nombre || user?.email?.split('@')[0]} • {getRoleBadge(user?.role)}
                </span>
            </div>

            {/* Navegación */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                <div className="mb-3 px-4 flex items-center justify-between" style={{ color: primaryColor }}>
                    <span className="text-[10px] font-black uppercase tracking-widest">Módulos del Sistema</span>
                    <Circle size={7} fill="currentColor" />
                </div>

                {menuItems.map((item, index) => {
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={index}
                            to={item.path}
                            className={`flex items-center justify-between px-4 py-3 border-l-4 transition-all group ${
                                active
                                    ? 'bg-gray-800 text-white shadow-sm'
                                    : 'border-transparent hover:bg-gray-800/60 hover:border-gray-600'
                            }`}
                            style={{ borderLeftColor: active ? primaryColor : 'transparent' }}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon 
                                    size={18} 
                                    className={`transition-colors ${active ? '' : 'text-gray-400 group-hover:text-white'}`}
                                    style={{ color: active ? primaryColor : undefined }}
                                />
                                <span className="font-bold text-sm tracking-wide">{item.label}</span>
                            </div>
                            {active && <ChevronRight size={14} style={{ color: primaryColor }} />}
                        </Link>
                    );
                })}
            </nav>

            {/* Buscador Inferior y Botón Salir */}
            <div className="p-5 space-y-3 border-t border-gray-700/40">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar en el sistema..."
                        className="w-full bg-[#1e293b] text-gray-200 border border-slate-700 rounded-full py-2 pl-4 pr-10 text-xs focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': primaryColor }}
                    />
                    <button 
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full text-white transition-colors"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <Search size={11} />
                    </button>
                </div>

                <button
                    onClick={handleLogoutClick}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-widest text-rose-400 hover:text-white hover:bg-rose-500/20 rounded transition-colors"
                >
                    <LogOut size={14} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
