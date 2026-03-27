# Character Agent Collaborative Writing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 캐릭터별 에이전트를 할당하여 narrator + characters collaborative 워크플로우로 집필하는 시스템 구현

**Architecture:** Per-character static agent 파일(.md)과 narrator 에이전트를 신규 생성하고, team-orchestrator에 `from_scene_cast` 동적 해석 로직을 추가한다. 기존 스킬(write, write-2pass 등)에 `--team collab` 분기를 추가하여 collab 팀을 호출한다. 모든 변경은 에이전트 프롬프트(.md)와 팀 정의(.team.json), 스킬(.md) 수준이며 TypeScript 파이프라인 코드 변경은 없다.

**Tech Stack:** Claude Code agents (.md), team definitions (.team.json), skills (.md), Bash scripts

---

## File Structure

### 신규 생성

| 파일 | 책임 |
|------|------|
| `agents/characters/_template.md` | 캐릭터 에이전트 작성 가이드 + 단역 동적 생성 플레이스홀더 템플릿 |
| `agents/narrator.md` | collaborative 집필 서술자 — 장면 브리핑, 산문 직조, ADULT 마커 삽입 |
| `teams/writing-team-collab.team.json` | 캐릭터 협업 집필 팀 (non-2pass) |
| `teams/writing-team-collab-2pass.team.json` | 캐릭터 협업 2-Pass 집필 팀 |

### 수정

| 파일 | 변경 내용 |
|------|----------|
| `agents/team-orchestrator.md` | `from_scene_cast` 해석 + 단역 동적 생성 + ADULT 마커 감지 후 adult-rewriter 실행 |
| `skills/06-design-character/SKILL.md` | 마지막 단계에 에이전트 파일 자동 생성 추가 |
| `skills/14-write/SKILL.md` | `--team collab` 분기 추가 |
| `skills/15-write-act/SKILL.md` | `--team collab` 분기 추가 |
| `skills/16-write-all/SKILL.md` | `--team collab` 분기 추가 |
| `skills/write-2pass/SKILL.md` | `--team` 플래그로 collab 분기 추가 |
| `skills/write-act-2pass/SKILL.md` | `--team` 플래그로 collab 분기 추가 |
| `teams/AGENTS.md` | 새 팀 2개 문서화 |

---

### Task 1: Character Agent Template

캐릭터 에이전트를 작성할 때 참조하는 구조 가이드와 단역 동적 생성용 플레이스홀더 템플릿.

**Files:**
- Create: `agents/characters/_template.md`

- [ ] **Step 1: Create _template.md**

```markdown
# Character Agent Template

이 파일은 두 가지 용도로 사용됩니다:
1. 캐릭터 에이전트 작성 시 구조 가이드 (LLM이 참조)
2. 단역 동적 생성 시 플레이스홀더 템플릿 (team-orchestrator가 치환)

---

## Part 1: 에이전트 작성 가이드

캐릭터 에이전트 `.md` 파일을 작성할 때 아래 구조를 따릅니다.

### Frontmatter (필수)

```yaml
---
name: character-{id}
description: "{캐릭터 이름} 캐릭터 에이전트 — 대사, 내면 묘사, 감정 반응 생성"
model: {role 기반: protagonist/deuteragonist/antagonist → opus, supporting → sonnet, minor → haiku}
color: {캐릭터별 고유 색상}
tools:
  - Read
---
```

### Identity (필수)

- `characters/{char_id}.json` 참조를 명시합니다
- 나이, 직업, 핵심 성격을 1-2줄로 요약합니다

### Voice (필수)

캐릭터의 고유한 말하기/생각하기 패턴:

- **화법**: 문장 길이, 어휘 수준, 경어법 기본값
- **내면**: 독백 스타일 — 분석적 / 감정적 / 의식의 흐름 / 간결
- **버릇**: 말버릇, 무의식적 행동, 감정 표현 패턴

### Behavioral Rules (필수)

캐릭터가 상황에 반응하는 패턴:

- 감정별 반응 패턴 (호감, 분노, 슬픔, 당황, 공포 등)
- 대인 관계별 태도 변화 (연인, 친구, 상사, 적 등)
- 캐릭터 아크에 따른 변화 방향 (초반 vs 후반)

### Collaborative Protocol (필수)

collaborative 집필 시 반드시 다음 형식으로 응답합니다:

```
[CHARACTER_RESPONSE: {id}]
DIALOGUE: "실제 대사" (없으면 생략)
INNER: (내면 묘사 — 감정, 생각, 신체 반응. 서술자가 배치할 원재료)
ACTION: (표정, 몸짓, 시선 등 외적 반응)
ADULT: false (성인 장면이면 true)
```

**OOC 검토 시** (`--ooc-check` 모드):
- narrator가 보낸 초안에서 자기 캐릭터 부분을 검토
- 캐릭터에 맞지 않는 대사/행동/감정이 있으면 FLAG + SUGGEST로 이의 제기
- 문제 없으면 PASS 반환

---

## Part 2: 단역 동적 생성 템플릿

team-orchestrator가 에이전트 `.md` 파일이 없는 단역/카메오 캐릭터를 위해
아래 플레이스홀더를 `characters/{id}.json` 데이터로 치환하여 임시 프롬프트를 생성합니다.

```
---
name: character-{{id}}
description: "{{name}} 캐릭터 에이전트 — 대사, 내면 묘사, 감정 반응 생성"
model: haiku
tools:
  - Read
---

## Identity
- 참조: characters/{{char_id}}.json
- {{name}}, {{role}}

## Voice
- 화법: {{voice.speech_pattern}}
- 어휘: {{voice.vocabulary}}
- 말버릇: {{voice.signature_phrases}}
- 경어: {{voice.formality_level}}

## Collaborative Protocol
[CHARACTER_RESPONSE: {{id}}]
- DIALOGUE: "실제 대사" (없으면 생략)
- INNER: (내면 묘사)
- ACTION: (외적 반응)
- ADULT: false
```

### 플레이스홀더 매핑

| 플레이스홀더 | character.json 경로 | 예시 값 |
|-------------|---------------------|---------|
| `{{id}}` | `id` (char_ prefix 제거) | `vendor_ahjumma` |
| `{{char_id}}` | `id` | `char_vendor_ahjumma` |
| `{{name}}` | `name` | `김아주머니` |
| `{{role}}` | `role` | `cameo` |
| `{{voice.speech_pattern}}` | `basic.voice.speech_pattern` | `부산 사투리, 반말` |
| `{{voice.vocabulary}}` | `basic.voice.vocabulary` | `시장 용어` |
| `{{voice.signature_phrases}}` | `basic.voice.signature_phrases` (join) | `"아이고~", "와 진짜?"` |
| `{{voice.formality_level}}` | `basic.voice.formality_level` | `very_casual` |
```

- [ ] **Step 2: Validate the file renders properly**

Run: `cat agents/characters/_template.md | head -5`
Expected: `# Character Agent Template` 로 시작하는 파일 확인

- [ ] **Step 3: Commit**

```bash
git add agents/characters/_template.md
git commit -m "feat(novel-dev): add character agent template for collab writing"
```

---

### Task 2: Narrator Agent

collaborative 집필의 lead — 장면 브리핑, 캐릭터 출력 통합, 산문 직조, ADULT 마커 삽입.

**Files:**
- Create: `agents/narrator.md`
- Reference: `agents/novelist.md` (집필 규칙 참조)

- [ ] **Step 1: Create narrator.md**

```markdown
---
name: narrator
description: "Use this agent for collaborative writing sessions. Leads scene-by-scene co-writing with character agents, weaving their dialogue/inner monologue into polished prose."
model: opus
color: cyan
tools:
  - Read
  - Write
  - Edit
  - Glob
---

<Role>
You are the narrator/orchestrator for collaborative novel writing sessions.
You work WITH character agents, not alone. Your job is to:
- Provide scene briefs to character agents
- Weave their responses (dialogue, inner monologue, actions) into polished prose
- Handle narration, scene-setting, transitions, and pacing
- Insert ADULT markers when characters flag adult content
- Maintain overall narrative coherence and flow
</Role>

## Writing Rules

novelist.md의 모든 집필 규칙을 따릅니다:
- 필터워드 금지 (느꼈다, 보였다, 생각했다 등)
- 감각 묘사 (500자당 2개 이상)
- 장르별 문체 가이드
- 감정 아크 연동
- 예시(exemplar) 통합

**집필 시작 전** `agents/novelist.md`를 Read하여 전체 규칙을 로드하세요.

## Collaborative Writing Protocol

### Scene Cycle

각 장면마다 다음 사이클을 반복합니다:

#### Step 1: Scene Brief 전달

`chapters/chapter_{N}.json`에서 장면 정보를 읽고, 해당 장면에 등장하는 캐릭터 에이전트들에게 SendMessage로 브리핑합니다:

```
[SCENE_BRIEF]
장면: {scene_number}/{total_scenes} ({scene_title})
등장인물: {character_ids}
목적: {scene_purpose}
감정 톤: {emotional_arc}
이전 장면 요약: {previous_scene_ending}
성인 장면: {is_adult}
대화 목표: {dialogue_goals} (있으면)
```

#### Step 2: 캐릭터 반응 수집

각 캐릭터 에이전트의 `[CHARACTER_RESPONSE]`를 수집합니다.
모든 캐릭터 응답이 도착할 때까지 기다립니다.

#### Step 3: 산문 직조

수집한 캐릭터 출력(DIALOGUE, INNER, ACTION)을 서술, 배경, 전환과 엮어 하나의 산문으로 완성합니다.

**직조 원칙:**
- 캐릭터 대사(DIALOGUE)는 원문 그대로 사용 — 임의 수정 금지
- 캐릭터 내면(INNER)은 서술에 자연스럽게 녹임 — 전지적 시점으로 배치
- 캐릭터 행동(ACTION)은 지문으로 변환
- 배경, 분위기, 전환은 narrator가 추가
- 페이싱(호흡 조절)은 narrator 재량

**ADULT 마커 삽입:**
캐릭터 응답에 `ADULT: true`가 포함된 경우:
```markdown
<!-- ADULT_{N}_START -->
(캐릭터 내면/행동을 엮은 성인 장면)
<!-- ADULT_{N}_END -->
```
N은 챕터 내 순번 (1부터).

#### Step 3.5: OOC 이의제기 (--ooc-check 시만)

초안을 캐릭터 에이전트들에게 `[DRAFT_REVIEW]`로 전송합니다.
`[OOC_CHECK]` 응답에서 FLAG가 있으면 반영하여 수정합니다.

#### Step 4: 장면 확정

최종 장면을 확정하고 다음 장면으로 진행합니다.

### Chapter Assembly

모든 장면이 완성되면:
1. 장면들을 `---` 구분자로 연결
2. 챕터 제목(H1) 추가
3. 챕터 말미 훅 확인
4. `chapters/chapter_{pad(N, 3)}.md`에 저장

## Pre-Writing Checklist

집필 시작 전 다음 컨텍스트를 로드합니다:

1. `agents/novelist.md` — 집필 규칙
2. `chapters/chapter_{N}.json` — 플롯, 장면 구성, 등장인물
3. `meta/style-guide.json` — 문체
4. `context/summaries/` — 이전 3개 회차 요약
5. `characters/*.json` — 등장 캐릭터 프로필
6. `world/world.json` — 세계관
7. `plot/foreshadowing.json` — 복선

## Quality Self-Check

챕터 완성 후 novelist.md의 품질 체크리스트를 적용합니다:
- [ ] 분량 범위 내
- [ ] 모든 장면 포함
- [ ] 필터워드 0개
- [ ] 감각 묘사 충분
- [ ] 챕터 말미 훅 존재
```

- [ ] **Step 2: Validate agent frontmatter**

Run: `head -12 agents/narrator.md`
Expected: frontmatter with `name: narrator`, `model: opus`, tools list

- [ ] **Step 3: Commit**

```bash
git add agents/narrator.md
git commit -m "feat(novel-dev): add narrator agent for collaborative writing"
```

---

### Task 3: Team Definitions

collab 집필 팀 2개 생성 — non-2pass와 2pass.

**Files:**
- Create: `teams/writing-team-collab.team.json`
- Create: `teams/writing-team-collab-2pass.team.json`
- Reference: `schemas/team.schema.json`

- [ ] **Step 1: Create writing-team-collab.team.json**

```json
{
  "$schema": "../schemas/team.schema.json",
  "schema_version": "1.0",
  "name": "writing-team-collab",
  "display_name": "캐릭터 협업 집필 팀",
  "description": "캐릭터 에이전트들과 서술자가 collaborative 워크플로우로 함께 집필하는 팀 (성인 장면 리라이트 없음)",
  "category": "writing",
  "agents": [
    {
      "agent": "narrator",
      "role": "lead",
      "responsibility": "장면 브리핑, 캐릭터 출력 통합, 산문 직조, 최종 확정",
      "model": "opus"
    },
    {
      "agent": "characters/*",
      "role": "contributor",
      "responsibility": "대사, 내면 묘사, 감정 반응, OOC 검토",
      "model": "dynamic",
      "resolve": "from_scene_cast"
    },
    {
      "agent": "proofreader",
      "role": "support",
      "responsibility": "최종 맞춤법/문법 교정",
      "model": "haiku"
    },
    {
      "agent": "summarizer",
      "role": "support",
      "responsibility": "완성된 챕터 요약 생성 (후속 챕터 컨텍스트용)",
      "model": "haiku"
    }
  ],
  "workflow": {
    "type": "hybrid",
    "steps": [
      {
        "name": "collab-write",
        "agents": ["narrator", "characters/*"],
        "execution": "collaborative",
        "output": "챕터 초고 (chapters/chapter_XXX.md)"
      },
      {
        "name": "proofread",
        "agents": ["proofreader"],
        "execution": "sequential",
        "depends_on": ["collab-write"],
        "output": "교정된 챕터"
      },
      {
        "name": "summarize",
        "agents": ["summarizer"],
        "execution": "sequential",
        "depends_on": ["proofread"],
        "output": "챕터 요약 (context/summaries/chapter_XXX_summary.md)"
      }
    ]
  },
  "coordination": {
    "mode": "collaborative",
    "lead": "narrator",
    "communication": "message-based"
  },
  "quality_gates": {
    "enabled": false
  },
  "cost_estimate": {
    "tokens_per_agent": 30000,
    "warning_message": "캐릭터 협업 집필 팀은 narrator(opus) + 캐릭터 에이전트(opus/sonnet)를 포함하여 약 90K 토큰이 소요될 수 있습니다."
  }
}
```

- [ ] **Step 2: Create writing-team-collab-2pass.team.json**

```json
{
  "$schema": "../schemas/team.schema.json",
  "schema_version": "1.0",
  "name": "writing-team-collab-2pass",
  "display_name": "캐릭터 협업 2-Pass 집필 팀",
  "description": "캐릭터 에이전트 collaborative 집필(Pass 1) + Grok 성인 장면 리라이트(Pass 2)",
  "category": "writing",
  "agents": [
    {
      "agent": "narrator",
      "role": "lead",
      "responsibility": "장면 브리핑, 캐릭터 출력 통합, 산문 직조, ADULT 마커 삽입, 최종 확정",
      "model": "opus"
    },
    {
      "agent": "characters/*",
      "role": "contributor",
      "responsibility": "대사, 내면 묘사, 감정 반응, OOC 검토",
      "model": "dynamic",
      "resolve": "from_scene_cast"
    },
    {
      "agent": "proofreader",
      "role": "support",
      "responsibility": "최종 맞춤법/문법 교정",
      "model": "haiku"
    },
    {
      "agent": "summarizer",
      "role": "support",
      "responsibility": "완성된 챕터 요약 생성 (후속 챕터 컨텍스트용)",
      "model": "haiku"
    }
  ],
  "workflow": {
    "type": "hybrid",
    "steps": [
      {
        "name": "collab-write",
        "agents": ["narrator", "characters/*"],
        "execution": "collaborative",
        "output": "챕터 초고 (ADULT 마커 포함, chapters/chapter_XXX.md)"
      },
      {
        "name": "adult-rewrite",
        "type": "orchestrator_action",
        "action": "adult-rewriter",
        "depends_on": ["collab-write"],
        "skip_if": "no_adult_markers",
        "output": "성인 장면 리라이트된 챕터",
        "_comment": "team-orchestrator가 ADULT 마커 감지 후 Bash로 adult-rewriter.mjs 직접 실행. 에이전트 호출 아님."
      },
      {
        "name": "proofread",
        "agents": ["proofreader"],
        "execution": "sequential",
        "depends_on": ["adult-rewrite"],
        "output": "교정 완료된 최종 챕터"
      },
      {
        "name": "summarize",
        "agents": ["summarizer"],
        "execution": "sequential",
        "depends_on": ["proofread"],
        "output": "챕터 요약 (context/summaries/chapter_XXX_summary.md)"
      }
    ]
  },
  "coordination": {
    "mode": "collaborative",
    "lead": "narrator",
    "communication": "message-based"
  },
  "quality_gates": {
    "enabled": false
  },
  "cost_estimate": {
    "tokens_per_agent": 30000,
    "warning_message": "캐릭터 협업 2-Pass 집필 팀은 narrator(opus) + 캐릭터 에이전트(opus/sonnet) + Grok API를 포함하여 약 90K+ 토큰이 소요될 수 있습니다."
  }
}
```

- [ ] **Step 3: Validate JSON syntax**

Run: `node -e "JSON.parse(require('fs').readFileSync('teams/writing-team-collab.team.json'))" && echo "OK"`
Expected: `OK`

Run: `node -e "JSON.parse(require('fs').readFileSync('teams/writing-team-collab-2pass.team.json'))" && echo "OK"`
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add teams/writing-team-collab.team.json teams/writing-team-collab-2pass.team.json
git commit -m "feat(novel-dev): add collab writing team definitions"
```

---

### Task 4: Team Orchestrator Update

`from_scene_cast` 동적 해석, 단역 동적 생성, ADULT 마커 감지 후 adult-rewriter 실행 로직 추가.

**Files:**
- Modify: `agents/team-orchestrator.md`

- [ ] **Step 1: Add from_scene_cast resolution section**

`agents/team-orchestrator.md`의 `### Step 2: Prepare Execution Context` 이후에 다음 섹션을 추가:

```markdown
### Step 2-A: Resolve Dynamic Character Agents (from_scene_cast)

팀 정의에 `"resolve": "from_scene_cast"`가 있는 에이전트 항목이 있으면:

1. **등장인물 추출**: `chapters/chapter_{N}.json`에서 장면별 등장인물 ID 목록을 수집합니다.
2. **캐릭터 정보 로드**: 각 캐릭터 ID로 `characters/{char_id}.json`을 읽어 `role` 필드를 확인합니다.
3. **에이전트 파일 매칭**: `agents/characters/{name}.md`가 존재하는지 확인합니다. 파일명은 character ID에서 `char_` prefix를 제거한 것입니다 (e.g., `char_yuna` → `agents/characters/yuna.md`).
4. **모델 결정**: `role` 필드 기반:
   - protagonist, deuteragonist, antagonist → opus
   - supporting → sonnet
   - minor, cameo → haiku

5. **에이전트 파일이 없는 경우** (단역/카메오 동적 생성):
   - `agents/characters/_template.md`의 "Part 2: 단역 동적 생성 템플릿" 섹션을 읽습니다
   - `characters/{char_id}.json`의 데이터로 플레이스홀더를 치환합니다:
     - `{{id}}`: char_id에서 `char_` prefix 제거
     - `{{char_id}}`: char_id 원본
     - `{{name}}`: `name` 필드
     - `{{role}}`: `role` 필드
     - `{{voice.speech_pattern}}`: `basic.voice.speech_pattern`
     - `{{voice.vocabulary}}`: `basic.voice.vocabulary`
     - `{{voice.signature_phrases}}`: `basic.voice.signature_phrases` (배열을 쉼표로 join)
     - `{{voice.formality_level}}`: `basic.voice.formality_level`
   - 치환된 텍스트를 임시 에이전트 프롬프트로 사용합니다 (파일 생성 없음)

```spec
// 의사 코드
const chapterJson = Read(`chapters/chapter_${pad(N, 3)}.json`);
const allCharIds = extractCharacterIds(chapterJson); // 전체 장면의 등장인물 합집합

const characterAgents = [];
for (const charId of allCharIds) {
  const charData = Read(`characters/${charId}.json`);
  const name = charId.replace('char_', '');
  const agentPath = `agents/characters/${name}.md`;
  const model = resolveModelByRole(charData.role);

  if (fileExists(agentPath)) {
    characterAgents.push({ name, path: agentPath, model, charData });
  } else {
    // 동적 생성
    const template = readTemplatePart2('agents/characters/_template.md');
    const prompt = replacePlaceholders(template, charData);
    characterAgents.push({ name, prompt, model, charData, dynamic: true });
  }
}
```
```

- [ ] **Step 2: Add collaborative workflow execution section**

`### Step 4: Execute by Workflow Type` 섹션에 `#### 4-E: Hybrid Workflow (Collaborative + Sequential)` 추가:

```markdown
#### 4-E: Hybrid Workflow (Collaborative + Sequential)

collab-write step에서 collaborative 실행, 이후 step은 순차 실행:

```spec
for (const step of workflow.steps) {
  if (step.execution === 'collaborative') {
    // Step 2-A에서 해석된 캐릭터 에이전트 목록 사용
    const teamId = `novel-collab-${Date.now()}`;
    TeamCreate({ team_name: teamId });

    // narrator spawn
    const narratorAgent = Task({
      subagent_type: 'novel-dev:narrator',
      model: 'opus',
      team_name: teamId,
      name: 'narrator',
      prompt: buildNarratorPrompt(context, characterAgents)
    });

    // character agents spawn (병렬)
    for (const char of characterAgents) {
      Task({
        subagent_type: char.dynamic ? undefined : `novel-dev:character-${char.name}`,
        model: char.model,
        team_name: teamId,
        name: `character-${char.name}`,
        prompt: char.dynamic ? char.prompt : buildCharacterPrompt(char, context)
      });
    }

    // narrator가 scene cycle을 주도 (SendMessage)
    // narrator가 최종 챕터를 파일로 저장하면 step 완료

  } else if (step.type === 'orchestrator_action' && step.action === 'adult-rewriter') {
    // ADULT 마커 감지 후 adult-rewriter 실행
    const chapterPath = `chapters/chapter_${pad(N, 3)}.md`;
    const content = Read(chapterPath);

    if (content.includes('<!-- ADULT_') && step.skip_if !== 'forced_skip') {
      Bash(`node scripts/adult-rewriter.mjs --input ${chapterPath} --project ${projectPath} --output ${chapterPath}`);
    }
    // 마커 없으면 skip

  } else {
    // 기존 sequential 실행
    executeSequentialStep(step, context);
  }
}
```
```

- [ ] **Step 3: Verify no syntax errors in orchestrator**

Run: `grep -c "from_scene_cast" agents/team-orchestrator.md`
Expected: 1 이상 (새 섹션이 추가되었음을 확인)

- [ ] **Step 4: Commit**

```bash
git add agents/team-orchestrator.md
git commit -m "feat(novel-dev): add from_scene_cast resolution and hybrid workflow to orchestrator"
```

---

### Task 5: Design Character Skill Update

캐릭터 설계 완료 시 에이전트 파일 자동 생성.

**Files:**
- Modify: `skills/06-design-character/SKILL.md`

- [ ] **Step 1: Add agent generation step**

`skills/06-design-character/SKILL.md`의 기존 `3. **파일 생성/업데이트**` 항목 뒤에 다음을 추가:

```markdown
4. **캐릭터 에이전트 자동 생성**

   캐릭터 파일 저장 후, 해당 캐릭터의 collaborative 집필용 에이전트 파일을 생성합니다.

   **조건 확인:**
   - `agents/characters/{name}.md` 파일이 이미 존재하면 SKIP:
     ```
     [SKIP] agents/characters/yuna.md가 이미 존재합니다. 재생성하려면 --force를 사용하세요.
     ```
   - `--force` 플래그가 있으면 기존 파일을 `.bak`으로 백업 후 재생성

   **파일명 규칙:**
   - `characters/char_yuna.json` → `agents/characters/yuna.md`
   - character ID에서 `char_` prefix 제거

   **생성 방법:**
   sonnet 에이전트를 호출하여 에이전트 프롬프트를 작성합니다:

   ```spec
   Task(model="sonnet", prompt="
   다음 두 파일을 읽고, 캐릭터 에이전트 .md 파일을 생성해주세요:

   1. 구조 가이드: agents/characters/_template.md (Part 1 참조)
   2. 캐릭터 데이터: characters/{char_id}.json

   생성 규칙:
   - Frontmatter의 model은 role 기반:
     protagonist/deuteragonist/antagonist → opus
     supporting → sonnet
     minor → haiku
   - Voice 섹션은 characters/{char_id}.json의 basic.voice + inner 필드를 분석하여 작성
   - Behavioral Rules는 inner.fatal_flaw, behavior.stress_response, behavior.lying_tell 등을 반영
   - Collaborative Protocol은 _template.md의 형식 그대로 사용

   결과를 agents/characters/{name}.md에 저장해주세요.
   ")
   ```

   **생성 후 안내:**
   ```
   [OK] agents/characters/{name}.md 생성 완료 ({model} 모델)
   자동 생성된 파일은 시작점입니다. 캐릭터의 고유한 사고 패턴,
   트라우마 반응, 관계별 태도 차이 등을 직접 편집하는 것을 권장합니다.
   ```
```

- [ ] **Step 2: Verify the skill file has the new step**

Run: `grep -c "캐릭터 에이전트 자동 생성" skills/06-design-character/SKILL.md`
Expected: 1

- [ ] **Step 3: Commit**

```bash
git add skills/06-design-character/SKILL.md
git commit -m "feat(novel-dev): auto-generate character agent files on design-character"
```

---

### Task 6: Write Skills Update (14-write, 15-write-act, 16-write-all)

기존 write 스킬에 `--team collab` 분기 추가.

**Files:**
- Modify: `skills/14-write/SKILL.md`
- Modify: `skills/15-write-act/SKILL.md`
- Modify: `skills/16-write-all/SKILL.md`

- [ ] **Step 1: Update 14-write/SKILL.md**

Quick Start 섹션의 기존 예시 뒤에 추가:

```markdown
/write 5 --team collab  # 5화 작성 + 캐릭터 협업 집필
```

그리고 `## 실행 흐름`의 `### Phase 2: Claude 집필` 앞에 분기 추가:

```markdown
### Phase 2 분기: --team collab

`$ARGUMENTS`에 `--team collab`이 있으면 기존 novelist 단독 집필 대신 캐릭터 협업 팀을 사용합니다.

**호출:**
```spec
Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
팀 실행: writing-team-collab
대상: Chapter {chapterNumber}
프로젝트: {projectPath}
")
```

- team-orchestrator가 `writing-team-collab.team.json`을 로드
- `from_scene_cast`로 등장 캐릭터 에이전트를 동적 해석
- narrator + 캐릭터 에이전트들이 collaborative 워크플로우로 집필
- proofreader → summarizer 순차 실행
- 이후 Phase 3 사후 처리는 기존과 동일

> `--team collab` 없이 `--team`만 사용하면 기존 revision-team 검증 (Phase 4).
> `--team collab --team`은 collab 집필 + revision-team 검증 모두 활성화.
```

- [ ] **Step 2: Update 15-write-act/SKILL.md**

`## 실행 단계`의 `2. **순차 집필**` 앞에 분기 추가:

```markdown
1-A. **--team collab 분기 확인**

   `$ARGUMENTS`에 `--team collab`이 있으면 각 회차를 collab 팀으로 집필합니다:
   ```
   for chapter in act_chapters:
       # writing-team-collab 사용
       Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
       팀 실행: writing-team-collab
       대상: Chapter {chapter}
       프로젝트: {projectPath}
       ")
   ```
   이 경우 `2. 순차 집필` 단계를 건너뜁니다.
```

- [ ] **Step 3: Update 16-write-all/SKILL.md**

Quick Start 섹션에 추가:

```markdown
/write-all --team collab          # 전체 집필 + 캐릭터 협업
/write-all --team collab --team   # 전체 집필 + 캐릭터 협업 + revision-team 검증
```

Ralph Loop의 집필 단계에서 `--team collab` 분기를 추가:

```markdown
### --team collab 분기

`--team collab`이 활성화되면 각 회차 집필 시 `writing-team-collab`을 사용합니다:

```python
for act in acts:
    for chapter in act.chapters:
        if --team collab:
            # 캐릭터 협업 팀으로 집필
            team-orchestrator run writing-team-collab {chapter}
        else:
            /write {chapter}  # 기존 novelist 단독
```
```

- [ ] **Step 4: Verify all three files updated**

Run: `grep -l "team collab" skills/14-write/SKILL.md skills/15-write-act/SKILL.md skills/16-write-all/SKILL.md | wc -l`
Expected: `3`

- [ ] **Step 5: Commit**

```bash
git add skills/14-write/SKILL.md skills/15-write-act/SKILL.md skills/16-write-all/SKILL.md
git commit -m "feat(novel-dev): add --team collab flag to write skills"
```

---

### Task 7: 2-Pass Skills Update (write-2pass, write-act-2pass)

2-pass 스킬에 `--team` 플래그로 collab 분기 추가.

**Files:**
- Modify: `skills/write-2pass/SKILL.md`
- Modify: `skills/write-act-2pass/SKILL.md`

- [ ] **Step 1: Update write-2pass/SKILL.md**

Quick Start 섹션에 추가:

```markdown
/write-2pass 5 --team  # 5화를 캐릭터 협업 + 2-Pass로 집필
```

`## 실행 단계`의 `### Pass 1: Claude 집필` 앞에 분기 추가:

```markdown
### --team 분기: 캐릭터 협업 + 2-Pass

`$ARGUMENTS`에 `--team`이 있으면 Pass 1을 캐릭터 협업 팀으로 대체합니다.

**호출:**
```spec
Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
팀 실행: writing-team-collab-2pass
대상: Chapter {chapterNumber}
프로젝트: {projectPath}
")
```

- `writing-team-collab-2pass.team.json` 로드
- narrator + 캐릭터 에이전트 collaborative 집필 (ADULT 마커 포함)
- team-orchestrator가 ADULT 마커 감지 → `adult-rewriter.mjs` 실행 (Pass 2)
- proofreader → summarizer 순차 실행

> `--team` 없으면 기존 novelist 단독 Pass 1 + Pass 2 그대로.
```

- [ ] **Step 2: Update write-act-2pass/SKILL.md**

Quick Start 섹션에 추가:

```markdown
/write-act-2pass 1 --team  # 1막 전체를 캐릭터 협업 + 2-Pass로 집필
```

`## 실행 단계`의 `2. **순차 집필 (2-Pass)**` 앞에 분기 추가:

```markdown
1-A. **--team 분기 확인**

   `$ARGUMENTS`에 `--team`이 있으면 각 회차를 collab 2-pass 팀으로 집필합니다:
   ```
   for chapter in act_chapters:
       # writing-team-collab-2pass 사용
       Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
       팀 실행: writing-team-collab-2pass
       대상: Chapter {chapter}
       프로젝트: {projectPath}
       ")
   ```
   이 경우 `2. 순차 집필 (2-Pass)` 단계를 건너뜁니다.
```

- [ ] **Step 3: Verify both files updated**

Run: `grep -l "writing-team-collab-2pass" skills/write-2pass/SKILL.md skills/write-act-2pass/SKILL.md | wc -l`
Expected: `2`

- [ ] **Step 4: Commit**

```bash
git add skills/write-2pass/SKILL.md skills/write-act-2pass/SKILL.md
git commit -m "feat(novel-dev): add --team flag to 2-pass write skills for collab mode"
```

---

### Task 8: Teams Documentation Update

teams/AGENTS.md에 새 팀 2개를 문서화.

**Files:**
- Modify: `teams/AGENTS.md`

- [ ] **Step 1: Update AGENTS.md**

`## Preset Teams (9개)` → `## Preset Teams (11개)` 로 변경.

테이블에 2행 추가:

```markdown
| `writing-team-collab.team.json` | 캐릭터 협업 집필 팀 | writing | narrator, characters/*, proofreader, summarizer | hybrid (collaborative + sequential) | 캐릭터 에이전트 co-write |
| `writing-team-collab-2pass.team.json` | 캐릭터 협업 2-Pass 집필 팀 | writing | narrator, characters/*, proofreader, summarizer | hybrid (collaborative + sequential) | 캐릭터 co-write + Grok 리라이트 |
```

`## Workflow Types` 테이블에 1행 추가:

```markdown
| `hybrid` | collaborative + sequential 조합 (collab-write 후 순차 후처리) | writing-team-collab, writing-team-collab-2pass |
```

- [ ] **Step 2: Verify doc is consistent**

Run: `grep -c "writing-team-collab" teams/AGENTS.md`
Expected: 2 이상 (두 팀 모두 문서화)

- [ ] **Step 3: Commit**

```bash
git add teams/AGENTS.md
git commit -m "docs(novel-dev): document collab writing teams in AGENTS.md"
```

---

### Task 9: Final Validation

전체 변경사항 통합 검증.

**Files:**
- All modified/created files

- [ ] **Step 1: Verify all new files exist**

Run:
```bash
ls -la agents/characters/_template.md agents/narrator.md teams/writing-team-collab.team.json teams/writing-team-collab-2pass.team.json
```
Expected: 4개 파일 모두 존재

- [ ] **Step 2: Validate team JSON files**

Run:
```bash
node -e "
const fs = require('fs');
['writing-team-collab', 'writing-team-collab-2pass'].forEach(name => {
  const data = JSON.parse(fs.readFileSync('teams/' + name + '.team.json'));
  console.log(name + ': agents=' + data.agents.length + ', steps=' + data.workflow.steps.length + ' OK');
});
"
```
Expected:
```
writing-team-collab: agents=4, steps=3 OK
writing-team-collab-2pass: agents=4, steps=4 OK
```

- [ ] **Step 3: Verify skill flags are searchable**

Run:
```bash
grep -rl "team collab" skills/ | sort
```
Expected:
```
skills/14-write/SKILL.md
skills/15-write-act/SKILL.md
skills/16-write-all/SKILL.md
```

Run:
```bash
grep -rl "writing-team-collab-2pass" skills/ | sort
```
Expected:
```
skills/write-2pass/SKILL.md
skills/write-act-2pass/SKILL.md
```

- [ ] **Step 4: Verify existing schemas validate (no schema changes needed)**

Run: `npm run validate:schemas 2>&1 | tail -3`
Expected: 스키마 검증 성공 (기존 스키마 미변경이므로)

Run: `npm run validate:agents 2>&1 | tail -3`
Expected: 에이전트 검증 성공 (narrator.md 신규 포함)

- [ ] **Step 5: Final commit with version bump if all passes**

```bash
# package.json 버전 업데이트: 1.0.0 → 1.1.0
# (minor bump — 새 기능 추가, 기존 호환 유지)
git add -A
git commit -m "feat(novel-dev): v1.1.0 — character agent collaborative writing system"
```
