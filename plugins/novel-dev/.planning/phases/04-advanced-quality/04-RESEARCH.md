# Phase 4: Advanced Quality - Research

**Researched:** 2026-02-05
**Domain:** Multi-stage revision, style emulation, emotional subtext, character voice differentiation
**Confidence:** MEDIUM (technical approaches validated, integration patterns require iteration)

## Summary

Phase 4 implements four interconnected advanced quality systems: multi-stage revision pipeline (ADVQ-01), reference style learning (ADVQ-02), emotional subtext engine (ADVQ-03), and character voice differentiation (ADVQ-04). These build directly on Phase 1-3 infrastructure: the Style Library provides exemplar storage, the Quality Oracle produces surgical directives, the Prose Surgeon executes targeted revisions, and the Korean specialization modules handle language-specific quality.

The multi-stage revision pipeline structures editing into four distinct passes: Draft (structural/content), Tone (emotional consistency), Style (prose craft), and Final (proofreading). Each stage has specific evaluation criteria and produces measurable improvement signals. This mirrors professional editing workflows (developmental -> line -> copy -> proof) adapted for AI execution.

Reference style learning extracts quantifiable patterns from author samples using stylometric metrics: sentence length distribution (mean, variance, percentiles), dialogue ratio, vocabulary complexity (TTR, MTLD), and sensory density. These become generation constraints that guide prose output toward the reference style.

The emotional subtext engine annotates dialogue scenes with hidden emotion layers using a structured schema: surface meaning, actual intention, underlying emotion, and physical manifestation cues. This addresses the "characters say exactly what they mean" AI writing failure mode.

Character voice differentiation models each character's speech patterns: vocabulary range, sentence structure preferences, verbal habits/catchphrases, and internal monologue tone. The system enforces consistency within characters and distinction between characters across chapters.

**Primary recommendation:** Implement the 4-stage revision pipeline first (ADVQ-01) as it provides the orchestration framework. Then add reference style learning (ADVQ-02) which extends the existing Style Library. Emotional subtext (ADVQ-03) and character voice (ADVQ-04) can be developed in parallel as they target different text types (dialogue vs. all prose).

## Standard Stack

This phase uses existing TypeScript infrastructure. No new external libraries required.

### Core (From Previous Phases)
| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| Quality Oracle | src/pipeline/quality-oracle.ts | Analysis and directive generation | Complete |
| Prose Surgeon | src/pipeline/prose-surgeon.ts | Directive execution with scope limits | Complete |
| Revision Loop | src/pipeline/revision-loop.ts | Oracle-Surgeon iteration | Complete |
| Style Library | src/style-library/ | Exemplar storage and retrieval | Complete |
| Directive Types | src/pipeline/types.ts | DirectiveType union, PassageLocation | Complete |
| Korean Module | src/korean/ | Honorifics, banned expressions, texture | Complete |

### New Components to Create
| Component | Type | Purpose |
|-----------|------|---------|
| `src/quality/revision-stages.ts` | TypeScript | 4-stage revision orchestration |
| `src/quality/stage-evaluators.ts` | TypeScript | Per-stage evaluation criteria |
| `src/style-library/style-analyzer.ts` | TypeScript | Extract style metrics from reference text |
| `src/style-library/style-profile.ts` | TypeScript | StyleProfile interface and matching |
| `src/subtext/subtext-engine.ts` | TypeScript | Dialogue emotion layer annotation |
| `src/subtext/types.ts` | TypeScript | SubtextAnnotation, EmotionLayer interfaces |
| `src/voice/character-voice.ts` | TypeScript | Per-character voice profile management |
| `src/voice/voice-metrics.ts` | TypeScript | Voice consistency measurement |
| `src/voice/types.ts` | TypeScript | VoiceProfile, VoiceFingerprint interfaces |
| `schemas/style-profile.schema.json` | JSON Schema | Reference style pattern schema |
| `schemas/subtext-annotation.schema.json` | JSON Schema | Dialogue subtext annotation schema |
| `schemas/voice-profile.schema.json` | JSON Schema | Character voice profile schema |

### Dependencies on Previous Phases
| Component | How Phase 4 Uses It |
|-----------|---------------------|
| `analyzeChapter()` | Base analysis extended with stage-specific criteria |
| `executeDirective()` | Surgeon invoked per stage with stage-appropriate routing |
| `runRevisionLoop()` | Wrapped by multi-stage orchestrator |
| `queryExemplars()` | Extended with style-profile matching |
| `StyleExemplar` | Extended with computed style metrics |
| `DirectiveType` | Extended with voice and subtext directive types |

## Architecture Patterns

### Recommended Project Structure

```
src/
  quality/
    index.ts                    # NEW: Quality module exports
    revision-stages.ts          # NEW: 4-stage orchestration
    stage-evaluators.ts         # NEW: Per-stage criteria
    types.ts                    # NEW: Stage-specific types
  style-library/
    style-analyzer.ts           # NEW: Extract metrics from reference
    style-profile.ts            # NEW: StyleProfile matching
    types.ts                    # EXTEND: Add StyleProfile interface
  subtext/
    index.ts                    # NEW: Subtext module exports
    subtext-engine.ts           # NEW: Emotion layer annotation
    subtext-prompts.ts          # NEW: LLM prompts for subtext
    types.ts                    # NEW: SubtextAnnotation interfaces
  voice/
    index.ts                    # NEW: Voice module exports
    character-voice.ts          # NEW: Voice profile management
    voice-metrics.ts            # NEW: Consistency measurement
    voice-prompts.ts            # NEW: LLM prompts for voice
    types.ts                    # NEW: VoiceProfile interfaces
  pipeline/
    types.ts                    # EXTEND: Add new DirectiveTypes
    quality-oracle.ts           # EXTEND: Stage-aware analysis
    prose-surgeon.ts            # EXTEND: Voice/subtext routing
schemas/
  style-profile.schema.json     # NEW
  subtext-annotation.schema.json # NEW
  voice-profile.schema.json     # NEW
```

### Pattern 1: Multi-Stage Revision Pipeline (ADVQ-01)

**What:** Four distinct revision passes with separate evaluation criteria and measurable improvement tracking.

**Stage Definitions:**

| Stage | Focus | Evaluation Criteria | Model | Temperature |
|-------|-------|---------------------|-------|-------------|
| Draft | Structure, completeness | Scene coverage, beat completion, transition presence | sonnet | 0.5 |
| Tone | Emotional consistency | Arc alignment, mood shifts, intensity calibration | opus | 0.6 |
| Style | Prose craft | Sensory density, rhythm variation, filter words, cliches | opus | 0.7 |
| Final | Surface errors | Grammar, spelling, punctuation, spacing | sonnet | 0.2 |

**Workflow:**
```
Chapter Draft
     |
     v
[Stage 1: DRAFT]
  - Check scene completeness
  - Verify beat coverage
  - Identify missing transitions
  - Fix structural issues
  - Measure: scene_coverage_ratio, beat_completion_rate
     |
     v
[Stage 2: TONE]
  - Analyze emotional arc alignment
  - Check mood consistency within scenes
  - Calibrate intensity peaks
  - Fix emotional discontinuities
  - Measure: arc_alignment_score, mood_consistency
     |
     v
[Stage 3: STYLE]
  - Apply reference style constraints (if provided)
  - Check sensory density (2+ per 500 chars)
  - Fix filter words, rhythm issues
  - Replace cliches, AI-tell expressions
  - Measure: style_match_score, craft_metrics
     |
     v
[Stage 4: FINAL]
  - Grammar and spelling check
  - Punctuation normalization
  - Korean spacing correction
  - Final polish
  - Measure: error_count, readability_score
     |
     v
Final Output (with per-stage metrics)
```

**Implementation:**
```typescript
// src/quality/revision-stages.ts
interface RevisionStage {
  name: 'draft' | 'tone' | 'style' | 'final';
  evaluator: StageEvaluator;
  directiveTypes: DirectiveType[];
  modelConfig: { model: 'opus' | 'sonnet'; temperature: number };
  maxIterations: number;
  passThreshold: number;
}

interface StageResult {
  stage: RevisionStage['name'];
  inputScore: number;
  outputScore: number;
  improvement: number;  // outputScore - inputScore
  directivesProcessed: number;
  iterations: number;
}

interface MultiStageResult {
  finalContent: string;
  stageResults: StageResult[];
  totalImprovement: number;
  passedAllStages: boolean;
}

const REVISION_STAGES: RevisionStage[] = [
  {
    name: 'draft',
    evaluator: evaluateDraftStage,
    directiveTypes: ['transition-smoothing', 'show-not-tell'],
    modelConfig: { model: 'sonnet', temperature: 0.5 },
    maxIterations: 2,
    passThreshold: 70,
  },
  {
    name: 'tone',
    evaluator: evaluateToneStage,
    directiveTypes: ['dialogue-subtext', 'voice-consistency'],
    modelConfig: { model: 'opus', temperature: 0.6 },
    maxIterations: 2,
    passThreshold: 75,
  },
  {
    name: 'style',
    evaluator: evaluateStyleStage,
    directiveTypes: [
      'filter-word-removal', 'sensory-enrichment', 'rhythm-variation',
      'cliche-replacement', 'banned-expression', 'texture-enrichment'
    ],
    modelConfig: { model: 'opus', temperature: 0.7 },
    maxIterations: 3,
    passThreshold: 80,
  },
  {
    name: 'final',
    evaluator: evaluateFinalStage,
    directiveTypes: ['proofreading', 'honorific-violation'],
    modelConfig: { model: 'sonnet', temperature: 0.2 },
    maxIterations: 1,
    passThreshold: 95,
  },
];

async function runMultiStageRevision(
  content: string,
  options: MultiStageOptions
): Promise<MultiStageResult> {
  let currentContent = content;
  const stageResults: StageResult[] = [];

  for (const stage of REVISION_STAGES) {
    const inputScore = await stage.evaluator.score(currentContent, options);

    // Run revision loop with stage-specific configuration
    const loopResult = await runRevisionLoop(currentContent, surgeonCallback, {
      maxIterations: stage.maxIterations,
      directiveFilter: (d) => stage.directiveTypes.includes(d.type),
      modelOverride: stage.modelConfig,
    });

    const outputScore = await stage.evaluator.score(loopResult.finalContent, options);

    stageResults.push({
      stage: stage.name,
      inputScore,
      outputScore,
      improvement: outputScore - inputScore,
      directivesProcessed: loopResult.totalDirectivesProcessed,
      iterations: loopResult.iterations,
    });

    currentContent = loopResult.finalContent;
  }

  return {
    finalContent: currentContent,
    stageResults,
    totalImprovement: stageResults.reduce((sum, r) => sum + r.improvement, 0),
    passedAllStages: stageResults.every((r, i) =>
      r.outputScore >= REVISION_STAGES[i].passThreshold
    ),
  };
}
```

### Pattern 2: Reference Style Learning (ADVQ-02)

**What:** Extract quantifiable style patterns from reference text and apply as generation constraints.

**Style Metrics (Stylometry-Based):**

| Metric | Computation | Use |
|--------|-------------|-----|
| Sentence Length Distribution | mean, stddev, p25/p50/p75 | Rhythm constraints |
| Vocabulary Complexity (TTR) | unique_words / total_words | Lexical diversity target |
| Vocabulary Sophistication (MTLD) | Sequential TTR stability | Vocabulary depth |
| Dialogue Ratio | dialogue_chars / total_chars | Scene balance |
| Sensory Density | sensory_words / 1000_chars | Descriptive richness |
| Punctuation Pattern | comma/period ratio, exclamation frequency | Pacing indicators |
| Paragraph Length | mean, variance | Visual rhythm |

**StyleProfile Schema:**
```typescript
// src/style-library/style-profile.ts
interface StyleProfile {
  id: string;                          // "style_author_work"
  source: {
    author: string;
    work?: string;
    sampleSize: number;                // chars analyzed
    sampleCount: number;               // number of excerpts
  };
  metrics: {
    sentenceLength: {
      mean: number;                    // Average in characters
      stddev: number;
      p25: number;                     // 25th percentile
      p50: number;                     // Median
      p75: number;                     // 75th percentile
    };
    vocabulary: {
      ttr: number;                     // Type-Token Ratio (0-1)
      mtld: number;                    // Measure of Textual Lexical Diversity
      uniqueWordsPerThousand: number;  // Normalized unique count
    };
    dialogueRatio: number;             // 0-1 (55-65% typical for fiction)
    sensoryDensity: number;            // senses per 1000 chars
    punctuationPattern: {
      commasPerSentence: number;
      exclamationRate: number;         // per 1000 chars
      questionRate: number;            // per 1000 chars
    };
    paragraphLength: {
      mean: number;                    // chars
      variance: number;
    };
  };
  qualitativeNotes?: string[];         // e.g., "short punchy dialogue", "rich nature descriptions"
  created_at: string;
}

// Analysis function
function analyzeStyleFromReference(
  samples: string[],
  sourceInfo: { author: string; work?: string }
): StyleProfile {
  const combined = samples.join('\n\n');

  return {
    id: `style_${sourceInfo.author.toLowerCase().replace(/\s+/g, '_')}`,
    source: {
      ...sourceInfo,
      sampleSize: combined.length,
      sampleCount: samples.length,
    },
    metrics: {
      sentenceLength: computeSentenceLengthStats(combined),
      vocabulary: computeVocabularyMetrics(combined),
      dialogueRatio: computeDialogueRatio(combined),
      sensoryDensity: computeSensoryDensity(combined),
      punctuationPattern: computePunctuationPattern(combined),
      paragraphLength: computeParagraphStats(combined),
    },
    created_at: new Date().toISOString(),
  };
}
```

**Style Matching for Generation:**
```typescript
// Integration with Style Library retrieval
interface StyleMatchOptions {
  referenceProfile?: StyleProfile;     // Target style to match
  tolerances?: {
    sentenceLengthVariance: number;    // How much deviation allowed (default: 0.3)
    vocabularyComplexity: number;      // TTR tolerance (default: 0.1)
    dialogueRatioTolerance: number;    // (default: 0.1)
  };
}

function buildStyleConstraints(profile: StyleProfile): string {
  const s = profile.metrics.sentenceLength;
  const v = profile.metrics.vocabulary;

  return `
## Style Constraints (Reference: ${profile.source.author})

### Sentence Structure
- Target sentence length: ${s.mean.toFixed(0)} chars (range: ${s.p25.toFixed(0)}-${s.p75.toFixed(0)})
- Vary between short (${s.p25.toFixed(0)} chars) and long (${s.p75.toFixed(0)} chars)
- Standard deviation target: ${s.stddev.toFixed(1)}

### Vocabulary
- Lexical diversity (TTR): ${(v.ttr * 100).toFixed(1)}%
- Aim for ${v.uniqueWordsPerThousand.toFixed(0)} unique words per 1000 characters
- Vocabulary sophistication: ${v.mtld > 80 ? 'High' : v.mtld > 50 ? 'Medium' : 'Accessible'}

### Dialogue Balance
- Target dialogue ratio: ${(profile.metrics.dialogueRatio * 100).toFixed(0)}%
- ${profile.metrics.dialogueRatio > 0.6 ? 'Dialogue-heavy style' : profile.metrics.dialogueRatio < 0.4 ? 'Narration-focused style' : 'Balanced dialogue/narration'}

### Sensory Richness
- Target: ${profile.metrics.sensoryDensity.toFixed(1)} sensory details per 1000 chars
`;
}
```

### Pattern 3: Emotional Subtext Engine (ADVQ-03)

**What:** Annotate dialogue scenes with hidden emotion layers that inform prose generation.

**Subtext Annotation Schema:**
```typescript
// src/subtext/types.ts
interface SubtextAnnotation {
  dialogueId: string;                  // Reference to dialogue in scene
  speakerId: string;
  listenerId: string;

  surfaceLevel: {
    text: string;                      // What the character literally says
    topic: string;                     // Apparent subject matter
  };

  subtextLayers: EmotionLayer[];       // 1-3 layers of hidden meaning

  physicalManifestations: {
    bodyLanguage: string[];            // "clenched jaw", "avoided eye contact"
    actionBeats: string[];             // "fidgeted with ring", "turned away"
    vocalCues: string[];               // "voice dropped", "words came too fast"
  };

  narrativeFunction: 'reveal' | 'conceal' | 'deflect' | 'test' | 'manipulate';
}

interface EmotionLayer {
  level: number;                       // 1 = primary subtext, 2 = deeper, 3 = deepest
  actualIntention: string;             // What character is really trying to do
  underlyingEmotion: string;           // The emotion beneath
  hiddenContext: string;               // What they're NOT saying
  tellSigns: string[];                 // How this manifests subtly
}

// Example
const exampleSubtext: SubtextAnnotation = {
  dialogueId: 'ch5_scene2_d3',
  speakerId: 'char_minji',
  listenerId: 'char_junho',
  surfaceLevel: {
    text: '"It's fine. I don't mind."',
    topic: 'Schedule change',
  },
  subtextLayers: [
    {
      level: 1,
      actualIntention: 'Avoid conflict',
      underlyingEmotion: 'Disappointment',
      hiddenContext: 'Had been looking forward to the original plan',
      tellSigns: ['too-quick response', 'didn\'t meet eyes'],
    },
    {
      level: 2,
      actualIntention: 'Test his reaction',
      underlyingEmotion: 'Fear of not being prioritized',
      hiddenContext: 'Wondering if he cares enough to notice her disappointment',
      tellSigns: ['slight pause before "fine"', 'voice slightly flat'],
    },
  ],
  physicalManifestations: {
    bodyLanguage: ['shoulders dropped slightly', 'hands clasped together'],
    actionBeats: ['turned to look out window', 'started organizing papers unnecessarily'],
    vocalCues: ['voice even and controlled', 'spoke more quietly than usual'],
  },
  narrativeFunction: 'conceal',
};
```

**Subtext Generation:**
```typescript
// src/subtext/subtext-engine.ts
interface SubtextContext {
  scene: SceneV5;
  characters: CharacterProfile[];
  relationshipDynamics: RelationshipInfo[];
  sceneGoals: string[];
  emotionalStakes: string;
}

async function annotateDialogueSubtext(
  dialogue: DialogueLine,
  context: SubtextContext
): Promise<SubtextAnnotation> {
  const speaker = context.characters.find(c => c.id === dialogue.speakerId);
  const listener = context.characters.find(c => c.id === dialogue.listenerId);
  const relationship = context.relationshipDynamics.find(
    r => r.includes(speaker?.id) && r.includes(listener?.id)
  );

  // Build prompt for LLM subtext analysis
  const prompt = buildSubtextPrompt(dialogue, speaker, listener, relationship, context);

  // Invoke LLM for subtext annotation
  const annotation = await invokeSubtextAnalysis(prompt);

  return annotation;
}

function buildSubtextPrompt(
  dialogue: DialogueLine,
  speaker: CharacterProfile,
  listener: CharacterProfile,
  relationship: RelationshipInfo,
  context: SubtextContext
): string {
  return `
# Subtext Analysis Task

## Dialogue
"${dialogue.text}"

## Context
- Speaker: ${speaker.name} (${speaker.personality}, ${speaker.currentEmotionalState})
- Listener: ${listener.name}
- Relationship: ${relationship.description}
- Scene goal: ${context.sceneGoals.join(', ')}
- Emotional stakes: ${context.emotionalStakes}

## Instructions
Analyze what lies beneath this dialogue. People rarely say exactly what they mean.

1. What is the speaker ACTUALLY trying to communicate?
2. What emotion are they hiding or suppressing?
3. What are they deliberately NOT saying?
4. How would this manifest physically? (body language, action beats, vocal cues)

## Output Format (JSON)
{
  "actualIntention": "...",
  "underlyingEmotion": "...",
  "hiddenContext": "...",
  "physicalManifestations": {
    "bodyLanguage": ["..."],
    "actionBeats": ["..."],
    "vocalCues": ["..."]
  }
}
`;
}
```

### Pattern 4: Character Voice Differentiation (ADVQ-04)

**What:** Model and enforce distinct speech patterns for each character.

**Voice Profile Schema:**
```typescript
// src/voice/types.ts
interface VoiceProfile {
  characterId: string;
  characterName: string;

  speechPatterns: {
    sentenceStructure: {
      preferredLength: 'short' | 'medium' | 'long' | 'varied';
      complexityLevel: 'simple' | 'moderate' | 'complex';
      fragmentUsage: 'never' | 'rare' | 'occasional' | 'frequent';
    };
    vocabulary: {
      register: 'colloquial' | 'standard' | 'formal' | 'literary';
      technicalTerms?: string[];        // Domain-specific words they use
      avoidedWords?: string[];          // Words they would never say
      favoredExpressions: string[];     // Pet phrases
    };
    verbalHabits: {
      fillers: string[];                // "um", "like", "you know"
      catchphrases: string[];           // Signature expressions
      exclamations: string[];           // "Oh my!", "Damn!", "Heavens!"
      hedging: 'none' | 'minimal' | 'moderate' | 'heavy';
    };
    rhythm: {
      tempo: 'slow' | 'moderate' | 'fast' | 'variable';
      pauseUsage: 'rare' | 'occasional' | 'frequent';
      interruption: 'never' | 'sometimes' | 'often';
    };
  };

  internalMonologue: {
    style: 'stream-of-consciousness' | 'analytical' | 'emotional' | 'sparse';
    selfAddressing: 'first-person' | 'second-person' | 'none';
    tangentFrequency: 'low' | 'medium' | 'high';
  };

  linguisticMarkers: {
    honorificDefault: 'haeche' | 'haeyoche' | 'hapsyoche';  // From Phase 3
    dialectFeatures?: string[];         // Regional speech patterns
    educationSignals: string[];         // Vocabulary indicating education level
  };

  voiceFingerprint: VoiceFingerprint;   // Quantitative metrics
}

interface VoiceFingerprint {
  avgSentenceLength: number;
  vocabularyComplexity: number;         // 0-1 scale
  dialogueToNarrationRatio: number;     // For this character's scenes
  exclamationFrequency: number;         // per 1000 chars
  questionFrequency: number;            // per 1000 chars
  fillerWordDensity: number;            // per 1000 chars
}
```

**Voice Consistency Checking:**
```typescript
// src/voice/voice-metrics.ts
interface VoiceConsistencyResult {
  characterId: string;
  overallScore: number;                 // 0-100
  deviations: VoiceDeviation[];
  recommendations: string[];
}

interface VoiceDeviation {
  location: PassageLocation;
  aspect: 'vocabulary' | 'structure' | 'habit' | 'rhythm' | 'monologue';
  expected: string;
  found: string;
  severity: 'minor' | 'moderate' | 'major';
}

function analyzeVoiceConsistency(
  content: string,
  characterId: string,
  profile: VoiceProfile,
  dialogueAttributions: DialogueAttribution[]
): VoiceConsistencyResult {
  const deviations: VoiceDeviation[] = [];

  // Extract this character's dialogue
  const characterDialogue = dialogueAttributions
    .filter(d => d.speakerId === characterId)
    .map(d => ({ text: d.text, position: d.position }));

  for (const dialogue of characterDialogue) {
    // Check vocabulary
    const vocabDeviations = checkVocabularyConsistency(
      dialogue.text,
      profile.speechPatterns.vocabulary
    );
    deviations.push(...vocabDeviations.map(d => ({
      ...d,
      location: findPassageLocation(content, dialogue.position),
    })));

    // Check verbal habits
    const habitDeviations = checkVerbalHabits(
      dialogue.text,
      profile.speechPatterns.verbalHabits
    );
    deviations.push(...habitDeviations.map(d => ({
      ...d,
      location: findPassageLocation(content, dialogue.position),
    })));

    // Check sentence structure
    const structureDeviations = checkSentenceStructure(
      dialogue.text,
      profile.speechPatterns.sentenceStructure
    );
    deviations.push(...structureDeviations.map(d => ({
      ...d,
      location: findPassageLocation(content, dialogue.position),
    })));
  }

  // Calculate overall score
  const severityWeights = { minor: 1, moderate: 3, major: 5 };
  const deviationScore = deviations.reduce(
    (sum, d) => sum + severityWeights[d.severity], 0
  );
  const maxScore = characterDialogue.length * 15; // Max penalty
  const overallScore = Math.max(0, 100 - (deviationScore / maxScore * 100));

  return {
    characterId,
    overallScore,
    deviations,
    recommendations: generateVoiceRecommendations(deviations, profile),
  };
}
```

**Voice-Consistent Generation:**
```typescript
function buildVoiceConstraintPrompt(profile: VoiceProfile): string {
  const sp = profile.speechPatterns;
  const vh = sp.verbalHabits;

  return `
## Character Voice: ${profile.characterName}

### Speech Patterns
- Sentence preference: ${sp.sentenceStructure.preferredLength} sentences, ${sp.sentenceStructure.complexityLevel} complexity
- Fragments: ${sp.sentenceStructure.fragmentUsage}
- Register: ${sp.vocabulary.register}
- Speaking tempo: ${sp.rhythm.tempo}

### Verbal Habits (MUST USE)
- Catchphrases: ${vh.catchphrases.join(', ') || 'none'}
- Typical fillers: ${vh.fillers.join(', ') || 'none'}
- Exclamations: ${vh.exclamations.join(', ') || 'varies'}
- Hedging level: ${vh.hedging}

### Vocabulary Markers
- Favored expressions: ${sp.vocabulary.favoredExpressions.join(', ')}
- NEVER uses: ${sp.vocabulary.avoidedWords?.join(', ') || 'none specified'}
${sp.vocabulary.technicalTerms ? `- Technical terms: ${sp.vocabulary.technicalTerms.join(', ')}` : ''}

### Internal Monologue (if applicable)
- Style: ${profile.internalMonologue.style}
- Self-addressing: ${profile.internalMonologue.selfAddressing}

This character must sound DISTINCT from others. Their voice is recognizable.
`;
}
```

### Anti-Patterns to Avoid

- **All-at-once revision:** Never process all 4 stages simultaneously. Each stage builds on the previous.
- **Generic style metrics:** Don't use vague "style similarity" - use specific quantifiable metrics.
- **Subtext everywhere:** Not all dialogue needs subtext. Save it for emotionally significant moments.
- **Over-distinctive voices:** Don't make voices so distinct they become caricatures. Subtlety matters.
- **Ignoring context:** Character voice shifts based on context (formal settings, emotional states). The profile is a baseline, not a straitjacket.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sentence splitting | Custom regex | Phase 2 sentence detection | Korean sentence boundaries are complex |
| Token counting | New counter | Existing `estimateTokens()` | Already handles Korean |
| Dialogue extraction | Simple quotes | Existing `countFilterWords()` quote detection | Handles Korean quotes |
| Stage orchestration | Custom loop | Extend `runRevisionLoop()` | Already has circuit breaker, tracking |
| Vocabulary metrics | From scratch | Adapt research formulas (TTR, MTLD) | Validated metrics |

**Key insight:** Phase 4 extends existing infrastructure rather than replacing it. The Quality Oracle, Prose Surgeon, and Revision Loop remain the core - we add stage awareness, style profiles, subtext annotations, and voice profiles as enrichments.

## Common Pitfalls

### Pitfall 1: Stage Improvement Regression
**What goes wrong:** Style stage undoes improvements from Tone stage
**Why it happens:** Stages operate independently without preserving previous gains
**How to avoid:**
- Each stage only produces directives for its designated types
- Never allow a stage to rewrite outside its scope
- Track per-stage metrics to detect regression
**Warning signs:** Total score drops between stages; earlier fixes are reverted

### Pitfall 2: Over-Constrained Style Matching
**What goes wrong:** Prose becomes mechanical trying to hit exact metrics
**Why it happens:** Treating style metrics as hard constraints rather than guidelines
**How to avoid:**
- Use tolerance ranges, not exact targets
- Style metrics are soft constraints (influence, don't mandate)
- Natural variation is expected and healthy
**Warning signs:** Prose feels forced; sentences feel artificially constructed

### Pitfall 3: Subtext Overload
**What goes wrong:** Every dialogue line drips with hidden meaning; exhausting to read
**Why it happens:** Applying subtext engine to all dialogue indiscriminately
**How to avoid:**
- Reserve subtext annotation for emotionally significant scenes
- Maximum 30-40% of dialogue should have explicit subtext
- Some exchanges should be straightforward
**Warning signs:** Readers feel every conversation is loaded; characters seem manipulative

### Pitfall 4: Voice Homogenization Under Revision
**What goes wrong:** Revision passes smooth out distinctive voice features
**Why it happens:** General quality criteria favor "correct" over "distinctive"
**How to avoid:**
- Voice profile overrides general quality directives
- Character-specific vocabulary is protected from "cliche" detection
- Catchphrases exempt from repetition flagging
**Warning signs:** Characters sound more alike after revision; voice scores drop

### Pitfall 5: Metric Computation Errors for Korean
**What goes wrong:** TTR and sentence length metrics are skewed for Korean text
**Why it happens:** Korean doesn't have clear word boundaries like English
**How to avoid:**
- Use character-based metrics, not word-based
- Sentence splitting uses Korean-specific patterns (`.`, `!`, `?`, `。`)
- Vocabulary analysis uses morphological awareness
**Warning signs:** Metrics are outliers compared to known references; scores don't match human judgment

### Pitfall 6: Subtext Without Physical Manifestation
**What goes wrong:** Characters have hidden emotions but no physical tells
**Why it happens:** Subtext annotation stops at the emotion layer
**How to avoid:**
- Every SubtextAnnotation MUST have physicalManifestations populated
- Prose Surgeon incorporates body language when writing dialogue
- Verify physical cues appear in generated text
**Warning signs:** Dialogue feels flat despite subtext annotations; readers can't detect hidden emotions

## Code Examples

### Stage Evaluator Implementation
```typescript
// src/quality/stage-evaluators.ts
interface StageEvaluator {
  name: string;
  score(content: string, options: EvaluatorOptions): Promise<number>;
  generateDirectives(content: string, options: EvaluatorOptions): Promise<SurgicalDirective[]>;
}

const DraftStageEvaluator: StageEvaluator = {
  name: 'draft',

  async score(content: string, options: EvaluatorOptions): Promise<number> {
    const scenes = options.scenes || [];
    let score = 100;

    // Check scene coverage
    const sceneCoverage = calculateSceneCoverage(content, scenes);
    if (sceneCoverage < 1.0) {
      score -= (1 - sceneCoverage) * 30; // -30 max for missing scenes
    }

    // Check transitions
    const transitionGaps = detectTransitionGaps(content, scenes);
    score -= transitionGaps.length * 5; // -5 per gap

    // Check beat completion
    const beatCompletion = calculateBeatCompletion(content, scenes);
    if (beatCompletion < 0.9) {
      score -= (0.9 - beatCompletion) * 20;
    }

    return Math.max(0, score);
  },

  async generateDirectives(content: string, options: EvaluatorOptions): Promise<SurgicalDirective[]> {
    const directives: SurgicalDirective[] = [];
    const transitionGaps = detectTransitionGaps(content, options.scenes || []);

    for (const gap of transitionGaps) {
      directives.push(createDirective(
        'transition-smoothing',
        2,
        gap.location,
        `Abrupt transition between scene ${gap.fromScene} and ${gap.toScene}`,
        gap.currentText,
        `Smooth the transition: ${gap.suggestion}`,
        2
      ));
    }

    return directives.slice(0, 3); // Max 3 per stage
  },
};

const ToneStageEvaluator: StageEvaluator = {
  name: 'tone',

  async score(content: string, options: EvaluatorOptions): Promise<number> {
    const scenes = options.scenes || [];
    let score = 100;

    // Check emotional arc alignment
    for (const scene of scenes) {
      const sceneText = extractSceneText(content, scene.scene_number);
      const arcScore = analyzeEmotionalArcAlignment(sceneText, scene);
      if (arcScore < 70) {
        score -= (70 - arcScore) / scenes.length;
      }
    }

    // Check mood consistency
    const moodInconsistencies = detectMoodInconsistencies(content, scenes);
    score -= moodInconsistencies.length * 3;

    return Math.max(0, score);
  },

  async generateDirectives(content: string, options: EvaluatorOptions): Promise<SurgicalDirective[]> {
    const directives: SurgicalDirective[] = [];

    // Generate subtext directives for flat dialogue
    const flatDialogue = detectFlatDialogue(content, options.subtextAnnotations || []);
    for (const flat of flatDialogue.slice(0, 2)) {
      directives.push(createDirective(
        'dialogue-subtext',
        3,
        flat.location,
        'Dialogue lacks emotional depth; characters say exactly what they mean',
        flat.currentText,
        `Add subtext: ${flat.suggestedSubtext}`,
        2
      ));
    }

    return directives;
  },
};

const StyleStageEvaluator: StageEvaluator = {
  name: 'style',

  async score(content: string, options: EvaluatorOptions): Promise<number> {
    // Leverage existing Quality Oracle analysis
    const oracleResult = analyzeChapter(content, options.sceneCount, {
      assessKoreanTexture: true,
      detectBannedExpressions: true,
    });

    // Base score from oracle assessment
    let score = (
      oracleResult.assessment.proseQuality.score +
      oracleResult.assessment.sensoryGrounding.score +
      oracleResult.assessment.rhythmVariation.score
    ) / 3;

    // Add style profile matching if provided
    if (options.styleProfile) {
      const styleMatch = computeStyleMatch(content, options.styleProfile);
      score = (score * 0.7) + (styleMatch * 0.3);
    }

    return score;
  },

  async generateDirectives(content: string, options: EvaluatorOptions): Promise<SurgicalDirective[]> {
    const oracleResult = analyzeChapter(content, options.sceneCount, {
      assessKoreanTexture: true,
      detectBannedExpressions: true,
    });

    // Filter to style-relevant directives
    return oracleResult.directives.filter(d =>
      ['filter-word-removal', 'sensory-enrichment', 'rhythm-variation',
       'cliche-replacement', 'banned-expression', 'texture-enrichment'].includes(d.type)
    );
  },
};

const FinalStageEvaluator: StageEvaluator = {
  name: 'final',

  async score(content: string, options: EvaluatorOptions): Promise<number> {
    let score = 100;

    // Check proofreading issues
    const proofIssues = detectProofreadingIssues(content);
    score -= proofIssues.length * 2;

    // Check honorific consistency
    if (options.honorificMatrix) {
      const honorificResult = analyzeChapter(content, options.sceneCount, {
        honorificMatrix: options.honorificMatrix,
        dialogueAttributions: options.dialogueAttributions,
      });
      if (honorificResult.assessment.honorificConsistency) {
        score -= honorificResult.assessment.honorificConsistency.violations.length * 5;
      }
    }

    return Math.max(0, score);
  },

  async generateDirectives(content: string, options: EvaluatorOptions): Promise<SurgicalDirective[]> {
    const directives: SurgicalDirective[] = [];

    const proofIssues = detectProofreadingIssues(content);
    for (const issue of proofIssues.slice(0, 5)) {
      directives.push(createDirective(
        'proofreading',
        1,
        issue.location,
        issue.description,
        issue.currentText,
        issue.suggestion,
        1
      ));
    }

    return directives;
  },
};
```

### Style Analysis Implementation
```typescript
// src/style-library/style-analyzer.ts
function computeSentenceLengthStats(content: string): StyleProfile['metrics']['sentenceLength'] {
  // Korean sentence splitting
  const sentences = content
    .split(/[.!?。！？]\s*/)
    .filter(s => s.trim().length > 0);

  const lengths = sentences.map(s => s.length);
  const sorted = [...lengths].sort((a, b) => a - b);

  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / lengths.length;

  return {
    mean,
    stddev: Math.sqrt(variance),
    p25: sorted[Math.floor(sorted.length * 0.25)],
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p75: sorted[Math.floor(sorted.length * 0.75)],
  };
}

function computeVocabularyMetrics(content: string): StyleProfile['metrics']['vocabulary'] {
  // For Korean, use character-based tokens (simple approach)
  // More sophisticated: use morphological analysis
  const words = content.match(/[가-힣]+/g) || [];
  const totalWords = words.length;
  const uniqueWords = new Set(words).size;

  const ttr = uniqueWords / totalWords;

  // MTLD: Measure of Textual Lexical Diversity
  // Simplified computation: average TTR over sliding windows
  const mtld = computeMTLD(words);

  return {
    ttr,
    mtld,
    uniqueWordsPerThousand: (uniqueWords / content.length) * 1000,
  };
}

function computeMTLD(words: string[]): number {
  const FACTOR_THRESHOLD = 0.72; // Standard MTLD threshold
  let factors = 0;
  let factorLength = 0;
  let seenWords = new Set<string>();

  for (const word of words) {
    seenWords.add(word);
    factorLength++;

    const currentTTR = seenWords.size / factorLength;
    if (currentTTR <= FACTOR_THRESHOLD) {
      factors++;
      seenWords.clear();
      factorLength = 0;
    }
  }

  // Handle incomplete factor at end
  if (factorLength > 0) {
    const currentTTR = seenWords.size / factorLength;
    const partialFactor = (1 - currentTTR) / (1 - FACTOR_THRESHOLD);
    factors += partialFactor;
  }

  return factors > 0 ? words.length / factors : words.length;
}

function computeDialogueRatio(content: string): number {
  // Korean dialogue markers: "", 「」, ""
  const dialogueMatches = content.match(/[""][^""]+[""]|「[^」]+」|"[^"]+"/g) || [];
  const dialogueChars = dialogueMatches.reduce((sum, d) => sum + d.length, 0);
  return dialogueChars / content.length;
}

function computeSensoryDensity(content: string): number {
  // Reuse existing SENSORY_CATEGORIES from quality-oracle.ts
  const senseCount = countUniqueSenses(content);
  return (senseCount.count / content.length) * 1000;
}
```

### New Directive Types
```typescript
// Extension to src/pipeline/types.ts
export type DirectiveType =
  // Existing (Phase 2-3)
  | 'show-not-tell'
  | 'filter-word-removal'
  | 'sensory-enrichment'
  | 'rhythm-variation'
  | 'dialogue-subtext'
  | 'cliche-replacement'
  | 'transition-smoothing'
  | 'voice-consistency'
  | 'proofreading'
  | 'honorific-violation'
  | 'banned-expression'
  | 'texture-enrichment'
  // NEW (Phase 4)
  | 'style-alignment'           // Match reference style profile
  | 'subtext-injection'         // Add emotional subtext to dialogue
  | 'voice-drift'               // Fix character voice deviation
  | 'arc-alignment';            // Fix emotional arc misalignment

// New model routing entries
const PHASE_4_MODEL_ROUTING: Partial<Record<DirectiveType, { model: 'opus' | 'sonnet'; temperature: number }>> = {
  'style-alignment': { model: 'opus', temperature: 0.6 },
  'subtext-injection': { model: 'opus', temperature: 0.7 },
  'voice-drift': { model: 'opus', temperature: 0.5 },
  'arc-alignment': { model: 'opus', temperature: 0.6 },
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single revision pass | Multi-stage pipeline (4 passes) | Professional editing workflow | Each stage has clear focus; measurable improvement |
| "Match this author's style" | Quantifiable stylometric profiles | Computational stylometry (TTR, MTLD) | Objective style constraints |
| On-the-nose dialogue | Subtext annotation schema | Fiction writing craft literature | Characters gain psychological depth |
| Generic character dialogue | Voice profiles with fingerprints | Character voice differentiation research | Each character sounds distinct |
| Manual style matching | Style profile extraction + matching | This phase | Data-driven style emulation |

**Deprecated/outdated:**
- Simple "write like Author X" instructions (too vague)
- Single-metric vocabulary measures (TTR alone is insufficient)
- Manual character voice tracking (error-prone at scale)

## Open Questions

1. **Style Profile Sample Size**
   - What we know: More samples = better profile; diminishing returns exist
   - What's unclear: Optimal number of excerpts per author (3? 5? 10?)
   - Recommendation: Start with 5 excerpts (10,000+ chars total); validate with native reader

2. **Subtext Annotation Automation**
   - What we know: LLM can generate subtext annotations; quality varies
   - What's unclear: How much human curation is needed
   - Recommendation: LLM generates draft annotations; provide manual override capability

3. **Voice Profile Initialization**
   - What we know: Profiles need initial data before consistency checking
   - What's unclear: How to bootstrap profiles for new characters
   - Recommendation: Generate initial profile from character description + first major scene; refine over chapters

4. **Stage Threshold Calibration**
   - What we know: Thresholds (70/75/80/95) are initial estimates
   - What's unclear: Optimal thresholds for different genres
   - Recommendation: Track metrics across projects; adjust per-genre

5. **Cross-Stage Dependency Management**
   - What we know: Later stages should not undo earlier work
   - What's unclear: How to detect and prevent regression
   - Recommendation: Freeze paragraphs that passed specific checks; track per-paragraph stage history

## Sources

### Primary (HIGH confidence)
- Existing codebase: quality-oracle.ts, prose-surgeon.ts, revision-loop.ts, style-library/
- Phase 2 RESEARCH.md: Directive system, surgical revision pattern
- Phase 3 RESEARCH.md: Korean specialization integration points

### Secondary (MEDIUM confidence)
- [Taylor & Francis - Stylometric Analysis 2025](https://www.tandfonline.com/doi/full/10.1080/23311983.2025.2553162): TTR, Herdan's C, Flesch-Kincaid metrics
- [Industrial Scripts - How to Write Subtext](https://industrialscripts.com/how-to-write-subtext/): Hemingway iceberg theory, subtext techniques
- [Author's Pathway - Dialogue Differentiation](https://authorspathway.com/writing-process/writing/why-your-characters-sound-the-same-a-guide-to-dialogue-differentiation/): Character voice patterns
- [Writers Digest - Subtext and Dramatic Tension](https://www.writersdigest.com/write-better-fiction/how-to-use-subtext-and-the-art-of-dramatic-tension-in-fiction): Emotional layers in dialogue
- [Aliventures - Three Stages of Editing](https://www.aliventures.com/three-stages-editing/): Professional editing workflow stages
- [Reedsy - Types of Editing](https://reedsy.com/blog/guide/editing/): Developmental, line, copy, proof stages

### Tertiary (LOW confidence - needs validation)
- Exact thresholds for stage pass criteria
- Optimal number of subtext layers (1-3 proposed)
- Voice profile feature weights for consistency scoring

## Metadata

**Confidence breakdown:**
- Multi-stage revision (ADVQ-01): HIGH - Mirrors established editing workflow
- Reference style learning (ADVQ-02): MEDIUM - Metrics validated, application to Korean needs testing
- Emotional subtext (ADVQ-03): MEDIUM - Techniques documented, LLM automation quality TBD
- Character voice (ADVQ-04): MEDIUM - Patterns identified, quantification approach novel
- Pitfalls: HIGH - Derived from established pitfall patterns

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (30 days - novel patterns, needs implementation validation)
