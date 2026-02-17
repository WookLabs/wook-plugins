<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-01-29 -->
<!-- Updated: Agent consolidation - 18 agents reduced to 14 functional + 4 deprecated -->

# agents

## Purpose

Contains prompt definitions for the specialized agents used in the novel writing workflow. After consolidation, the plugin has **14 functional agents** and **4 deprecated stubs** (kept for backward compatibility). Each agent is defined in a Markdown file with frontmatter specifying the agent name, description, Claude model tier (opus/sonnet/haiku), and a comprehensive prompt that defines their role, constraints, guidelines, and output format.

Agents are invoked via the Task tool by commands and orchestration workflows. They operate with specific domain expertise while maintaining consistency with the overall project structure.

## Agent Consolidation Summary

The following merges were performed to reduce overlap:

| Absorbed Agent | Merged Into | Capabilities Transferred |
|----------------|-------------|--------------------------|
| `pacing-analyzer` | `engagement-optimizer` | Scene length analysis, beat timing, rhythm/variety, genre-specific pacing |
| `tension-tracker` | `engagement-optimizer` | Korean emotion keyword detection, cross-chapter state, arc compliance, cliffhanger analysis, fatigue detection |
| `dialogue-analyzer` | `character-voice-analyzer` | Naturalness, subtext, tags/beats, dialogue ratio, info dump detection, conflict/tension, purpose verification |
| `plot-consistency-analyzer` | `consistency-verifier` | Plot hole detection, cause-effect logic chains, foreshadowing setup/payoff tracking |

## Key Files - Functional Agents (15)

| File | Agent | Model | Role |
|------|-------|-------|------|
| `novelist.md` | novelist | opus | Main prose writing - transforms plot outlines into immersive Korean narrative with proper pacing, character voice, and foreshadowing |
| `editor.md` | editor | sonnet | Revision and editing - improves pacing, style, dialogue, and structural flow while maintaining author's voice |
| `critic.md` | critic | opus | Quality evaluation - provides scores (0-100) across 4 dimensions, identifies issues, READ-ONLY (does not modify) |
| `lore-keeper.md` | lore-keeper | sonnet | Worldbuilding and consistency management - designs settings, manages character profiles, validates consistency |
| `plot-architect.md` | plot-architect | opus | Plot structure design - creates story arcs, dramatic beats, episode-level plots using proven structures (3-act, 5-act, Hero's Journey, Save the Cat) |
| `proofreader.md` | proofreader | haiku | Grammar and spelling - checks Korean language correctness, typos, formatting issues |
| `summarizer.md` | summarizer | haiku | Chapter summarization - creates concise summaries for context in subsequent chapters |
| `beta-reader.md` | beta-reader | sonnet | Reader simulation - predicts engagement, drop-off risk, emotional beats from reader perspective |
| `genre-validator.md` | genre-validator | sonnet | Genre compliance - validates genre-specific requirements, cliches, commercial factors |
| `chapter-verifier.md` | chapter-verifier | sonnet | Verification orchestrator - coordinates parallel validation before completion claims |
| `consistency-verifier.md` | consistency-verifier | sonnet | **EXPANDED** - Consistency checker (5 domains): character, timeline, setting, factual, and plot logic (absorbed plot-consistency-analyzer) |
| `engagement-optimizer.md` | engagement-optimizer | sonnet | **EXPANDED** - Engagement analysis (7 domains): pacing, tension curves, emotional beats with Korean keyword detection, hook density, drop-off risk, cliffhanger analysis, arc compliance (absorbed pacing-analyzer + tension-tracker) |
| `character-voice-analyzer.md` | character-voice-analyzer | sonnet | **EXPANDED** - Voice and dialogue analysis: speech patterns, OOC detection, relationship dynamics, naturalness, subtext, tags/beats, info dump detection, dialogue purpose (absorbed dialogue-analyzer) |
| `prose-quality-analyzer.md` | prose-quality-analyzer | sonnet | Prose analysis - show vs tell, sensory detail, filter words, specificity |
| `team-orchestrator.md` | team-orchestrator | sonnet | Team orchestration - loads team definitions, spawns agents, coordinates workflows (parallel/sequential/pipeline/collaborative), applies quality gates |

## Deprecated Agent Stubs (4)

These files are kept for backward compatibility. They redirect to their merged target.

| File | Original Role | Redirects To |
|------|---------------|--------------|
| `pacing-analyzer.md` | Pacing analysis - tension curves, scene rhythm, beat timing | `engagement-optimizer` |
| `tension-tracker.md` | Emotional arc tracking - tension curves, beat counting, cliffhanger analysis | `engagement-optimizer` |
| `dialogue-analyzer.md` | Dialogue analysis - naturalness, subtext, info dump detection | `character-voice-analyzer` |
| `plot-consistency-analyzer.md` | Plot hole detection - timeline errors, causality issues, foreshadowing tracking | `consistency-verifier` |

## Agent Characteristics

### Model Selection Rationale

- **Opus (novelist, critic, plot-architect)**: Complex creative tasks requiring deep reasoning, narrative understanding, and quality judgment
- **Sonnet (editor, lore-keeper, beta-reader, genre-validator, chapter-verifier, consistency-verifier, engagement-optimizer, character-voice-analyzer, prose-quality-analyzer)**: Balanced tasks needing both creativity and analytical skills, fast validation workflows
- **Haiku (proofreader, summarizer)**: Fast, focused tasks with clear criteria and limited scope

### Agent Interaction Patterns

Agents work together in specific workflows:

1. **Planning Phase**: `plot-architect` -> `lore-keeper` (story structure -> worldbuilding)
2. **Writing Phase**: `novelist` -> `summarizer` (prose -> summary for context)
3. **Revision Phase**: `critic` -> `editor` -> `proofreader` (evaluation -> revision -> cleanup)
4. **Consistency Phase**: `consistency-verifier` (validates character, timeline, setting, facts, and plot logic)
5. **Quality Gate Phase**: `critic` + `beta-reader` + `genre-validator` (parallel multi-validation)
6. **Engagement Phase**: `engagement-optimizer` (pacing, tension curves, emotional beats, hooks, drop-off, cliffhangers, arc compliance)
7. **Voice & Dialogue Phase**: `character-voice-analyzer` (voice consistency, OOC detection, dialogue quality)

### Common Prompt Structure

All agent prompts follow this pattern:

```markdown
---
name: agent-name
description: Brief role description
model: opus|sonnet|haiku
---

<Role>
Primary mission and identity
</Role>

<Critical_Constraints>
Hard rules and quality gates
</Critical_Constraints>

<Guidelines>
Best practices and techniques
</Guidelines>

## Expected Input Format
What data the agent receives

## Expected Output Format
What data the agent produces

## Workflow
Step-by-step process
```

## For AI Agents

### When to Use Each Agent

**plot-architect**:
- Initial project setup (structure design)
- Creating main/sub arcs
- Designing act breaks and dramatic beats
- Episode-level plot generation
- Foreshadowing and hook planning

**lore-keeper**:
- Worldbuilding (settings, rules, magic systems)
- Character creation and profiles
- Location design
- Terminology management
- Consistency validation (character traits, world rules, timeline)

**novelist**:
- Writing chapter prose from plot outlines
- Transforming beats into scenes
- Creating dialogue and internal monologue
- Planting foreshadowing naturally
- Crafting chapter-end hooks

**editor**:
- Revising chapters based on critic feedback
- Improving pacing and rhythm
- Enhancing dialogue and descriptions
- Fixing structural issues
- Maintaining style guide compliance

**critic**:
- Evaluating chapter quality (after writing or revision)
- Providing scores and feedback
- Identifying specific issues
- **READ-ONLY**: Never modifies content

**proofreader**:
- Final grammar and spelling check
- Korean language validation
- Formatting consistency
- Typo detection

**summarizer**:
- Creating chapter summaries for context
- Extracting key events and character developments
- Maintaining continuity information

### Expanded Validation Agents

**beta-reader**:
- Simulating reader engagement experience
- Predicting drop-off risk zones
- Detecting emotional beats (심쿵, 긴장, 설렘)
- Analyzing pacing from reader perspective
- Threshold: >=80 engagement score

**engagement-optimizer** (expanded - absorbs pacing-analyzer + tension-tracker):
- 7-domain engagement analysis: pacing, tension, emotional beats, hooks, drop-off, cliffhangers, arc compliance
- Scene length analysis and beat timing verification
- Korean emotion keyword-based beat detection with intensity scoring
- Cross-chapter state tracking via emotional-context.json (3-chapter sliding window)
- Cliffhanger effectiveness scoring (5 types: REVELATION, CLIFFHANGER, QUESTION, EMOTIONAL, TWIST)
- Arc-level tension compliance (기/승/전/결)
- Reader fatigue detection and warnings
- Genre-specific pacing standards and beat requirements
- Actionable optimization suggestions with impact estimates

**character-voice-analyzer** (expanded - absorbs dialogue-analyzer):
- Voice consistency and OOC detection with profile-based comparison
- Dialogue naturalness assessment (Korean speech patterns)
- Subtext vs on-the-nose analysis
- Dialogue tags & beats quality evaluation
- Dialogue-to-narration ratio analysis (genre-specific)
- Info dump detection in dialogue
- Conflict & tension in conversations
- Dialogue purpose verification (every line must serve the story)
- Korean honorifics and speech hierarchy validation

**consistency-verifier** (expanded - absorbs plot-consistency-analyzer):
- 5-domain consistency checking: character, timeline, setting, factual, plot logic
- Plot hole detection with confidence scoring
- Cause-effect logic chain validation
- Foreshadowing setup/payoff bidirectional checking
- Enhanced timeline verification with reconstruction
- Systematic entity extraction and cross-referencing

**genre-validator**:
- Verifying genre-specific required elements
- Checking cliche usage (acceptable vs overused)
- Evaluating commercial factors (hook density, dialogue ratio, episode length)
- Threshold: >=95 compliance score

### Agent Invocation Example

```javascript
// From a command or workflow script
Task(
  subagent_type: "novel-dev:novelist",
  prompt: `
## Context
${previousChapterSummaries}

## Current Chapter Info
${chapterJson}

## Settings
${styleGuide}
${characterProfiles}

## Instructions
- Target word count: 5000
- Tone: 달달, 코믹
- Pacing: medium
- Emotional goal: 설렘, 긴장감
- Foreshadowing to plant: [foreshadow_001, foreshadow_005]
- Chapter-end hook: 예상치 못한 제안
  `
)
```

### Quality Standards

Agents enforce these standards:

- **novelist**: +-10% word count tolerance, all required scenes included, foreshadowing planted naturally
- **editor**: Style guide adherence, improved scores on all metrics
- **critic**: Objective scoring (25 points each for narrative quality, plot coherence, character consistency, worldbuilding)
- **lore-keeper**: No contradictions with established canon
- **plot-architect**: Clear dramatic structure, proper pacing across acts
- **proofreader**: Zero grammar/spelling errors in final output
- **summarizer**: Concise (200-500 words), captures key events and emotional beats
- **beta-reader**: >=80 engagement score, drop-off risk zones identified with severity
- **engagement-optimizer**: 7-domain analysis with prioritized actionable fixes
- **character-voice-analyzer**: Voice consistency + dialogue quality across all characters
- **consistency-verifier**: 5-domain verification with chapter:line citations
- **genre-validator**: >=95 compliance, all required genre elements present

### Korean Writing Conventions

Agents (especially novelist and editor) follow these Korean literary techniques:

- **은유/비유**: Metaphors and similes appropriate to genre
- **의성어/의태어**: Onomatopoeia and mimetic words (살금살금, 콩닥콩닥, 찌릿)
- **호흡 조절**: Sentence rhythm variation (long sentences followed by short for impact)
- **감정 전이**: Emotional contagion through word choice
- **여백의 미**: Strategic understatement (imply rather than state directly)
- **반복과 변주**: Motif repetition with variation

### Common Pitfalls to Avoid

**DON'T:**
- Use novelist for planning tasks (use plot-architect)
- Use critic to revise content (it's read-only; use editor)
- Bypass quality gates (70/100 minimum)
- Ignore style guide taboo words
- Create info-dumps in prose
- Use Western idioms that don't translate well
- Telegraph foreshadowing ("This would be important later")
- Write meta-commentary in prose output
- Call deprecated agents directly (use their merged targets instead)

## Multi-Validator Quality Gate (v2)

Masterpiece Mode uses 3-validator parallel consensus:

| Validator | Threshold | Focus |
|-----------|-----------|-------|
| critic | >=85 | Quality (narrative, plot, character, setting) |
| beta-reader | >=80 | Engagement (hooks, pacing, emotional impact) |
| genre-validator | >=95 | Genre compliance (required elements, commercials) |

**ALL three must PASS** for quality gate approval.

### Circuit Breaker

If same failure reason occurs 3 times:
1. Auto-pause validation
2. Present options to user: (A) Manual fix (B) Lower threshold (C) Skip chapter (D) Stop

### Diagnostic Output

Failed validators provide:
- `root_cause`: Primary issue identified
- `severity`: critical/major/minor
- `suggested_fix`: Specific actionable recommendation
- `estimated_effort`: quick/moderate/significant

## Dependencies

**Agent Dependencies:**
- All agents depend on JSON schemas in `../schemas/` for data validation
- novelist requires style-guide.json, character profiles, plot structure
- editor requires original chapter + critic review
- critic requires completed chapter
- lore-keeper manages canonical data in `../world/` and `../characters/`
- plot-architect produces structure consumed by novelist
- summarizer produces context for novelist
- engagement-optimizer uses emotional-context.json for cross-chapter state

**Model Availability:**
- Agents are hardcoded to specific Claude models
- Requires Claude API access with opus/sonnet/haiku model tiers
- Model selection cannot be overridden (intentional design for quality consistency)

## Extending Agents

To add a new agent:

1. Create `agent-name.md` in this directory
2. Add frontmatter with `name`, `description`, `model`
3. Define Role, Critical_Constraints, Guidelines sections
4. Specify Input/Output formats
5. Document workflow steps
6. Update parent `../AGENTS.md` to reference new agent
7. Update relevant commands to invoke the agent

**Example frontmatter:**
```yaml
---
name: beta-reader
description: Provides reader perspective feedback on chapters
model: sonnet
---
```

## Agent Prompt Best Practices

When modifying agent prompts:

- Use clear section headers with XML-style tags (`<Role>`, `<Guidelines>`)
- Provide specific examples of good/bad outputs
- Include quality checklists
- Specify expected JSON/Markdown formats precisely
- Use Korean examples for Korean-specific agents
- Balance prescriptive rules with creative freedom
- Test with edge cases (very short/long chapters, complex scenarios)

---

## External Agent Integration

### oh-my-claude-sisyphus / oh-my-claudecode Agent Usage

novel-dev can leverage external strategic agents:

| Situation | Agent to Call | Purpose |
|-----------|--------------|---------|
| Strategic planning | `oh-my-claudecode:planner` | Project-wide planning, interview-based requirements |
| Plan/manuscript review | `oh-my-claudecode:critic` | Critical review, structural flaw identification |
| Risk analysis | `oh-my-claudecode:analyst` | Hidden risk factors, preemptive issue identification |
| Research | `oh-my-claudecode:researcher` | External documentation/resource search |

### Usage Notes

- External plugins must be installed
- External agents are general-purpose (not novel-domain-specific)
- Use novel-dev built-in agents for novel-specific tasks

---

## Magic Keywords (Auto-Command Triggers)

Novel-dev recognizes natural language keywords and automatically executes corresponding commands.

### Keyword-Command Mapping

| Keyword Pattern | Trigger Command | Example |
|-----------------|----------------|---------|
| "집필", "써줘", "작성해" | `/novel-dev:write [chapter]` | "15화 집필해줘" |
| "퇴고", "수정", "다듬어" | `/novel-dev:revise` | "이 장면 퇴고해줘" |
| "평가", "점수", "품질" | `/novel-dev:evaluate` | "품질 평가해봐" |
| "전체 집필", "다 써줘", "끝까지" | `/novel-dev:write-all` | "1막 전체 집필" |
| "일관성", "설정 체크" | `/novel-dev:consistency-check` | "설정 일관성 확인" |
| "통계", "현황" | `/novel-dev:stats` | "진행 통계 보여줘" |
| "내보내기", "출력" | `/novel-dev:export` | "원고 내보내기" |

### Usage Rules

1. **Explicit commands take priority**: `/write 15` overrides keyword detection.
2. **Context-aware**: Keywords only trigger when a novel project is active.
3. **Combinable**: "15화 집필하고 퇴고까지 해줘" -> `/write 15` + `/revise`

### Deactivation

Use explicit commands to bypass keyword auto-triggers:
- `/novel-dev:write 15` (explicit)
- "15화 작성해줘" (keyword - auto-triggered)
