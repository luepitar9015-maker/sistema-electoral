import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCampaign } from '../context/CampaignContext';
import {
    Users as UsersIcon, UserPlus, Shield, ShieldCheck,
    Edit3, Trash2, X, Check, Lock, Mail, Phone,
    Building2, Search, AlertCircle, Sparkles, KeyRound
} from 'lucide-react';
import { API } from '../config/api';

const ROLES_INFO = [
    {
        id: 'superadmin',
        label: 'Superusuario / Soporte Técnico',
        desc: 'Acceso irrestricto al sistema, configuración técnica, soporte y administración global.',
        color: 'bg-purple-100 text-purple-800 border-purple-300'
    },
    {
        id: 'candidato',
        label: 'Candidato de la Campaña',
        desc: 'Supervisión ejecutiva de su campaña, avances, cumplimiento de metas de votantes y agenda de reuniones.',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    },
    {
        id: 'gerente',
        label: 'Gerente de Campaña',
        desc: 'Gestión integral operativa de la campaña, líderes, agenda y reportes.',
        color: 'bg-blue-100 text-blue-800 border-blue-300'
    },
    {
        id: 'coordinador_zonal',
        label: 'Coordinador Zonal / Comunal',
        desc: 'Coordina y supervisa a los líderes territoriales de una comuna o subregión. Gestiona la movilización y el seguimiento electoral zonal.',
        color: 'bg-indigo-100 text-indigo-800 border-indigo-300'
    },
    {
        id: 'comunicaciones_prensa',
        label: 'Comunicaciones, Prensa & Redes',
        desc: 'Manejo de contenidos en redes sociales, WhatsApp masivo, agenda de medios y generación de discursos estratégicos sin acceso a datos privados de votantes.',
        color: 'bg-pink-100 text-pink-800 border-pink-300'
    },
    {
        id: 'testigo_electoral',
        label: 'Testigo Electoral / Jurado Día D',
        desc: 'Auditoría en mesas de votación el Día D, verificación del formulario E-14 y reporte de transmisión de votos y alertas de fraude.',
        color: 'bg-amber-100 text-amber-800 border-amber-300'
    },
    {
        id: 'orador',
        label: 'Orador Delegado',
        desc: 'Preside reuniones delegadas, visualiza lugares y agenda, da inicio oficial a las reuniones y carga evidencias fotográficas.',
        color: 'bg-rose-100 text-rose-800 border-rose-300'
    },
    {
        id: 'lider_avanzada',
        label: 'Líder de Avanzada / Logística',
        desc: 'Coordina la agenda logística territorial por grupos de avanzada y carga las bases de datos de asistentes de cada reunión.',
        color: 'bg-cyan-100 text-cyan-800 border-cyan-300'
    },
    {
        id: 'apoyo_bd',
        label: 'Apoyo de Bases de Datos',
        desc: 'Carga masiva de Excel, digitación y depuración de votantes y líderes.',
        color: 'bg-teal-100 text-teal-800 border-teal-300'
    },
    {
        id: 'lider',
        label: 'Líder Territorial',
        desc: 'Registro y seguimiento exclusivo de sus votantes asignados.',
        color: 'bg-gray-100 text-gray-800 border-gray-300'
    }
];

export default function Users() {
    const { user: currentUser } = useAuth();
    const { campaigns } = useCampaign();
    const token = localStorage.getItem('token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('todos');
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    const [form, setForm] = useState({
        nombre: '',
        email: '',
        telefono: '',
        password: '',
        role: 'apoyo_bd',
        campana_id: '',
        activo: true
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/users`, authHeaders);
            setUsers(res.data);
        } catch (err) {
            console.error('Error al cargar usuarios:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const openCreateModal = () => {
        setEditingUser(null);
        setForm({
            nombre: '',
            email: '',
            telefono: '',
            password: '',
            role: 'apoyo_bd',
            campana_id: '',
            activo: true
        });
        setFormError('');
        setFormSuccess('');
        setModalOpen(true);
    };

    const openEditModal = (u) => {
        setEditingUser(u);
        setForm({
            nombre: u.nombre || '',
            email: u.email,
            telefono: u.telefono || '',
            password: '',
            role: u.role || 'apoyo_bd',
            campana_id: u.campana_id || '',
            activo: u.activo !== false
        });
        setFormError('');
        setFormSuccess('');
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError('');

        try {
            if (editingUser) {
                await axios.put(`${API}/users/${editingUser.id}`, form, authHeaders);
            } else {
                await axios.post(`${API}/users`, form, authHeaders);
            }
            await fetchUsers();
            setModalOpen(false);
        } catch (err) {
            setFormError(err.response?.data?.message || 'Error al guardar usuario');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, email) => {
        if (!window.confirm(`¿Estás seguro de eliminar el usuario "${email}"?`)) return;
        try {
            await axios.delete(`${API}/users/${id}`, authHeaders);
            await fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al eliminar usuario');
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = [u.nombre, u.email, u.telefono].some(val =>
            val && val.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const matchesRole = roleFilter === 'todos' || u.role === roleFilter || (roleFilter === 'superadmin' && u.role === 'admin');
        return matchesSearch && matchesRole;
    });

    return (
        <div className="max-w-6xl mx-auto space-y-6">

            {/* Header del Módulo */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl text-indigo-400">
                        <ShieldCheck size={30} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-wide uppercase">
                            Roles y Usuarios del Sistema Electoral
                        </h1>
                        <p className="text-gray-300 text-xs mt-0.5">
                            Control de accesos: Superusuario / Soporte, Candidato de Campaña, Gerente de Campaña y Apoyo de Bases de Datos.
                        </p>
                    </div>
                </div>

                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-[#00B894] hover:bg-[#00a884] text-white px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                    <UserPlus size={18} />
                    <span>Crear Nuevo Usuario</span>
                </button>
            </div>

            {/* Tarjetas de Explicación de Roles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {ROLES_INFO.filter(r => r.id !== 'lider').map(r => (
                    <div key={r.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1.5">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${r.color} inline-block`}>
                            {r.label.split('/')[0]}
                        </span>
                        <p className="text-xs font-bold text-slate-800">{r.label}</p>
                        <p className="text-[11px] text-gray-500 leading-tight">{r.desc}</p>
                    </div>
                ))}
            </div>

            {/* Filtros y Buscador */}
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, correo o teléfono..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#00B894]"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto text-xs font-bold">
                    <button
                        onClick={() => setRoleFilter('todos')}
                        className={`px-3 py-1.5 rounded-xl transition-all ${roleFilter === 'todos' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        Todos ({users.length})
                    </button>
                    <button
                        onClick={() => setRoleFilter('superadmin')}
                        className={`px-3 py-1.5 rounded-xl transition-all ${roleFilter === 'superadmin' ? 'bg-purple-700 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        Superusuario
                    </button>
                    <button
                        onClick={() => setRoleFilter('candidato')}
                        className={`px-3 py-1.5 rounded-xl transition-all ${roleFilter === 'candidato' ? 'bg-emerald-700 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        Candidato
                    </button>
                    <button
                        onClick={() => setRoleFilter('gerente')}
                        className={`px-3 py-1.5 rounded-xl transition-all ${roleFilter === 'gerente' ? 'bg-blue-700 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        Gerente
                    </button>
                    <button
                        onClick={() => setRoleFilter('orador')}
                        className={`px-3 py-1.5 rounded-xl transition-all ${roleFilter === 'orador' ? 'bg-rose-700 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        Oradores
                    </button>
                    <button
                        onClick={() => setRoleFilter('lider_avanzada')}
                        className={`px-3 py-1.5 rounded-xl transition-all ${roleFilter === 'lider_avanzada' ? 'bg-cyan-700 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        Avanzada
                    </button>
                    <button
                        onClick={() => setRoleFilter('apoyo_bd')}
                        className={`px-3 py-1.5 rounded-xl transition-all ${roleFilter === 'apoyo_bd' ? 'bg-amber-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        Apoyo BD
                    </button>
                </div>
            </div>

            {/* Tabla de Usuarios */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="text-center py-16 text-gray-400 text-xs">Cargando usuarios...</div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 text-xs">No se encontraron usuarios coincidentes.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                                <tr>
                                    <th className="px-5 py-3.5">Usuario</th>
                                    <th className="px-4 py-3.5">Rol en el Sistema</th>
                                    <th className="px-4 py-3.5">Campaña Asignada</th>
                                    <th className="px-4 py-3.5">Contacto</th>
                                    <th className="px-4 py-3.5 text-center">Estado</th>
                                    <th className="px-4 py-3.5 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredUsers.map(u => {
                                    const roleObj = ROLES_INFO.find(r => r.id === u.role) || ROLES_INFO[0];
                                    const isSelf = currentUser?.id === u.id;

                                    return (
                                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                            {/* Avatar + Nombre + Email */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                                                        {u.nombre?.charAt(0) || u.email.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="font-bold text-slate-900">{u.nombre || u.email.split('@')[0]}</p>
                                                            {isSelf && (
                                                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">Tú</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-gray-400 font-mono">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Rol */}
                                            <td className="px-4 py-3.5">
                                                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${roleObj.color} inline-block`}>
                                                    {roleObj.label}
                                                </span>
                                            </td>

                                            {/* Campaña */}
                                            <td className="px-4 py-3.5">
                                                {u.campana ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: u.campana.color }} />
                                                        <div>
                                                            <p className="font-bold text-slate-800">{u.campana.nombre}</p>
                                                            <p className="text-[10px] text-gray-400 uppercase">{u.campana.candidato}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic text-[11px]">Acceso Global (Todas)</span>
                                                )}
                                            </td>

                                            {/* Contacto */}
                                            <td className="px-4 py-3.5 text-gray-600">
                                                {u.telefono ? (
                                                    <span className="font-mono text-xs">{u.telefono}</span>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>

                                            {/* Estado */}
                                            <td className="px-4 py-3.5 text-center">
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${u.activo !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                    {u.activo !== false ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>

                                            {/* Acciones */}
                                            <td className="px-4 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => openEditModal(u)}
                                                        className="p-1.5 text-gray-400 hover:text-slate-800 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Editar usuario"
                                                    >
                                                        <Edit3 size={15} />
                                                    </button>
                                                    {!isSelf && (
                                                        <button
                                                            onClick={() => handleDelete(u.id, u.email)}
                                                            className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                            title="Eliminar usuario"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Crear / Editar Usuario */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
                        {/* Header Modal */}
                        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-500/20 rounded-2xl text-indigo-300">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg uppercase tracking-wide">
                                        {editingUser ? 'Editar Usuario' : 'Nuevo Usuario del Sistema'}
                                    </h3>
                                    <p className="text-gray-300 text-xs">
                                        Asigna el rol y la campaña electoral correspondiente.
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-xl">
                                <X size={20} />
                            </button>
                        </div>

                        {formError && (
                            <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                                <AlertCircle size={15} />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                {/* Nombre */}
                                <div className="sm:col-span-2">
                                    <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">Nombre Completo *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej. Andrés Camilo Restrepo"
                                        value={form.nombre}
                                        onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-indigo-600"
                                    />
                                </div>

                                {/* Correo */}
                                <div>
                                    <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">Correo Electrónico *</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="usuario@campana.com"
                                        value={form.email}
                                        onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-indigo-600"
                                    />
                                </div>

                                {/* Teléfono */}
                                <div>
                                    <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">Teléfono / Celular</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. 3001234567"
                                        value={form.telefono}
                                        onChange={e => setForm(prev => ({ ...prev, telefono: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-indigo-600"
                                    />
                                </div>

                                {/* Contraseña */}
                                <div className="sm:col-span-2">
                                    <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                        {editingUser ? 'Nueva Contraseña (dejar en blanco para mantener actual)' : 'Contraseña de Acceso *'}
                                    </label>
                                    <input
                                        type="password"
                                        required={!editingUser}
                                        placeholder="Mínimo 6 caracteres"
                                        value={form.password}
                                        onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-indigo-600"
                                    />
                                </div>

                                {/* Selección del Rol */}
                                <div className="sm:col-span-2 space-y-2">
                                    <label className="block text-gray-700 font-bold text-xs uppercase">
                                        Rol y Nivel de Privilegios *
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {ROLES_INFO.map(r => (
                                            <button
                                                key={r.id}
                                                type="button"
                                                onClick={() => setForm(prev => ({ ...prev, role: r.id }))}
                                                className={`p-3 rounded-2xl border text-left transition-all ${form.role === r.id ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${r.color}`}>
                                                        {r.id}
                                                    </span>
                                                    {form.role === r.id && <Check size={14} className="text-indigo-600" />}
                                                </div>
                                                <p className="font-bold text-xs text-slate-800 mt-1.5 leading-tight">{r.label}</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{r.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Campaña Asociada */}
                                <div className="sm:col-span-2">
                                    <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                        Campaña Electoral Asignada
                                    </label>
                                    <select
                                        value={form.campana_id || ''}
                                        onChange={e => setForm(prev => ({ ...prev, campana_id: e.target.value }))}
                                        className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-indigo-600"
                                    >
                                        <option value="">-- ACCESO GLOBAL (O TODAS LAS CAMPAÑAS) --</option>
                                        {campaigns.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.nombre} [{c.tipo_cargo.toUpperCase()}] - Candidato: {c.candidato}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        * Para Superusuario se recomienda Acceso Global. Para candidatos o gerentes, selecciona su campaña.
                                    </p>
                                </div>
                            </div>

                            {/* Botones de Acción */}
                            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wider hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all"
                                >
                                    {submitting ? 'Guardando...' : editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
