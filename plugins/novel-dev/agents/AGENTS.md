<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-01-17 -->

# agents

## Purpose

Contains prompt definitions for the 18 specialized agents used in the novel writing workflow. Each agent is defined in a Markdown file with frontmatter specifying the agent name, description, Claude model tier (opus/sonnet/haiku), and a comprehensive prompt that defines their role, constraints, guidelines, and output format.

Agents are invoked via the Task tool by commands and orchestration workflows. They operate with specific domain expertise while maintaining consistency with the overall project structure.

## Key Files

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
| `tension-tracker.md` | tension-tracker | sonnet | Emotional arc tracking - tension curves, beat counting, cliffhanger analysis, cross-chapter state |
| `genre-validator.md` | genre-validator | sonnet | Genre compliance - validates genre-specific requirements, cliches, commercial factors |
| `chapter-verifier.md` | chapter-verifier | sonnet | Verification orchestrator - coordinates parallel validation before completion claims |
| `consistency-verifier.md` | consistency-verifier | sonnet | Consistency checker - detects character, timeline, setting, and factual contradictions |
| `engagement-optimizer.md` | engagement-optimizer | sonnet | Engagement analysis - pacing, tension curves, emotional beats, hook density optimization |
| `plot-consistency-analyzer.md` | plot-consistency-analyzer | sonnet | Plot hole detection - timeline errors, causality issues, foreshadowing tracking |
| `character-voice-analyzer.md` | character-voice-analyzer | sonnet | Voice consistency - speech patterns, OOC detection, relationship dynamics |
| `prose-quality-analyzer.md` | prose-quality-analyzer | sonnet | Prose analysis - show vs tell, sensory detail, filter words, specificity |
| `pacing-analyzer.md` | pacing-analyzer | sonnet | Pacing analysis - tension curves, scene rhythm, beat timing |
| `dialogue-analyzer.md` | dialogue-analyzer | sonnet | Dialogue analysis - naturalness, subtext, info dump detection |

## Agent Characteristics

### Model Selection Rationale

- **Opus (novelist, critic, plot-architect)**: Complex creative tasks requiring deep reasoning, narrative understanding, and quality judgment
- **Sonnet (editor, lore-keeper, beta-reader, tension-tracker, genre-validator)**: Balanced tasks needing both creativity and analytical skills, fast validation workflows
- **Haiku (proofreader, summarizer)**: Fast, focused tasks with clear criteria and limited scope

### Agent Interaction Patterns

Agents work together in specific workflows:

1. **Planning Phase**: `plot-architect` → `lore-keeper` (story structure → worldbuilding)
2. **Writing Phase**: `novelist` → `summarizer` (prose → summary for context)
3. **Revision Phase**: `critic` → `editor` → `proofreader` (evaluation → revision → cleanup)
4. **Consistency Phase**: `lore-keeper` (validates against canonical data)
5. **Quality Gate Phase**: `critic` + `beta-reader` + `genre-validator` (parallel multi-validation)
6. **Emotional Arc Phase**: `tension-tracker` (updates tension-curve.json, beat-counter.json after each chapter)

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

### New Validation Agents (Masterpiece Mode)

**beta-reader**:
- Simulating reader engagement experience
- Predicting drop-off risk zones
- Detecting emotional beats (심쿵, 긴장, 설렘)
- Analyzing pacing from reader perspective
- Threshold: ≥75 engagement score

**tension-tracker**:
- Tracking tension levels (1-10) across scenes
- Counting emotional beats per genre requirements
- Analyzing cliffhanger effectiveness
- Maintaining cross-chapter state (3-chapter sliding window)
- Generating recommendations for next chapter

**genre-validator**:
- Verifying genre-specific required elements
- Checking cliche usage (acceptable vs overused)
- Evaluating commercial factors (hook density, dialogue ratio, episode length)
- Threshold: ≥90 compliance score

### Agent Invocation Example

```javascript
// From a command or workflow script
Task(
  subagent_type: "oh-my-claude-sisyphus:novelist",
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

- **novelist**: ±10% word count tolerance, all required scenes included, foreshadowing planted naturally
- **editor**: Style guide adherence, improved scores on all metrics
- **critic**: Objective scoring (25 points each for narrative quality, plot coherence, character consistency, worldbuilding)
- **lore-keeper**: No contradictions with established canon
- **plot-architect**: Clear dramatic structure, proper pacing across acts
- **proofreader**: Zero grammar/spelling errors in final output
- **summarizer**: Concise (200-500 words), captures key events and emotional beats
- **beta-reader**: ≥75 engagement score, drop-off risk zones identified with severity
- **tension-tracker**: Tension curve within act-level ranges, required beats present
- **genre-validator**: ≥90 compliance, all required genre elements present

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

## Multi-Validator Quality Gate (v2)

Masterpiece Mode uses 3-validator parallel consensus:

| Validator | Threshold | Focus |
|-----------|-----------|-------|
| critic | ≥85 | Quality (narrative, plot, character, setting) |
| beta-reader | ≥75 | Engagement (hooks, pacing, emotional impact) |
| genre-validator | ≥90 | Genre compliance (required elements, commercials) |

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

### oh-my-claude-sisyphus 에이전트 활용

novel-dev는 oh-my-claude-sisyphus의 전략적 에이전트를 활용할 수 있습니다:

| 상황 | 호출 에이전트 | 용도 |
|------|-------------|------|
| 전략 계획 | `oh-my-claude-sisyphus:prometheus` | 프로젝트 전체 계획 수립, 인터뷰 기반 요구사항 도출 |
| 계획/원고 리뷰 | `oh-my-claude-sisyphus:momus` | 비판적 검토, 구조적 결함 식별 |
| 위험 분석 | `oh-my-claude-sisyphus:metis` | 숨겨진 위험 요소, 미리 대비할 문제 식별 |
| 자료 조사 | `oh-my-claude-sisyphus:librarian` | 외부 문서/자료 검색 및 정리 |

### 활용 예시

**init-review에서 momus 호출:**

~~~javascript
Task(
  subagent_type: "oh-my-claude-sisyphus:momus",
  prompt: `
## 검토 대상
프로젝트: ${projectJson}
플롯 구조: ${structureJson}

## 검토 요청
1. 구조적 결함 식별
2. 숨겨진 위험 요소
3. 개선 제안
  `
)
~~~

**전략 계획 시 prometheus 호출:**

~~~javascript
Task(
  subagent_type: "oh-my-claude-sisyphus:prometheus",
  prompt: `
## 프로젝트 정보
${projectOverview}

## 질문
이 소설 프로젝트의 전체 전략을 수립해주세요.
  `
)
~~~

### 주의사항

- oh-my-claude-sisyphus 플러그인이 설치되어 있어야 함
- 해당 에이전트들은 소설 도메인 특화가 아님 (범용 전략/리뷰 에이전트)
- 소설 특화 작업은 novel-dev 내장 에이전트 사용 권장

---

## Magic Keywords (자동 커맨드 트리거)

Novel-Sisyphus는 자연어 키워드를 인식하여 해당 커맨드를 자동으로 실행합니다.

### 키워드-커맨드 매핑

| 키워드 패턴 | 트리거 커맨드 | 예시 |
|-------------|--------------|------|
| "집필", "써줘", "작성해" | `/novel-dev:write [chapter]` | "15화 집필해줘" |
| "퇴고", "수정", "다듬어" | `/novel-dev:revise` | "이 장면 퇴고해줘" |
| "평가", "점수", "품질" | `/novel-dev:evaluate` | "품질 평가해봐" |
| "전체 집필", "다 써줘", "끝까지" | `/novel-dev:write-all` | "1막 전체 집필" |
| "일관성", "설정 체크" | `/novel-dev:consistency-check` | "설정 일관성 확인" |
| "통계", "현황" | `/novel-dev:stats` | "진행 통계 보여줘" |
| "내보내기", "출력" | `/novel-dev:export` | "원고 내보내기" |

### 사용 규칙

1. **명시적 커맨드 우선**: `/write 15` 같은 명시적 커맨드가 키워드보다 우선합니다.
2. **컨텍스트 인식**: 소설 프로젝트가 활성화된 상태에서만 키워드가 작동합니다.
3. **조합 가능**: "15화 집필하고 퇴고까지 해줘" → `/write 15` + `/revise`

### 키워드 감지 예시

**입력:** "망작소설 15화 집필해줘"
**해석:**
- "집필" 키워드 감지 → `/novel-dev:write` 트리거
- "15화" 숫자 감지 → chapter=15 파라미터
- **실행:** `/novel-dev:write 15`

**입력:** "품질이 너무 낮아. 퇴고 좀 해줘"
**해석:**
- "퇴고" 키워드 감지 → `/novel-dev:revise` 트리거
- **실행:** `/novel-dev:revise`

### 비활성화

키워드 자동 트리거를 원하지 않으면 명시적 커맨드를 사용하세요:
- `/novel-dev:write 15` (명시적)
- "15화 작성해줘" (키워드 - 자동 트리거됨)
