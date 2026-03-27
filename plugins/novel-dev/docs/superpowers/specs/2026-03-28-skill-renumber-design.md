# Skill Renumbering & Design/Review Team Consolidation

스킬 번호 재배치 + 설계/퇴고 스킬 팀 통합.

## 1. Problem Statement

04~12 개별 설계 스킬이 9개로 흩어져 있어 사용자가 순서를 외워야 한다.
17-revise, 18-evaluate, 19-consistency-check도 개별 호출이 번거롭다.
팀으로 묶어 한 번에 실행하는 것이 자연스럽다.

## 2. Solution Overview

### 핵심 변경

1. **04~12 설계 스킬 9개 → `04-design` 1개** (design-execution-team 호출)
2. **17-revise + 18-evaluate + 19-consistency-check → `09-review` 1개** (revision-team 호출)
3. **`04-design-review` 신규** (design-review-team 호출)
4. **설계 팀 에이전트 5명으로 확대** (character-designer, arc-designer 신규)
5. **번호 재배치**: 13→05, 14→06, 15→07, 16→08, 20→10

### 결정사항

| 항목 | 결정 |
|------|------|
| 개별 설계 스킬 | 삭제 (팀 통합으로 대체) |
| 팀 재활용 | design-execution-team, revision-team, design-review-team 활용 |
| 설계 팀 구성 | 5명 (기존 3 + 신규 2) |
| `/design` 동작 | 항상 04~12 전체 수행 |
| `/design-review` 동작 | 설계 산출물 검토 및 수정 |

## 3. New Skill Number Mapping

### 최종 번호 체계

| # | 스킬명 | 상태 | 내용 |
|---|--------|------|------|
| 00 | brainstorm | 유지 | 소크라테스식 아이디어 발굴 |
| 01 | blueprint-gen | 유지 | 기획서 생성 |
| 02 | blueprint-review | 유지 | 기획서 리뷰 |
| 03 | init | 유지 | 프로젝트 초기화 |
| **04** | **design** | **신규** | 설계 팀 통합 (문체→세계관→캐릭터→관계→타임라인→아크→복선→훅) |
| **04** | **design-review** | **신규** | 설계 산출물 검토 및 수정 |
| **05** | **gen-plot** | 리네임 (구 13) | 회차별 플롯 생성 |
| **06** | **write** | 리네임 (구 14) | 챕터 집필 |
| **07** | **write-act** | 리네임 (구 15) | 막 단위 집필 |
| **08** | **write-all** | 리네임 (구 16) | 전체 자동 집필 |
| **09** | **review** | **신규** | 퇴고/평가/검증 팀 통합 |
| **10** | **resume** | 리네임 (구 20) | 이어쓰기 |

### 삭제 대상 (12개 스킬 디렉토리)

```
skills/04-design-style/
skills/05-design-world/
skills/06-design-character/
skills/07-design-relationship/
skills/08-design-timeline/
skills/09-design-main-arc/
skills/10-design-sub-arc/
skills/11-design-foreshadow/
skills/12-design-hook/
skills/17-revise/
skills/18-evaluate/
skills/19-consistency-check/
```

### 리네임 대상 (5개)

```
skills/13-gen-plot/  → skills/05-gen-plot/
skills/14-write/     → skills/06-write/
skills/15-write-act/ → skills/07-write-act/
skills/16-write-all/ → skills/08-write-all/
skills/20-resume/    → skills/10-resume/
```

## 4. Design Team (5 Agents)

### 신규 에이전트 2개

**character-designer** (opus):
- 캐릭터 프로필 설계 (기존 lore-keeper에서 분리)
- 내면 설계: want/need/fatal_flaw, 행동 패턴, 아크
- 캐릭터 에이전트 파일 자동 생성 (`agents/characters/*.md`)
- 출력: `characters/*.json`, `characters/index.json`, `agents/characters/*.md`

**arc-designer** (sonnet):
- 서브아크, 복선, 훅 설계 (기존 plot-architect에서 분리)
- plot-architect가 잡은 메인 아크 뼈대 위에 세부 구조 설계
- 출력: `plot/sub-arcs/*.json`, `plot/foreshadowing.json`, `plot/hooks.json`

### 팀 구성 (5명)

| 에이전트 | 모델 | 담당 | 기존/신규 |
|---------|------|------|----------|
| style-curator | sonnet | 문체 설계 | 기존 |
| lore-keeper | sonnet | 세계관, 관계도 | 기존 (역할 축소) |
| character-designer | opus | 캐릭터 프로필 + 에이전트 생성 | **신규** |
| plot-architect | opus | 타임라인, 메인 아크 | 기존 (역할 축소) |
| arc-designer | sonnet | 서브아크, 복선, 훅 | **신규** |

### 설계 파이프라인 (design-execution-team 업데이트)

```
Step 1: style-and-world (병렬)
  style-curator → style-guide.json
  lore-keeper   → world.json, locations.json, terms.json

Step 2: character-design (순차, Step 1 완료 후)
  character-designer → characters/*.json + agents/characters/*.md

Step 3: relationship-and-timeline (병렬, Step 2 완료 후)
  lore-keeper     → relationships.json
  plot-architect  → timeline.json

Step 4: main-arc (순차, Step 3 완료 후)
  plot-architect → main-arc.json

Step 5: arc-details (순차, Step 4 완료 후)
  arc-designer → sub-arcs/*.json

Step 6: foreshadow (순차, Step 5 완료 후)
  arc-designer → foreshadowing.json

Step 7: hooks (순차, Step 6 완료 후)
  arc-designer → hooks.json
```

## 5. New Skill Definitions

### 04-design

```markdown
---
name: 04-design
description: "Use this skill when designing all aspects of a novel project (style, world, characters, arcs, foreshadowing, hooks). Triggers on: '설계', '디자인', 'design'."
user-invocable: true
---

# /design - 소설 전체 설계

$ARGUMENTS

03-init 완료 후, 문체부터 훅까지 전체 설계를 팀으로 실행합니다.

## Quick Start
/design          # 전체 설계 실행
/design-review   # 설계 산출물 검토 및 수정

## Prerequisites
- 03-init 완료 (plot/structure.json, meta/project.json 존재)
- BLUEPRINT.md 존재

## 실행

team-orchestrator에 design-execution-team 실행을 위임합니다:

Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
팀 실행: design-execution-team
프로젝트: {projectPath}
")

## 팀 구성 (5명)

| 에이전트 | 모델 | 단계 | 산출물 |
|---------|------|------|--------|
| style-curator | sonnet | Step 1 | style-guide.json |
| lore-keeper | sonnet | Step 1, 3 | world.json, relationships.json |
| character-designer | opus | Step 2 | characters/*.json, agents/characters/*.md |
| plot-architect | opus | Step 3, 4 | timeline.json, main-arc.json |
| arc-designer | sonnet | Step 5-7 | sub-arcs/*.json, foreshadowing.json, hooks.json |

## 파이프라인

1. 문체 + 세계관 (병렬)
2. 캐릭터 설계 + 에이전트 생성
3. 관계도 + 타임라인 (병렬)
4. 메인 아크
5. 서브 아크
6. 복선
7. 훅

## 완료 후

설계 완료 메시지:
[OK] 전체 설계 완료. /design-review로 검토하거나, /gen-plot으로 회차별 플롯을 생성하세요.
```

### 04-design-review

```markdown
---
name: 04-design-review
description: "Use this skill when reviewing and refining design artifacts from multiple angles. Triggers on: '설계 리뷰', '설계 검토', 'design review'."
user-invocable: true
---

# /design-review - 설계 산출물 검토

$ARGUMENTS

설계 완료 후, 4명의 전문가가 다각도로 검토합니다.

## 실행

team-orchestrator에 design-review-team 실행을 위임합니다:

Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
팀 실행: design-review-team
프로젝트: {projectPath}
")

## 팀 구성 (4명, 병렬)

| 에이전트 | 역할 | 검토 관점 |
|---------|------|----------|
| critic | 서사 품질 | 구조적 완성도, 캐릭터 깊이 |
| lore-keeper | 세계관 일관성 | 설정 모순, 누락 |
| genre-validator | 장르 적합성 | 독자 기대 충족 |
| plot-architect | 플롯 구조 | 아크 균형, 긴장 곡선 |

## 결과

- 검토 리포트 + 수정 제안 제시
- 사용자 승인 후 수정 적용
```

### 09-review

```markdown
---
name: 09-review
description: "Use this skill when reviewing completed chapters (revision, evaluation, consistency check). Triggers on: '리뷰', '퇴고', '평가', '검증', 'review'."
user-invocable: true
---

# /review - 퇴고/평가/검증

$ARGUMENTS

완성된 챕터를 revision-team으로 퇴고 + 평가 + 일관성 검증합니다.

## Quick Start
/review 5        # 5화 리뷰
/review 1-10     # 1~10화 리뷰

## 실행

team-orchestrator에 revision-team 실행을 위임합니다:

Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
팀 실행: revision-team
대상: Chapter {chapterNumber}
프로젝트: {projectPath}
")

## 팀 구성 (4명, 파이프라인)

| 에이전트 | 모델 | 단계 | 역할 |
|---------|------|------|------|
| critic | opus | 1. 평가 | 4차원 품질 평가 (서사/플롯/캐릭터/배경) |
| editor | sonnet | 2. 퇴고 | 평가 기반 원고 수정 |
| proofreader | haiku | 3. 교정 | 맞춤법/문법/어법 |
| consistency-verifier | sonnet | 4. 검증 | 5도메인 일관성 체크 |

## Quality Gates

| 에이전트 | 기준 |
|---------|------|
| critic | ≥ 85 |
| consistency-verifier | ≥ 85 |

## 결과

- 성공: editor 수정본이 최종본으로 저장
- 실패: 원고 보존 + 경고 리포트
- 결과 파일: reviews/team/revision-team_ch{N}_{timestamp}.json
```

## 6. Routing Rules Update

`scripts/routing-rules.json`에서 삭제/변경할 항목:

### 삭제

기존 04~12, 17, 18, 19 스킬의 라우팅 룰 제거.

### 추가

```json
{
  "id": "04-design",
  "name": "design",
  "keywords": ["설계", "디자인", "design", "전체 설계"],
  "excludeKeywords": ["리뷰", "검토", "review"],
  "requireNovelContext": true,
  "priority": 8
},
{
  "id": "04-design-review",
  "name": "design-review",
  "keywords": ["설계 리뷰", "설계 검토", "design review"],
  "requireNovelContext": true,
  "priority": 8
},
{
  "id": "09-review",
  "name": "review",
  "keywords": ["리뷰", "퇴고", "평가", "검증", "review", "revise"],
  "argPattern": "^(\\d+)(?:[-~](\\d+))?",
  "argType": "chapterRange",
  "requireNovelContext": true,
  "priority": 7
}
```

### 변경 (번호 업데이트)

```
13-gen-plot → 05-gen-plot
14-write    → 06-write
15-write-act → 07-write-act
16-write-all → 08-write-all
20-resume   → 10-resume
```

## 7. Other References Update

### 리네임된 스킬을 참조하는 파일들

| 참조 파일 | 변경 내용 |
|-----------|----------|
| `skills/06-write/SKILL.md` (구 14-write) | 내부 번호 참조 업데이트 |
| `skills/07-write-act/SKILL.md` (구 15-write-act) | `/write {chapter}` → 번호 참조 |
| `skills/08-write-all/SKILL.md` (구 16-write-all) | `/write`, `/revise` 등 참조 |
| `teams/design-execution-team.team.json` | `skill_ref` 필드 업데이트 (구 번호 → 개별 스킬 삭제이므로 제거 또는 새 스킬 참조) |
| `teams/writing-team-collab.team.json` | 참조 없음 (변경 불필요) |
| `scripts/routing-rules.json` | 전체 업데이트 |
| `scripts/novel-skill-router.mjs` | routing-rules.json 기반이므로 코드 변경 불필요 |
| `agents/team-orchestrator.md` | skill_ref 참조 패턴 확인 |

### design-execution-team.team.json 업데이트

기존 `skill_ref`가 삭제되는 개별 스킬(04-design-style 등)을 참조하고 있으므로:
- 개별 스킬 파일이 삭제되면 skill_ref 참조가 깨짐
- **해결**: 개별 SKILL.md의 핵심 지시 내용을 design-execution-team.team.json의 각 step `responsibility` 필드에 흡수하거나, 별도 reference 파일로 분리

### 에이전트 파일

| 파일 | 변경 |
|------|------|
| `agents/character-designer.md` | **신규 생성** |
| `agents/arc-designer.md` | **신규 생성** |
| `config/model-tiers.json` | 신규 에이전트 2개 추가 |
| `agents/AGENTS.md` | 에이전트 목록 업데이트 |

## 8. File Changes Summary

### 신규 생성

| 파일 | 설명 |
|------|------|
| `agents/character-designer.md` | 캐릭터 전문 설계 에이전트 (opus) |
| `agents/arc-designer.md` | 서브아크/복선/훅 설계 에이전트 (sonnet) |
| `skills/04-design/SKILL.md` | 전체 설계 팀 스킬 |
| `skills/04-design-review/SKILL.md` | 설계 리뷰 팀 스킬 |
| `skills/09-review/SKILL.md` | 퇴고/평가/검증 팀 스킬 |

### 삭제

12개 스킬 디렉토리 (04-design-style ~ 12-design-hook, 17-revise, 18-evaluate, 19-consistency-check)

### 리네임

5개 스킬 디렉토리 (13→05, 14→06, 15→07, 16→08, 20→10)

### 수정

| 파일 | 변경 |
|------|------|
| `teams/design-execution-team.team.json` | 에이전트 5명으로 확대, skill_ref 정리 |
| `scripts/routing-rules.json` | 삭제/추가/번호 변경 반영 |
| `config/model-tiers.json` | character-designer, arc-designer 추가 |
| `agents/AGENTS.md` | 에이전트 목록 업데이트 |
| `teams/AGENTS.md` | 팀 문서 업데이트 |
| 리네임된 스킬 SKILL.md 5개 | 내부 번호 참조 업데이트 |

## 9. Migration Notes

### 기존 프로젝트 호환성

- 기존 `/revise`, `/evaluate`, `/consistency-check` 호출 → routing-rules에서 `09-review`로 리다이렉트
- 기존 `/design-style`, `/design-world` 등 개별 호출 → 삭제됨. `/design`으로 안내
- `design-execution-team`의 `skill_ref` 참조가 삭제된 스킬을 가리키므로 team.json 업데이트 필수
