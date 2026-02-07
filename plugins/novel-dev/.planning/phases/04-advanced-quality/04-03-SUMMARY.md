# Plan 04-03 Summary: Emotion Subtext + Character Voice

## Status: COMPLETE

**Duration:** ~12 min (parallel with 04-02)
**Tests:** 65 new tests (30 subtext + 35 voice)
**Commits:** 9a9d9fb, fa0a6ed, b386487

## Deliverables

### New Files
| File | Purpose | Lines |
|------|---------|-------|
| `src/subtext/types.ts` | SubtextAnnotation, EmotionLayer, PhysicalManifestations | ~140 |
| `src/subtext/subtext-engine.ts` | annotateDialogueSubtext, detectFlatDialogue, shouldHaveSubtext | ~430 |
| `src/subtext/subtext-prompts.ts` | buildSubtextPrompt for LLM analysis | ~120 |
| `src/subtext/index.ts` | Module exports | ~20 |
| `src/voice/types.ts` | VoiceProfile, VoiceFingerprint, SpeechPatterns | ~250 |
| `src/voice/character-voice.ts` | createVoiceProfile, updateVoiceProfile, buildVoiceConstraintPrompt | ~490 |
| `src/voice/voice-metrics.ts` | computeVoiceFingerprint, analyzeVoiceConsistency | ~300 |
| `src/voice/voice-prompts.ts` | buildVoiceAnalysisPrompt, buildVoiceGenerationPrompt | ~100 |
| `src/voice/index.ts` | Module exports | ~20 |
| `schemas/subtext-annotation.schema.json` | JSON Schema for SubtextAnnotation | ~150 |
| `schemas/voice-profile.schema.json` | JSON Schema for VoiceProfile | ~200 |
| `tests/subtext/subtext-engine.test.ts` | 30 test cases | ~400 |
| `tests/voice/character-voice.test.ts` | 35 test cases | ~500 |

### Modified Files
| File | Change |
|------|--------|
| `src/quality/types.ts` | Added subtextAnnotations, voiceProfiles, voiceDialogueAttributions to MultiStageOptions |
| `src/quality/stage-evaluators.ts` | ToneStageEvaluator integrates subtext detection + voice consistency |

## Key Decisions

- **Subtext detection**: Korean emotional word list (40+ words) + intent/relationship patterns
- **Context-first ordering**: Climactic/high-tension context overrides length heuristic
- **Voice fingerprint**: 6 quantitative metrics (avgSentenceLength, vocabularyComplexity, etc.)
- **Korean formality**: Handles 편하/편한/자유로/자유롭 conjugation variants
- **Honorific mapping**: casual+young=haeche, formal/old=hapsyoche, default=haeyoche
- **ToneStageEvaluator blending**: 40% emotional depth + 30% subtext + 30% voice consistency
- **Directive types**: subtext-injection for flat dialogue, voice-drift for voice deviations

## Must-Have Verification

- [x] Dialogue scenes contain observable emotional subtext detection
- [x] Hidden emotion layers annotated with surface meaning, actual intention, underlying emotion
- [x] Physical manifestations (body language, action beats, vocal cues) accompany subtext
- [x] Each character has distinct voice pattern (vocabulary, sentence structure, speech habits)
- [x] Character voices consistency checked across chapters (voice drift detected)
