import { useState } from 'react';
import axios from 'axios';
import { useCampaign } from '../context/CampaignContext';
import { colombiaData } from '../data/colombiaData';
import ApoyosManagerModal from '../components/ApoyosManagerModal';
import CampaignClock from '../components/common/CampaignClock';
import TermometroVictoriaModal from '../components/TermometroVictoriaModal';
import CoequiperosModal from '../components/CoequiperosModal';
import CompromisosGestionModal from '../components/CompromisosGestionModal';
import {
    Flag, Plus, Globe, Building2, MapPin, CheckCircle,
    Users, Target, Award, Calendar, Edit3, Trash2, X,
    ChevronRight, ArrowRight, Sparkles, Filter, Upload, Image,
    Quote, Handshake, Check, Clock, Flame, Network, Landmark, Shield
} from 'lucide-react';
import { API } from '../config/api';

const CARGOS = [
    { id: 'senado',      nombre: 'Senado de la República',       nivel: 'nacional',      desc: 'Circunscripción Nacional (Toda Colombia)', icon: Globe },
    { id: 'camara',      nombre: 'Cámara de Representantes',     nivel: 'departamental', desc: 'Circunscripción Departamental',            icon: Building2 },
    { id: 'gobernacion', nombre: 'Gobernación Departamental',    nivel: 'departamental', desc: 'Gobernador por Departamento',              icon: Building2 },
    { id: 'asamblea',    nombre: 'Asamblea Departamental',       nivel: 'departamental', desc: 'Diputados por Departamento',               icon: Building2 },
    { id: 'alcaldia',    nombre: 'Alcaldía Municipal',           nivel: 'municipal',     desc: 'Alcalde por Municipio o Distrito',        icon: MapPin },
    { id: 'concejo',     nombre: 'Concejo Municipal',            nivel: 'municipal',     desc: 'Concejales por Municipio',                 icon: MapPin },
];

export default function CampaignsPage() {
    const { campaigns, activeCampaign, setActiveCampaign, refreshCampaigns } = useCampaign();
    const token = localStorage.getItem('token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    const [filterNivel, setFilterNivel] = useState('todos'); // 'todos' | 'nacional' | 'departamental' | 'municipal'
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState(null);

    // Modals de Inteligencia & Gobernanza 4 Años
    const [selectedCampaignForApoyos, setSelectedCampaignForApoyos] = useState(null);
    const [selectedCampaignForTermometro, setSelectedCampaignForTermometro] = useState(null);
    const [selectedCampaignForCoequiperos, setSelectedCampaignForCoequiperos] = useState(null);
    const [selectedCampaignForCompromisos, setSelectedCampaignForCompromisos] = useState(null);

    // Formulario de Campaña
    const [formData, setFormData] = useState({
        nombre: '',
        tipo_cargo: 'alcaldia',
        departamento: '',
        municipio: '',
        candidato: '',
        partido_politico: '',
        numero_tarjeton: '',
        meta_votos: 50000,
        color: '#00B894',
        descripcion: '',
        eslogan: '',
        foto_candidato: '',
        logo_campana: '',
        fecha_inicio: '',
        fecha_elecciones: '',
        modo_operacion: 'electoral',
        periodo_gobierno: '2024-2027'
    });

    const [municipios, setMunicipios] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const openCreateModal = () => {
        setEditingCampaign(null);
        setFormData({
            nombre: '',
            tipo_cargo: 'alcaldia',
            departamento: '',
            municipio: '',
            candidato: '',
            partido_politico: '',
            numero_tarjeton: '',
            meta_votos: 50000,
            color: '#00B894',
            descripcion: '',
            eslogan: '',
            foto_candidato: '',
            logo_campana: '',
            fecha_inicio: new Date().toISOString().split('T')[0],
            fecha_elecciones: '2026-10-25',
            modo_operacion: 'electoral',
            periodo_gobierno: '2024-2027'
        });
        setMunicipios([]);
        setFormError('');
        setModalOpen(true);
    };

    const openEditModal = (camp) => {
        setEditingCampaign(camp);
        setFormData({
            nombre: camp.nombre,
            tipo_cargo: camp.tipo_cargo,
            departamento: camp.departamento || '',
            municipio: camp.municipio || '',
            candidato: camp.candidato,
            partido_politico: camp.partido_politico || '',
            numero_tarjeton: camp.numero_tarjeton || '',
            meta_votos: camp.meta_votos || 0,
            color: camp.color || '#00B894',
            descripcion: camp.descripcion || '',
            eslogan: camp.eslogan || '',
            foto_candidato: camp.foto_candidato || '',
            logo_campana: camp.logo_campana || '',
            fecha_inicio: camp.fecha_inicio ? camp.fecha_inicio.split(' ')[0] : '',
            fecha_elecciones: camp.fecha_elecciones ? camp.fecha_elecciones.split(' ')[0] : '',
            modo_operacion: camp.modo_operacion || 'electoral',
            periodo_gobierno: camp.periodo_gobierno || '2024-2027'
        });
        if (camp.departamento && colombiaData[camp.departamento]) {
            setMunicipios(colombiaData[camp.departamento]?.sort() || []);
        } else {
            setMunicipios([]);
        }
        setFormError('');
        setModalOpen(true);
    };

    const handleCargoChange = (cargoId) => {
        const selected = CARGOS.find(c => c.id === cargoId);
        setFormData(prev => ({
            ...prev,
            tipo_cargo: cargoId,
            departamento: selected?.nivel === 'nacional' ? 'COLOMBIA (NACIONAL)' : prev.departamento,
            municipio: selected?.nivel === 'nacional' || selected?.nivel === 'departamental' ? '' : prev.municipio
        }));
    };

    const handleDeptoChange = (depto) => {
        setFormData(prev => ({ ...prev, departamento: depto, municipio: '' }));
        if (depto && colombiaData[depto]) {
            setMunicipios(colombiaData[depto]?.sort() || []);
        } else {
            setMunicipios([]);
        }
    };

    const handleImageUpload = (e, field) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            alert('La imagen no puede exceder los 5MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = (uploadEvt) => {
            setFormData(prev => ({ ...prev, [field]: uploadEvt.target.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError('');

        try {
            const payload = { ...formData };
            if (!payload.nombre || !payload.nombre.trim()) {
                const cargoObj = CARGOS.find(c => c.id === payload.tipo_cargo);
                payload.nombre = `${cargoObj?.nombre || 'Campaña'} - ${payload.candidato || 'Oficial'}`;
            }

            if (editingCampaign) {
                await axios.put(`${API}/campaigns/${editingCampaign.id}`, payload, authHeaders);
            } else {
                await axios.post(`${API}/campaigns`, payload, authHeaders);
            }
            await refreshCampaigns();
            setModalOpen(false);
        } catch (error) {
            setFormError(error.response?.data?.message || 'Error al guardar la campaña');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, nombre) => {
        if (!window.confirm(`¿Estás seguro de eliminar la campaña "${nombre}"? Los votantes asociados no se borrarán, solo quedarán desvinculados.`)) {
            return;
        }
        try {
            await axios.delete(`${API}/campaigns/${id}`, authHeaders);
            await refreshCampaigns();
            if (activeCampaign?.id === id) {
                setActiveCampaign(null);
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Error al eliminar campaña');
        }
    };

    const filteredCampaigns = campaigns.filter(c => {
        if (filterNivel === 'todos') return true;
        return c.nivel_territorial === filterNivel;
    });

    const currentCargoObj = CARGOS.find(c => c.id === formData.tipo_cargo) || CARGOS[0];

    return (
        <div className="max-w-6xl mx-auto space-y-6">

            {/* Header del Módulo */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-[#00B894]/20 border border-[#00B894]/40 rounded-2xl text-[#00B894]">
                        <Flag size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-wide uppercase">Campañas Electorales y Candidaturas</h1>
                        <p className="text-gray-300 text-sm mt-0.5">
                            Gestión integral: Eslogan, Fotografía del Candidato, Segmentación Territorial y Directorio de Apoyos Políticos.
                        </p>
                    </div>
                </div>

                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-[#00B894] hover:bg-[#00a884] text-white px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                    <Plus size={18} />
                    <span>Crear Nueva Campaña</span>
                </button>
            </div>

            {/* Filtros por Nivel Territorial */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
                    <button
                        onClick={() => setFilterNivel('todos')}
                        className={`px-4 py-2 rounded-xl transition-all ${filterNivel === 'todos' ? 'bg-slate-900 text-white shadow' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        Todas ({campaigns.length})
                    </button>
                    <button
                        onClick={() => setFilterNivel('nacional')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${filterNivel === 'nacional' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Globe size={14} /> Nacional · Senado
                    </button>
                    <button
                        onClick={() => setFilterNivel('departamental')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${filterNivel === 'departamental' ? 'bg-emerald-600 text-white shadow' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Building2 size={14} /> Departamental · Cámara / Gob. / Asam.
                    </button>
                    <button
                        onClick={() => setFilterNivel('municipal')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${filterNivel === 'municipal' ? 'bg-amber-600 text-white shadow' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <MapPin size={14} /> Municipal · Alcaldía / Concejo
                    </button>
                </div>

                {activeCampaign && (
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span>Campaña activa:</span>
                        <span className="font-bold text-slate-800 bg-gray-100 px-3 py-1 rounded-xl border border-gray-200 flex items-center gap-2">
                            {activeCampaign.foto_candidato ? (
                                <img src={activeCampaign.foto_candidato} alt="Candidato" className="w-4 h-4 rounded-full object-cover" />
                            ) : (
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeCampaign.color }} />
                            )}
                            {activeCampaign.nombre}
                        </span>
                    </div>
                )}
            </div>

            {/* Cuadrícula de Campañas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCampaigns.map(camp => {
                    const isActive = activeCampaign?.id === camp.id;
                    const cargoObj = CARGOS.find(c => c.id === camp.tipo_cargo) || CARGOS[0];
                    const IconComponent = cargoObj.icon;

                    let scopeBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                    if (camp.nivel_territorial === 'departamental') scopeBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    if (camp.nivel_territorial === 'municipal') scopeBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';

                    return (
                        <div
                            key={camp.id}
                            className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-xl ${isActive ? 'border-2 border-[#00B894] ring-4 ring-[#00B894]/10' : 'border-gray-100 hover:border-gray-300'}`}
                        >
                            {/* Barra superior de color de campaña */}
                            <div className="h-2.5 w-full" style={{ backgroundColor: camp.color || '#00B894' }} />

                            <div className="p-6 space-y-4 flex-1">
                                {/* Encabezado: Foto de Candidato + Insignias */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        {camp.foto_candidato ? (
                                            <img
                                                src={camp.foto_candidato}
                                                alt={camp.candidato}
                                                className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-100 shadow-md flex-shrink-0"
                                            />
                                        ) : (
                                            <div
                                                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md flex-shrink-0"
                                                style={{ backgroundColor: camp.color || '#00B894' }}
                                            >
                                                {camp.candidato?.charAt(0) || 'C'}
                                            </div>
                                        )}
                                        <div>
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 w-max ${scopeBadgeClass}`}>
                                                <IconComponent size={11} />
                                                {camp.nivel_territorial} · {camp.tipo_cargo}
                                            </span>
                                            {camp.modo_operacion === 'gestion_cargo' && (
                                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border bg-amber-100 text-amber-900 border-amber-300 flex items-center gap-1 w-max mt-1">
                                                    <Landmark size={10} /> Mandatario en Cargo ({camp.periodo_gobierno || '2024-2027'})
                                                </span>
                                            )}
                                            <h3 className="font-black text-slate-800 text-base leading-snug uppercase mt-1">
                                                {camp.nombre}
                                            </h3>
                                        </div>
                                    </div>

                                    {isActive && (
                                        <span className="text-[10px] font-black uppercase tracking-wider bg-[#00B894] text-white px-2 py-0.5 rounded-md shadow-sm">
                                            ✓ Activa
                                        </span>
                                    )}
                                </div>

                                {/* Eslogan de Campaña */}
                                {camp.eslogan && (
                                    <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-xs text-emerald-900 font-medium italic flex items-center gap-2">
                                        <Quote size={14} className="text-emerald-500 flex-shrink-0" />
                                        <span>"{camp.eslogan}"</span>
                                    </div>
                                )}

                                {/* Candidato y Partido */}
                                <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-gray-400 font-bold uppercase text-[10px]">Candidato:</span>
                                        <strong className="text-slate-800">{camp.candidato}</strong>
                                    </div>
                                    {camp.numero_tarjeton && (
                                        <span className="font-mono font-black bg-white px-2 py-0.5 rounded border border-gray-200 text-slate-800 text-[11px]">
                                            #{camp.numero_tarjeton}
                                        </span>
                                    )}
                                </div>

                                {/* Información Territorial */}
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                                    <div className="flex justify-between items-center text-gray-500">
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Territorio</span>
                                        <span className="font-bold text-gray-800 text-right">
                                            {camp.nivel_territorial === 'nacional'
                                                ? 'Toda Colombia (Nacional)'
                                                : camp.nivel_territorial === 'departamental'
                                                    ? `${camp.departamento}`
                                                    : `${camp.municipio}, ${camp.departamento}`
                                            }
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-500">
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Partido / Movimiento</span>
                                        <span className="font-semibold text-gray-700 text-right">{camp.partido_politico || 'Independiente'}</span>
                                    </div>
                                </div>

                                {/* Reloj Oficial de la Campaña */}
                                <CampaignClock campaign={camp} mode="card" />

                                {/* Barra de Progreso hacia la Meta */}
                                <div className="space-y-1.5 pt-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500 flex items-center gap-1">
                                            <Users size={12} className="text-gray-400" />
                                            <strong>{camp.totalVoters.toLocaleString()}</strong> votantes
                                        </span>
                                        <span className="text-gray-400 text-[11px]">
                                            Meta: <strong>{camp.meta_votos > 0 ? camp.meta_votos.toLocaleString() : 'N/A'}</strong>
                                        </span>
                                    </div>

                                    {camp.meta_votos > 0 && (
                                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="h-2 rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${camp.progressPercent}%`,
                                                    backgroundColor: camp.color || '#00B894'
                                                }}
                                            />
                                        </div>
                                    )}

                                    <div className="flex justify-between text-[10px] text-gray-400 pt-0.5">
                                        <span>{camp.totalLeaders} líderes vinculados</span>
                                        <span className="text-emerald-600 font-bold">{camp.withPuesto} con puesto asignado</span>
                                    </div>
                                </div>

                                {/* Botón / Insignia de Apoyos Políticos */}
                                <div className="pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCampaignForApoyos(camp)}
                                        className="w-full flex items-center justify-between p-2 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/80 rounded-2xl text-emerald-900 transition-all group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-emerald-500 text-white rounded-xl group-hover:scale-105 transition-transform">
                                                <Handshake size={13} />
                                            </div>
                                            <div className="text-left">
                                                <span className="text-xs font-black uppercase tracking-wider block">Apoyos Políticos</span>
                                                <span className="text-[10px] text-emerald-700">Aliados y compromisos</span>
                                            </div>
                                        </div>
                                        <span className="bg-emerald-600 text-white text-xs font-black px-2 py-0.5 rounded-lg shadow-sm">
                                            {camp.totalApoyos || 0}
                                        </span>
                                    </button>
                                </div>

                                {/* Barra de Inteligencia Electoral & Gobernanza (3 Herramientas Estratégicas) */}
                                <div className="grid grid-cols-3 gap-1.5 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCampaignForTermometro(camp)}
                                        className="flex flex-col items-center justify-center p-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-black uppercase tracking-wider transition-all"
                                        title="Ver Termómetro de Victoria & Déficit Territorial"
                                    >
                                        <Flame size={15} className="text-rose-600 mb-0.5" />
                                        <span>Termómetro</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedCampaignForCoequiperos(camp)}
                                        className="flex flex-col items-center justify-center p-2 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[10px] font-black uppercase tracking-wider transition-all"
                                        title="Ver y Gestionar Red de Coequiperos (Campañas Hijas)"
                                    >
                                        <Network size={15} className="text-teal-600 mb-0.5" />
                                        <span>Coequiperos</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedCampaignForCompromisos(camp)}
                                        className="flex flex-col items-center justify-center p-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black uppercase tracking-wider transition-all"
                                        title="Gestión de Mandato 4 Años & Rendición de Cuentas"
                                    >
                                        <Landmark size={15} className="text-amber-600 mb-0.5" />
                                        <span>Mandato 4A</span>
                                    </button>
                                </div>
                            </div>

                            {/* Acciones de la Tarjeta */}
                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                                <button
                                    onClick={() => setActiveCampaign(camp)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${isActive ? 'bg-gray-200 text-gray-700 cursor-default' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'}`}
                                    disabled={isActive}
                                >
                                    {isActive ? (
                                        <><span>Seleccionada</span></>
                                    ) : (
                                        <><span>Activar Campaña</span> <ChevronRight size={14} /></>
                                    )}
                                </button>

                                <button
                                    onClick={() => openEditModal(camp)}
                                    className="p-2.5 text-gray-500 hover:text-slate-900 hover:bg-white rounded-xl border border-transparent hover:border-gray-200 transition-colors"
                                    title="Editar campaña"
                                >
                                    <Edit3 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(camp.id, camp.nombre)}
                                    className="p-2.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100 transition-colors"
                                    title="Eliminar campaña"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal Crear / Editar Campaña */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                        {/* Header Modal - Fijo en la parte superior */}
                        <div className="flex-shrink-0 bg-gradient-to-r from-slate-900 to-slate-800 p-5 sm:p-6 text-white flex items-center justify-between border-b border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-[#00B894]/20 rounded-2xl text-[#00B894]">
                                    <Flag size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg uppercase tracking-wide">
                                        {editingCampaign ? 'Editar Campaña Electoral' : 'Nueva Campaña Electoral'}
                                    </h3>
                                    <p className="text-gray-300 text-xs">
                                        Configura el cargo, territorio, candidato, identidad gráfica y fechas oficiales.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {formError && (
                            <div className="flex-shrink-0 mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold">
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                            {/* Contenedor desplazable con scroll interno */}
                            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

                                {/* 1. Selección del Tipo de Cargo y Nivel Territorial */}
                                <div className="space-y-3">
                                    <label className="block text-xs font-black uppercase tracking-wider text-gray-500">
                                        1. Tipo de Elección y Cargo Oficial (Colombia)
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                        {CARGOS.map(cargo => {
                                            const isSelected = formData.tipo_cargo === cargo.id;
                                            const IconComp = cargo.icon;
                                            return (
                                                <button
                                                    key={cargo.id}
                                                    type="button"
                                                    onClick={() => handleCargoChange(cargo.id)}
                                                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${isSelected ? 'border-[#00B894] bg-emerald-50/50 ring-2 ring-[#00B894]/20' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${cargo.nivel === 'nacional' ? 'bg-blue-100 text-blue-700' : cargo.nivel === 'departamental' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {cargo.nivel}
                                                        </span>
                                                        <IconComp size={16} className={isSelected ? 'text-[#00B894]' : 'text-gray-400'} />
                                                    </div>
                                                    <p className="font-bold text-xs text-gray-800 mt-2 leading-tight">
                                                        {cargo.nombre}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 2. Asignación Territorial Según el Nivel */}
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                                            <MapPin size={14} className="text-[#00B894]" /> 2. Delimitación Territorial
                                        </span>
                                        <span className="text-[11px] font-black uppercase text-slate-500">
                                            Nivel: <strong className="text-slate-800">{currentCargoObj.nivel.toUpperCase()}</strong>
                                        </span>
                                    </div>

                                    {currentCargoObj.nivel === 'nacional' && (
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center gap-2">
                                            <Globe size={18} className="text-blue-600 flex-shrink-0" />
                                            <span>
                                                <strong>Circunscripción Nacional:</strong> Para el Senado de la República, la campaña abarca toda Colombia. Los votantes podrán registrarse desde cualquier departamento y municipio.
                                            </span>
                                        </div>
                                    )}

                                    {currentCargoObj.nivel === 'departamental' && (
                                        <div>
                                            <label className="block text-gray-600 font-bold mb-1.5 text-xs uppercase">
                                                Departamento (Requerido)
                                            </label>
                                            <select
                                                value={formData.departamento}
                                                onChange={(e) => handleDeptoChange(e.target.value)}
                                                className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#00B894]"
                                                required
                                            >
                                                <option value="">-- SELECCIONE EL DEPARTAMENTO DE LA CAMPAÑA --</option>
                                                {Object.keys(colombiaData).sort().map(dep => (
                                                    <option key={dep} value={dep}>{dep}</option>
                                                ))}
                                            </select>
                                            <p className="text-[11px] text-gray-400 mt-1 italic">
                                                * Aplica para todos los municipios dentro del departamento seleccionado.
                                            </p>
                                        </div>
                                    )}

                                    {currentCargoObj.nivel === 'municipal' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-gray-600 font-bold mb-1.5 text-xs uppercase">
                                                    Departamento
                                                </label>
                                                <select
                                                    value={formData.departamento}
                                                    onChange={(e) => handleDeptoChange(e.target.value)}
                                                    className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#00B894]"
                                                    required
                                                >
                                                    <option value="">-- DEPARTAMENTO --</option>
                                                    {Object.keys(colombiaData).sort().map(dep => (
                                                        <option key={dep} value={dep}>{dep}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-gray-600 font-bold mb-1.5 text-xs uppercase">
                                                    Municipio o Distrito
                                                </label>
                                                <select
                                                    value={formData.municipio}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, municipio: e.target.value }))}
                                                    className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#00B894]"
                                                    required
                                                    disabled={!formData.departamento}
                                                >
                                                    <option value="">-- SELECCIONE MUNICIPIO --</option>
                                                    {municipios.map(mun => (
                                                        <option key={mun} value={mun}>{mun}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 3. Datos Generales de la Campaña y Candidato */}
                                <div className="p-4 bg-white border border-gray-200 rounded-2xl space-y-4">
                                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                                        <Users size={14} className="text-[#00B894]" /> 3. Datos del Candidato y la Campaña
                                    </span>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="sm:col-span-2">
                                            <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                                Nombre Oficial de la Campaña
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Ej. Alcaldía de Medellín 2026 - Medellín Adelante (Opcional, se autogenera)"
                                                value={formData.nombre}
                                                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#00B894]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                                Nombre del Candidato(a) *
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Ej. Carlos Mario Gómez"
                                                value={formData.candidato}
                                                onChange={(e) => setFormData(prev => ({ ...prev, candidato: e.target.value }))}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#00B894]"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                                Partido o Movimiento Político
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Ej. Coalición de la Esperanza"
                                                value={formData.partido_politico}
                                                onChange={(e) => setFormData(prev => ({ ...prev, partido_politico: e.target.value }))}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#00B894]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                                Número en Tarjetón
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Ej. 101, L-12, etc."
                                                value={formData.numero_tarjeton}
                                                onChange={(e) => setFormData(prev => ({ ...prev, numero_tarjeton: e.target.value }))}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#00B894]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                                Meta de Votos Esperada
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="Ej. 50000"
                                                value={formData.meta_votos}
                                                onChange={(e) => setFormData(prev => ({ ...prev, meta_votos: e.target.value }))}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#00B894]"
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                                Descripción Breve de la Campaña
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Ej. Elecciones Regionales Octubre 2026"
                                                value={formData.descripcion}
                                                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#00B894]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 4. Identidad de Campaña: Eslogan, Color y Fotografías */}
                                <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl space-y-4">
                                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                                        <Sparkles size={14} className="text-[#00B894]" /> 4. Identidad Visual, Marca & Eslogan
                                    </span>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Eslogan de la Campaña */}
                                        <div className="sm:col-span-2">
                                            <label className="block text-gray-700 font-bold mb-1 text-xs uppercase">
                                                Eslogan Oficial de la Campaña
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Ej. ¡El cambio que soñamos es ahora!"
                                                    value={formData.eslogan}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, eslogan: e.target.value }))}
                                                    className="w-full bg-white border border-emerald-300 rounded-xl p-2.5 pl-9 text-xs font-bold text-emerald-950 focus:outline-none focus:border-[#00B894]"
                                                />
                                                <Quote size={14} className="absolute left-3 top-3 text-emerald-500" />
                                            </div>
                                        </div>

                                        {/* Color Distintivo */}
                                        <div className="sm:col-span-2 flex items-center gap-3 p-3 bg-white border border-emerald-200 rounded-xl">
                                            <input
                                                type="color"
                                                value={formData.color}
                                                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                                                className="w-9 h-9 rounded-xl border-0 cursor-pointer shadow-sm"
                                            />
                                            <div>
                                                <label className="block text-gray-700 font-bold text-xs uppercase">
                                                    Color Distintivo de la Campaña
                                                </label>
                                                <span className="font-mono text-xs text-gray-500 font-bold">{formData.color}</span>
                                            </div>
                                        </div>

                                        {/* Foto del Candidato */}
                                        <div>
                                            <label className="block text-gray-700 font-bold mb-1 text-xs uppercase">
                                                Fotografía del Candidato
                                            </label>
                                            <div className="flex items-center gap-3">
                                                {formData.foto_candidato ? (
                                                    <div className="relative">
                                                        <img
                                                            src={formData.foto_candidato}
                                                            alt="Candidato"
                                                            className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-400 shadow"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({ ...prev, foto_candidato: '' }))}
                                                            className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow hover:bg-rose-600 transition-colors"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 rounded-2xl bg-white border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                                                        <Image size={20} />
                                                    </div>
                                                )}

                                                <div className="flex-1 space-y-1.5">
                                                    <label className="flex items-center justify-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-300 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 cursor-pointer shadow-sm transition-colors">
                                                        <Upload size={13} />
                                                        <span>Subir Archivo</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => handleImageUpload(e, 'foto_candidato')}
                                                        />
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="o URL directa de la foto"
                                                        value={formData.foto_candidato}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, foto_candidato: e.target.value }))}
                                                        className="w-full bg-white border border-gray-300 rounded-lg p-1.5 text-[11px] text-gray-700 focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Logo de la Campaña */}
                                        <div>
                                            <label className="block text-gray-700 font-bold mb-1 text-xs uppercase">
                                                Logo o Sello de la Campaña
                                            </label>
                                            <div className="flex items-center gap-3">
                                                {formData.logo_campana ? (
                                                    <div className="relative">
                                                        <img
                                                            src={formData.logo_campana}
                                                            alt="Logo"
                                                            className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-400 shadow"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({ ...prev, logo_campana: '' }))}
                                                            className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow hover:bg-rose-600 transition-colors"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 rounded-2xl bg-white border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                                                        <Flag size={20} />
                                                    </div>
                                                )}

                                                <div className="flex-1 space-y-1.5">
                                                    <label className="flex items-center justify-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-300 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 cursor-pointer shadow-sm transition-colors">
                                                        <Upload size={13} />
                                                        <span>Subir Logo</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => handleImageUpload(e, 'logo_campana')}
                                                        />
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="o URL del logo"
                                                        value={formData.logo_campana}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, logo_campana: e.target.value }))}
                                                        className="w-full bg-white border border-gray-300 rounded-lg p-1.5 text-[11px] text-gray-700 focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 5. Cronograma y Reloj Oficial de la Campaña (Inicio y Elecciones) */}
                                <div className="bg-gradient-to-br from-slate-900 to-gray-900 border border-gray-800 rounded-2xl p-4 text-white space-y-3 shadow-inner">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-[#00B894]/20 border border-[#00B894]/40 rounded-xl text-[#00B894]">
                                            <Clock size={16} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-xs uppercase tracking-wider text-emerald-300">
                                                5. Cronograma y Reloj Oficial de la Campaña
                                            </h4>
                                            <p className="text-[10px] text-gray-400">
                                                Configura las fechas para activar el conteo regresivo al Día D y el cálculo del ritmo diario de votos requerido.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                        <div>
                                            <label className="block text-gray-300 font-bold mb-1 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                                                <Calendar size={13} className="text-gray-400" />
                                                Fecha de Inicio de Campaña
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.fecha_inicio}
                                                onChange={(e) => setFormData(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                                                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:border-[#00B894]"
                                                required
                                            />
                                            <span className="text-[10px] text-gray-400 mt-1 block">
                                                Arranque oficial de la campaña
                                            </span>
                                        </div>

                                        <div>
                                            <label className="block text-emerald-400 font-bold mb-1 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                                                <Calendar size={13} className="text-emerald-400" />
                                                Día de las Elecciones (Día D)
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.fecha_elecciones}
                                                onChange={(e) => setFormData(prev => ({ ...prev, fecha_elecciones: e.target.value }))}
                                                className="w-full bg-gray-800 border border-emerald-500/60 rounded-xl p-2.5 text-xs font-bold text-emerald-300 focus:outline-none focus:border-emerald-400"
                                                required
                                            />
                                            <span className="text-[10px] text-gray-400 mt-1 block">
                                                Fecha de comicios (Apertura de urnas 8:00 AM)
                                            </span>
                                        </div>
                                    </div>

                                    {/* Vista previa instantánea del lapso */}
                                    {formData.fecha_inicio && formData.fecha_elecciones && (
                                        <div className="mt-2 p-2.5 bg-gray-800/80 border border-gray-700/80 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                                            <span className="text-gray-300">
                                                ⏳ Duración total:{' '}
                                                <strong className="text-white">
                                                    {Math.max(1, Math.round((new Date(formData.fecha_elecciones).getTime() - new Date(formData.fecha_inicio).getTime()) / (1000 * 60 * 60 * 24)))} días
                                                </strong>
                                            </span>
                                            <span className="text-emerald-400 font-bold">
                                                Faltan:{' '}
                                                {Math.ceil((new Date(formData.fecha_elecciones).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días al Día D
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* 6. Modo de Operación: Campaña vs. Mandatario en Cargo (4 Años) */}
                                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3">
                                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                                        <Landmark size={15} className="text-amber-600" />
                                        6. Régimen de Operación & Gobernanza (4 Años)
                                    </span>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-gray-700 font-bold mb-1 text-[11px] uppercase">
                                                Modo de Operación
                                            </label>
                                            <select
                                                value={formData.modo_operacion}
                                                onChange={(e) => setFormData(prev => ({ ...prev, modo_operacion: e.target.value }))}
                                                className="w-full bg-white border border-amber-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-amber-500"
                                            >
                                                <option value="electoral">🎯 Campaña Electoral Activa</option>
                                                <option value="gestion_cargo">🏛️ Mandatario en Cargo (4 Años de Gestión & Rendición)</option>
                                            </select>
                                            <span className="text-[10px] text-gray-500 mt-1 block">
                                                Activa el panel de obras, debates y proyectos durante el mandato.
                                            </span>
                                        </div>

                                        <div>
                                            <label className="block text-gray-700 font-bold mb-1 text-[11px] uppercase">
                                                Periodo Constitucional
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Ej. 2024-2027 o 2026-2030"
                                                value={formData.periodo_gobierno}
                                                onChange={(e) => setFormData(prev => ({ ...prev, periodo_gobierno: e.target.value }))}
                                                className="w-full bg-white border border-amber-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-amber-500"
                                            />
                                            <span className="text-[10px] text-gray-500 mt-1 block">
                                                Cuatrienio oficial de gestión pública.
                                            </span>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Footer Fijo - Botones de Acción */}
                            <div className="flex-shrink-0 p-4 sm:px-6 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wider hover:bg-gray-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 rounded-xl bg-[#00B894] hover:bg-[#00a884] disabled:bg-gray-300 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-2"
                                >
                                    {submitting ? 'Guardando...' : editingCampaign ? 'Actualizar Campaña' : 'Crear Campaña'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Gestión de Apoyos Políticos */}
            {selectedCampaignForApoyos && (
                <ApoyosManagerModal
                    campaign={selectedCampaignForApoyos}
                    isOpen={!!selectedCampaignForApoyos}
                    onClose={() => setSelectedCampaignForApoyos(null)}
                    onApoyosUpdated={refreshCampaigns}
                />
            )}

            {/* Modal de Termómetro de Victoria & Déficit Territorial */}
            {selectedCampaignForTermometro && (
                <TermometroVictoriaModal
                    campaign={selectedCampaignForTermometro}
                    isOpen={!!selectedCampaignForTermometro}
                    onClose={() => setSelectedCampaignForTermometro(null)}
                />
            )}

            {/* Modal de Red de Coequiperos (Campañas Hijas) */}
            {selectedCampaignForCoequiperos && (
                <CoequiperosModal
                    campaign={selectedCampaignForCoequiperos}
                    isOpen={!!selectedCampaignForCoequiperos}
                    onClose={() => setSelectedCampaignForCoequiperos(null)}
                    onUpdated={refreshCampaigns}
                />
            )}

            {/* Modal de Gobernanza 4 Años & Compromisos de Mandato */}
            {selectedCampaignForCompromisos && (
                <CompromisosGestionModal
                    campaign={selectedCampaignForCompromisos}
                    isOpen={!!selectedCampaignForCompromisos}
                    onClose={() => setSelectedCampaignForCompromisos(null)}
                />
            )}

        </div>
    );
}
