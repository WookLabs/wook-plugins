/**
 * Style Dice Engine
 *
 * Deterministic style variation system using seeded PRNG.
 * Generates soft hint directives for LLM writing style diversity.
 */

// ============================================================================
// PRNG
// ============================================================================

/**
 * mulberry32 — deterministic PRNG returning values in [0, 1)
 */
export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================================
// Style Axes
// ============================================================================

/** 4 orthogonal style axes, each in [0, 1] */
export interface StyleAxes {
  /** 0=compressed, 1=expansive */
  pace: number;
  /** 0=restrained, 1=vivid */
  sensory: number;
  /** 0=sparse, 1=heavy */
  dialogue_density: number;
  /** 0=external, 1=deep */
  interiority: number;
}

/**
 * Rolls style axes from a seed.
 * variance controls deviation from 0.5 center (0=neutral, 1=full range).
 */
export function rollStyleAxes(seed: number, variance: number = 0.3): StyleAxes {
  const rng = mulberry32(seed);
  const clampedVariance = Math.min(Math.max(variance, 0), 1);
  const deviate = (raw: number) => 0.5 + (raw - 0.5) * clampedVariance;
  return {
    pace: deviate(rng()),
    sensory: deviate(rng()),
    dialogue_density: deviate(rng()),
    interiority: deviate(rng()),
  };
}

// ============================================================================
// Directive Formatting
// ============================================================================

/**
 * Converts axes to a Korean style directive string.
 */
export function formatStyleDirective(axes: StyleAxes): string {
  const describe = (value: number, low: string, mid: string, high: string) =>
    value < 0.35 ? low : value > 0.65 ? high : mid;

  const parts = [
    describe(axes.pace, '압축적이고 간결한 서술', '자연스러운 호흡의 서술', '여유롭고 확장적인 서술'),
    describe(axes.sensory, '절제된 감각 묘사', '적절한 감각 묘사', '풍부하고 선명한 감각 묘사'),
    describe(axes.dialogue_density, '대화 최소화, 서술 중심', '대화와 서술의 균형', '대화 중심의 장면 전개'),
    describe(axes.interiority, '외면 행동 중심의 관찰적 시점', '내면과 외면의 균형', '깊은 내면 탐구와 심리 묘사'),
  ];

  return `[STYLE_HINT] 이 장의 문체 방향: ${parts.join('. ')}. 이 지시는 참고 사항이며 장면에 맞게 자유롭게 조정하세요.`;
}

/**
 * Convenience wrapper: seed -> directive string
 */
export function generateStyleDirective(seed: number, variance: number = 0.3): string {
  return formatStyleDirective(rollStyleAxes(seed, variance));
}
