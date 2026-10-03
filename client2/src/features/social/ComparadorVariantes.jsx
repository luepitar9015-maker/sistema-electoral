import { useState } from 'react';
import axios from 'axios';
import { API } from '../../config/api';
import {
  GitCompare, Trophy, Sparkles, Copy, Check, Sliders,
  RefreshCw, TrendingUp, AlertCircle
} from 'lucide-react';

export default function ComparadorVariantes({ activeCampaign, token }) {
  const [platform, setPlatform] = useState('tiktok');
  const [durationSeconds, setDurationSeconds] = useState(30);

  const [variants, setVariants] = useState([
    {
      id: 'var_a',
      label: 'Variante A: Pregunta Retórica',
      hook: '¿Por qué nadie en nuestra región se atreve a hablar de lo que pasó esta semana?',
      script: '¿Por qué nadie en nuestra región se atreve a hablar de lo que pasó esta semana? Mientras otros prometen, nosotros tenemos los datos de inversión...',
      hookStrength: 85,
      pacingScore: 78
    },
    {
      id: 'var_b',
      label: 'Variante B: Dato Crudo de Impacto',
      hook: '3 de cada 5 familias viven esto todos los días, y la solución está a nuestro alcance.',
      script: '3 de cada 5 familias viven esto todos los días. Si revisamos el presupuesto asignado, nos damos cuenta de dónde está el problema...',
      hookStrength: 72,
      pacingScore: 82
    },
    {
      id: 'var_c',
      label: 'Variante C: Enfoque Humano y Cercano',
      hook: 'Ayer hablé con una madre comunitaria y lo que me dijo me dejó pensando toda la noche.',
      script: 'Ayer hablé con una madre comunitaria y lo que me contó nos afecta a todos. No podemos permitir que siga pasando lo mismo...',
      hookStrength: 65,
      pacingScore: 68
    }
  ]);

  const [comparisonResult, setComparisonResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const handleCompare = async () => {
    setLoading(true);
    try {
      const authToken = token || localStorage.getItem('token');
      const res = await axios.post(`${API}/social/intelligence/compare-variants`, {
        variants,
        platform,
        durationSeconds,
        campana_id: activeCampaign?.id || 1
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (res.data?.success) {
        setComparisonResult(res.data);
      }
    } catch (err) {
      console.error('Error al comparar variantes:', err);
      alert('Error al ejecutar comparación de variantes.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyScript = (scriptText, id) => {
    navigator.clipboard.writeText(scriptText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black uppercase tracking-wide flex items-center gap-2">
            <GitCompare className="text-purple-400" size={20} />
            Laboratorio de Variantes A/B (Prueba de Ganchos)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Simula el rendimiento de diferentes aperturas y guiones antes de grabar o pautar. Descubre cuál retiene mejor la atención.
          </p>
        </div>

        <button
          onClick={handleCompare}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-xs uppercase rounded-xl transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          {loading ? (
            <>
              <RefreshCw size={15} className="animate-spin" />
              <span>Simulando Comparación...</span>
            </>
          ) : (
            <>
              <Sparkles size={15} />
              <span>Ejecutar Comparación A/B</span>
            </>
          )}
        </button>
      </div>

      {/* Editor de Variantes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {variants.map((v, idx) => (
          <div key={v.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-purple-300">
                {v.label}
              </span>
              <span className="text-[10px] font-mono text-slate-400">Variante #{idx + 1}</span>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Gancho de Apertura (Primeros 3 Segundos)
              </label>
              <input
                type="text"
                value={v.hook}
                onChange={(e) => {
                  const updated = [...variants];
                  updated[idx].hook = e.target.value;
                  setVariants(updated);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Guion Completo Propuesto
              </label>
              <textarea
                rows="4"
                value={v.script}
                onChange={(e) => {
                  const updated = [...variants];
                  updated[idx].script = e.target.value;
                  setVariants(updated);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Potencia Gancho</span>
                <input
                  type="number"
                  min="20"
                  max="99"
                  value={v.hookStrength}
                  onChange={(e) => {
                    const updated = [...variants];
                    updated[idx].hookStrength = Number(e.target.value);
                    setVariants(updated);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white text-center font-bold"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Ritmo / Dinamismo</span>
                <input
                  type="number"
                  min="20"
                  max="99"
                  value={v.pacingScore}
                  onChange={(e) => {
                    const updated = [...variants];
                    updated[idx].pacingScore = Number(e.target.value);
                    setVariants(updated);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white text-center font-bold"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resultados de la Comparación A/B */}
      {comparisonResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl space-y-6">
          {/* Winner Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-700/60 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                <Trophy size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                    Variante Ganadora Recomendada:
                  </span>
                  <span className="text-sm font-black text-white">
                    {comparisonResult.winningVariant?.label}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Potencial Algorítmico Proyectado: <strong className="text-emerald-400">{comparisonResult.winningVariant?.algorithmPotentialScore}/100</strong> con una retención final de <strong className="text-emerald-400">{comparisonResult.winningVariant?.finalCompletionRate}%</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleCopyScript(comparisonResult.winningVariant?.script, 'winner')}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black uppercase transition-all cursor-pointer self-start sm:self-auto"
            >
              {copiedId === 'winner' ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedId === 'winner' ? '¡Copiado!' : 'Copiar Guion Ganador'}</span>
            </button>
          </div>

          {/* Comparativa Lado a Lado */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {comparisonResult.variants?.map((v) => {
              const isWinner = v.variantId === comparisonResult.winningVariant?.variantId;
              return (
                <div
                  key={v.variantId}
                  className={`p-4 rounded-2xl border transition-all ${
                    isWinner
                      ? 'bg-slate-950 border-emerald-500/80 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-white">{v.label}</span>
                    {isWinner && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700 rounded-full">
                        Ganador
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Score Algorítmico:</span>
                      <span className="font-bold text-cyan-400">{v.algorithmPotentialScore}/100</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Retención Promedio:</span>
                      <span className="font-bold text-white">{v.averageRetentionPercentage}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Finalizan el Video:</span>
                      <span className="font-bold text-emerald-400">{v.finalCompletionRate}%</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Vistas Proyectadas:</span>
                      <span className="font-bold text-purple-300">{(v.projectedViews || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
