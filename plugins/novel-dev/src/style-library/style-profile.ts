/**
 * Style Profile Types
 *
 * Types for reference style learning and stylometric analysis.
 * Enables extracting quantifiable style patterns from reference text
 * and using them to guide generation and evaluate style alignment.
 *
 * @module style-library/style-profile
 */

// ============================================================================
// Stylometrics (Quantifiable Style Patterns)
// ============================================================================

/**
 * Lexical diversity metrics
 *
 * Measures vocabulary richness and variation:
 * - TTR (Type-Token Ratio): unique words / total words (0-1)
 * - MTLD (Measure of Textual Lexical Diversity): typically 50-150
 */
export interface LexicalDiversity {
  /** Type-Token Ratio (0-1) - unique words / total words */
  ttr: number;
  /** Measure of Textual Lexical Diversity (typically 50-150) */
  mtld: number;
  /** Number of unique words */
  uniqueWordCount: number;
  /** Total number of words */
  totalWordCount: number;
}

/**
 * Sentence length distribution buckets
 */
export interface SentenceLengthDistribution {
  /** < 10 words (percentage 0-1) */
  short: number;
  /** 10-20 words (percentage 0-1) */
  medium: number;
  /** 20-35 words (percentage 0-1) */
  long: number;
  /** > 35 words (percentage 0-1) */
  veryLong: number;
}

/**
 * Sentence statistics metrics
 */
export interface SentenceStatistics {
  /** Average words per sentence */
  meanLength: number;
  /** Standard deviation of sentence lengths */
  stdDeviation: number;
  /** Distribution histogram buckets */
  distribution: SentenceLengthDistribution;
}

/**
 * Dialogue analysis metrics
 */
export interface DialogueMetrics {
  /** Dialogue / total content ratio (0-1) */
  dialogueRatio: number;
  /** Average words per dialogue line */
  avgDialogueLength: number;
  /** Dialogue-to-narration transitions per 1000 chars */
  dialogueToNarrationTransitions: number;
}

/**
 * Sensory word types
 */
export type SenseType = 'visual' | 'auditory' | 'tactile' | 'olfactory' | 'gustatory';

/**
 * Sensory density metrics
 */
export interface SensoryMetrics {
  /** Sensory words per 1000 chars */
  sensoryDensity: number;
  /** Dominant senses in order of frequency */
  dominantSenses: SenseType[];
}

/**
 * Rhythm and paragraph patterns
 */
export interface RhythmPatterns {
  /** Average paragraph length in words */
  paragraphLengthMean: number;
  /** Standard deviation of paragraph lengths */
  paragraphLengthStdDev: number;
  /** Coefficient of variation for sentence lengths (stdDev / mean) */
  sentenceVariation: number;
}

/**
 * Complete stylometric profile
 *
 * All quantifiable style patterns extracted from reference text.
 */
export interface Stylometrics {
  /** Vocabulary richness metrics */
  lexicalDiversity: LexicalDiversity;
  /** Sentence length patterns */
  sentenceStatistics: SentenceStatistics;
  /** Dialogue usage patterns */
  dialogueMetrics: DialogueMetrics;
  /** Sensory word usage */
  sensoryMetrics: SensoryMetrics;
  /** Rhythm and structure patterns */
  rhythmPatterns: RhythmPatterns;
}

// ============================================================================
// Qualitative Patterns
// ============================================================================

/**
 * Narrative voice options
 */
export type NarrativeVoice = 'first-person' | 'third-person-limited' | 'third-person-omniscient';

/**
 * Pacing descriptor options
 */
export type PaceDescriptor = 'slow' | 'moderate' | 'fast' | 'variable';

/**
 * Dialogue style options
 */
export type DialogueStyle = 'minimal' | 'balanced' | 'dialogue-heavy';

/**
 * Qualitative style patterns (require LLM analysis)
 */
export interface QualitativePatterns {
  /** Tone descriptors (e.g., "melancholic", "sparse", "lyrical") */
  toneDescriptors: string[];
  /** Narrative point of view */
  narrativeVoice: NarrativeVoice;
  /** Overall pacing */
  paceDescriptor: PaceDescriptor;
  /** Dialogue usage style */
  dialogueStyle: DialogueStyle;
}

// ============================================================================
// Style Constraints
// ============================================================================

/**
 * Style constraint aspects
 */
export type StyleConstraintAspect =
  | 'sentence-length'
  | 'vocabulary'
  | 'dialogue'
  | 'sensory'
  | 'rhythm';

/**
 * A constraint derived from style profile for generation guidance
 */
export interface StyleConstraint {
  /** Aspect of style this constraint targets */
  aspect: StyleConstraintAspect;
  /** Human-readable target description */
  target: string;
  /** Acceptable deviation (0-1, e.g., 0.2 = 20% tolerance) */
  tolerance: number;
}

// ============================================================================
// Style Profile
// ============================================================================

/**
 * Complete style profile for reference style learning
 *
 * Contains both quantitative (stylometrics) and qualitative patterns
 * extracted from reference text, plus generated constraints for
 * guiding prose generation.
 */
export interface StyleProfile {
  /** Unique identifier */
  id: string;
  /** Profile name (e.g., "Author X Style" or "Reference Novel Y") */
  name: string;
  /** Description of what the profile was extracted from */
  sourceDescription: string;
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** Quantitative stylometric patterns */
  stylometrics: Stylometrics;
  /** Qualitative style patterns */
  qualitativePatterns: QualitativePatterns;
  /** Generated constraints for prompts */
  constraints: StyleConstraint[];
}

// ============================================================================
// Style Match Result
// ============================================================================

/**
 * Per-aspect style match scores
 */
export interface StyleAspectScores {
  /** Lexical diversity match (0-100) */
  lexicalDiversity: number;
  /** Sentence structure match (0-100) */
  sentenceStructure: number;
  /** Dialogue balance match (0-100) */
  dialogueBalance: number;
  /** Sensory density match (0-100) */
  sensoryDensity: number;
  /** Rhythm pattern match (0-100) */
  rhythm: number;
}

/**
 * Style deviation severity levels
 */
export type DeviationSeverity = 'minor' | 'moderate' | 'major';

/**
 * A specific deviation from target style
 */
export interface StyleDeviation {
  /** Aspect that deviates */
  aspect: string;
  /** Expected value/range */
  expected: string;
  /** Actual measured value */
  actual: string;
  /** Severity of deviation */
  severity: DeviationSeverity;
  /** Suggestion for correction */
  suggestion: string;
}

/**
 * Result of comparing content against a style profile
 */
export interface StyleMatchResult {
  /** Overall match score (0-100) */
  overallMatch: number;
  /** Per-aspect scores */
  aspectScores: StyleAspectScores;
  /** Identified deviations */
  deviations: StyleDeviation[];
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new StyleProfile with default qualitative patterns
 *
 * @param id - Unique identifier
 * @param name - Profile name
 * @param sourceDescription - Description of source text
 * @param stylometrics - Computed stylometrics
 * @returns Complete StyleProfile with defaults filled
 */
export function createStyleProfile(
  id: string,
  name: string,
  sourceDescription: string,
  stylometrics: Stylometrics
): StyleProfile {
  const now = new Date().toISOString();

  // Infer qualitative patterns from stylometrics
  const dialogueStyle: DialogueStyle =
    stylometrics.dialogueMetrics.dialogueRatio < 0.2
      ? 'minimal'
      : stylometrics.dialogueMetrics.dialogueRatio > 0.5
        ? 'dialogue-heavy'
        : 'balanced';

  const paceDescriptor: PaceDescriptor =
    stylometrics.sentenceStatistics.meanLength < 12
      ? 'fast'
      : stylometrics.sentenceStatistics.meanLength > 25
        ? 'slow'
        : stylometrics.rhythmPatterns.sentenceVariation > 0.5
          ? 'variable'
          : 'moderate';

  const profile: StyleProfile = {
    id,
    name,
    sourceDescription,
    createdAt: now,
    stylometrics,
    qualitativePatterns: {
      toneDescriptors: [],
      narrativeVoice: 'third-person-limited', // Default, should be updated by LLM analysis
      paceDescriptor,
      dialogueStyle,
    },
    constraints: [],
  };

  // Generate constraints
  profile.constraints = buildStyleConstraints(profile);

  return profile;
}

/**
 * Build style constraints from a profile's stylometrics
 *
 * Generates specific constraints for each style aspect that can be
 * used in generation prompts.
 *
 * @param profile - StyleProfile to derive constraints from
 * @returns Array of style constraints
 */
export function buildStyleConstraints(profile: StyleProfile): StyleConstraint[] {
  const constraints: StyleConstraint[] = [];
  const { stylometrics } = profile;

  // Sentence length constraint
  const meanLen = stylometrics.sentenceStatistics.meanLength;
  const lenRange = Math.round(stylometrics.sentenceStatistics.stdDeviation);
  constraints.push({
    aspect: 'sentence-length',
    target: `평균 문장 길이 ${Math.round(meanLen)}단어 (범위: ${Math.max(5, Math.round(meanLen - lenRange))}-${Math.round(meanLen + lenRange)}단어)`,
    tolerance: 0.25,
  });

  // Vocabulary constraint based on TTR
  const ttr = stylometrics.lexicalDiversity.ttr;
  const vocabLevel = ttr > 0.6 ? '다양한' : ttr > 0.4 ? '보통의' : '반복적인';
  constraints.push({
    aspect: 'vocabulary',
    target: `${vocabLevel} 어휘 사용 (TTR: ${(ttr * 100).toFixed(0)}%)`,
    tolerance: 0.2,
  });

  // Dialogue constraint
  const dialogueRatio = stylometrics.dialogueMetrics.dialogueRatio;
  const dialoguePercent = Math.round(dialogueRatio * 100);
  constraints.push({
    aspect: 'dialogue',
    target: `대화 비율 약 ${dialoguePercent}% 유지`,
    tolerance: 0.3,
  });

  // Sensory constraint
  const sensoryDensity = stylometrics.sensoryMetrics.sensoryDensity;
  const dominantSenses = stylometrics.sensoryMetrics.dominantSenses.slice(0, 2);
  const senseNames: Record<SenseType, string> = {
    visual: '시각',
    auditory: '청각',
    tactile: '촉각',
    olfactory: '후각',
    gustatory: '미각',
  };
  const senseStr = dominantSenses.map(s => senseNames[s]).join(', ');
  constraints.push({
    aspect: 'sensory',
    target: `감각 밀도 ${sensoryDensity.toFixed(1)}/1000자, 주요 감각: ${senseStr || '시각'}`,
    tolerance: 0.3,
  });

  // Rhythm constraint
  const variation = stylometrics.rhythmPatterns.sentenceVariation;
  const rhythmDesc = variation > 0.5 ? '변화있는' : variation > 0.3 ? '적당한' : '일정한';
  constraints.push({
    aspect: 'rhythm',
    target: `${rhythmDesc} 문장 리듬 (변이계수: ${(variation * 100).toFixed(0)}%)`,
    tolerance: 0.25,
  });

  return constraints;
}
