# Character Agent Collaborative Writing System

캐릭터별 에이전트를 할당하여 collaborative 워크플로우로 집필하는 시스템 설계.

## 1. Problem Statement

현재 novelist 에이전트 1개가 모든 캐릭터의 대사/내면/행동을 단독 작성한다.
voice 시스템(VoiceProfile, 경어법 매트릭스, constraint prompt)이 구현되어 있지만 집필 파이프라인에 연결되지 않아 캐릭터 개성이 희미하다.

## 2. Solution Overview

캐릭터마다 개별 에이전트 파일(`.md`)을 생성하고, 집필 시 narrator + 등장 캐릭터 에이전트들이 collaborative 워크플로우로 함께 집필한다.

### 핵심 결정사항

| 항목 | 결정 |
|------|------|
| 캐릭터 에이전트 역할 | 대사 + 내면 묘사(내적 독백, 감정) |
| 시점 | 전지적 — 모든 캐릭터가 내면 표현 가능, narrator가 배치 조율 |
| 생명주기 | 주요 캐릭터(protagonist/deuteragonist/antagonist)는 에이전트 .md 파일 상시 보유, 조연은 파일 보유하되 장면별 참여, 단역은 파일 없이 동적 생성 |
| 서술자 역할 | Co-write — collaborative 워크플로우로 실시간 메시지 교환 |
| 모델 티어 | 주인공급 opus, 조연 sonnet, 단역 haiku |
| 품질 파이프라인 | 기존 revision-team 그대로 활용 |
| 접근법 | Per-Character Static Agent (B) — 캐릭터별 개별 .md 파일 |
| 2-Pass 연동 | 지원 — collab 집필 후 Grok adult-rewriter 연동 |

## 3. Character Agent Structure

### 3.1 파일 배치

```
agents/
  characters/              ← 새 디렉토리
    _template.md           ← 작성 가이드 + 단역 동적 생성 템플릿 (에이전트 아님)
    yuna.md                ← 주인공 — opus
    minhyuk.md             ← 주인공 — opus
    jisu.md                ← 조연 — sonnet
    ...
  narrator.md              ← 새 에이전트 — opus (collaborative 집필 전용)
  novelist.md              ← 기존 유지 (non-team 집필용 fallback)
```

### 3.2 캐릭터 에이전트 .md 구조

```markdown
---
name: character-yuna
description: "김유나 캐릭터 에이전트 — 대사, 내면 묘사, 감정 반응 생성"
model: opus
color: pink
tools:
  - Read
---

## Identity
- 참조: characters/char_yuna.json
- 25세, 스타트업 개발자, 논리적이지만 감정 표현에 서툼

## Voice
- 화법: 짧은 문장, 기술 용어 무의식적 사용, 존댓말 기본
- 내면: 분석적 독백, 감정을 논리로 번역하려는 습관
- 버릇: "그러니까..." 으로 말 시작, 당황하면 말꼬리 흐림

## Behavioral Rules
- 호감 표현: 직접 말 못하고 행동으로 (커피 건네기, 버그 대신 고쳐주기)
- 갈등 시: 회피 → 혼자 분석 → 논리적 해결책 제시
- 감정 폭발: 극히 드물지만 터지면 평소와 완전 다른 어투

## Collaborative Protocol
collaborative 집필 시 다음 형식으로 응답:
- DIALOGUE: "실제 대사"
- INNER: (내면 묘사 — 서술자가 배치할 원재료)
- ACTION: (표정, 몸짓 등 외적 반응)
- ADULT: true/false (성인 장면 여부)
```

### 3.3 에이전트 파일명 규칙

character.json의 ID(`char_yuna`)에서 `char_` prefix를 제거하여 파일명으로 사용:

```
characters/char_yuna.json  →  agents/characters/yuna.md
characters/char_minhyuk.json  →  agents/characters/minhyuk.md
```

에이전트 name은 `character-{id}` 형식 (e.g., `character-yuna`).

### 3.4 role → 모델 매핑

`characters/{id}.json`의 `role` 필드 기반:

| role | 모델 | 에이전트 파일 | 근거 |
|------|------|-------------|------|
| protagonist | opus | .md 파일 상시 보유 | 깊은 내면, 복잡한 감정선 |
| deuteragonist | opus | .md 파일 상시 보유 | 주인공급 중요도 |
| antagonist | opus | .md 파일 상시 보유 | 빌런의 왜곡된 시선, 자기합리화 |
| supporting | sonnet | .md 파일 상시 보유 | 일관된 voice, 적절한 깊이 |
| minor | haiku | .md 파일 선택적, 동적 생성 가능 | 단순한 반응, 비용 효율 |
| cameo | haiku | .md 파일 없음, 동적 생성 | 일회성 등장 |

### 3.5 narrator 에이전트

기존 novelist의 역할을 분리한다:

- **narrator**: collaborative 집필 시 서술/배경/전환/페이싱/ADULT 마커 삽입 담당
- **novelist**: 기존처럼 혼자 챕터 전체를 쓰는 모드 (non-team fallback)

narrator.md의 집필 규칙은 novelist.md를 **참조**하여 중복을 방지한다:

```markdown
## Writing Rules
novelist.md의 모든 집필 규칙(필터워드 금지, 감각 묘사, 장르별 가이드,
감정 아크 연동 등)을 따릅니다. 해당 파일을 Read하여 규칙을 로드하세요.

추가로 다음 collaborative 전용 규칙을 적용합니다:
(scene brief, 캐릭터 출력 통합, ADULT 마커 삽입 등)
```

## 4. Collaborative Writing Workflow

### 4.1 장면(scene) 단위 진행

collaborative 집필은 장면 단위로 반복된다. 한 챕터에 3~5개 장면이 있으면 각 장면마다 이 사이클이 돈다.

```
┌───────────────────────────────────────────────────┐
│                  Scene Cycle                       │
│                                                    │
│  1. narrator: 장면 브리핑 전달 (SendMessage)        │
│       ↓                                            │
│  2. characters: 각자 반응 생성 (병렬)               │
│       ↓                                            │
│  3. narrator: 초안 직조 (서술 + 캐릭터 출력 통합)    │
│       ↓                                            │
│  4. narrator: 최종 장면 확정                        │
│                                                    │
│  [선택적] --ooc-check 플래그 시:                    │
│  3.5. characters: 초안 검토 → OOC 이의제기          │
│       → narrator: 반영 후 확정                      │
└───────────────────────────────────────────────────┘
```

**OOC 체크는 기본 비활성화.** 토큰 비용 대비 대부분 "PASS"이므로, `--ooc-check` 플래그 또는 1화/클라이맥스 장면에서만 활성화한다.

### 4.2 각 단계 상세

**Step 1 — 장면 브리핑** (narrator → all characters)

narrator가 chapter_{N}.json에서 장면 정보를 읽고 SendMessage로 전달:

```
[SCENE_BRIEF]
장면: 3/5 (카페에서 재회)
등장인물: yuna, minhyuk, jisu
목적: 유나-민혁 재회의 어색함, 지수의 관찰자 역할
감정 톤: 긴장 → 해빙
이전 장면 요약: (이전 장면 마지막 2-3문장)
성인 장면: false
```

**Step 2 — 캐릭터 반응** (characters → narrator, 병렬)

각 캐릭터 에이전트가 독립적으로 반응 생성:

```
[CHARACTER_RESPONSE: yuna]
DIALOGUE: "...오랜만이네."
INNER: 심장이 빠르게 뛰었다. 2년이라는 시간이 무색하게,
       그의 얼굴은 거의 변하지 않았다. 괜히 커피잔을 만지작거렸다.
ACTION: 시선을 테이블로 떨어뜨리며 커피잔 손잡이를 돌림
ADULT: false
```

**Step 3 — 초안 직조** (narrator)

narrator가 캐릭터 출력 + 서술(배경, 전환, 페이싱)을 엮어 산문으로 완성.
성인 장면이 포함된 경우 `<!-- ADULT_N_START/END -->` 마커를 삽입.

**Step 3.5 — OOC 이의제기** (선택적, `--ooc-check` 시)

각 캐릭터 에이전트가 초안에서 자기 캐릭터의 탈캐릭터 여부를 검토:

```
[OOC_CHECK: minhyuk]
- FLAG: "여유로운 표정을 지었다" → 민혁은 긴장을 숨기려 주머니에 손을 넣는 습관이 있음.
- SUGGEST: "주머니에 손을 찔러 넣으며 자리에 앉았다"
```

**Step 4 — 최종 확정** (narrator)

이의 반영(있으면) 후 장면 확정. 모든 장면이 끝나면 챕터 조립.

### 4.3 메시지 프로토콜

| 메시지 타입 | 발신 | 수신 | 용도 |
|------------|------|------|------|
| `SCENE_BRIEF` | narrator | all chars in scene | 장면 컨텍스트 전달 |
| `CHARACTER_RESPONSE` | char | narrator | 대사/내면/행동 제공 |
| `DRAFT_REVIEW` | narrator | all chars in scene | 초안 검토 요청 (--ooc-check 시) |
| `OOC_CHECK` | char | narrator | 탈캐릭터 이의/승인 (--ooc-check 시) |
| `SCENE_FINAL` | narrator | — | 장면 확정 신호 |

## 5. Team Definitions

### 5.1 writing-team-collab-2pass (주력)

```json
{
  "name": "writing-team-collab-2pass",
  "display_name": "캐릭터 협업 2-Pass 집필 팀",
  "description": "캐릭터 에이전트 collaborative 집필(Pass 1) + Grok 성인 장면 리라이트(Pass 2)",
  "category": "writing",
  "agents": [
    {
      "agent": "narrator",
      "role": "lead",
      "responsibility": "장면 브리핑, 산문 직조, ADULT 마커 삽입, 최종 확정",
      "model": "opus"
    },
    {
      "agent": "characters/*",
      "role": "contributor",
      "responsibility": "대사, 내면 묘사, OOC 검토",
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
      "responsibility": "챕터 요약 생성",
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
        "output": "챕터 초고 (ADULT 마커 포함)"
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
        "output": "챕터 요약"
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
  }
}
```

**adult-rewrite step 실행 방식**: team-orchestrator가 collab-write 완료 후, 챕터 파일에서 ADULT 마커를 감지한다. 마커가 있으면 Bash로 `adult-rewriter.mjs`를 직접 실행한다. 마커가 없으면 skip. 별도 schema 변경 없이 orchestrator 로직으로 처리한다.

### 5.2 writing-team-collab (non-2pass)

ADULT 마커가 필요 없는 프로젝트용. adult-rewrite step이 없는 버전:

```json
{
  "name": "writing-team-collab",
  "display_name": "캐릭터 협업 집필 팀",
  "description": "캐릭터 에이전트 collaborative 집필 (성인 장면 리라이트 없음)",
  "category": "writing",
  "agents": [
    { "agent": "narrator", "role": "lead", "model": "opus" },
    { "agent": "characters/*", "role": "contributor", "model": "dynamic", "resolve": "from_scene_cast" },
    { "agent": "proofreader", "role": "support", "model": "haiku" },
    { "agent": "summarizer", "role": "support", "model": "haiku" }
  ],
  "workflow": {
    "type": "hybrid",
    "steps": [
      { "name": "collab-write", "agents": ["narrator", "characters/*"], "execution": "collaborative" },
      { "name": "proofread", "agents": ["proofreader"], "depends_on": ["collab-write"] },
      { "name": "summarize", "agents": ["summarizer"], "depends_on": ["proofread"] }
    ]
  }
}
```

### 5.3 `characters/*` 동적 해석 (from_scene_cast)

team-orchestrator가 `"resolve": "from_scene_cast"`를 만나면:

1. `chapters/chapter_{N}.json`에서 장면별 등장인물 목록 추출
2. `characters/{id}.json`의 `role` 필드 확인
3. `agents/characters/{name}.md` 존재 여부 확인
4. 매칭되는 캐릭터 에이전트를 팀에 동적 추가

```
chapter_005.json의 등장인물: [char_yuna, char_minhyuk, char_jisu, char_vendor_ahjumma]

→ agents/characters/yuna.md       (protagonist → opus)    ✓ 상시
→ agents/characters/minhyuk.md    (deuteragonist → opus)   ✓ 상시
→ agents/characters/jisu.md       (supporting → sonnet)    ✓ 상시
→ char_vendor_ahjumma             (cameo → haiku)          동적 생성
```

### 5.4 단역 동적 생성

에이전트 .md가 없는 단역/카메오는 team-orchestrator가 `_template.md`의 플레이스홀더를 문자열 치환하여 임시 에이전트 프롬프트를 생성한다 (LLM 호출 불필요):

```
_template.md 플레이스홀더:
  {{name}}                   → "김아주머니"
  {{role}}                   → "cameo"
  {{voice.speech_pattern}}   → "부산 사투리, 반말"
  {{voice.signature_phrases}} → ["아이고~", "와 진짜?"]

→ 임시 에이전트 프롬프트 (haiku)
```

## 6. Flag System

### 6.1 명령어 체계

```
/write-2pass 5                    → novelist 단독 + Grok (기존)
/write-2pass 5 --team             → collab 집필 + Grok (신규)
/write 5 --team collab            → collab 집필, Grok 없음 (신규)
/write 5                          → novelist 단독 (기존)
```

| 명령 | Pass 1 | Pass 2 (Grok) | 퇴고 |
|------|--------|---------------|------|
| `/write N` | novelist 단독 | - | 선택적 |
| `/write N --team collab` | narrator + characters collab | - | 선택적 |
| `/write-2pass N` | novelist 단독 | adult-rewriter | 선택적 |
| `/write-2pass N --team` | narrator + characters collab | adult-rewriter | 선택적 |

### 6.2 추가 플래그

| 플래그 | 기본값 | 설명 |
|--------|--------|------|
| `--team` | off | collab 집필 활성화 |
| `--ooc-check` | off | OOC 이의제기 단계 활성화 |

## 7. Character Agent Generation Workflow

### 7.1 생성 시점

`06-design-character` 스킬이 `characters/{id}.json`을 저장한 직후 자동으로 `agents/characters/{name}.md`를 생성한다.

```
/design-character 유나
    ↓
characters/char_yuna.json 저장
    ↓
agents/characters/yuna.md 자동 생성
```

### 7.2 생성 로직

`_template.md`(구조 가이드) + `characters/{id}.json`(설계 데이터)를 입력으로 sonnet이 에이전트 프롬프트를 작성한다.

```
입력:
  - agents/characters/_template.md (구조 가이드)
  - characters/char_yuna.json (설계 데이터)

처리: sonnet이 캐릭터 특성을 반영한 에이전트 프롬프트 작성

출력:
  - agents/characters/yuna.md (커스텀 에이전트)
```

### 7.3 재생성 보호

이미 사용자가 편집한 에이전트 파일이 있으면 덮어쓰지 않는다:

```
agents/characters/yuna.md 이미 존재?
  → YES: "[SKIP] yuna.md가 이미 존재합니다. 재생성하려면 --force 사용"
  → NO: 자동 생성
```

`--force` 시 기존 파일을 `.bak`으로 백업 후 재생성.

### 7.4 수동 편집 권장

자동 생성된 에이전트 파일은 시작점이다. 사용자가 직접 다듬는 것을 권장한다:

- 캐릭터 고유의 사고 패턴
- 트라우마 반응
- 관계별 태도 차이
- 캐릭터 아크 진행에 따른 변화

### 7.5 _template.md 구조

```markdown
# Character Agent Template

이 파일은 두 가지 용도로 사용됩니다:
1. 캐릭터 에이전트 작성 시 구조 가이드
2. 단역 동적 생성 시 플레이스홀더 템플릿

## 에이전트 작성 가이드 (LLM용)

### 필수 섹션

**Frontmatter:**
- name: character-{id}
- description: "{이름} 캐릭터 에이전트 — 대사, 내면 묘사, 감정 반응 생성"
- model: {role에 따라 opus/sonnet/haiku}
- tools: [Read]

**Identity:**
- characters/{id}.json 참조 명시
- 나이, 직업, 핵심 성격 요약 (1-2줄)

**Voice:**
- 화법: 문장 길이, 어휘 수준, 경어법 기본값
- 내면: 독백 스타일 (분석적/감정적/의식의 흐름/간결)
- 버릇: 말버릇, 무의식적 행동, 감정 표현 패턴

**Behavioral Rules:**
- 감정별 반응 패턴 (호감, 분노, 슬픔, 당황 등)
- 대인 관계별 태도 변화
- 캐릭터 아크에 따른 변화 방향

**Collaborative Protocol:**
- DIALOGUE / INNER / ACTION / ADULT 형식 준수
- OOC 검토 시 자기 캐릭터 관점에서 판단

## 단역 동적 생성 템플릿

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
- 말버릇: {{voice.signature_phrases}}

## Collaborative Protocol
- DIALOGUE: "실제 대사"
- INNER: (내면 묘사)
- ACTION: (외적 반응)
- ADULT: true/false
```

## 8. Pipeline Integration

### 8.1 전체 흐름

```
[집필]
  /write-2pass N --team
      ↓
  writing-team-collab-2pass
      ↓
  ┌─ collab-write ──────────────┐
  │  narrator (opus)             │
  │  + character-yuna (opus)     │
  │  + character-minhyuk (opus)  │
  │  + character-jisu (sonnet)   │
  │  collaborative workflow      │
  └──────────────────────────────┘
      ↓
  adult-rewriter.mjs (Grok, ADULT 마커 있을 때만)
      ↓
  proofreader (haiku)
      ↓
  summarizer (haiku)
      ↓
[퇴고] (--team 시)
  revision-team (기존 그대로)
  critic → editor → proofreader → consistency-verifier
```

### 8.2 기존 경로와의 호환

| 기존 | 변경 |
|------|------|
| novelist.md | 유지 — non-team fallback |
| writing-team.team.json | 유지 — 기본 집필 팀 |
| writing-team-2pass.team.json | 유지 — 기본 2-pass 팀 |
| revision-team.team.json | 변경 없음 |
| write-2pass/SKILL.md | `--team` 분기 추가 |
| 14-write/SKILL.md | `--team collab` 분기 추가 |

## 9. File Changes Summary

### 신규 생성

| 파일 | 설명 |
|------|------|
| `agents/narrator.md` | collaborative 집필 서술자 에이전트 |
| `agents/characters/_template.md` | 작성 가이드 + 단역 동적 생성 템플릿 |
| `agents/characters/*.md` | 프로젝트별 캐릭터 에이전트 (design-character 시 자동 생성) |
| `teams/writing-team-collab.team.json` | 캐릭터 협업 집필 팀 (non-2pass) |
| `teams/writing-team-collab-2pass.team.json` | 캐릭터 협업 2-Pass 집필 팀 |

### 수정

| 파일 | 변경 내용 |
|------|----------|
| `skills/write-2pass/SKILL.md` | `--team` 플래그 분기 추가 |
| `skills/write-act-2pass/SKILL.md` | `--team` 플래그 분기 추가 |
| `skills/14-write/SKILL.md` | `--team collab` 분기 추가 |
| `skills/15-write-act/SKILL.md` | `--team collab` 분기 추가 |
| `skills/16-write-all/SKILL.md` | `--team collab` 분기 추가 |
| `skills/06-design-character/SKILL.md` | 마지막 단계에 에이전트 파일 자동 생성 추가 |
| `agents/team-orchestrator.md` | `from_scene_cast` 해석 + ADULT 마커 감지 후 adult-rewriter 실행 |
| `teams/AGENTS.md` | 새 팀 문서화 |

### 변경 없음

| 파일 | 이유 |
|------|------|
| `schemas/team.schema.json` | orchestrator 로직으로 처리, 스키마 변경 불필요 |
| `schemas/character.schema.json` | 기존 `role` 필드 활용 |
| `revision-team.team.json` | 기존 퇴고 파이프라인 그대로 |
| `src/pipeline/*` | collaborative는 에이전트 레벨에서 동작, pipeline 코드 변경 불필요 |

## 10. Cost Estimation

### 기본 모드 (OOC 체크 없음)

챕터 1개 기준 (4장면, 캐릭터 3명):

| 단계 | 에이전트 | 호출 수 | 예상 토큰 |
|------|---------|---------|----------|
| Scene Brief × 4 | narrator (opus) | 4 | ~8K |
| Character Response × 4 × 3 | characters (opus/sonnet) | 12 | ~36K |
| Draft Weaving × 4 | narrator (opus) | 4 | ~40K |
| Adult Rewrite | Grok (외부) | 0~1 | 별도 과금 |
| Proofread | proofreader (haiku) | 1 | ~5K |
| Summarize | summarizer (haiku) | 1 | ~3K |
| **합계** | | **~22** | **~92K** |

### OOC 체크 모드

위 기본 + OOC 체크:

| 추가 단계 | 호출 수 | 추가 토큰 |
|-----------|---------|----------|
| Draft Review × 4 | 4 | ~8K |
| OOC Check × 4 × 3 | 12 | ~12K |
| Revision × 4 | 4 | ~16K |
| **추가 합계** | **20** | **~36K** |
| **전체 합계** | **~42** | **~128K** |

비교: 기존 novelist 단독 = ~50K 토큰. collab 기본 모드는 약 1.8배, OOC 모드는 약 2.6배.
