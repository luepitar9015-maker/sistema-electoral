/**
 * Viral Simulation Engine — MODO A (Simulación Ficticia / Videojuego Político)
 * Strictly labeled as simulated data.
 * Simulates viewer retention curves, algorithm velocity, and audience fatigue.
 * DOES NOT touch voter records or perform profiling.
 */

// Simple pseudo-random number generator with seed support for reproducible scenarios
function seededRandom(seed) {
  let s = Math.sin(seed) * 10000;
  return s - Math.floor(s);
}

/**
 * Runs a mathematical retention and reach simulation
 * @param {Object} options
 * @param {number} [options.durationSeconds=30]
 * @param {number} [options.hookStrength=70] - 0 to 100
 * @param {number} [options.pacingScore=75] - 0 to 100
 * @param {number} [options.fatigueScore=20] - 0 to 100
 * @param {string} [options.platform='tiktok']
 * @param {number} [options.seed=12345]
 * @returns {Object} Simulation results with retention curve and scenario outcomes
 */
function simulatePostPerformance({
  durationSeconds = 30,
  hookStrength = 70,
  pacingScore = 75,
  fatigueScore = 20,
  platform = 'tiktok',
  seed = 42
}) {
  const duration = Math.max(5, Math.min(300, Number(durationSeconds) || 30));
  const hook = Math.max(10, Math.min(99, Number(hookStrength) || 70));
  const pacing = Math.max(10, Math.min(99, Number(pacingScore) || 75));
  const fatigue = Math.max(0, Math.min(100, Number(fatigueScore) || 20));

  // Platform specific decay multipliers
  const platformDecay = {
    tiktok: 1.15,
    reels: 1.05,
    youtube_shorts: 1.0,
    x: 1.35,
    facebook: 0.95
  }[platform.toLowerCase()] || 1.1;

  // Build second-by-second retention curve
  const retentionCurve = [];
  let currentRetention = 100; // Starts at 100% of viewers entering
  
  // Hook drop in first 3 seconds: strongly governed by hookStrength
  const initialHookLoss = Math.max(5, (100 - hook) * 0.45);

  for (let t = 0; t <= duration; t++) {
    if (t === 0) {
      retentionCurve.push({ second: 0, retentionPercentage: 100 });
      continue;
    }

    if (t <= 3) {
      // Steep initial drop governed by hook
      currentRetention -= (initialHookLoss / 3) * platformDecay;
    } else {
      // Subsequent gradual decay influenced by pacing and fatigue
      const decayBase = 0.45 + (100 - pacing) * 0.012 + (fatigue * 0.008);
      // Pseudo-random micro-jitter based on seed
      const jitter = (seededRandom(seed + t) - 0.5) * 0.3;
      currentRetention -= (decayBase * platformDecay) + jitter;
    }

    currentRetention = Math.max(5, Math.round(currentRetention * 10) / 10);
    retentionCurve.push({
      second: t,
      retentionPercentage: currentRetention
    });
  }

  const completionRate = retentionCurve[retentionCurve.length - 1].retentionPercentage;
  const avgRetention = Math.round(
    (retentionCurve.reduce((sum, r) => sum + r.retentionPercentage, 0) / retentionCurve.length) * 10
  ) / 10;

  // Critical drop points (seconds where retention dropped steepest)
  let maxDrop = 0;
  let steepestSecond = 3;
  for (let i = 1; i < retentionCurve.length; i++) {
    const diff = retentionCurve[i - 1].retentionPercentage - retentionCurve[i].retentionPercentage;
    if (diff > maxDrop) {
      maxDrop = diff;
      steepestSecond = retentionCurve[i].second;
    }
  }

  // Multi-scenario projected outcomes
  // Algorithm distribution multiplier based on completion rate & hook
  const algorithmScore = (hook * 0.4) + (completionRate * 0.4) + (pacing * 0.2) - (fatigue * 0.25);
  const normalizedAlgScore = Math.max(10, Math.min(99, Math.round(algorithmScore)));

  const scenarios = {
    conservador: {
      label: 'Escenario Base / Orgánico Frío',
      projectedViews: Math.round(1500 * (normalizedAlgScore / 50)),
      projectedReach: Math.round(1200 * (normalizedAlgScore / 50)),
      estimatedShares: Math.round(25 * (normalizedAlgScore / 50)),
      estimatedComments: Math.round(18 * (normalizedAlgScore / 50))
    },
    moderado: {
      label: 'Escenario Moderado / Tracción Media',
      projectedViews: Math.round(8500 * Math.pow(normalizedAlgScore / 45, 1.4)),
      projectedReach: Math.round(7100 * Math.pow(normalizedAlgScore / 45, 1.4)),
      estimatedShares: Math.round(180 * Math.pow(normalizedAlgScore / 45, 1.3)),
      estimatedComments: Math.round(110 * Math.pow(normalizedAlgScore / 45, 1.3))
    },
    alto_impacto: {
      label: 'Escenario Algoritmo Favorable / Viral',
      projectedViews: Math.round(35000 * Math.pow(normalizedAlgScore / 40, 1.8)),
      projectedReach: Math.round(29000 * Math.pow(normalizedAlgScore / 40, 1.8)),
      estimatedShares: Math.round(890 * Math.pow(normalizedAlgScore / 40, 1.6)),
      estimatedComments: Math.round(540 * Math.pow(normalizedAlgScore / 40, 1.5))
    }
  };

  return {
    is_simulation: true,
    mode: 'MODO_A_SIMULACION_FICTICIA',
    disclaimer: 'SIMULACIÓN MATEMÁTICA FICTICIA (MODO VIDEOJUEGO). No representa métricas de votantes reales ni perfilamiento psicológico.',
    parameters: {
      durationSeconds: duration,
      hookStrength: hook,
      pacingScore: pacing,
      fatigueScore: fatigue,
      platform,
      seed
    },
    results: {
      algorithmPotentialScore: normalizedAlgScore,
      averageRetentionPercentage: avgRetention,
      finalCompletionRate: completionRate,
      criticalDropSecond: steepestSecond,
      retentionCurve,
      scenarios
    },
    recommendations: [
      steepestSecond <= 3
        ? 'Reforzar el gancho en el segundo 1-2. La mayor pérdida de atención ocurre al arrancar el video.'
        : `Atención: Se detectó una caída pronunciada en el segundo ${steepestSecond}. Revisar edición en ese punto.`,
      fatigue > 50
        ? 'La fatiga acumulada está restando un 20% de tracción algorítmica. Recomendado pausar o diversificar temática.'
        : 'Índice de saturación bajo. Es viable publicar en este momento sin riesgo de canibalización de audiencia.'
    ]
  };
}

module.exports = {
  simulatePostPerformance
};
