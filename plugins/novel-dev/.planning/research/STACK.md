# Technology Stack: AI Creative Writing Quality

**Project:** Novel-Dev v5.0 -- Korean Genre Fiction Quality Revolution
**Researched:** 2026-02-05
**Overall Confidence:** MEDIUM (domain is fast-moving; Korean-specific data is sparse in academic literature)

---

## 1. Prompt Engineering for Natural Korean Prose (AI-che Escape)

### The Core Problem

Korean AI-generated prose has distinctive tells ("AI체") that experienced readers spot immediately. These stem from two sources: (a) LLMs trained primarily on English data producing translated-feeling Korean ("번역체"), and (b) universal LLM tendencies toward safe, median-probability token selection that produces bland, predictable text.

**Confidence: MEDIUM-HIGH** -- Verified through Korean web novel community sources (DC Inside AI Writer Gallery) and cross-referenced with general LLM behavior research.

### Recommended Technique Stack

#### 1.1 Korean-Specific Anti-AI-che Rules (MUST IMPLEMENT)

These are concrete, enforceable rules that should be embedded in every writing prompt. Sourced from active Korean web novel AI communities and linguistic analysis.

**A. Translation-Style Elimination (번역체 제거)**

| Pattern to Ban | Why It Sounds AI | What to Do Instead |
|---------------|-----------------|-------------------|
| "~에 의해" passive constructions | Direct translation of English passive voice | Use active voice: "비가 창을 때렸다" not "창이 비에 의해 맞았다" |
| Excessive "그/그녀" pronouns | Korean omits pronouns; overuse = translated feel | Drop pronouns; use names sparingly; rely on context |
| "~들" plural marker overuse | Korean rarely marks plurals explicitly | Remove "들" unless disambiguating |
| Prepositional phrase translations | "~에 대해", "~을 통해" in non-standard positions | Use natural Korean particles: "~은/는", "~이/가" |
| "가지다" as "to have" | Direct translation of English "have" | Use existence ("있다") or state descriptions |
| "Not only A but also B" structures | English rhetorical pattern; unnatural in Korean | Restructure to natural Korean parallelism |

**B. AI-Specific Overused Expressions (한국어 AI체 금지어)**

Maintain a `banned_expressions.json` in the style guide with these categories:

```json
{
  "filter_words": [
    "느꼈다", "느낀다", "보였다", "보인다", "들렸다",
    "생각했다", "알았다", "깨달았다", "이해했다",
    "~인 것 같았다", "~처럼 보였다", "알 수 있었다"
  ],
  "ai_flattery_markers": [
    "통찰력", "핵심을 찔렀어", "탐구해 볼까요",
    "자, 살펴봅시다", "흥미로운 관점"
  ],
  "overused_transitions": [
    "그런데", "하지만", "그리고", "그래서", "한편",
    "이와 같이", "결국", "마침내"
  ],
  "vague_intensifiers": [
    "매우", "정말", "너무", "아주", "상당히", "굉장히"
  ],
  "cliche_body_reactions": [
    "심장이 쿵쾅거렸다", "시간이 멈춘 듯했다",
    "머리가 하얘졌다", "온몸이 얼어붙었다",
    "눈앞이 캄캄해졌다"
  ]
}
```

**Rationale:** These lists serve as negative constraints. The system should check generated output against these lists and flag/rewrite matches. Cliches in the last category are acceptable *occasionally* in genre fiction but should be metered (max 1 per chapter) rather than banned outright.

**C. Korean Rhythm and Voice Rules**

| Technique | Implementation | Why |
|-----------|---------------|-----|
| Sentence ending variety | Max 3 consecutive "~다" endings; require mixing "~지", "~구나", "~을까", noun endings | Korean prose rhythm depends on ending variety; monotony = AI tell |
| Paragraph length variation | Alternate 1-line, 3-line, 5-line paragraphs | Web novel formatting: short paragraphs for mobile reading |
| Dialogue line breaks | Every dialogue line starts new paragraph | Korean web novel formatting standard |
| 의성어/의태어 (onomatopoeia/mimetics) | Require 2-3 per scene minimum | These are a distinctive feature of natural Korean prose; AI under-generates them |
| 존비어 system in dialogue | Each character must have defined speech level; enforce in dialogue | Social distance markers are critical for Korean characterization |
| Ellipsis and interjections | Allow "...", "음,", "글쎄,", "아," in inner monologue | These "imperfect" markers signal human thought patterns |

#### 1.2 Structured Prompt Architecture (MUST IMPLEMENT)

**Confidence: HIGH** -- Validated across multiple 2025-2026 prompt engineering guides and academic research.

**A. Role + Exemplar + Constraint Layering**

The most effective prompt structure for creative writing combines three elements in strict order:

```
[ROLE] 당신은 한국 웹소설 베스트셀러 작가입니다. 15년간 로맨스 장르를 집필했습니다.

[EXEMPLAR] 다음은 목표 문체의 참고 문단입니다:
"""
{3-5 paragraphs from the target style reference}
"""

[CONSTRAINTS]
- 금지어 목록을 절대 사용하지 마세요: {banned_expressions}
- 문장 종결어미를 3개 이상 연속 동일하게 사용하지 마세요
- 필터 워드 대신 신체 반응과 감각 묘사로 감정을 보여주세요
- 분량: {target_chars}자 (+-10%)

[SCENE CONTEXT]
{이전 장면 요약, 캐릭터 상태, 목표 감정}
```

**Why this order matters:** Role primes the model's distribution toward Korean literary prose. Exemplar provides concrete style targets (research shows few-shot examples are the single most impactful technique). Constraints act as guardrails. Context last so it's freshest in the model's attention.

**B. Anti-Pattern: What NOT to Do**

| Anti-Pattern | Why It Fails | Evidence |
|-------------|-------------|---------|
| "자연스러운 한국어로 써줘" (Write in natural Korean) | Too vague; model defaults to its median | Community consensus: explicit rules outperform vague instructions |
| "AI체를 피해줘" (Avoid AI-style) | Model doesn't reliably know what AI-style means | DC Inside AI Writer Gallery: "핵심 원칙: 인간적 글쓰기" section has minimal effect |
| Long lists of do's without exemplars | Rules without examples are under-specified | Research: few-shot examples outperform instruction-only by significant margins |
| Setting creativity/temperature too high (>0.9) | Increases style noise, incoherence, and hallucination | Korean community reports: higher creativity = less plot adherence |
| One giant system prompt | Context window attention degrades for mid-prompt content | Better to split into system prompt (immutable rules) + user prompt (scene-specific) |

#### 1.3 Emotional Immersion Priority (RECOMMENDED)

Korean web novel readers prioritize emotional immersion over logical precision. The prompt should explicitly instruct:

```
감정적 몰입과 변화를 논리적 완벽함보다 우선시하세요.
개인적인 경험이나 주관적인 판단을 논리적 근거 없이도 자연스럽게 드러내세요.
학술적이거나 격식적인 표현보다 일상어를 우선 사용하세요.
때로는 의도적으로 부정확하거나 애매한 표현을 사용하여 인간적인 망설임을 표현하세요.
```

**Rationale:** LLMs default to clear, logical, well-structured prose. Human fiction is deliberately "imperfect" -- characters think in circles, narration has emotional coloring, and sentences break grammatical rules for effect. Explicitly permitting imperfection is paradoxically what makes output sound human.

---

## 2. Multi-Agent Writing Architecture

### Current State of Art

**Confidence: MEDIUM-HIGH** -- Based on ICLR 2025 paper (Agents' Room), EMNLP 2025 survey, and ACL 2025 character simulation paper.

#### 2.1 Agents' Room Architecture (ICLR 2025) -- Primary Reference

The landmark "Agents' Room" paper establishes the academically validated architecture for multi-agent creative writing:

```
                    ┌──────────────────┐
                    │   Orchestrator   │
                    │  (Central Hub)   │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              v              v              v
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │  Planning   │  │  Planning   │  │  Planning   │
     │  Agent:     │  │  Agent:     │  │  Agent:     │
     │  Character  │  │  Plot       │  │  Setting    │
     └──────┬─────┘  └──────┬─────┘  └──────┬─────┘
            │               │               │
            └───────────────┼───────────────┘
                            v
                   ┌────────────────┐
                   │  Shared        │
                   │  Scratchpad    │
                   │  (Memory)      │
                   └────────┬───────┘
                            v
              ┌─────────────┼─────────────┐
              v             v             v
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │  Writing    │  │  Writing    │  │  Writing    │
     │  Agent:     │  │  Agent:     │  │  Agent:     │
     │  Exposition │  │  Rising     │  │  Climax     │
     └─────────────┘  └─────────────┘  └─────────────┘
```

**Key architectural principles:**
1. **Separation of planning and writing:** Planning agents structure narrative without generating prose. Writing agents generate prose using planning output. This prevents the common failure of "plotting while writing" that leads to incoherent narratives.
2. **Shared scratchpad:** All agents communicate through a shared memory, not direct message passing. This prevents information loss and ensures consistency.
3. **Section-by-section generation:** Writing agents generate the story in narrative sections (exposition, rising action, climax, etc.), which overcomes LLM length limitations and maintains quality throughout.
4. **Central orchestrator:** Manages agent sequencing and consolidates contributions.

**Result:** Stories preferred by expert evaluators over single-agent baselines; less overlap with prompts (indicating more creative elaboration).

#### 2.2 Character Simulation Approach (ACL 2025)

The "Multi-Agent Based Character Simulation for Story Writing" paper adds a role-play layer:

```
Step 1: ROLE-PLAY
  Director Agent → selects Character Agents → characters respond in-character to outline events

Step 2: REWRITE
  Writing LLM → rewrites role-play dialogue/action into narrative prose
```

**Why this matters for Novel-Dev:** This is directly applicable to dialogue-heavy web novels. Instead of having the novelist agent generate dialogue cold, you first have character agents improvise the scene, then a prose agent rewrites it. This produces more natural, character-consistent dialogue.

#### 2.3 Recommended Architecture for Novel-Dev v5.0

Building on academic research and Novel-Dev's existing agent structure:

```
PHASE 1: PLANNING (existing, enhance)
  plot-architect → chapter structure
  lore-keeper → world consistency check

PHASE 2: CHARACTER SIMULATION (NEW)
  character-actor agents (one per POV character) →
    improvise scene dialogue/reactions based on chapter plan
  director agent → guides scene flow, ensures plot beats hit

PHASE 3: PROSE GENERATION (enhance existing)
  novelist agent → transforms simulation output into literary prose
    INPUT: character simulation transcript + style guide + exemplars
    CONSTRAINT: banned expressions + rhythm rules + sensory requirements

PHASE 4: QUALITY PIPELINE (enhance existing)
  prose-quality-analyzer → identifies issues (READ-ONLY)
  editor agent → applies fixes based on analyzer output
  proofreader → final grammar/spelling pass

PHASE 5: EVALUATION (NEW)
  evaluator agent → scores against rubric (see Section 4)
  IF score < threshold: LOOP back to Phase 3 with feedback
```

**Critical difference from current system:** The current system goes directly from plot to prose (Phase 1 -> Phase 3). The NEW character simulation phase (Phase 2) is the single highest-impact addition for writing quality, based on the academic literature.

#### 2.4 What NOT to Do in Multi-Agent Architecture

| Anti-Pattern | Why It Fails | What to Do Instead |
|-------------|-------------|-------------------|
| Too many agents (>7 per pipeline) | Increased complexity without proportional quality gain; research shows diminishing returns | Keep it to 5-6 specialized agents per writing pipeline |
| Using the same model/prompt for all agents | Defeats the purpose of specialization | Match model tier to task: opus for creative writing, sonnet for editing, haiku for proofreading |
| No shared memory between agents | Information loss between pipeline stages | Use a scratchpad file (e.g., `pipeline/scratchpad.json`) persisted between agent calls |
| Agents that both plan and write | Conflates two distinct cognitive tasks; reduces quality of both | Strict separation: planning agents produce structure, writing agents produce prose |
| No quality gate before output | Allows subpar output to persist | Always run evaluator agent; loop back on failure |

---

## 3. Style Transfer and Reference-Based Writing

### Current State of Art

**Confidence: MEDIUM** -- Academic research exists but confirms this is a partially-solved problem. Practical community techniques fill the gap.

#### 3.1 Few-Shot Exemplar Prompting (MUST IMPLEMENT)

The single most effective technique for style consistency. Research from multiple 2025 papers confirms few-shot examples outperform all instruction-only approaches.

**Implementation for Novel-Dev:**

```
meta/style-reference/
  ├── exemplar_01.md  (3-5 paragraphs of target style)
  ├── exemplar_02.md
  ├── exemplar_03.md
  ├── anti_exemplar_01.md  (examples of what NOT to produce)
  └── style-analysis.json  (extracted style features)
```

**The exemplar selection process:**

1. User provides 3-5 passages from a Korean novel they want to emulate
2. A `style-analyzer` agent extracts features:
   - Average sentence length
   - Dialogue-to-narration ratio
   - Sentence ending distribution (% ~다, % ~지, % ~까, etc.)
   - Onomatopoeia/mimetic frequency
   - Sensory detail density per scene
   - Paragraph length distribution
3. These features become quantitative targets in the writing prompt
4. The exemplar passages themselves become few-shot examples

**Why 3-5 exemplars, not 1 or 10:** Research shows 3-5 few-shot examples are the sweet spot. Fewer than 3 gives insufficient style signal. More than 10 wastes context window without proportional benefit and may cause the model to over-fit on specific content rather than style.

#### 3.2 Hierarchical Style Transfer (RECOMMENDED)

Based on the ZeroStylus framework (2025), style transfer works better when decomposed into two levels:

| Level | What It Captures | How to Implement |
|-------|-----------------|-----------------|
| Sentence-level | Word choice, rhythm, ending patterns | Per-sentence style rules in prompt |
| Paragraph-level | Structure, pacing, information density | Paragraph templates showing narrative arc patterns |

**Implementation:** The `style-guide.json` should contain both levels:

```json
{
  "sentence_level": {
    "avg_length_chars": 35,
    "ending_distribution": {"다": 0.4, "지": 0.15, "까": 0.1, "noun_ending": 0.1, "other": 0.25},
    "max_consecutive_same_ending": 3,
    "onomatopoeia_per_1000_chars": 2.5,
    "filter_word_max_per_1000_chars": 5
  },
  "paragraph_level": {
    "avg_paragraph_length_sentences": 3.5,
    "dialogue_narration_ratio": "60:40",
    "scene_sensory_minimum": {"sight": 2, "sound": 1, "touch_or_smell_or_taste": 1},
    "paragraph_length_variance": "high"
  }
}
```

#### 3.3 Anti-Exemplar Technique (RECOMMENDED)

Show the model what NOT to write. This is more effective than negative instructions alone.

```
[좋은 예 - 이렇게 쓰세요]
유나의 손가락이 커피잔을 감쌌다. 도자기의 온기가 손끝으로 스며들었다.
"괜찮아?" 지수가 물었다.
유나는 대답 대신 커피를 한 모금 마셨다. 쓴맛이 혀 위에 번졌다.

[나쁜 예 - 이렇게 쓰지 마세요]
유나는 커피잔을 들었다. 그녀는 매우 피곤함을 느꼈다.
"괜찮아?" 지수가 걱정스럽게 물었다.
"응, 괜찮아." 유나는 생각했다. 정말 괜찮은 걸까?
```

**Why it works:** Negative examples activate the model's discriminative capabilities, not just generative ones. The model learns the boundary between acceptable and unacceptable output.

#### 3.4 What NOT to Do in Style Transfer

| Anti-Pattern | Why It Fails |
|-------------|-------------|
| Describing style in abstract terms ("elegant", "flowing") | Models can't reliably translate abstract style descriptions into concrete prose |
| Using a single long reference passage | Model may copy content, not style |
| Fine-tuning without sufficient data (<10K sentences) | Overfits on content; produces repetitive output |
| Ignoring the quantitative dimension | "Write like Author X" is vague; "40% dialogue, avg sentence length 35 chars, ~다 ending < 40%" is enforceable |

#### 3.5 Fine-Tuning vs. Prompt Engineering Decision

| Approach | When to Use | When NOT to Use |
|----------|------------|----------------|
| Prompt engineering + few-shot | Default for Novel-Dev v5.0; flexible per-project | When the same style is needed across thousands of chapters |
| LoRA fine-tuning | If a specific author's style must be perfectly reproduced at scale | For Novel-Dev's general-purpose tool (too rigid, too costly per style) |
| Text-to-LoRA (emerging 2025) | Future consideration when tooling matures | Now -- tooling not production-ready |

**Recommendation:** Stay with prompt engineering + few-shot exemplars for v5.0. LoRA fine-tuning is the correct next step only if a specific user wants to generate 100+ chapters in an identical style and is willing to invest in training data curation. This should be a future optional feature, not a core dependency.

---

## 4. LLM Evaluation Frameworks for Creative Writing Quality

### Current Benchmarks and What to Learn From Them

**Confidence: MEDIUM-HIGH** -- Multiple peer-reviewed and community benchmarks exist; the field is converging on best practices.

#### 4.1 Recommended Evaluation Stack for Novel-Dev

| Component | Purpose | Model | How |
|-----------|---------|-------|-----|
| **Rubric Scoring** | Per-chapter quality assessment | Claude Sonnet (judge) | Score against 8 dimensions adapted from Lech Mazur's benchmark |
| **Slop Detection** | AI-ism frequency measurement | Rule-based + LLM | Match against `banned_expressions.json`; count per 1000 chars |
| **Pairwise Comparison** | Before/after revision quality delta | Claude Sonnet | Present original vs. revised; judge picks winner per dimension |
| **Style Drift Detection** | Consistency across chapters | Rule-based | Compare quantitative style metrics per chapter against targets |
| **Degradation Tracking** | Quality drop-off in long novels | Rule-based + LLM | Track chapter scores over time; alert if 3+ chapter downward trend |

#### 4.2 The 8-Dimension Rubric (MUST IMPLEMENT)

Adapted from EQ-Bench Creative Writing v3 and Lech Mazur's writing benchmark, localized for Korean genre fiction:

| Dimension | What It Measures | Weight |
|-----------|-----------------|--------|
| 1. Character Depth (캐릭터 깊이) | Authentic motivations, consistent voice, growth | 15% |
| 2. Emotional Engagement (감정 몰입) | Reader feels what characters feel; emotional peaks land | 20% |
| 3. Plot Coherence (플롯 일관성) | Events follow logically; no plot holes; foreshadowing pays off | 10% |
| 4. Prose Quality (문장력) | Show-don't-tell, sensory detail, rhythm variety, no filter words | 20% |
| 5. Voice & Style (문체 일관성) | Consistent tone, matches style guide, distinctive voice | 15% |
| 6. Dialogue Naturalness (대화 자연스러움) | Characters sound different from each other; Korean speech patterns | 10% |
| 7. Originality (참신성) | Fresh metaphors, avoids cliches, unexpected turns | 5% |
| 8. Genre Execution (장르 적합성) | Hits genre-specific beats; satisfies genre reader expectations | 5% |

**Weight rationale:** Emotional engagement and prose quality get highest weights because these are where AI fails most noticeably. Plot and genre execution get lower weights because the planning system already handles these. Originality gets lowest weight because web novel readers value execution over novelty.

#### 4.3 Slop Score Implementation (MUST IMPLEMENT)

The EQ-Bench "Slop Score" concept is directly applicable. Maintain a Korean-localized slop list:

```json
{
  "korean_slop_phrases": [
    "마치 ~처럼", "순간 시간이 멈춘 듯", "그 순간", "갑자기",
    "문득", "불현듯", "어느새", "그러자", "그때였다",
    "심장이 쿵", "눈을 감았다 떴다", "한숨을 내쉬었다",
    "주먹을 불끈 쥐었다", "입술을 깨물었다"
  ],
  "scoring": {
    "per_1000_chars": "count occurrences",
    "threshold_warning": 5,
    "threshold_critical": 10
  }
}
```

**How to use it:** Run slop detection after generation but before saving. If above threshold, trigger revision agent with specific instructions to replace flagged phrases.

#### 4.4 LLM-as-Judge Calibration

Key findings from LitBench (2025) and EQ-Bench:

- **Claude Sonnet is the best off-the-shelf judge** for creative writing (73% agreement with human preferences -- LitBench)
- **Trained reward models outperform all off-the-shelf judges** (78% accuracy -- LitBench)
- **Small open-source models are poor judges** (56-60% accuracy, barely above chance)
- **Chain-of-thought reasoning does NOT improve** creative writing evaluation (may degrade it)

**Recommendation:** Use Claude Sonnet as the evaluation judge. Do NOT use chain-of-thought for evaluation prompts (counter-intuitive but research-backed). If Novel-Dev v6+ needs better evaluation, invest in a trained reward model fine-tuned on Korean fiction preferences.

#### 4.5 What NOT to Do in Evaluation

| Anti-Pattern | Why It Fails |
|-------------|-------------|
| Using the same model to write and evaluate | Self-preference bias; models rate their own style higher |
| Numeric scores only without textual feedback | Numbers without explanation don't guide revision |
| Evaluating entire chapters in one pass | Too much context; evaluators miss local issues |
| Using perplexity as a quality metric | High perplexity = novel text, not necessarily good text |
| Skipping human calibration | Automated evaluation should be periodically validated against human preferences |

---

## 5. External API Selection for Creative Writing

### Model Comparison for Korean Creative Writing (2026)

**Confidence: MEDIUM** -- Rankings are from multiple benchmarks and community reports, but Korean-specific creative writing benchmarks are scarce.

#### 5.1 Current Rankings (Early 2026)

| Model | Creative Writing (General) | Korean Quality | Best For | Cost |
|-------|--------------------------|---------------|----------|------|
| **Claude Opus 4.5** | Top tier (highest "soul") | Excellent | Main novelist agent; character voice | $$$ |
| **Claude Sonnet 4.5** | Top tier | Very Good | Editor/judge agent; good balance | $$ |
| **GPT-5.2** | Top tier | Very Good | Alternative novelist; strong plot coherence | $$$ |
| **Grok 4.1** | Top tier (highest EQ-Bench) | **POOR** | NSFW content only; Korean quality is a known weakness | $$ |
| **Gemini 3 Flash** | Good | Good | Fast first drafts; cost-efficient bulk work | $ |
| **Claude Haiku** | Adequate | Adequate | Proofreading; summary generation | $ |
| **DeepSeek V3.1** | Good (open-source best) | Untested | Future consideration for self-hosted | Free |
| **Qwen3-235B** | Good (open-source best) | Untested | Future consideration for self-hosted | Free |

#### 5.2 Critical Finding: Grok's Korean Weakness

**Confidence: HIGH** -- Verified through NamuWiki, Korean community reports, and SemEval-2025 research.

Grok processes Korean through an internal translation layer rather than understanding it natively. This results in:
- Syllable-level errors (characters appearing in wrong script)
- Literacy quality described as "very poor" by Korean users
- Translation artifacts in Korean output
- Inconsistent: sometimes outputs entire responses in English

**Recommendation for Novel-Dev v5.0:** Keep Grok integration ONLY for adult/NSFW content where Claude's content policy is restrictive. For ALL quality-oriented Korean prose generation, use Claude or GPT. Do NOT position Grok as a quality writing option for Korean users.

#### 5.3 Recommended Model Routing

```
WRITING TASKS:
  Main prose generation → Claude Opus 4.5 (temperature 0.7-0.8)
  Fast/bulk drafts → Claude Sonnet 4.5 (temperature 0.7)
  NSFW content only → Grok 4.1 (with post-processing by Claude for Korean quality)

EVALUATION TASKS:
  Quality scoring → Claude Sonnet 4.5 (temperature 0.3)
  Slop detection → Rule-based (no LLM needed)

EDITING TASKS:
  Revision → Claude Sonnet 4.5 (temperature 0.5)
  Proofreading → Claude Haiku (temperature 0.2)

PLANNING TASKS:
  Plot/structure → Claude Sonnet 4.5 (temperature 0.6)
  Character simulation → Claude Opus 4.5 (temperature 0.8)
```

**Temperature rationale:**
- Writing: 0.7-0.8 is the sweet spot. Below 0.7 = too predictable/bland. Above 0.9 = incoherent, ignores constraints.
- Evaluation: 0.3 for consistency in scoring.
- Editing: 0.5 balances creativity with faithfulness to original.

#### 5.4 Future Considerations

| Technology | Timeline | Impact | Action Now |
|-----------|----------|--------|-----------|
| GPT-5 series improvements | Available now | Alternative to Claude for prose generation | Test and benchmark against Claude for Korean quality |
| Open-source models (Qwen3, DeepSeek) | Available now | Self-hosted option eliminates API costs | Evaluate Korean creative writing quality; likely not ready yet |
| LoRA fine-tuning services | 2026 H1 | Custom style models | Design data collection pipeline; defer actual fine-tuning |
| Multimodal writing (image+text) | 2026 H2 | Scene visualization during writing | Monitor but do not build for |

---

## 6. Implementation Priority Matrix

| Priority | Component | Impact | Effort | Phase |
|----------|-----------|--------|--------|-------|
| P0 | Korean anti-AI-che prompt rules + banned expression lists | CRITICAL | Low | Phase 1 |
| P0 | Few-shot exemplar system (style references) | CRITICAL | Medium | Phase 1 |
| P0 | Anti-exemplar (negative examples) in prompts | HIGH | Low | Phase 1 |
| P1 | 8-dimension evaluation rubric | HIGH | Medium | Phase 2 |
| P1 | Slop score detection (Korean-localized) | HIGH | Low | Phase 2 |
| P1 | Character simulation agent phase | HIGH | High | Phase 2 |
| P2 | Hierarchical style transfer (sentence+paragraph) | MEDIUM | Medium | Phase 3 |
| P2 | Pairwise comparison evaluation | MEDIUM | Low | Phase 3 |
| P2 | Quality degradation tracking | MEDIUM | Low | Phase 3 |
| P3 | Grok post-processing pipeline (Korean quality fix) | LOW | Medium | Phase 4 |
| P3 | Open-source model evaluation | LOW | High | Future |
| P3 | LoRA fine-tuning support | LOW | Very High | Future |

---

## 7. Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Primary writing model | Claude Opus 4.5 | GPT-5.2 | Claude rated as having most "soul" in writing; best Korean quality |
| Evaluation judge | Claude Sonnet 4.5 | Trained reward model | Reward model is better (78% vs 73%) but requires training data investment |
| Style transfer approach | Few-shot exemplar prompting | LoRA fine-tuning | Too rigid and costly for a general-purpose tool; exemplar prompting is flexible |
| Multi-agent architecture | Plan-Simulate-Write-Evaluate | Direct write-evaluate | Character simulation phase is the highest-impact quality improvement |
| Korean quality for NSFW | Grok + Claude post-processing | Grok alone | Grok Korean quality is unacceptable for literary output |
| Slop detection | Rule-based + banned list | LLM-based detection | Rule-based is faster, cheaper, and more reliable for known patterns |

---

## Sources

**Academic Papers:**
- [Agents' Room: Narrative Generation through Multi-step Collaboration (ICLR 2025)](https://arxiv.org/abs/2410.02603) -- HIGH confidence
- [Multi-Agent Based Character Simulation for Story Writing (ACL 2025)](https://aclanthology.org/2025.in2writing-1.9.pdf) -- HIGH confidence
- [Creativity in LLM-based Multi-Agent Systems: A Survey (EMNLP 2025)](https://arxiv.org/pdf/2505.21116) -- HIGH confidence
- [LitBench: A Benchmark and Dataset for Reliable Evaluation of Creative Writing (2025)](https://arxiv.org/abs/2507.00769) -- HIGH confidence
- [Long Text Style Transfer with ZeroStylus (2025)](https://arxiv.org/html/2505.07888v1) -- MEDIUM confidence
- [LLMs Still Struggle to Imitate Implicit Writing Styles (EMNLP 2025)](https://aclanthology.org/2025.findings-emnlp.532.pdf) -- HIGH confidence

**Benchmarks:**
- [EQ-Bench Creative Writing v3 Leaderboard](https://eqbench.com/creative_writing.html) -- HIGH confidence
- [EQ-Bench Longform Creative Writing](https://eqbench.com/creative_writing_longform.html) -- HIGH confidence
- [Lech Mazur's Writing Benchmark](https://github.com/lechmazur/writing) -- HIGH confidence
- [EQ-Bench Slop Score](https://eqbench.com/slop-score.html) -- HIGH confidence

**Community Sources:**
- [DC Inside AI Writer Gallery - Prompt Sharing](https://gall.dcinside.com/mgallery/board/view/?id=aiwriter&no=2684) -- MEDIUM confidence (community, not peer-reviewed)
- [DC Inside AI Writer Gallery - 7 Anti-AI Tips](https://gall.dcinside.com/mgallery/board/view/?id=aiwriter&no=128) -- MEDIUM confidence
- [NamuWiki: Grok Korean Quality Assessment](https://en.namu.wiki/w/Grok) -- MEDIUM confidence (wiki, but reflects user experience consensus)
- [TypeTak: AI Web Novel Guide](https://www.typetak.com/en/blog/ai_webnovel) -- LOW confidence

**Model Comparisons:**
- [Grok vs Claude Creative Tasks](https://www.godofprompt.ai/blog/grok-vs-claude-which-excels-at-creative-tasks) -- MEDIUM confidence
- [Best LLMs for Writing 2025](https://intellectualead.com/best-llm-writing/) -- MEDIUM confidence
- [AI Model Comparison January 2026](https://felloai.com/best-ai-of-january-2026/) -- MEDIUM confidence
- [Best Open Source LLM for Literature 2026](https://www.siliconflow.com/articles/en/best-open-source-llm-for-literature) -- MEDIUM confidence
