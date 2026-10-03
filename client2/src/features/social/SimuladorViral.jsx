import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../../config/api';
import {
  Gamepad2, Flame, Sliders, TrendingDown, Eye, Share2,
  MessageSquare, RefreshCw, AlertTriangle, Zap, CheckCircle2
} from 'lucide-react';

export default function SimuladorViral({ activeCampaign, token }) {
  const [params, setParams] = useState({
    durationSeconds: 30,
    hookStrength: 75,
    pacingScore: 70,
    fatigueScore: 20,
    platform: 'tiktok',
    seed: 42
  });

  const [loading, setLoading] = useState(false);
  const [simulation, setSimulation] = useState(null);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const authToken = token || localStorage.getItem('token');
      const res = await axios.post(`${API}/social/intelligence/simulate`, {
        ...params,
        campana_id: activeCampaign?.id || 1
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (res.data?.success) {
        setSimulation(res.data.simulation);
      }
    } catch (err) {
      console.error('Error al ejecutar simulación:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [params.platform, params.durationSeconds]);

  // SVG Chart path calculation for retention curve
  const curve = simulation?.results?.retentionCurve || [];
  const svgWidth = 600;
  const svgHeight = 160;

  const points = curve.map((pt, idx) => {
    const x = (pt.second / Math.max(1, params.durationSeconds)) * svgWidth;
    const y = svgHeight - (pt.retentionPercentage / 100) * (svgHeight - 20) - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-6">
      {/* Banner de Agua Ficticia / Videojuego Político */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-800/60 p-5 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-400">
            <Gamepad2 size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black uppercase tracking-wider text-purple-300">
                MODO A: Simulador de Dinámica Viral (Videojuego Político)
              </span>
              <span className="bg-purple-900/80 text-purple-300 border border-purple-700/50 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                Datos 100% Simulados
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
              Entorno virtual para calibrar ganchos, duración y ritmo antes de gastar recursos de producción. Modelo matemático sin perfilamiento ni datos reales de votantes.
            </p>
          </div>
        </div>

        <button
          onClick={runSimulation}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase rounded-xl transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Simular Escenario</span>
        </button>
      </div>

      {/* Panel de Controles / Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white shadow-xl space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sliders size={18} className="text-purple-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Parámetros del Video y Audiencia
            </h4>
          </div>

          <div>
            <label className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-300 mb-1">
              <span>Plataforma</span>
              <span className="text-cyan-400 font-mono">{params.platform.toUpperCase()}</span>
            </label>
            <select
              value={params.platform}
              onChange={(e) => setParams({ ...params, platform: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="tiktok">TikTok (Alta velocidad de scroll)</option>
              <option value="reels">Instagram Reels</option>
              <option value="youtube_shorts">YouTube Shorts</option>
              <option value="x">X / Twitter</option>
            </select>
          </div>

          <div>
            <label className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-300 mb-1">
              <span>Duración del Video</span>
              <span className="text-cyan-400 font-mono">{params.durationSeconds}s</span>
            </label>
            <input
              type="range"
              min="10"
              max="120"
              step="5"
              value={params.durationSeconds}
              onChange={(e) => setParams({ ...params, durationSeconds: Number(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
              <span>10s (Micro)</span>
              <span>60s (Estándar)</span>
              <span>120s (Explicativo)</span>
            </div>
          </div>

          <div>
            <label className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-300 mb-1">
              <span>Fuerza del Gancho (0-3s)</span>
              <span className="text-emerald-400 font-mono">{params.hookStrength}%</span>
            </label>
            <input
              type="range"
              min="20"
              max="95"
              value={params.hookStrength}
              onChange={(e) => setParams({ ...params, hookStrength: Number(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Impacto visual, pregunta retórica o dato impactante de apertura.
            </span>
          </div>

          <div>
            <label className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-300 mb-1">
              <span>Dinamismo de Edición y Ritmo</span>
              <span className="text-purple-400 font-mono">{params.pacingScore}%</span>
            </label>
            <input
              type="range"
              min="20"
              max="95"
              value={params.pacingScore}
              onChange={(e) => setParams({ ...params, pacingScore: Number(e.target.value) })}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Cortes cada 2.5s, subtítulos dinámicos y cambios de plano.
            </span>
          </div>

          <div>
            <label className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-300 mb-1">
              <span>Fatiga de Audiencia Estimada</span>
              <span className="text-rose-400 font-mono">{params.fatigueScore}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="90"
              value={params.fatigueScore}
              onChange={(e) => setParams({ ...params, fatigueScore: Number(e.target.value) })}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Saturación de mensajes similares en los últimos 7 días.
            </span>
          </div>
        </div>

        {/* Gráfico de Curva de Retención Segundo a Segundo */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <TrendingDown size={18} />
                  Curva de Retención Proyectada (0 a {params.durationSeconds}s)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Porcentaje estimado de espectadores que permanecen segundo a segundo.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase px-3 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-full">
                  Retención Final: {simulation?.results?.finalCompletionRate || 0}%
                </span>
              </div>
            </div>

            {/* SVG Visualizer */}
            <div className="mt-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 relative">
              <div className="absolute top-2 left-4 text-[10px] text-slate-500 font-mono">100% Retención</div>
              <div className="absolute bottom-6 left-4 text-[10px] text-slate-500 font-mono">0% Retención</div>

              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-44 overflow-visible">
                {/* Horizontal reference grids */}
                <line x1="0" y1={svgHeight * 0.25} x2={svgWidth} y2={svgHeight * 0.25} stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="0" y1={svgHeight * 0.50} x2={svgWidth} y2={svgHeight * 0.50} stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="0" y1={svgHeight * 0.75} x2={svgWidth} y2={svgHeight * 0.75} stroke="#1e293b" strokeDasharray="3 3" />

                {/* Critical Drop marker */}
                {simulation?.results?.criticalDropSecond && (
                  <line
                    x1={(simulation.results.criticalDropSecond / params.durationSeconds) * svgWidth}
                    y1="0"
                    x2={(simulation.results.criticalDropSecond / params.durationSeconds) * svgWidth}
                    y2={svgHeight}
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                )}

                {/* Polyline curve */}
                {points && (
                  <>
                    <polyline
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={points}
                    />
                  </>
                )}
              </svg>

              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-900">
                <span>0s (Inicio)</span>
                <span>Punto Crítico: {simulation?.results?.criticalDropSecond || 3}s</span>
                <span>{params.durationSeconds}s (Final)</span>
              </div>
            </div>

            {/* Recomendaciones Dinámicas */}
            <div className="mt-4 space-y-2">
              {simulation?.recommendations?.map((rec, i) => (
                <div key={i} className="text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-300 flex items-start gap-2">
                  <Zap size={14} className="text-cyan-400 mt-0.5 shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tres Escenarios de Proyección */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-800">
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">1. Escenario Conservador</span>
              <span className="text-lg font-black text-slate-300 mt-0.5 block">
                {(simulation?.results?.scenarios?.conservador?.projectedViews || 0).toLocaleString()} vistas
              </span>
              <span className="text-[10px] text-slate-500 block">Distribución base sin impulso</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-cyan-900/60 shadow-md">
              <span className="text-[10px] font-bold uppercase text-cyan-400 block">2. Escenario Moderado</span>
              <span className="text-lg font-black text-cyan-300 mt-0.5 block">
                {(simulation?.results?.scenarios?.moderado?.projectedViews || 0).toLocaleString()} vistas
              </span>
              <span className="text-[10px] text-cyan-500 block">Tracción orgánica esperada</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-purple-900/60">
              <span className="text-[10px] font-bold uppercase text-purple-400 block">3. Escenario Viral</span>
              <span className="text-lg font-black text-purple-300 mt-0.5 block">
                {(simulation?.results?.scenarios?.alto_impacto?.projectedViews || 0).toLocaleString()} vistas
              </span>
              <span className="text-[10px] text-purple-500 block">Amplificación de algoritmo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
