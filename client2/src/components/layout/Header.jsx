import { Search, Mail, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCampaign } from '../../context/CampaignContext';
import CampaignSelector from './CampaignSelector';
import CampaignClock from '../common/CampaignClock';
import NotificationCenter from './NotificationCenter';

const Header = ({ onMenuClick }) => {
    const { user } = useAuth();
    const { activeCampaign } = useCampaign();

    return (
        <header className="h-16 bg-[#2D3436] border-b border-gray-700 flex items-center justify-between px-6 shadow-sm">

            {/* Left: Search Bar, Campaign Selector & Live Clock */}
            <div className="flex items-center gap-3.5 flex-1 max-w-3xl">
                <div className="relative w-full max-w-xs hidden xl:flex items-center">
                    <input
                        type="text"
                        placeholder="Buscar en el sistema..."
                        className="w-full bg-[#E0E0E0] text-gray-800 rounded-full py-1.5 pl-4 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-[#00B894]"
                    />
                    <button className="absolute right-2 p-1 bg-gray-600 rounded-full text-white hover:bg-[#00B894] transition-colors">
                        <Search size={12} />
                    </button>
                </div>

                {/* Selector de Campaña Activa */}
                <CampaignSelector />

                {/* Reloj Oficial de la Campaña */}
                {activeCampaign && (
                    <CampaignClock campaign={activeCampaign} mode="compact" />
                )}
            </div>

            {/* Right: User/Notifications */}
            <div className="flex items-center space-x-6">
                <NotificationCenter />
                <div className="text-right hidden sm:block">
                    <div className="text-white font-bold text-sm uppercase leading-none">
                        {user?.email?.split('@')[0] || 'USUARIO'}
                    </div>
                    <span className="text-[10px] text-[#00B894] font-bold uppercase tracking-widest">
                        {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </span>
                </div>
            </div>
        </header>
    );
};

export default Header;
