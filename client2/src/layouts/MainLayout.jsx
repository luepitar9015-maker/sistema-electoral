import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MainLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-800 text-white flex-shrink-0 hidden md:flex flex-col">
                <div className="p-4 text-2xl font-bold border-b border-slate-700">
                    Electoral App
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link to="/dashboard" className="block px-4 py-2 rounded hover:bg-slate-700">Dashboard</Link>
                    <Link to="/register" className="block px-4 py-2 rounded hover:bg-slate-700">Registrar Votante</Link>
                    <Link to="/reports" className="block px-4 py-2 rounded hover:bg-slate-700">Informes</Link>
                    {user?.role === 'admin' && (
                        <Link to="/users" className="block px-4 py-2 rounded hover:bg-slate-700">Gestionar Usuarios</Link>
                    )}
                </nav>
                <div className="p-4 border-t border-slate-700">
                    <div className="text-sm text-slate-400 mb-2">Logueado como: {user?.email}</div>
                    <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 py-2 rounded text-sm transition">
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Mobile Header & Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow md:hidden flex justify-between items-center p-4">
                    <div className="text-xl font-bold">Electoral App</div>
                    <button onClick={handleLogout} className="text-red-600 text-sm">Salir</button>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
