# Feature Landscape: AI Novel Writing Quality Improvement

**Domain:** Korean genre fiction AI writing system (Novel-Dev v5.0)
**Researched:** 2026-02-05
**Overall Confidence:** MEDIUM-HIGH (synthesis of domain expertise, web research, and existing codebase analysis)

---

## Table Stakes

Features without which the output will sound unmistakably AI-generated. These are the minimum bar for human-level prose quality. Missing any of these = the writing fails the "AI체" test.

### TS-1: AI체 탈피 (De-AI-ification) Core Rules Engine

| Aspect | Detail |
|--------|--------|
| Why Expected | AI prose has a recognizable "accent": hyper-adjectival nouns, overwrought metaphors, exposed subtext, anti-repetition synonym cycling, formal/academic register. Korean readers immediately detect this. |
| Complexity | Medium |
| Implementation | A **negative constraint system** embedded in the novelist agent prompt. Not a post-processing filter, but a generation-time prohibition list with examples. |

**Concrete rules to enforce:**

1. **Ban hyper-adjectival prose**: Prohibit decorating every noun with adjectives. "차가운 겨울 바람이 거친 도시의 어두운 골목을 휩쓸었다" is AI writing. "골목에 바람이 불었다. 뼛속까지 스미는 추위." is human writing.

2. **Ban synonym cycling (anti-repetition penalty artifacts)**: AI writes "주인공", then "그녀", then "젊은 여성", then "목격자" for the same person in 4 consecutive sentences. Human writers reuse "그녀" or the name. Enforce consistent referent use within paragraphs.

3. **Ban exposed subtext**: AI writes "그의 미소 뒤에는 깊은 슬픔이 숨어 있었다" (subtext stated as text). Enforce: show the smile, let the reader infer the sadness.

4. **Ban formal/academic register in narration**: AI defaults to "~하였다", "~인 것으로 판단되었다", "~라는 사실을 인지하였다". Enforce natural Korean narrative register: "~했다", "~였다", natural spoken-to-self tone.

5. **Ban "AI stock phrases"**: Compile and maintain a blacklist of Korean AI tells:
   - "심장이 미친 듯이 뛰었다" (overused)
   - "시간이 멈춘 듯했다" (cliche)
   - "머리가 하얘졌다" (cliche)
   - "깊은 한숨을 내쉬었다" (AI favorite)
   - "알 수 없는 감정이 밀려왔다" (vague)
   - "복잡한 감정이 교차했다" (abstract)
   - "묘한 감정" / "알 수 없는 무언가" (evasive)

6. **Enforce imperfection**: Human writing has intentional roughness. Allow sentence fragments, trailing thoughts ("..."), incomplete sentences in internal monologue. AI's tendency toward grammatically perfect sentences is itself a tell.

---

### TS-2: Filter Word Elimination System

| Aspect | Detail |
|--------|--------|
| Why Expected | Filter words ("느꼈다", "보였다", "생각했다", "알 수 있었다", "~인 것 같았다") create distance between reader and scene. AI overuses these 3-5x compared to human writers. |
| Complexity | Low-Medium |
| Implementation | Two-layer approach: (1) Generation-time prohibition in novelist prompt with transformation examples, (2) Post-generation detection + flagging in prose-quality-analyzer. |

**Transformation patterns to teach:**

| Filter (Bad) | Direct (Good) |
|-------------|--------------|
| "분노를 느꼈다" | "주먹이 떨렸다" / "이가 갈렸다" |
| "그녀가 웃는 것이 보였다" | "그녀가 웃었다" |
| "위험하다고 생각했다" | "위험했다." (직접 서술) |
| "알 수 없는 감정이 밀려왔다" | (구체적 신체 반응으로 대체) |
| "~인 것 같았다" | "~였다" (commit to description) |
| "~처럼 보였다" | (직접 묘사) |

**Allowed exceptions:**
- 1인칭 시점에서 의도적 불확실성 표현
- 캐릭터가 실제로 관찰자인 장면
- 인지/깨달음의 순간 ("그제야 알았다" 등)

---

### TS-3: Sentence Rhythm Engine (문장 호흡 시스템)

| Aspect | Detail |
|--------|--------|
| Why Expected | AI produces monotonous rhythm: similar length sentences, identical ending patterns (~다/~었다 연속 10회 이상). Korean prose rhythm is critical to readability. |
| Complexity | Medium |
| Implementation | Rhythm rules embedded in novelist prompt + post-generation analysis in prose-quality-analyzer with specific metrics. |

**Rules:**

1. **Sentence length variation**: Enforce long-short-medium pattern. After 3+ sentences of similar length, mandate a break. Use short fragments for impact after long descriptive passages.

2. **Ending variation (종결어미 다양화)**:
   - ~다/~었다 (기본 서술)
   - ~지/~네/~구나 (감탄/내면)
   - ~을까/~는가 (의문/사색)
   - ~려나/~리라 (추측/의지)
   - 체언 종결: "적막." "침묵." (임팩트)
   - 명사형 종결: "끝없는 낙하." (시적 효과)
   - No more than 5 consecutive sentences with the same ending pattern.

3. **Paragraph length variation**: Mix 1-line paragraphs (for impact) with 3-5 line paragraphs (for flow). AI tends toward uniform 3-line paragraphs.

4. **Pacing through rhythm**:
   - Action scenes: short, staccato. "검이 빗나갔다. 반격. 어깨를 스치는 칼날."
   - Emotional scenes: longer, flowing. Complex structures with embedded clauses.
   - Dialogue: natural Korean speech rhythm with omissions and implications.

---

### TS-4: Sensory Grounding System (감각 묘사 시스템)

| Aspect | Detail |
|--------|--------|
| Why Expected | AI defaults to visual-only description or abstract emotional labels. Human writers engage multiple senses. Korean prose has rich onomatopoeia/mimetic word traditions. |
| Complexity | Medium |
| Implementation | Per-scene sensory checklist in novelist prompt + sensory coverage metrics in prose-quality-analyzer. |

**Requirements:**

1. **Multi-sense mandate**: Every scene of 500+ characters must engage 2+ senses beyond sight. Key scenes (emotional peaks, action, romance) require 3+.

2. **Sensory hierarchy by genre:**
   - Romance: touch > smell > sight > sound > taste
   - Horror: sound > touch > sight > smell > taste
   - Martial arts: touch (proprioception) > sight > sound
   - Fantasy: sight > sound > smell > touch
   - Thriller: sound > sight > touch

3. **의성어/의태어 integration**: Korean's rich mimetic vocabulary is underutilized by AI. Mandate natural integration:
   - Motion: 살금살금, 후다닥, 비틀비틀, 허둥지둥
   - Emotion: 콩닥콩닥, 울컥, 찡하게, 뭉클하게
   - Sound: 쨍그랑, 우당탕, 사각사각, 바스락
   - Texture: 까끌까끌, 미끌미끌, 포슬포슬
   - Not as decoration, but as action-integrated description.

4. **Internal/proprioceptive senses**: Go beyond the classic 5:
   - Proprioception: "다리가 풀렸다", "중심이 흔들렸다"
   - Interoception: "속이 뒤집혔다", "가슴이 답답했다"
   - Temperature: "등줄기에 차가운 땀이 흘렀다"
   - Pain: "욱신거리는 통증"

---

### TS-5: Character Voice Fingerprinting (캐릭터 음성 차별화)

| Aspect | Detail |
|--------|--------|
| Why Expected | AI produces generic dialogue where all characters sound identical. Without distinct voices, characters feel flat and interchangeable. The "strip dialogue tags" test fails. |
| Complexity | High |
| Implementation | Per-character voice profile in character.json + voice enforcement in novelist prompt + voice consistency check in critic agent. |

**Voice dimensions to define per character:**

1. **어휘 수준 (Vocabulary Level)**: 구어체/문어체 비율, 전문용어 사용, 비속어/은어 수준
2. **문장 구조 (Sentence Structure)**: 짧고 끊는 vs 길게 이어붙이는, 주어 생략 빈도, 도치 빈도
3. **말버릇 (Speech Habits)**: 특정 감탄사, 입버릇, 말끝 흐리기, 반복 표현
4. **화법 (Discourse Style)**: 직설적 vs 완곡, 질문형 vs 명령형, 수동적 vs 능동적
5. **존칭 패턴**: 상황별 존댓말/반말 전환 규칙, 호칭 체계
6. **사고 패턴 (내면 독백)**: 논리적 vs 감정적, 분석적 vs 직관적, 자기비판적 vs 자기확신적

**Implementation approach:**
- Extend `character.schema.json` with `voice_profile` object containing above dimensions
- Novelist agent loads relevant character voice profiles before writing dialogue
- Each line of dialogue is filtered through character's voice constraints
- The "blind test": Can you identify the speaker without dialogue tags?

---

### TS-6: Natural Scene Transition System (장면 전환 시스템)

| Aspect | Detail |
|--------|--------|
| Why Expected | AI tends toward abrupt scene breaks or clunky transitions ("한편, 그 시각..." / "한 시간 후..."). Human writers use causal linking, sensory bridges, and thematic echoes. |
| Complexity | Medium |
| Implementation | Transition technique library in novelist prompt + transition quality check in editor/critic. |

**Transition techniques to implement:**

1. **Causal chain (도미노)**: Scene A's outcome causes Scene B's opening. No explicit time/place markers needed.
2. **Sensory bridge**: End Scene A with a sound/smell/sensation, open Scene B with the same or contrasting one.
3. **Word echo**: Last word/image of Scene A appears in first line of Scene B (subtle, subconscious linking).
4. **Thematic mirror**: Contrast or parallel between ending and beginning (e.g., crowded party scene -> solitary morning).
5. **Character perspective bridge**: End in one character's emotional state, open in another's reaction to related event.
6. **Cut on action**: End mid-action, resume in new context (cinematic technique).

**Anti-patterns to prohibit:**
- "한편, 그 시각..." (meanwhile, at that time...)
- "시간이 흘러..." (time passed...)
- "장소를 옮기면..." (moving to another location...)
- Explicit time/place headers except for major time jumps

---

## Differentiators

Features that separate "competent AI writing" from "writing that wins literary magazine prizes." Not expected by default, but these create genuine competitive advantage.

### D-1: Multi-Stage Revision Pipeline (다단계 퇴고 파이프라인)

| Aspect | Detail |
|--------|--------|
| Value Proposition | Single-pass generation cannot achieve publication quality. Research shows decomposition-based multi-agent pipelines outperform single-pass by 40%+ in quality metrics. A structured pipeline mimics how professional human authors actually work. |
| Complexity | High |
| Implementation | Sequential agent pipeline with specialized focus per stage. Each stage has distinct evaluation criteria. |

**Proposed 4-stage pipeline:**

**Stage 1: Raw Draft (초고) - novelist agent**
- Focus: story, emotion, momentum
- Ignore: polish, perfection
- Quality gate: plot coverage, emotional beats present
- Target: 110% of final word count (room to cut)

**Stage 2: Voice & Tone Pass (톤 개선) - NEW: voice-refiner agent**
- Focus: character voice consistency, tone matching, register correction
- Actions: fix dialogue voice mismatches, correct narrative register, ensure consistent POV depth
- Quality gate: voice fingerprint consistency score

**Stage 3: Prose Polish (문체 다듬기) - editor agent (enhanced)**
- Focus: AI체 removal, filter word elimination, rhythm correction, sensory enrichment
- Actions: replace filter words, vary sentence rhythm, add sensory grounding, remove AI stock phrases
- Quality gate: prose-quality-analyzer score >= 80
- Target: reduce word count by 5-10%

**Stage 4: Final Proofread (최종 교정) - proofreader agent**
- Focus: grammar, spelling, spacing, consistency
- Actions: 맞춤법 교정, 띄어쓰기, 조사 일치, 고유명사 일관성
- Quality gate: zero critical issues

**Key design decisions:**
- Each stage sees only the output of the previous stage (clean input)
- Stage 2 and 3 can loop (re-enter if quality gate fails, max 2 iterations)
- Stage 1 intentionally over-generates to give later stages material to sculpt
- Pipeline metadata tracks what changed at each stage for learning

---

### D-2: Reference Style Learning System (레퍼런스 기반 문체 학습)

| Aspect | Detail |
|--------|--------|
| Value Proposition | Users can provide excerpts from admired novels and the system extracts style patterns to guide generation. This moves beyond generic "romance tone" to "this specific author's romance tone." |
| Complexity | High |
| Implementation | Style analysis agent that extracts quantifiable patterns from reference texts, stored as enhanced style-guide parameters. |

**System design:**

1. **Reference Ingestion**: User provides 3,000-10,000 characters of reference text (1-2 chapters of a novel they admire)

2. **Style Extraction** (NEW: style-analyst agent):
   - Sentence length distribution (histogram)
   - Ending pattern distribution (어미 비율)
   - Dialogue-to-narration ratio
   - Sensory detail density and preference
   - Vocabulary complexity level (어휘 수준)
   - Metaphor density and type
   - Paragraph structure patterns
   - Filter word frequency (to match, not necessarily minimize)
   - Onomatopoeia/mimetic word frequency
   - Tone markers

3. **Style Profile Generation**: Extracted patterns stored as quantified targets in `meta/reference-style-profile.json`

4. **Generation Guidance**: Novelist agent receives style profile as soft constraints (targets, not hard rules). "Target 30% dialogue ratio (reference: 35%). Target sentence length variance of 8-25 words (reference: 6-22)."

5. **Style Drift Detection**: prose-quality-analyzer compares output against reference profile, flags significant deviations.

**Limitations to document:**
- This is pattern matching, not true style transfer
- Works best for quantifiable aspects (rhythm, density, ratio)
- Cannot capture an author's worldview or thematic sensibility
- Reference text should be same genre as target
- 3,000+ characters minimum for reliable extraction

---

### D-3: Emotional Subtext Engine (감정 서브텍스트 엔진)

| Aspect | Detail |
|--------|--------|
| Value Proposition | Professional fiction operates on two levels: what characters say/do (text) and what they feel/mean (subtext). AI writing collapses these into one layer. This engine enforces the gap between surface action and underlying emotion. |
| Complexity | Medium-High |
| Implementation | Subtext annotation in chapter plans + subtext enforcement in novelist prompt + subtext detection in critic. |

**How it works:**

1. **Chapter plan annotation**: Each scene in `chapter_N.json` gets a `subtext` field:
   ```json
   {
     "scene": 2,
     "action": "두 사람이 커피를 마시며 일상 대화",
     "subtext": "서로에 대한 미묘한 끌림을 느끼지만 인정하지 않음",
     "surface_emotion": "편안함, 유쾌함",
     "hidden_emotion": "설렘, 불안",
     "subtext_signals": ["시선이 자꾸 마주침", "불필요한 질문을 함", "떠나기를 미룸"]
   }
   ```

2. **Generation rule**: Novelist agent writes the `surface_emotion` explicitly but expresses `hidden_emotion` only through `subtext_signals` -- never stated directly.

3. **Critic check**: Evaluate whether subtext is maintained (shown, not told) and whether reader could plausibly infer the hidden emotion.

---

### D-4: Korean Prose Texture Library (한국어 문체 텍스처 라이브러리)

| Aspect | Detail |
|--------|--------|
| Value Proposition | Korean prose has unique literary traditions (한, 정, 여백의 미, 반복과 변주) that AI rarely captures. A curated library of Korean-specific techniques provides concrete patterns for the novelist agent. |
| Complexity | Medium |
| Implementation | Technique library as reference document loaded into novelist context. Genre-indexed. |

**Techniques to catalog:**

1. **여백의 미 (Beauty of empty space)**: What is NOT said carries meaning. Truncated sentences, implied emotions, silence in dialogue.
   - Example: "그는 아무 말도 하지 않았다. 창밖을 보았다." (Implies more than explicit emotional description)

2. **반복과 변주 (Repetition and variation)**: Motif that returns in slightly different form each time, gaining meaning.
   - Example: Character sees cherry blossoms 3 times: first as beauty, then as transience, finally as acceptance.

3. **한 (Han)**: Deep, unresolved sorrow specific to Korean emotional vocabulary. Not depression but accumulated grief with dignity.

4. **정 (Jeong)**: Deep affection/bond that develops over time, not romantic love but human connection. Critical for Korean reader resonance.

5. **체언 종결 (Noun-ending)**: "적막. 그리고 침묵." Powerful stylistic device unique to Korean that creates staccato impact.

6. **의식의 흐름 Korean style**: Korean stream-of-consciousness has its own grammar -- particle dropping, sentence fragments, topic jumps that mirror actual Korean thinking patterns.

7. **계절감 (Seasonal sensibility)**: Korean fiction deeply embeds seasonal references for emotional resonance. Spring = new beginnings, autumn = melancholy, winter = endurance.

---

### D-5: Adaptive Quality Gate System (적응형 품질 게이트)

| Aspect | Detail |
|--------|--------|
| Value Proposition | Current fixed 70-point threshold doesn't distinguish between "fast serial publication" and "literary prize submission." Adaptive gates let users set target quality tier. |
| Complexity | Medium |
| Implementation | Quality tier configuration in project settings, different thresholds per tier. |

**Proposed tiers:**

| Tier | Target | Min Score | Revision Loops | Use Case |
|------|--------|-----------|----------------|----------|
| Draft | Speed | 60 | 0 | Brainstorming, plot testing |
| Serial | Publishable | 75 | 1 | Web novel serial publication |
| Premium | High quality | 85 | 2 | Premium platform, ebook |
| Literary | Prize-worthy | 92 | 3+ | Literary magazine submission, contest |

Each tier activates different levels of the revision pipeline and different strictness in the AI체 detection rules.

---

### D-6: Dynamic Pacing Controller (동적 페이싱 컨트롤러)

| Aspect | Detail |
|--------|--------|
| Value Proposition | AI maintains flat pacing -- every scene gets the same treatment. Professional novels modulate pace deliberately: slow for emotional depth, fast for action, breathing room between climaxes. |
| Complexity | Medium |
| Implementation | Pacing annotations in chapter plans + pacing-aware generation rules in novelist. |

**Pacing modes per scene:**

| Mode | Sentence Style | Description Density | Dialogue Ratio | Word Budget |
|------|---------------|---------------------|----------------|-------------|
| Breakneck | Short, fragments | Minimal | Low | 60% of base |
| Fast | Short-medium | Low | Medium | 80% of base |
| Normal | Mixed | Medium | Medium | 100% of base |
| Reflective | Medium-long | High | Low | 120% of base |
| Lingering | Long, flowing | Very high | Very low | 140% of base |

**Integration with tension curve**: Pacing mode should inversely correlate with tension changes. Rising tension = accelerating pace. Peak tension = breakneck or sudden stop. Falling tension = reflective/lingering.

---

## Anti-Features

Features to deliberately NOT build. These approaches are commonly attempted but actually make writing worse.

### AF-1: DO NOT Build an "AI Humanizer" Post-Processor

| Anti-Feature | Why Avoid | What to Do Instead |
|-------------|-----------|-------------------|
| A pass that randomly introduces typos, grammar errors, or "human imperfections" to fool AI detectors | This produces worse writing, not better writing. The goal is quality prose, not AI-detector evasion. Artificial imperfections are themselves detectable and make the text objectively worse. | Fix the root cause: write better prose from the start through improved prompts and pipeline design. |

---

### AF-2: DO NOT Build Synonym Replacement / Vocabulary Enrichment

| Anti-Feature | Why Avoid | What to Do Instead |
|-------------|-----------|-------------------|
| Post-processing that replaces "common" words with "interesting" synonyms to make prose seem more literary | This is the #1 cause of purple prose and AI-sounding text. AI already over-synonymizes. Adding more synonym variety makes text worse by increasing cognitive load and destroying consistent voice. | Use simple, precise words. "Said" is almost always better than "exclaimed/murmured/intoned/articulated." Enforce vocabulary consistency, not diversity. |

---

### AF-3: DO NOT Build Adjective/Adverb Injection

| Anti-Feature | Why Avoid | What to Do Instead |
|-------------|-----------|-------------------|
| "Enriching" prose by adding descriptive modifiers to bare nouns/verbs | Hyper-adjectival prose is the most recognizable AI tell. "The gleaming, ornate, ancient sword" is AI writing. "The sword" or "a notched blade" is human writing. | Enforce strong verbs over adverbs ("질주했다" not "매우 빨리 달렸다"). Enforce specific nouns over adjective+generic noun ("벚꽃" not "아름다운 꽃"). |

---

### AF-4: DO NOT Build Global Style Rewrite

| Anti-Feature | Why Avoid | What to Do Instead |
|-------------|-----------|-------------------|
| A "style transfer" pass that rewrites entire chapters to match a target style | Full rewrites destroy narrative voice, character consistency, and plot-specific word choices. Research shows this reduces novelty scores from 4.17 to 2.33 out of 5. | Use targeted, surgical edits (filter word removal, rhythm adjustment) rather than wholesale rewriting. The revision pipeline should refine, not replace. |

---

### AF-5: DO NOT Build Emotion Label Injection

| Anti-Feature | Why Avoid | What to Do Instead |
|-------------|-----------|-------------------|
| Adding explicit emotional labels ("슬픔이 밀려왔다", "행복함을 느꼈다") to ensure reader understands character emotions | This is literally "telling" -- the opposite of good writing. It destroys subtext and treats the reader as unable to infer. | Build the Emotional Subtext Engine (D-3) instead. Show emotions through action, dialogue, and physical sensation. Trust the reader. |

---

### AF-6: DO NOT Build "Literary Device Sprinkler"

| Anti-Feature | Why Avoid | What to Do Instead |
|-------------|-----------|-------------------|
| Randomly inserting metaphors, similes, and literary devices at fixed intervals to make prose seem more "literary" | Forced literary devices are worse than none. "Her eyes were like deep pools of midnight" is AI cliche. Devices must emerge from character/situation, not be sprinkled on top. | Train the novelist agent to use devices organically when the narrative moment calls for it. Quality over quantity. One perfect metaphor per scene beats five generic ones. |

---

## Feature Dependencies

```
TS-1 (AI체 탈피) ──────────────┐
TS-2 (Filter Words) ───────────┤
TS-3 (Sentence Rhythm) ────────┼──> D-1 (Revision Pipeline) ──> D-5 (Adaptive Quality)
TS-4 (Sensory Grounding) ──────┤
TS-5 (Character Voice) ────────┤
TS-6 (Scene Transitions) ──────┘

D-2 (Reference Style) ─────────> Style Guide Enhancement
D-3 (Emotional Subtext) ───────> Chapter Plan Enhancement
D-4 (Korean Texture Library) ──> Novelist Agent Enhancement
D-6 (Dynamic Pacing) ──────────> Chapter Plan Enhancement + Tension Curve Integration
```

**Key dependency**: All Table Stakes features must be implemented before D-1 (Revision Pipeline) can be effective. The pipeline stages need the detection systems (TS-1 through TS-6) to know what to fix.

---

## Priority Recommendation

### Phase 1: Foundation (Table Stakes)
Must implement first. These features go directly into the novelist agent prompt redesign and prose-quality-analyzer enhancement.

1. **TS-1** AI체 탈피 Core Rules (highest impact, addresses root cause)
2. **TS-2** Filter Word Elimination (low complexity, high visibility)
3. **TS-3** Sentence Rhythm Engine (medium complexity, critical for Korean feel)
4. **TS-5** Character Voice Fingerprinting (high complexity, but fundamental)
5. **TS-4** Sensory Grounding (medium complexity, immediate quality lift)
6. **TS-6** Scene Transitions (medium complexity, addresses pacing)

### Phase 2: Pipeline (Core Differentiator)
Build the revision pipeline once detection/rules are in place.

1. **D-1** Multi-Stage Revision Pipeline (the multiplier for all other features)
2. **D-4** Korean Prose Texture Library (reference material for pipeline stages)
3. **D-5** Adaptive Quality Gate (configurable output quality)

### Phase 3: Advanced (Competitive Edge)
Polish features that separate "good" from "great."

1. **D-2** Reference Style Learning (user-specific customization)
2. **D-3** Emotional Subtext Engine (literary depth)
3. **D-6** Dynamic Pacing Controller (professional-level pacing)

### Defer:
- None of the anti-features (AF-1 through AF-6) should ever be built.

---

## Korean-Language Specific Techniques Summary

| Technique | Category | Implementation Point |
|-----------|----------|---------------------|
| 의성어/의태어 natural integration | TS-4 | Novelist prompt + texture library |
| 종결어미 다양화 (~다/~지/~네/체언종결) | TS-3 | Novelist prompt + analyzer metrics |
| 여백의 미 (understatement) | D-4 | Texture library + subtext engine |
| 한/정 emotional vocabulary | D-4 | Texture library + genre recipes |
| 존칭 체계 consistency | TS-5 | Character voice profile |
| 계절감 embedding | D-4 | Texture library |
| 구어체/문어체 register control | TS-1 | AI체 rules + voice profiles |
| 한국식 대화 생략/함축 | TS-5 | Voice profile + dialogue rules |
| 반복과 변주 motif system | D-4 | Texture library + chapter plans |

---

## Sources

### High Confidence (Official docs, research papers)
- [Can AI writing be salvaged? - arXiv](https://arxiv.org/html/2409.14509v1) - Analysis of AI writing flaws: 28% awkward word choice, 20% sentence structure, 18% redundancy, 17% cliches
- [Evaluating Novelty in AI-Generated Research Plans - arXiv](https://arxiv.org/html/2601.09714) - Decomposition-based pipelines score 4.17/5 vs reflection-based 2.33/5
- [Generative AI enhances individual creativity but reduces collective diversity - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11244532/)

### Medium Confidence (Multiple sources corroborating)
- [Why Your Characters Sound the Same - Author's Pathway](https://authorspathway.com/writing-process/writing/why-your-characters-sound-the-same-a-guide-to-dialogue-differentiation/) - Dialogue differentiation techniques
- [Show, Don't Tell - Reedsy](https://blog.reedsy.com/show-dont-tell/) - Sensory writing techniques
- [Scene Transitions - FirstDraftPro](https://www.firstdraftpro.com/blog/how-to-write-a-great-scene-transition) - Transition techniques
- [AI가 쓴 티 안 나게 - AI Recipe](https://maily.so/airecipe/posts/1do19kmlzx6) - Korean AI writing de-detection
- [DC인사이드 AI 웹소설 갤러리 - 프롬프트 공유](https://gall.dcinside.com/mgallery/board/view/?id=aiwriter&no=2684) - Korean community prompt techniques
- [10 Ways AI Is Ruining Your Students' Writing](https://wendybelcher.com/writing-advice/10-ways-ai-is-ruining-your-students-writing/) - AI anti-patterns in prose

### Low Confidence (Single source, needs validation)
- I-Eum AI and TypeTak as Korean web novel specialized tools (commercial claims, not independently verified)
- Sudowrite's prose quality claims (company marketing)
