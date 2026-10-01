import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, ArrowRight, ShieldCheck, LayoutDashboard } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Credenciales incorrectas. Verifique e intente de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto overflow-x-hidden font-sans">
            {/* Background Decorative Elements */}
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full -mr-64 -mt-64 blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full -ml-32 -mb-32 blur-[100px] pointer-events-none"></div>

            <div className="w-full max-w-md my-auto relative z-10 animate-in fade-in zoom-in duration-700">
                {/* Logo & Entity Name */}
                <div className="text-center mb-8 space-y-4">
                    <div className="inline-flex p-4 rounded-[1.8rem] bg-gradient-to-br from-indigo-500 to-blue-600 shadow-2xl shadow-indigo-500/30 mb-2">
                        <LayoutDashboard className="text-white w-10 h-10" />
                    </div>
                    <div>
                        <h1 className="text-white text-2xl font-black tracking-tighter uppercase leading-none">Sistema Electoral</h1>
                        <p className="text-indigo-400/60 font-black text-[9px] uppercase tracking-[0.2em] mt-2">Plataforma de Votación 2026</p>
                    </div>
                </div>

                {/* Login Card */}
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-black/50">
                    <div className="mb-8 text-center">
                        <h2 className="text-white text-lg font-bold mb-1">Bienvenido</h2>
                        <p className="text-slate-400 text-xs">Ingrese sus credenciales de acceso</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 text-white" autoComplete="off">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                    <User size={16} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    className="block w-full bg-slate-900/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-indigo-500/50 focus:bg-slate-900/80 transition-all font-bold text-slate-100 placeholder:text-slate-700 text-sm"
                                    placeholder="admin@sistema.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2 text-white">
                            <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">Contraseña</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                    <Lock size={16} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    className="block w-full bg-slate-900/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-indigo-500/50 focus:bg-slate-900/80 transition-all font-bold text-slate-100 placeholder:text-slate-700 font-mono text-sm"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-[10px] font-bold animate-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${loading ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Ingresar</span>
                                    <ArrowRight size={14} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2">
                        <ShieldCheck className="text-indigo-500/50" size={14} />
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Plataforma Segura</p>
                    </div>
                </div>

                <p className="text-center text-slate-700 text-[9px] font-black uppercase tracking-widest mt-6">
                    © 2026 Registraduría Nacional
                </p>
            </div>
        </div>
    );
};

export default Login;
