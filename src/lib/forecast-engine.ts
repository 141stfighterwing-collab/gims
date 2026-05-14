/**
 * Forecast Engine - Various methods for generating index forecasts
 */

export interface ForecastResult {
  forecastValue: number;
  confidence: number;
  method: string;
  horizonDays: number;
  scenario: string;
}

/**
 * Linear Extrapolation - Simple trend projection
 */
export function linearExtrapolation(
  historicalScores: number[],
  horizonDays: number
): ForecastResult {
  if (historicalScores.length < 2) {
    return {
      forecastValue: historicalScores[0] ?? 50,
      confidence: 0.3,
      method: 'Linear Extrapolation',
      horizonDays,
      scenario: 'Insufficient historical data for reliable forecast.',
    };
  }

  const n = historicalScores.length;
  const recent = historicalScores.slice(-7);
  const avgTrend = (recent[recent.length - 1] - recent[0]) / recent.length;
  const forecastValue = Math.min(100, Math.max(0,
    recent[recent.length - 1] + avgTrend * horizonDays
  ));

  const variance = recent.reduce((sum, val) => {
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
    return sum + (val - mean) ** 2;
  }, 0) / recent.length;

  const confidence = Math.max(0.2, Math.min(0.95, 1 - Math.sqrt(variance) / 50));

  return {
    forecastValue: Math.round(forecastValue * 10) / 10,
    confidence: Math.round(confidence * 100) / 100,
    method: 'Linear Extrapolation',
    horizonDays,
    scenario: `Based on ${recent.length}-day trend of ${avgTrend > 0 ? '+' : ''}${avgTrend.toFixed(1)} points/day. Current momentum suggests ${avgTrend > 0 ? 'increasing' : 'decreasing'} trajectory over the forecast period.`,
  };
}

/**
 * Exponential Smoothing - Weighted recent data
 */
export function exponentialSmoothing(
  historicalScores: number[],
  horizonDays: number,
  alpha: number = 0.3
): ForecastResult {
  if (historicalScores.length === 0) {
    return {
      forecastValue: 50,
      confidence: 0.3,
      method: 'Exponential Smoothing',
      horizonDays,
      scenario: 'No historical data available.',
    };
  }

  let smoothed = historicalScores[0];
  for (let i = 1; i < historicalScores.length; i++) {
    smoothed = alpha * historicalScores[i] + (1 - alpha) * smoothed;
  }

  // Calculate trend from smoothed values
  const smoothedValues: number[] = [];
  let s = historicalScores[0];
  for (let i = 1; i < historicalScores.length; i++) {
    s = alpha * historicalScores[i] + (1 - alpha) * s;
    smoothedValues.push(s);
  }

  const recentSmoothed = smoothedValues.slice(-5);
  const trend = recentSmoothed.length >= 2
    ? (recentSmoothed[recentSmoothed.length - 1] - recentSmoothed[0]) / recentSmoothed.length
    : 0;

  const forecastValue = Math.min(100, Math.max(0, smoothed + trend * horizonDays));

  const recentVariance = historicalScores.slice(-7).reduce((sum, val) => {
    const mean = historicalScores.slice(-7).reduce((a, b) => a + b, 0) / 7;
    return sum + (val - mean) ** 2;
  }, 0) / 7;

  const confidence = Math.max(0.2, Math.min(0.95, 1 - Math.sqrt(recentVariance) / 60));

  return {
    forecastValue: Math.round(forecastValue * 10) / 10,
    confidence: Math.round(confidence * 100) / 100,
    method: 'Exponential Smoothing',
    horizonDays,
    scenario: `Exponentially smoothed baseline at ${smoothed.toFixed(1)} with trend of ${trend > 0 ? '+' : ''}${trend.toFixed(2)}/day. Alpha=${alpha} gives more weight to recent observations.`,
  };
}

/**
 * ARIMA-like Forecast - Simplified autoregressive model
 */
export function arimaForecast(
  historicalScores: number[],
  horizonDays: number
): ForecastResult {
  if (historicalScores.length < 10) {
    return linearExtrapolation(historicalScores, horizonDays);
  }

  // Calculate autocorrelation
  const mean = historicalScores.reduce((a, b) => a + b, 0) / historicalScores.length;
  const demeaned = historicalScores.map(v => v - mean);
  const variance = demeaned.reduce((sum, v) => sum + v * v, 0) / demeaned.length;

  let autocorrLag1 = 0;
  for (let i = 1; i < demeaned.length; i++) {
    autocorrLag1 += demeaned[i] * demeaned[i - 1];
  }
  autocorrLag1 /= (demeaned.length - 1) * variance;

  const phi = Math.max(-0.95, Math.min(0.95, autocorrLag1));
  let forecast = historicalScores[historicalScores.length - 1];
  const previous = historicalScores[historicalScores.length - 2];

  for (let i = 0; i < horizonDays; i++) {
    forecast = mean + phi * (forecast - mean);
  }

  const errorVariance = variance * (1 - phi * phi);
  const confidence = Math.max(0.2, Math.min(0.9, 1 - Math.sqrt(errorVariance) / 40));

  return {
    forecastValue: Math.round(Math.min(100, Math.max(0, forecast)) * 10) / 10,
    confidence: Math.round(confidence * 100) / 100,
    method: 'ARIMA Forecast',
    horizonDays,
    scenario: `Autoregressive model with phi=${phi.toFixed(3)} (lag-1 autocorrelation). Mean reversion level at ${mean.toFixed(1)}. Error variance indicates ${confidence > 0.6 ? 'moderate' : 'lower'} reliability.`,
  };
}

/**
 * Scenario Analysis - Generate scenario-based forecasts
 */
export function scenarioAnalysis(
  historicalScores: number[],
  horizonDays: number,
  scenarios: { name: string; multiplier: number; probability: number }[] = [
    { name: 'Best Case', multiplier: 0.7, probability: 0.15 },
    { name: 'Base Case', multiplier: 1.0, probability: 0.55 },
    { name: 'Worst Case', multiplier: 1.4, probability: 0.30 },
  ]
): ForecastResult {
  const baseResult = linearExtrapolation(historicalScores, horizonDays);

  let weightedForecast = 0;
  const scenarioTexts: string[] = [];

  for (const scenario of scenarios) {
    const scenarioValue = baseResult.forecastValue * scenario.multiplier;
    weightedForecast += scenarioValue * scenario.probability;
    scenarioTexts.push(
      `${scenario.name} (${(scenario.probability * 100).toFixed(0)}%): ${Math.round(scenarioValue)}/100`
    );
  }

  return {
    forecastValue: Math.round(Math.min(100, Math.max(0, weightedForecast)) * 10) / 10,
    confidence: Math.round(baseResult.confidence * 0.85 * 100) / 100,
    method: 'Scenario Analysis',
    horizonDays,
    scenario: `Probability-weighted forecast across scenarios: ${scenarioTexts.join('. ')}.`,
  };
}

/**
 * Anomaly Detection - Identify unusual patterns
 */
export function anomalyDetection(
  historicalScores: number[]
): ForecastResult {
  if (historicalScores.length < 14) {
    return {
      forecastValue: historicalScores[historicalScores.length - 1] ?? 50,
      confidence: 0.3,
      method: 'Anomaly Detection',
      horizonDays: 7,
      scenario: 'Insufficient data for anomaly detection.',
    };
  }

  const recent = historicalScores.slice(-14);
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
  const stdDev = Math.sqrt(recent.reduce((sum, v) => sum + (v - mean) ** 2, 0) / recent.length);

  const lastValue = recent[recent.length - 1];
  const zScore = stdDev > 0 ? (lastValue - mean) / stdDev : 0;

  const isAnomaly = Math.abs(zScore) > 1.5;
  const anomalyDirection = zScore > 0 ? 'upward' : zScore < 0 ? 'downward' : 'stable';

  let forecastValue = lastValue;
  if (isAnomaly) {
    // Regress toward mean
    forecastValue = lastValue + (mean - lastValue) * 0.3;
  } else {
    forecastValue = lastValue + (mean - lastValue) * 0.05;
  }

  return {
    forecastValue: Math.round(Math.min(100, Math.max(0, forecastValue)) * 10) / 10,
    confidence: Math.round(Math.max(0.3, 0.9 - Math.abs(zScore) * 0.1) * 100) / 100,
    method: 'Anomaly Detection',
    horizonDays: 7,
    scenario: isAnomaly
      ? `Anomaly detected: ${Math.abs(zScore).toFixed(2)}σ ${anomalyDirection} deviation from 14-day mean of ${mean.toFixed(1)}. Forecast regresses toward mean. Pattern suggests unexpected ${anomalyDirection} development.`
      : `No significant anomalies detected. Current trajectory within normal parameters (μ=${mean.toFixed(1)}, σ=${stdDev.toFixed(1)}).`,
  };
}

/**
 * Monte Carlo Simulation - Probabilistic forecast
 */
export function monteCarloSimulation(
  historicalScores: number[],
  horizonDays: number,
  simulations: number = 1000
): ForecastResult {
  if (historicalScores.length < 5) {
    return linearExtrapolation(historicalScores, horizonDays);
  }

  const recent = historicalScores.slice(-14);
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
  const stdDev = Math.sqrt(recent.reduce((sum, v) => sum + (v - mean) ** 2, 0) / recent.length);

  // Simple random walk with drift
  const drift = (recent[recent.length - 1] - recent[0]) / recent.length;
  const finalValues: number[] = [];

  for (let sim = 0; sim < simulations; sim++) {
    let value = recent[recent.length - 1];
    for (let day = 0; day < horizonDays; day++) {
      const shock = (Math.random() * 2 - 1) * stdDev * 0.3;
      value = Math.max(0, Math.min(100, value + drift + shock));
    }
    finalValues.push(value);
  }

  finalValues.sort((a, b) => a - b);
  const median = finalValues[Math.floor(simulations / 2)];
  const p10 = finalValues[Math.floor(simulations * 0.1)];
  const p90 = finalValues[Math.floor(simulations * 0.9)];

  const confidence = Math.max(0.2, 1 - (p90 - p10) / 100);

  return {
    forecastValue: Math.round(median * 10) / 10,
    confidence: Math.round(confidence * 100) / 100,
    method: 'Monte Carlo Simulation',
    horizonDays,
    scenario: `${simulations} simulations project median of ${median.toFixed(1)} with 80% confidence interval [${p10.toFixed(1)}, ${p90.toFixed(1)}]. Daily drift: ${drift > 0 ? '+' : ''}${drift.toFixed(2)}.`,
  };
}
