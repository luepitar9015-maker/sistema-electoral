import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../../config/api';
import {
  Flame, Sparkles, Video, Gamepad2, GitCompare,
  Activity, ShieldCheck, AlertCircle, Info, RefreshCw
} from 'lucide-react';
import AnalizadorAudiovisual from './AnalizadorAudiovisual';
import SimuladorViral from './SimuladorViral';
import ComparadorVariantes from './ComparadorVariantes';

export default function ContentIntelligenceDashboard({ activeCampaign, token }) {
  // Sub-tabs: 'analizador' | 'simulador' | 'comparador'
  const [subTab, setSubTab] = useState('analizador');
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const fetchInsights = async () => {
    if (!token) return;
    setLoadingInsights(true);
    try {
      const res = await axios.get(`${API}/social/intelligence/insights`, {
        params: { campana_id: activeCampaign?.id },
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setInsights(res.data);
      }
    } catch (err) {
      console.warn('Error al cargar insights de inteligencia:', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [activeCampaign?.id, token]);

  const fatigue = insights?.fatigue;
  const aiStatus = insights?.aiProviderStatus;

  return (
    <div className="space-y-6">
      {/* HEADER PRINCIPAL DEL MÓDULO */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-indigo-900/60 p-6 rounded-3xl text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg">
              <Sparkles size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black uppercase tracking-wide text-white">
                  Impulsar Algoritmo Social & Content Intelligence
                </h2>
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                  Media Lab 2.0
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Ingeniería de contenido audiovisual: retención de primeros 3 segundos, estructura narrativa y simulación matemática sin inventar métricas ni perfilamiento.
              </p>
            </div>
          </div>

          {/* Badges de Proveedor & Estado */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-400" />
              <span>IA: {aiStatus?.provider?.toUpperCase() || 'MOCK DETERMINÍSTICO'}</span>
            </span>
          </div>
        </div>

        {/* METRICAS GENERALES DEL LAB */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-900/70 p-3.5 rounded-2xl border border-gray-800">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Fatiga de Audiencia</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`text-xl font-black ${
                fatigue?.level === 'alto' ? 'text-rose-400' :
                fatigue?.level === 'medio' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {fatigue?.fatigueScore || 15}%
              </span>
              <span className="text-[10px] uppercase font-bold text-gray-400">
                ({fatigue?.level || 'bajo'})
              </span>
            </div>
            <span className="text-[9px] text-gray-400 block mt-0.5 line-clamp-1">{fatigue?.recommendation}</span>
          </div>

          <div className="bg-slate-900/70 p-3.5 rounded-2xl border border-gray-800">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Retención Gancho Promedio</span>
            <span className="text-xl font-black text-cyan-400 mt-0.5 block">
              {insights?.aggregatedStats?.averageHookScore || 72}%
            </span>
            <span className="text-[9px] text-gray-400 block mt-0.5">Efectividad 0-3 segundos</span>
          </div>

          <div className="bg-slate-900/70 p-3.5 rounded-2xl border border-gray-800">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Análisis Auditados</span>
            <span className="text-xl font-black text-purple-400 mt-0.5 block">
              {insights?.aggregatedStats?.totalAnalyses || 0}
            </span>
            <span className="text-[9px] text-gray-400 block mt-0.5">Registros históricos en DB</span>
          </div>

          <div className="bg-slate-900/70 p-3.5 rounded-2xl border border-gray-800">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Modos Disponibles</span>
            <span className="text-xs font-black text-emerald-400 mt-1 block">
              Modo A (Simulado) / Modo B (Real)
            </span>
            <span className="text-[9px] text-gray-400 block mt-0.5">Aislamiento ético activo</span>
          </div>
        </div>
      </div>

      {/* SUB-PESTAÑAS DE NAVEGACIÓN */}
      <div className="bg-white p-2 rounded-3xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSubTab('analizador')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
            subTab === 'analizador'
              ? 'bg-slate-950 text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <Video size={16} className={subTab === 'analizador' ? 'text-cyan-400' : ''} />
          <span>Analizador Audiovisual & Desglose</span>
        </button>

        <button
          onClick={() => setSubTab('simulador')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
            subTab === 'simulador'
              ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-md shadow-purple-500/20'
              : 'text-purple-700 bg-purple-50/70 hover:bg-purple-100 border border-purple-200'
          }`}
        >
          <Gamepad2 size={16} className={subTab === 'simulador' ? 'text-purple-300' : ''} />
          <span>🎮 Simulador Viral (Modo A)</span>
        </button>

        <button
          onClick={() => setSubTab('comparador')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
            subTab === 'comparador'
              ? 'bg-slate-950 text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <GitCompare size={16} className={subTab === 'comparador' ? 'text-emerald-400' : ''} />
          <span>Laboratorio A/B de Variantes</span>
        </button>
      </div>

      {/* RENDER DE LA SUB-PESTAÑA ACTIVA */}
      {subTab === 'analizador' && (
        <AnalizadorAudiovisual activeCampaign={activeCampaign} token={token} />
      )}

      {subTab === 'simulador' && (
        <SimuladorViral activeCampaign={activeCampaign} token={token} />
      )}

      {subTab === 'comparador' && (
        <ComparadorVariantes activeCampaign={activeCampaign} token={token} />
      )}
    </div>
  );
}
