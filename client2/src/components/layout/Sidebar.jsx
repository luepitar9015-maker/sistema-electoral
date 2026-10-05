import { useState } from 'react';
import {
    LayoutDashboard, Users, FileText, UserPlus, LogOut,
    Search, User as UserIcon, Circle, ChevronRight, List, Database, Flag,
    MessageSquare, Sparkles, CalendarDays, Share2, Vote, Compass, Calculator,
    Truck, Headphones, Building2
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Menú dinámico basado en los roles y módulos existentes
    const menuItems = [
        { icon: LayoutDashboard, label: 'INICIO',               path: '/dashboard' },
        { icon: Vote,           label: 'OPERACIÓN DÍA D',      path: '/dia-d',       badge: 'GOTV' },
        { icon: Truck,          label: 'FLOTA Y TRANSPORTE',   path: '/logistica',   badge: 'LOGÍSTICA' },
        { icon: Headphones,     label: 'CALL CENTER GOTV',     path: '/callcenter',  badge: 'EN VIVO' },
        { icon: Compass,        label: 'MAPA TERRITORIAL',     path: '/territorio',  badge: 'GIS' },
        { icon: Building2,      label: 'BANCO NECESIDADES',    path: '/necesidades', badge: 'IA / 4 AÑOS' },
        { icon: Calculator,     label: 'SIMULADOR CURULES',    path: '/simulador' },
        { icon: CalendarDays,   label: 'REUNIONES Y AGENDA',   path: '/meetings', badge: 'EVENTOS' },
        { icon: Share2,         label: 'REDES SOCIALES',       path: '/social',   badge: 'EN VIVO' },
        { icon: Flag,            label: 'CAMPAÑAS',             path: '/campaigns' },
        { icon: MessageSquare,   label: 'AGENTE WHATSAPP',      path: '/whatsapp', badge: 'IA' },
        { icon: UserPlus,        label: 'REGISTRO',             path: '/register'  },
        { icon: List,            label: 'VOTANTES',             path: '/voters'    },
        { icon: Database,        label: 'CENSO / PUESTOS',      path: '/censo'     },
        { icon: FileText,        label: 'INFORMES',             path: '/reports'   },
    ];

    // Módulo de usuarios para superadmin y admin
    if (user?.role === 'superadmin' || user?.role === 'admin') {
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
            case 'candidato':
                return 'CANDIDATO DE CAMPAÑA';
            case 'gerente':
                return 'GERENTE DE CAMPAÑA';
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
            {/* Perfil de Usuario */}
            <div className="p-6 flex flex-col items-center border-b border-gray-700/50">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00B894] to-emerald-800 rounded-2xl flex items-center justify-center mb-2.5 text-white font-black text-xl shadow-lg">
                    {user?.nombre?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h3 className="text-[#00B894] font-bold text-base text-center leading-tight">
                    {user?.nombre || user?.email?.split('@')[0].toUpperCase()}
                </h3>
                <span className="text-[9px] font-black uppercase tracking-wider bg-gray-800 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full mt-1.5 text-center">
                    {getRoleBadge(user?.role)}
                </span>
            </div>

            {/* Navegación */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                <div className="mb-3 px-4 flex items-center justify-between text-[#00B894]">
                    <span className="text-[10px] font-black uppercase tracking-widest">Módulos del Sistema</span>
                    <Circle size={7} fill="currentColor" />
                </div>

                {menuItems.map((item, index) => (
                    <Link
                        key={index}
                        to={item.path}
                        className={`flex items-center justify-between px-4 py-3 border-l-4 transition-all group ${isActive(item.path)
                                ? 'border-[#00B894] bg-gray-800 text-white'
                                : 'border-transparent hover:bg-gray-800 hover:border-gray-600'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <item.icon size={18} className={isActive(item.path) ? 'text-[#00B894]' : 'text-gray-400 group-hover:text-white'} />
                            <span className="font-bold text-sm tracking-wide">{item.label}</span>
                        </div>
                        {isActive(item.path) && <ChevronRight size={14} className="text-[#00B894]" />}
                    </Link>
                ))}
            </nav>

            {/* Buscador Inferior y Botón Salir */}
            <div className="p-6 space-y-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="w-full bg-[#E0E0E0] text-gray-800 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B894]"
                    />
                    <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 bg-gray-600 rounded-full text-white hover:bg-[#00B894] transition-colors">
                        <Search size={12} />
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
