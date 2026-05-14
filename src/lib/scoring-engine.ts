// Index definitions with signal weights and decay factors
export const INDICES: Record<string, {
  name: string;
  decayLambda: number;
  signals: { name: string; weight: number }[];
}> = {
  'us-iran-tension': {
    name: 'US-Iran Tension Index',
    decayLambda: 0.92,
    signals: [
      { name: 'sanctions', weight: 0.20 },
      { name: 'military_deployments', weight: 0.20 },
      { name: 'proxy_attacks', weight: 0.15 },
      { name: 'diplomatic_statements', weight: 0.10 },
      { name: 'nuclear_developments', weight: 0.15 },
      { name: 'hormuz_incidents', weight: 0.10 },
      { name: 'cyber_attacks', weight: 0.10 },
    ],
  },
  'warfare-tech-acceleration': {
    name: 'Global Warfare Technology Acceleration',
    decayLambda: 0.95,
    signals: [
      { name: 'weapons_tests', weight: 0.20 },
      { name: 'budget_increases', weight: 0.15 },
      { name: 'tech_breakthroughs', weight: 0.20 },
      { name: 'hypersonic_tests', weight: 0.15 },
      { name: 'drone_advances', weight: 0.15 },
      { name: 'arms_race_indicators', weight: 0.15 },
    ],
  },
  'military-contract-activity': {
    name: 'Major Military Contract Activity',
    decayLambda: 0.90,
    signals: [
      { name: 'contract_announcements', weight: 0.25 },
      { name: 'dollar_volume', weight: 0.25 },
      { name: 'contractor_count', weight: 0.15 },
      { name: 'multi_year_deals', weight: 0.15 },
      { name: 'emerging_vendors', weight: 0.10 },
      { name: 'fms_deals', weight: 0.10 },
    ],
  },
  'regional-conflict-risk': {
    name: 'Regional Conflict Risk',
    decayLambda: 0.88,
    signals: [
      { name: 'armed_clashes', weight: 0.25 },
      { name: 'troop_movements', weight: 0.15 },
      { name: 'diplomatic_breakdowns', weight: 0.10 },
      { name: 'civilian_casualties', weight: 0.15 },
      { name: 'alliance_shifts', weight: 0.10 },
      { name: 'resource_disputes', weight: 0.10 },
      { name: 'escalation_indicators', weight: 0.15 },
    ],
  },
  'strategic-surprise': {
    name: 'Strategic Surprise Probability',
    decayLambda: 0.85,
    signals: [
      { name: 'unusual_movements', weight: 0.20 },
      { name: 'comms_blackouts', weight: 0.15 },
      { name: 'leadership_changes', weight: 0.10 },
      { name: 'economic_shocks', weight: 0.10 },
      { name: 'intelligence_warnings', weight: 0.15 },
      { name: 'pattern_deviations', weight: 0.15 },
      { name: 'alliance_changes', weight: 0.15 },
    ],
  },
};

// Thresholds
export const THRESHOLDS = {
  LOW: { min: 0, max: 25, color: '#22c55e', label: 'Low' },
  ELEVATED: { min: 26, max: 50, color: '#eab308', label: 'Elevated' },
  HIGH: { min: 51, max: 75, color: '#f97316', label: 'High' },
  CRITICAL: { min: 76, max: 100, color: '#ce2d48', label: 'Critical' },
};

export type ThresholdKey = keyof typeof THRESHOLDS;
export type Threshold = typeof THRESHOLDS[ThresholdKey];

/**
 * Calculate an index score from signal values (0-100 each)
 */
export function calculateIndexScore(indexName: string, signals: Record<string, number>): number {
  const indexDef = INDICES[indexName];
  if (!indexDef) return 0;

  let weightedSum = 0;
  for (const sig of indexDef.signals) {
    const value = signals[sig.name] ?? 0;
    weightedSum += value * sig.weight;
  }

  return Math.min(100, Math.max(0, Math.round(weightedSum * 10) / 10));
}

/**
 * Get the threshold level for a given score
 */
export function getThreshold(score: number): Threshold {
  if (score >= THRESHOLDS.CRITICAL.min) return THRESHOLDS.CRITICAL;
  if (score >= THRESHOLDS.HIGH.min) return THRESHOLDS.HIGH;
  if (score >= THRESHOLDS.ELEVATED.min) return THRESHOLDS.ELEVATED;
  return THRESHOLDS.LOW;
}

/**
 * Apply exponential decay to a score based on previous score and lambda
 */
export function applyDecay(currentScore: number, previousScore: number, lambda: number): number {
  return Math.round((currentScore * lambda + previousScore * (1 - lambda)) * 10) / 10;
}

/**
 * Get the decay lambda for a given index
 */
export function getDecayLambda(indexName: string): number {
  return INDICES[indexName]?.decayLambda ?? 0.90;
}

/**
 * Get all index keys
 */
export function getIndexKeys(): string[] {
  return Object.keys(INDICES);
}

/**
 * Get formatted index name
 */
export function getIndexName(indexKey: string): string {
  return INDICES[indexKey]?.name ?? indexKey;
}

/**
 * Get signals for a given index
 */
export function getIndexSignals(indexKey: string) {
  return INDICES[indexKey]?.signals ?? [];
}
