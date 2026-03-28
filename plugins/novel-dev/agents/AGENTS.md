<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-01-29 -->
<!-- Updated: v8.0 - novel-autopilot removed, structural AI patterns added -->

# Novel-Dev 에이전트 카탈로그 (v1.2)

## 산출물 기반 에이전트 매핑

| 에이전트 | 산출물 | 모델 | 권한 | 색상 |
|---------|--------|------|------|------|
| novelist | 본문 원고 (markdown) | opus | default | green |
| editor | 퇴고된 원고 + 변경 사유 | sonnet | default | cyan |
| critic | 4차원 품질 평가 리포트 (0-100) | opus | plan (READ-ONLY) | yellow |
| plot-architect | 플롯 구조 문서 (JSON) + 아크/복선/텐션 곡선 | opus | default | blue |
| lore-keeper | 검증된 설정 파일 (JSON) - 캐릭터/장소/용어/타임라인 | sonnet | default | cyan |
| proofreader | 교정 리포트 + 수정 목록 | haiku | plan (READ-ONLY) | magenta |
| summarizer | 챕터 요약 (markdown) - 다음 회차 컨텍스트용 | haiku | default | magenta |
| quality-oracle | 품질 분석 리포트 + 수술 지시서 | opus | plan (READ-ONLY) | yellow |
| prose-surgeon | 수술적 개선 원고 | opus | default | green |
| beta-reader | 독자 몰입도 분석 리포트 | sonnet | plan (READ-ONLY) | yellow |
| chapter-verifier | 챕터 검증 요약 리포트 (병렬 검증기 결과) | sonnet | plan (READ-ONLY) | red |
| character-voice-analyzer | 캐릭터 목소리 일관성 리포트 | sonnet | plan (READ-ONLY) | yellow |
| consistency-verifier | 5도메인 일관성 검증 결과 | sonnet | plan (READ-ONLY) | red |
| engagement-optimizer | 7도메인 몰입도 최적화 리포트 | sonnet | plan (READ-ONLY) | yellow |
| genre-validator | 장르 적합성 평가서 | sonnet | plan (READ-ONLY) | yellow |
| style-curator | 분류된 스타일 예시 컬렉션 | sonnet | default | cyan |
| team-orchestrator | 팀 실행 계획 + 병렬/순차 에이전트 조율 | sonnet | default | blue |
| narrator | 협업 집필 리더 — 씬 브리핑 + 캐릭터 출력 통합 산문 직조 | opus | default | cyan |
| character-designer | 캐릭터 프로필 설계 + collaborative용 에이전트 파일 생성 | opus | default | pink |
| arc-designer | 서브아크/복선/훅 설계 전문 | sonnet | default | blue |

## Purpose

Contains prompt definitions for the specialized agents used in the novel writing workflow. After consolidation, the plugin has **17 functional agents**. Each agent is defined in a Markdown file with frontmatter specifying the agent name, description, Claude model tier (opus/sonnet/haiku), color, permissionMode, and a comprehensive prompt that defines their role, constraints, guidelines, and output format.

Agents are invoked via the Task tool by commands and orchestration workflows. They operate with specific domain expertise while maintaining consistency with the overall project structure.

## Agent Consolidation Summary

The following merges were performed to reduce overlap:

| Absorbed Agent | Merged Into | Capabilities Transferred |
|----------------|-------------|--------------------------|
| `pacing-analyzer` | `engagement-optimizer` | Scene length analysis, beat timing, rhythm/variety, genre-specific pacing |
| `tension-tracker` | `engagement-optimizer` | Korean emotion keyword detection, cross-chapter state, arc compliance, cliffhanger analysis, fatigue detection |
| `dialogue-analyzer` | `character-voice-analyzer` | Naturalness, subtext, tags/beats, dialogue ratio, info dump detection, conflict/tension, purpose verification |
| `plot-consistency-analyzer` | `consistency-verifier` | Plot hole detection, cause-effect logic chains, foreshadowing setup/payoff tracking |
| `prose-quality-analyzer` | `quality-oracle` | Show-vs-tell analysis, sensory density, filter word detection (v7.0) |
| `scene-drafter` | `novelist` | Scene-by-Scene Mode already covers this functionality (v7.0) |
| `assembly-agent` | `novelist` | Chapter assembly integrated into novelist workflow (v7.0) |

## Agent Consolidation History

The following agents were merged and their stub files removed:

| Removed Agent | Merged Into | Capabilities Transferred |
|---------------|-------------|--------------------------|
| `pacing-analyzer` | `engagement-optimizer` | Scene length analysis, beat timing, rhythm/variety, genre-specific pacing |
| `tension-tracker` | `engagement-optimizer` | Korean emotion keyword detection, cross-chapter state, arc compliance, cliffhanger analysis |
| `dialogue-analyzer` | `character-voice-analyzer` | Naturalness, subtext, tags/beats, dialogue ratio, info dump detection |
| `plot-consistency-analyzer` | `consistency-verifier` | Plot hole detection, cause-effect logic chains, foreshadowing tracking |

## Agent Characteristics

### Model Selection Rationale

- **Opus (novelist, critic, plot-architect, quality-oracle, prose-surgeon)**: Complex creative tasks requiring deep reasoning, narrative understanding, and quality judgment
- **Sonnet (editor, lore-keeper, beta-reader, genre-validator, chapter-verifier, consistency-verifier, engagement-optimizer, character-voice-analyzer, style-curator, team-orchestrator)**: Balanced tasks needing both creativity and analytical skills, fast validation workflows
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
description: "Use this agent when <trigger>. Produces <output>."
model: opus|sonnet|haiku
color: green|cyan|yellow|blue|magenta|red
permissionMode: default|plan
tools:
  - Read
  - Write
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
2. Add frontmatter with `name`, `description`, `model`, `color`, `permissionMode`, `tools`
3. Define Role, Critical_Constraints, Guidelines sections
4. Specify Input/Output formats
5. Document workflow steps
6. Update parent `../AGENTS.md` to reference new agent
7. Update `config/model-tiers.json` permissionModes + colors sections
8. Update relevant commands to invoke the agent

**Example frontmatter:**
```yaml
---
name: beta-reader
description: "Use this agent when simulating reader experience and predicting engagement drop-off. Produces reader immersion analysis report."
model: sonnet
color: yellow
permissionMode: plan
tools:
  - Read
  - Glob
  - Grep
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

## Magic Keywords (Auto-Routing via novel-skill-router)

novel-dev는 `novel-skill-router.mjs`를 통해 자연어 입력을 자동 라우팅합니다.
전체 매핑 규칙은 `scripts/routing-rules.json`에 정의되어 있습니다.

### 라우팅 동작 (2-tier 신뢰도)

| 신뢰도 | 동작 | 예시 |
|--------|------|------|
| >= 0.8 | 자동 실행 (MAGIC KEYWORD) | "5화 집필해줘" -> `/write` |
| 0.6-0.8 | 후보 목록 제시 (suggest) | "이거 좀 고쳐줘" -> 후보 3개 |
| < 0.6 | 무개입 (passthrough) | "오늘 날씨 어때?" |

### 주요 라우팅 예시 (v1: 핵심 20개 스킬)

| 자연어 입력 | 라우팅 대상 | 추출 인자 |
|-------------|-----------|----------|
| "5화 집필해줘" | `/write` | chapter=5 |
| "전체 집필해" | `/write-all` | - |
| "1막 집필 시작" | `/write-act` | act=1 |
| "캐릭터 설계해줘" | `/design` | - |
| "일관성 체크" | `/act-review` | - |
| "새 소설 시작하자" | `/init` | - |
| "퇴고 좀 해줘" | `/revise` | - |
| "2막 평가해봐" | `/act-review` | act=2 |
| "플롯 리뷰해줘" | `/plot-review` | - |

### 라우팅 규칙

1. **명시적 커맨드 우선**: `/write 5`는 라우터를 무시하고 직접 실행
2. **프로젝트 상태 인식**: planning/writing/editing/complete별 필터링
3. **OMC 충돌 해소**: 소설 컨텍스트 없는 범용 키워드(team 등)는 OMC에 위임
4. **프로젝트 필수**: init/brainstorm/help 외 스킬은 프로젝트 존재 필요
5. **Ralph 활성 시 비활성**: Ralph Loop 진행 중에는 라우터가 개입하지 않음

전체 규칙: `scripts/routing-rules.json`
