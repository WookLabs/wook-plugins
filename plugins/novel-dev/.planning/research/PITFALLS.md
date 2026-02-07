# Domain Pitfalls: AI Novel Writing Quality

**Domain:** AI-assisted Korean genre fiction (web novels)
**Researched:** 2026-02-05
**Overall Confidence:** MEDIUM-HIGH (synthesized from web research, academic papers, practitioner reports, and analysis of current Novel-Dev v4.0 codebase)

---

## Critical Pitfalls

Mistakes that cause fundamental quality failures or require major rework.

---

### Pitfall 1: The Multi-Agent Coordination Tax

**What goes wrong:** Adding more agents (14 in Novel-Dev's case) creates coordination overhead that actively degrades output quality instead of improving it. Each agent handoff introduces error amplification, context pollution, and voice fragmentation. UC Berkeley/DeepMind research shows that if a single agent has a 5% error rate, a multi-agent system can compound this to 86% error rates through cascading failures.

**Why it happens:** The intuition that "more specialists = better quality" is wrong for creative writing. Unlike software engineering where tasks decompose cleanly, prose quality is holistic -- voice, rhythm, emotion, and narrative flow are properties of the whole text, not separable components. When a critic agent flags "too much telling," an editor agent "fixes" it by adding sensory details, and a proofreader then smooths the transitions, the result is committee-written prose that sounds like exactly what it is: a document revised by multiple non-communicating reviewers.

**Consequences:**
- Prose reads like it was written by committee (because it was)
- Each agent's "improvements" overwrite or dilute the previous agent's voice
- Context pollution: error messages, evaluation JSON, and meta-commentary leak into the creative pipeline
- NeurIPS 2025 data shows 41-86.7% failure rates across multi-agent systems

**Warning signs:**
- Revised text scores higher on rubrics but reads worse to humans
- Character voice becomes more generic after each revision pass
- The "editor" agent systematically removes stylistic risks the "novelist" agent took
- Prose quality metrics improve while reader engagement drops

**Prevention:**
- Reduce the pipeline to the minimum viable chain: writer -> single quality gate -> targeted fix
- Never let evaluation agents rewrite text; they should only flag locations and issues
- Keep the novelist agent as the sole voice; revision should be re-generation with feedback, not patching
- Test: can a human reader tell where one agent's work ends and another's begins? If yes, the pipeline is broken

**Detection:** Compare a chapter written by the novelist agent alone vs. one that went through the full pipeline. If the pipeline output sounds more generic, the pipeline is destroying value.

**Phase relevance:** Phase 1 (Architecture). Must restructure agent pipeline before any prompt improvements matter.

---

### Pitfall 2: The "Tell Don't Show" Trap -- LLMs' Default Mode

**What goes wrong:** LLMs statistically default to exposition and summarization over scene-level dramatization. The model writes "She felt angry" instead of "Her hands curled into fists." This is not a prompt engineering failure -- it is a fundamental property of how language models generate text. They produce the statistically most probable next token, which for emotional moments is the label ("angry") rather than the dramatization (physical behavior).

**Why it happens:**
- Statistical averaging: LLMs produce output biased toward the most common patterns in training data. Telling is more common than showing in the internet corpus
- Lack of intentionality: the model does not understand that a scene needs to create an experience, not deliver information
- Pattern collapse under instruction: when given explicit "show don't tell" instructions, models often produce formulaic showing (always describing hands clenching, hearts pounding) rather than varied dramatization
- The model defaults to the "report" register -- summarizing what happens rather than rendering it

**Consequences:**
- Prose reads like a plot summary with dialogue inserted
- Emotional climaxes fall flat because feelings are announced rather than demonstrated
- Reader engagement drops because there is nothing to interpret -- everything is stated explicitly
- In Korean specifically: over-reliance on direct emotion words (느꼈다, 생각했다, 알았다) creates distance between reader and character

**Warning signs:**
- Filter word density > 10 per 1000 words (느꼈다, 보였다, 생각했다, 깨달았다)
- Climactic scenes contain sentences like "그녀는 깊은 배신감을 느꼈다" instead of behavioral dramatization
- Every emotional beat follows the pattern: [character] + [emotion noun] + 느꼈다/했다
- Internal monologue is exposition disguised as character thought

**Prevention:**
- Do NOT instruct "show don't tell" generically -- this produces cliched showing
- Instead, provide concrete examples of dramatized emotion IN THE STYLE GUIDE for each emotion type the chapter requires
- Use "negative examples" in prompts: show the model what the bad version looks like and what the good version looks like
- Require the novelist agent to write a "sensory budget" before drafting: list which senses will be used in each scene
- For Korean: create a curated library of non-cliche physical reactions per emotion, refreshed per project

**Detection:** Run the prose-quality-analyzer's filter word count. If > 10 per 1000 words, or if climactic scenes contain more than 30% telling, the trap is active.

**Phase relevance:** Phase 2 (Prompt Architecture). Must be addressed through style guide and example engineering, not just instructions.

---

### Pitfall 3: Numeric Score Evaluation Theater

**What goes wrong:** The current 3-validator quality gate (critic >= 85, beta-reader >= 80, genre-validator >= 95) creates the illusion of quality control while measuring the wrong things. LLM-as-judge evaluators are biased toward length, formal correctness, and surface-level genre compliance. They cannot reliably assess what makes prose feel alive vs. artificial. Research shows LLM judges favor stylistic choices over substance and exhibit positional bias.

**Why it happens:**
- Automated metrics (BLEU, ROUGE, rubric scores) measure surface similarity, not experiential quality
- LLM evaluators share the same statistical biases as LLM writers -- they reward the patterns they themselves would produce
- Numeric thresholds create perverse incentives: the writer agent learns to produce "85-point prose" that satisfies rubrics while lacking soul
- The genre-validator at >= 95 especially rewards checkbox compliance (tropes present, structure followed) over execution quality

**Consequences:**
- Chapters that score 90+ on rubrics but read as AI-generated to any human reader
- The system optimizes for metric satisfaction rather than reader experience
- "Goodharting" -- when the measure becomes the target, it ceases to be a good measure
- False sense of security: the team believes quality is high because numbers are high

**Warning signs:**
- Scores consistently high (85+) but human readers still say "this sounds like AI"
- Score variance is low across chapters (all chapters score 82-88) -- this indicates the evaluator has a narrow dynamic range
- The critic never gives scores below 70 even for obviously weak prose
- Evaluator feedback is generic and could apply to any chapter

**Prevention:**
- Replace numeric thresholds with comparative evaluation: "Is this chapter better or worse than [reference chapter]?"
- Use contrastive evaluation: present the evaluator with two versions (current vs. alternative) and ask which reads more naturally
- Add a dedicated "AI-detection" check: ask an evaluator "does this sound like it was written by AI?" and require it to identify specific passages
- Supplement automated evaluation with human spot-checks on every Nth chapter
- Track score correlation: if automated scores do not correlate with human preference rankings, the evaluation system is broken

**Detection:** Have 3 human readers rank 5 chapters by quality. Compare their ranking to the automated scores. If Spearman correlation < 0.5, the evaluation system is measuring the wrong thing.

**Phase relevance:** Phase 3 (Evaluation Redesign). Must rebuild evaluation before claiming quality improvements.

---

### Pitfall 4: Context Window Voice Drift

**What goes wrong:** The AI loses the established voice, tone, and stylistic identity as it writes deeper into a chapter or across chapters. Research shows LLMs effectively utilize only 10-20% of their context window, with performance degrading sharply in the middle 70-80% of context. The current system loads context by priority (style guide, plot, summaries, characters, world) but the sheer volume (120K tokens) means the style guide's influence attenuates by mid-chapter.

**Why it happens:**
- Attention mechanisms favor the beginning and end of context ("lost in the middle" problem)
- Style guides loaded as structured JSON at the start of context get overridden by the narrative momentum of previous chapter summaries and plot JSON
- Each new chapter starts with a fresh context assembly, losing the "voice memory" established in previous chapters
- The model's default voice (AI-generic) reasserts itself when the stylistic signal weakens

**Consequences:**
- Chapter 1 sounds different from chapter 10 despite the same style guide
- Within a single chapter, the opening (closest to style guide in context) sounds better than the middle
- Character voice homogenizes across chapters -- all characters start sounding like the same narrator
- Korean-specific: honorific levels (존댓말/반말) drift mid-chapter, especially in dialogue-heavy sections

**Warning signs:**
- Opening paragraphs consistently stronger than middle sections
- Reviewer feedback notes "voice inconsistency" but the style guide has not changed
- Characters who speak casually (반말) occasionally slip into formal register (존댓말) mid-scene
- Later chapters in a series sound progressively more generic

**Prevention:**
- Place style exemplars (actual prose samples in target voice) at BOTH the beginning AND end of the context window, sandwiching the content
- Use "voice anchors": 3-5 short paragraphs of exemplary prose from the same project, placed immediately before the writing instruction
- Reduce context window usage: load less, but load it smarter. 60K of well-curated context beats 120K of everything
- For multi-chapter consistency: include a "voice fingerprint" (statistical summary of sentence length distribution, vocabulary preferences, rhythm patterns) from the previous chapter as a compact reference
- Implement "style checkpoints" every 1000 words where the model re-reads the style guide excerpt

**Detection:** Compare sentence-level metrics (avg length, ending variety, filter word density) between the first 1000 words and last 1000 words of each chapter. If they diverge > 15%, voice drift is occurring.

**Phase relevance:** Phase 2 (Prompt Architecture) for context restructuring. Phase 4 (Polish) for cross-chapter consistency.

---

## Moderate Pitfalls

Mistakes that cause noticeable quality degradation or accumulate as technical debt.

---

### Pitfall 5: Korean Language Specific -- Honorific System Collapse

**What goes wrong:** Korean's complex honorific system (존댓말/반말/높임말/하오체/하게체/해요체/해체) is one of the most difficult aspects for LLMs to maintain consistently. Characters whose relationship dictates a specific speech level (e.g., 해체 between close friends, 존댓말 between boss and subordinate) will randomly shift registers, breaking reader immersion.

**Why it happens:**
- LLMs treat honorific levels as surface-level vocabulary choices rather than relational markers
- Context window limitations mean relationship context gets lost mid-chapter
- The model defaults to the most common register in training data (해요체) regardless of character relationship
- When generating long dialogue sequences, the model "forgets" the established speech level

**Consequences:**
- A character who speaks casually to their friend suddenly uses formal speech
- The internal monologue register does not match the character's social position
- Readers immediately recognize this as AI-generated because honorific errors are jarring in Korean
- The 존칭 체계 is a fundamental signal of character relationship -- getting it wrong undermines characterization

**Prevention:**
- Include an explicit "speech level matrix" in character profiles: Character A speaks to Character B in [해체], to Character C in [존댓말]
- Place this matrix in the immediate context before each dialogue-heavy scene
- Add a post-generation validation step specifically for honorific consistency
- Never rely on the model to infer speech levels from relationship descriptions alone -- always specify explicitly
- Use Korean-specific taboo patterns: flag when 해요체 appears in a scene where only 해체 was specified

**Detection:** Grep for sentence-ending patterns (요, 습니다, 세요) in scenes where the style guide specifies informal speech. Any occurrence is a violation.

**Phase relevance:** Phase 2 (Prompt Architecture) for speech level specification. Phase 3 (Evaluation) for automated detection.

---

### Pitfall 6: Korean Language Specific -- Unnatural Onomatopoeia and Mimetic Words

**What goes wrong:** Korean is extraordinarily rich in onomatopoeia (의성어) and mimetic words (의태어), with subtle gradations (살금살금 vs. 슬금슬금, 콩닥콩닥 vs. 쿵쾅쿵쾅). LLMs tend to either overuse the same few common ones or misapply them, using words whose nuance does not match the scene's emotional register.

**Why it happens:**
- The model knows the common ones (두근두근, 살금살금) but not the nuanced variations
- Onomatopoeia carry emotional weight in Korean that the model does not fully grasp: 콩닥콩닥 (light, excited heartbeat) vs. 쿵쾅쿵쾅 (heavy, anxious heartbeat) -- using the wrong one changes the scene's emotion
- The model may invent plausible-sounding but non-standard onomatopoeia
- Overuse of the same mimetic words creates a repetitive texture readers notice

**Prevention:**
- Create a curated onomatopoeia/mimetic word reference per genre and emotional register
- Include 3-5 alternative expressions for each common one (e.g., for "heart beating": 두근두근, 콩닥콩닥, 쿵쾅쿵쾅, 벌렁벌렁 -- with usage notes)
- Flag repetition: no onomatopoeia/mimetic word should appear more than twice in a single chapter
- Validate against a whitelist rather than relying on the model's vocabulary

**Detection:** Count unique onomatopoeia per chapter. If < 5 unique expressions or any single expression appears 3+ times, the variety is insufficient.

**Phase relevance:** Phase 2 (Style Guide Enhancement).

---

### Pitfall 7: Prompt Engineering Cliche Induction

**What goes wrong:** Common prompt engineering techniques for creative writing inadvertently make the output MORE AI-sounding, not less. Phrases like "write vividly," "use sensory details," "create compelling characters" produce recognizably formulaic prose because every AI writing system uses these same instructions.

**Why it happens:**
- These instructions activate the model's "creative writing mode" -- a specific register trained on writing advice and MFA-style fiction, which is itself a recognizable style
- "Write vividly" produces the model's idea of vivid writing, which is the statistical average of all "vivid" writing in its training data
- Generic quality instructions produce generic quality -- the model cannot distinguish between "be vivid like Hemingway" and "be vivid like a romance novel"
- The more creative writing advice you put in the prompt, the more the output sounds like a creative writing exercise rather than a published novel

**Warning signs:**
- Output contains recognizable "AI creative writing" markers: starting paragraphs with sensory details, every scene opening with weather/setting description, emotional beats always rendered through physical sensation
- Characters always "let out a breath they didn't know they were holding"
- Every chapter opening follows the pattern: sensory hook -> character introduction -> conflict tease
- Prose is competent but indistinguishable from any other AI-generated fiction

**Prevention:**
- Replace generic instructions ("write vividly") with specific, project-unique exemplars
- Use "anti-prompt" technique: include examples of BAD AI-generated prose and instruct the model to avoid those specific patterns
- Derive stylistic instructions from a specific human author's work, not from writing advice
- Limit the style guide to CONSTRAINTS (what NOT to do) rather than ASPIRATIONS (what to aim for) -- constraints produce more distinctive prose
- Example: instead of "use varied sentence lengths," specify "no more than 3 consecutive sentences ending in ~다. At least 20% of sentences should be under 8 words."

**Detection:** Feed the output to an AI detection tool. If it scores > 70% likely AI-generated, the prompt engineering is producing AI-recognizable patterns.

**Phase relevance:** Phase 2 (Prompt Architecture). This is the single highest-impact change available.

---

### Pitfall 8: Temperature/Sampling Parameter Misuse

**What goes wrong:** Using the same temperature setting for all writing tasks produces either consistently safe/generic prose (too low) or incoherent/off-brand prose (too high). The current system uses temperature 0.85 for Grok adult content but does not appear to differentiate temperature by scene type for the main writing pipeline.

**Why it happens:**
- Temperature is often set once and forgotten
- The relationship between temperature and prose quality is non-linear and task-dependent
- Too low (< 0.5): the model produces the safest, most predictable token at each step, resulting in generic prose
- Too high (> 1.0): the model produces surprising but potentially incoherent or off-character text
- The optimal temperature differs by scene type: dialogue benefits from moderate temperature (0.6-0.8) while lyrical description benefits from higher (0.8-1.0)

**Prevention:**
- Implement scene-type-aware temperature: action scenes (0.6-0.7 for clarity), dialogue (0.7-0.8 for natural variation), emotional/lyrical (0.8-1.0 for freshness), exposition (0.5-0.6 for precision)
- Combine temperature with top-p: use top-p 0.9 as a safety net to prevent incoherence at higher temperatures
- Test: generate the same scene at 3 different temperatures and compare. Choose the setting that produces the best balance of surprise and coherence
- Never use temperature > 1.0 for Korean web novel prose -- the risk of honorific errors and unnatural phrasing increases sharply

**Detection:** If all chapters feel equally "safe" and predictable, temperature is too low. If characters occasionally say things that break their established voice, temperature is too high.

**Phase relevance:** Phase 2 (Prompt Architecture) for initial calibration. Phase 4 (Polish) for scene-type specialization.

---

### Pitfall 9: Dialogue Homogenization

**What goes wrong:** All characters sound identical. The model produces grammatically varied dialogue but fails to give characters distinctive speech patterns, vocabulary preferences, sentence length tendencies, or verbal tics. In Korean web novels, where dialogue can comprise 55-65% of the text, this is devastating.

**Why it happens:**
- Character profiles describe personality traits but not speech patterns
- The model generates dialogue that sounds like "a character who would say this" rather than "this specific character speaking"
- Korean's relative morphological richness (어미 variation, 조사 selection) is underutilized -- the model defaults to standard patterns
- When multiple characters speak in a scene, the model's "voice" bleeds across all characters

**Prevention:**
- Add "speech fingerprint" to each character profile: preferred sentence endings, habitual filler words, vocabulary level, sentence length tendency, dialect markers
- Include 5-10 sample dialogue lines per character in the style guide
- Use contrastive specification: "Character A speaks in short, blunt sentences. Character B speaks in flowing, hedging phrases with lots of ~것 같은데 and ~거 아닌가?"
- Post-generation check: mask character names in dialogue and test if readers can identify who is speaking from speech patterns alone

**Detection:** Extract all dialogue lines per character. Calculate average sentence length, ending pattern distribution, and vocabulary overlap between characters. If overlap > 80%, characters are not differentiated enough.

**Phase relevance:** Phase 2 (Character System Enhancement).

---

### Pitfall 10: The Revision Death Spiral

**What goes wrong:** Each revision pass makes the prose slightly more "correct" and slightly less alive. The critic identifies genuine issues, the editor fixes them conservatively, and after 3 passes the text reads like it was written by a cautious student rather than a confident storyteller. The current abort condition (3+ revisions with no improvement) does not catch this because scores keep improving even as voice quality degrades.

**Why it happens:**
- Revision agents are risk-averse: they fix problems by choosing safer, more common alternatives
- Each pass removes stylistic choices that were intentional ("risky but effective") because the evaluator cannot distinguish intentional style from errors
- The evaluation rubric rewards conformity: standard pacing, standard structure, standard emotional beats
- Korean-specific: revision agents tend to "standardize" sentence endings toward the most common ~다 form, removing the rhythm variety (체언 종결, 명사형 종결, 의문형) the novelist agent may have introduced

**Prevention:**
- Limit revision to ONE pass of targeted fixes, not iterative polishing
- Make revision additive (add missing elements) rather than subtractive (remove "problems")
- Protect intentional style: the novelist agent should mark "intentional" stylistic choices that the revision pipeline must preserve
- If score after revision is within 5 points of pre-revision score, STOP -- further revision will only damage voice
- Use "revision budget": each revision pass may change at most 15% of the text

**Detection:** Track the vocabulary diversity (type-token ratio) across revision passes. If TTR decreases with each pass, revision is homogenizing the prose.

**Phase relevance:** Phase 1 (Architecture) for pipeline restructuring. Phase 3 (Evaluation) for revision termination criteria.

---

## Minor Pitfalls

Issues that cause annoyance or reduce polish but are fixable with targeted changes.

---

### Pitfall 11: Korean Sentence Ending Monotony

**What goes wrong:** Korean prose requires varied sentence endings for natural rhythm, but LLMs default to the most common endings (~다, ~었다, ~ㄴ다) producing monotonous prose. The current prose-quality-analyzer already flags this (80% same ending as a red flag) but the fixing mechanism is inadequate.

**Prevention:**
- Add explicit ending distribution targets to the style guide: ~다/~었다 (max 60%), ~지/~네/~구나 (min 15%), 체언/명사형 종결 (min 10%), 의문형/기타 (min 15%)
- Include rhythm templates: "After 3 sentences ending in ~다, the next sentence must use a different ending"

**Phase relevance:** Phase 2 (Style Guide Enhancement).

---

### Pitfall 12: Foreshadowing as Checklist Item

**What goes wrong:** The current system tracks foreshadowing as IDs to "plant" (fore_001, fore_002). This mechanical approach produces foreshadowing that feels like a checklist item inserted into the narrative rather than an organic part of the story. The critic evaluates "was fore_001 planted?" not "was it planted naturally?"

**Prevention:**
- Replace ID-based foreshadowing tracking with narrative-function tracking: "Scene where [character] notices [detail] that will matter in chapter [N]"
- Evaluate foreshadowing by asking "could a first-time reader identify this as foreshadowing?" -- if yes, it is too obvious
- Allow the novelist agent to choose HOW to plant foreshadowing, not just WHERE

**Phase relevance:** Phase 2 (Plot System Redesign).

---

### Pitfall 13: Western Prose Patterns in Korean Text

**What goes wrong:** LLMs trained primarily on English text produce Korean prose that follows English syntactic and rhetorical patterns, even when the surface language is Korean. This includes: topic-comment structure violations, unnatural relative clause stacking, overly explicit logical connectors (그러므로, 따라서, 결과적으로), and English-style metaphors that do not resonate in Korean culture.

**Prevention:**
- Add a Korean naturalness checklist: check for overly long relative clauses (>20 syllables before the noun), excessive logical connectors, direct translation idioms
- Include examples of natural Korean prose rhythm alongside the style guide
- Specify: "Write as a native Korean author would, not as a translation from English would read"
- Flag specific Western patterns: starting sentences with adverbial clauses ("비가 내리고 있었기 때문에, 그녀는...") which are natural in English but awkward in Korean

**Phase relevance:** Phase 2 (Prompt Architecture).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Architecture (Pipeline) | Multi-agent coordination tax (#1), Revision death spiral (#10) | Simplify to writer + single evaluator + targeted fix. Never more than 1 revision pass |
| Prompt Architecture | Tell don't show (#2), Cliche induction (#7), Voice drift (#4), Temperature misuse (#8) | Example-driven prompts, anti-patterns library, context sandwich, scene-type temperature |
| Style Guide | Korean honorifics (#5), Onomatopoeia (#6), Sentence endings (#11), Western patterns (#13) | Explicit speech matrices, curated word lists, distribution targets, naturalness checklist |
| Evaluation | Score theater (#3), Revision death spiral (#10), Foreshadowing checklist (#12) | Comparative evaluation, human calibration, narrative-function tracking |
| Character System | Dialogue homogenization (#9), Honorific collapse (#5) | Speech fingerprints, contrastive specification, masked identification test |
| Cross-Chapter | Voice drift (#4), Sentence monotony (#11) | Voice anchors, fingerprint continuity, style checkpoints |

---

## The Meta-Pitfall: Solving the Wrong Problem

The single most important insight from this research is that Novel-Dev v4.0's quality problem is likely NOT that its agents are insufficiently capable. The problem is structural:

1. **Too many agents** creating committee-written prose instead of a single voice
2. **Evaluation metrics** that reward AI-recognizable patterns instead of human-resonant writing
3. **Generic prompt engineering** that activates the model's "creative writing mode" instead of a specific, distinctive voice
4. **Korean-specific naturalness** being treated as a secondary concern rather than the primary quality signal

The most impactful single change would be to generate a chapter with a single, well-prompted agent using project-specific exemplars, with NO revision pipeline, and compare it against the current 14-agent pipeline output. If the simpler version sounds more natural, the complexity is the problem.

---

## Sources

### Multi-Agent System Failures
- [Why Your Multi-Agent AI System Is Probably Making Things Worse](https://www.imaginexdigital.com/insights/why-your-multi-agent-ai-system-is-probably-making-things-worse) - MEDIUM confidence
- [Why Do Multi-Agent LLM Systems Fail? (NeurIPS 2025)](https://arxiv.org/pdf/2503.13657) - HIGH confidence
- [2025 Overpromised AI Agents](https://medium.com/generative-ai-revolution-ai-native-transformation/2025-overpromised-ai-agents-2026-demands-agentic-engineering-5fbf914a9106) - LOW confidence
- [State of AI Agents - LangChain](https://www.langchain.com/state-of-agent-engineering) - HIGH confidence

### AI Writing Quality
- [Creative Writing and AI's Failure Modes](https://coyotetracks.org/blog/ai-writing/) - MEDIUM confidence
- [Why AI Writing Still Sounds Robotic](https://medium.com/@benjlijelbacem/why-ai-writing-still-sounds-robotic-and-how-to-fix-it-726e7beafb73) - LOW confidence
- [Creative Writing with LLMs - LessWrong](https://www.lesswrong.com/posts/D9MHrR8GrgSbXMqtB/creative-writing-with-llms-part-1-prompting-for-fiction) - MEDIUM confidence
- [How Context Windows Shape Your AI Writing](https://medium.com/higher-neurons/how-context-windows-shape-your-ai-writing-over-time-30c75ec5f9df) - LOW confidence

### Evaluation Metrics
- [AI Bias for Creative Writing Assessment (IZA)](https://docs.iza.org/dp17646.pdf) - HIGH confidence
- [LitBench: Evaluation of Creative Writing (Stanford)](https://cs191.stanford.edu/projects/Spring2025/Sebastian___Russo_.pdf) - HIGH confidence
- [WritingBench: Comprehensive Benchmark](https://arxiv.org/html/2503.05244v2) - HIGH confidence
- [Stylometric Comparisons of Human vs. AI Writing (Nature)](https://www.nature.com/articles/s41599-025-05986-3) - HIGH confidence

### Temperature and Sampling
- [Adjusting Temperature for Writing with an LLM](https://medium.com/ai-and-llm-and-creative-writing/adjusting-the-temperature-for-writing-with-an-llm-efaf79bee31c) - MEDIUM confidence
- [AI Settings for Writers (Future Fiction Academy)](https://futurefictionacademy.com/ai-writing-settings-guide/) - MEDIUM confidence
- [What is LLM Temperature (IBM)](https://www.ibm.com/think/topics/llm-temperature) - HIGH confidence

### Korean AI Writing
- [ko_novel_generator (GitHub)](https://github.com/IllgamhoDuck/ko_novel_generator) - MEDIUM confidence (dated)
- [한국어 쓰기에서 생성형 AI 사용에 대한 학습자 인식](https://www.earticle.net/Article/A459550) - HIGH confidence
