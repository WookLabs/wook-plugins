/**
 * Novel-Dev TypeScript Type Definitions
 * Generated from novel-dev-plan-v4.md
 */

// ============================================================================
// Project Types
// ============================================================================

export interface NovelProject {
  id: string; // Format: "novel_{YYYYMMDD}_{HHmmss}"
  title: string;
  genre: string[];
  sub_genre: string[];
  tropes: string[];
  tone: string[];
  rating: string; // e.g., "15+"
  target_chapters: number;
  target_words_per_chapter: number;
  current_chapter: number;
  status: "planning" | "writing" | "editing" | "complete" | "paused"; // SYNC: schemas/project.schema.json
  created_at: string; // ISO 8601 format
  updated_at: string; // ISO 8601 format
}

// ============================================================================
// Style Guide Types
// ============================================================================

export interface StyleGuide {
  narrative_voice: "1인칭" | "3인칭 제한 시점" | "3인칭 전지적 시점";
  pov_type: "single" | "multiple" | "omniscient";
  tense: "과거형" | "현재형";
  tone: string[];
  pacing_default: "fast" | "medium" | "slow";
  dialogue_style: string;
  description_density: "high" | "medium" | "low";
  sentence_rhythm: "short" | "long" | "mixed";
  taboo_words: string[];
  preferred_expressions: string[];
  chapter_structure: {
    opening_hook: boolean;
    scene_count_range: [number, number];
    ending_hook: boolean;
  };
}

// ============================================================================
// Plot Structure Types
// ============================================================================

export interface PlotStructure {
  structure_type: "3막" | "5막" | "영웅의여정" | "Save the Cat";
  logline: string;
  synopsis_short: string; // ~200 chars
  synopsis_long: string; // ~1000 chars
  acts: Act[];
}

export interface Act {
  act_number: number;
  name: string;
  chapters: [number, number]; // [start, end]
  purpose: string;
}

// ============================================================================
// Character Types
// ============================================================================

export interface Character {
  id: string; // Format: "char_{number}"
  name: string;
  aliases: string[];
  role: "protagonist" | "antagonist" | "supporting" | "minor";
  basic: CharacterBasic;
  background: CharacterBackground;
  inner: CharacterInner;
  behavior: CharacterBehavior;
  arc: CharacterArc;
}

export interface CharacterBasic {
  age: number;
  gender: string;
  birthday?: string;
  appearance: {
    height: string;
    build: string;
    features: string[];
  };
  voice: {
    tone: string;
    speech_pattern: string;
    vocabulary: string;
  };
}

export interface CharacterBackground {
  origin: string;
  family: string;
  education?: string;
  occupation: string;
  economic_status: string;
  trauma?: string;
  secret?: {
    content: string;
    reveal_chapter: number;
  };
}

export interface CharacterInner {
  want: string; // Surface desire
  need: string; // True need
  fatal_flaw: string;
  values: string[];
  fears: string[];
}

export interface CharacterBehavior {
  habits: string[];
  hobbies: string[];
  dislikes: string[];
  stress_response: string;
  lying_tell: string;
}

export interface CharacterArc {
  start_state: string;
  catalyst: string;
  midpoint: string;
  dark_night: string;
  transformation: string;
  end_state: string;
}

// ============================================================================
// Relationship Types
// ============================================================================

export interface Relationship {
  from: string; // Character ID (관계 주체)
  to: string; // Character ID (관계 대상)
  type: RelationshipType;
  subtype?: string; // 세부 관계 (예: 형제, 부모-자식)
  description?: string;
  dynamic?: "positive" | "negative" | "neutral" | "complex";
  evolution?: RelationshipEvolution[];
  bidirectional?: boolean;
}

export type RelationshipType =
  | "family"
  | "friend"
  | "romantic"
  | "rival"
  | "mentor"
  | "enemy"
  | "colleague"
  | "acquaintance"
  | "other";

export interface RelationshipEvolution {
  chapter: number;
  change: string;
}

// ============================================================================
// World Types
// ============================================================================

export interface World {
  era: string; // e.g., "현대", "근대", "중세", "미래"
  year?: string;
  location: {
    country: string;
    city: string;
    district?: string;
  };
  technology_level: string;
  social_context: {
    norms: string[];
    relevant_issues: string[];
  };
  special_settings?: {
    magic_system?: string;
    species?: string[];
    [key: string]: any;
  };
}

export interface Location {
  id: string; // Format: "loc_{number}"
  name: string;
  type: string; // e.g., "거주지", "직장", "공공장소"
  description: string;
  atmosphere: string;
  related_characters: string[]; // Character IDs
}

// ============================================================================
// Plot Arc Types
// ============================================================================

export interface MainArc {
  conflicts: {
    external: string;
    internal: string;
    relational: string;
  };
  dramatic_question: string;
  major_events: {
    inciting_incident: PlotEvent;
    plot_point_1: PlotEvent;
    midpoint: PlotEvent;
    plot_point_2: PlotEvent;
    climax: PlotEvent;
    resolution: PlotEvent;
  };
  theme: string;
}

export interface PlotEvent {
  chapter: number;
  description: string;
}

export interface SubArc {
  id: string; // Format: "sub_{number}"
  name: string;
  related_characters: string[]; // Character IDs
  connection_to_main: string;
  start_chapter: number;
  resolution_chapter: number;
  thematic_function: string;
  beats: PlotBeat[];
}

export interface PlotBeat {
  chapter: number;
  event: string;
}

// ============================================================================
// Foreshadowing Types
// ============================================================================

export interface Foreshadowing {
  id: string; // Format: "fore_{number}"
  content: string;
  importance: "A" | "B" | "C";
  plant_chapter: number;
  hints: number[]; // Chapter numbers
  payoff_chapter: number;
  status: "not_planted" | "planted" | "hinted" | "paid_off";
  details: {
    plant: string;
    hint_1?: string;
    hint_2?: string;
    hint_3?: string;
    payoff: string;
  };
}

// ============================================================================
// Hook Types
// ============================================================================

export interface Hook {
  id: string; // Format: "hook_{number}"
  content: string;
  plant_chapter: number;
  clues: number[]; // Chapter numbers
  reveal_chapter: number;
  reader_reaction: string;
  reveal: string;
}

export interface ChapterEndHook {
  chapter: number;
  hook: string;
  purpose: string;
}

// ============================================================================
// Chapter Types
// ============================================================================

export interface ChapterMeta {
  chapter_number: number;
  chapter_title: string;
  status: "planned" | "draft" | "edited" | "reviewed" | "final";
  word_count_target: number;
  word_count_actual?: number;
  meta: ChapterMetadata;
  context: ChapterContext;
  narrative_elements: NarrativeElements;
  scenes: Scene[];
  style_guide: ChapterStyleGuide;
}

export interface ChapterMetadata {
  pov_character: string; // Character ID
  characters: string[]; // Character IDs
  locations: string[]; // Location IDs
  in_story_time: string; // e.g., "20XX년 3월 15일 저녁"
}

export interface ChapterContext {
  previous_summary: string;
  current_plot: string;
  next_plot: string;
}

export interface NarrativeElements {
  foreshadowing_plant: string[]; // Foreshadowing IDs
  foreshadowing_payoff: string[]; // Foreshadowing IDs
  hooks_plant: string[]; // Hook IDs
  hooks_reveal: string[]; // Hook IDs
  character_development: string;
  emotional_goal: string;
}

export interface Scene {
  scene_number: number;
  purpose: string;
  characters: string[]; // Character IDs
  location: string; // Location ID
  conflict: string;
  beat: string;
}

export interface ChapterStyleGuide {
  tone: string;
  pacing: "fast" | "medium" | "slow";
  focus: string;
}

// ============================================================================
// Review & Evaluation Types
// ============================================================================

export interface InitReview {
  review_type: "init";
  scores: {
    genre_tone_consistency: number; // 0-20
    structure_appropriateness: number; // 0-20
    logline_appeal: number; // 0-20
    trope_originality: number; // 0-20
    commercial_potential: number; // 0-20
  };
  total_score: number; // 0-100
  feedback: string[];
  recommendations: string[];
}

export interface EvaluationResult {
  chapter?: number;
  act?: number;
  scores: {
    narrative_quality: number; // 0-25
    plot_consistency: number; // 0-25
    character_consistency: number; // 0-25
    setting_adherence: number; // 0-25
  };
  total_score: number; // 0-100
  grade: "S" | "A" | "B" | "C" | "F";
  feedback: string[];
}

export interface ConsistencyReport {
  check_date: string; // ISO 8601
  total_issues: number;
  issues: ConsistencyIssue[];
}

export interface ConsistencyIssue {
  id?: string;
  type: ConsistencyIssueType;
  severity: "critical" | "major" | "minor";
  description: string;
  location: {
    chapter?: number;
    scene?: number;
    context?: string;
  };
  references?: Array<{
    file?: string;
    field?: string;
    expected?: string;
    found?: string;
  }>;
  suggestion?: string;
  auto_fixable?: boolean;
}

export type ConsistencyIssueType =
  | "character_inconsistency"
  | "timeline_conflict"
  | "world_contradiction"
  | "foreshadowing_error"
  | "continuity_error"
  | "dialogue_inconsistency";

// ============================================================================
// Timeline Types
// ============================================================================

export interface Timeline {
  timeline: TimelineEntry[];
  time_jumps: TimeJump[];
  character_movements: Record<string, CharacterMovement[]>; // Character ID -> movements
}

export interface TimelineEntry {
  date: string; // Format: "YYYY-MM-DD"
  events: TimelineEvent[];
}

export interface TimelineEvent {
  chapter: number;
  time: string; // e.g., "오전", "저녁", "14:30"
  event: string;
}

export interface TimeJump {
  from_chapter: number;
  to_chapter: number;
  gap: string; // e.g., "2주", "3일"
}

export interface CharacterMovement {
  chapter: number;
  location: string;
}

// ============================================================================
// Ralph Loop State Types
// ============================================================================

export interface NovelState {
  ralph_active: boolean;
  project_id: string;
  current_act: number;
  current_chapter: number;
  act_complete: boolean;
  quality_score: number;
  retry_count: number;
  iteration: number;
  max_iterations: number;
}

// ============================================================================
// Export Statistics Types
// ============================================================================

export interface ProjectStats {
  project_id: string;
  title: string;
  status: "planning" | "writing" | "editing" | "complete";
  progress: {
    completed_chapters: number;
    target_chapters: number;
    percentage: number;
  };
  word_count: {
    total: number;
    average_per_chapter: number;
    target_percentage: number;
  };
  quality_scores: {
    recent_chapters: ChapterScore[];
    average: number;
  };
  foreshadowing: {
    planted: number;
    paid_off: number;
    overdue: number;
    next_payoff?: {
      id: string;
      chapter: number;
    };
  };
}

export interface ChapterScore {
  chapter: number;
  score: number;
}

// ============================================================================
// Utility Types
// ============================================================================

export type ChapterStatus = "planned" | "draft" | "edited" | "reviewed" | "final";
export type ProjectStatus = "planning" | "writing" | "editing" | "complete" | "paused"; // SYNC: schemas/project.schema.json
export type Importance = "A" | "B" | "C";
export type Severity = "critical" | "major" | "minor";
export type Grade = "S" | "A" | "B" | "C" | "F";
export type Pacing = "fast" | "medium" | "slow";
