---
name: team-nov
description: 에이전트 팀 관리 및 실행
user-invocable: true
---

# /novel-dev:team-nov - 에이전트 팀 관리 및 실행

> **Architecture Note**: 이 스킬은 팀 조직화와 서브커맨드 라우팅을 담당합니다.
> 실행 오케스트레이션은 `novel-dev:team-orchestrator` 에이전트에 위임합니다.
> **책임 분담**: SKILL.md = What (서브커맨드, 정책, 관계) / team-orchestrator.md = How (실행, 품질 게이트, 에러 처리)

## Quick Start

```bash
/novel-dev:team-nov list                          # 사용 가능한 팀 목록
/novel-dev:team-nov info verification-team        # 팀 구성 상세 정보
/novel-dev:team-nov run verification-team 5       # 5화에 검증 팀 실행
/novel-dev:team-nov run deep-review-team 3        # 3화에 심층 리뷰 팀 실행
/novel-dev:team-nov run revision-team 7           # 7화에 퇴고 팀 실행
/novel-dev:team-nov create my-custom-team         # 사용자 정의 팀 생성
/novel-dev:team-nov status                        # 활성 팀 세션 상태
```

## Subcommands

### `/novel-dev:team-nov list` — 팀 목록 조회

`teams/*.team.json` 파일을 검색하여 카테고리별로 표시합니다. 프리셋 팀과 사용자 정의 팀(category: custom)을 구분하여 이름, 카테고리, 에이전트 수를 요약합니다.

### `/novel-dev:team-nov info <name>` — 팀 상세 정보

`teams/{name}.team.json`을 읽어 팀 구성(에이전트 목록, 역할), 워크플로우 유형, 품질 게이트 설정, 비용 추정을 사용자에게 요약합니다.

### `/novel-dev:team-nov run <name> [chapter]` — 팀 실행

팀 정의에 따라 에이전트 팀을 구성하고 실행합니다.

**Phase 0: 비용 경고**

팀 정의의 `cost_estimate.warning_message`를 표시하고 AskUserQuestion으로 확인:
- "진행" — 팀 전체 실행
- "최소 실행" — optional 에이전트 제외
- "취소" — 실행 중단

**Phase 1: 컨텍스트 로드**

Context Budget System 우선순위에 따라 로드합니다. 비챕터 태스크는 [Non-Chapter Tasks](#non-chapter-tasks) 참조.

**Phase 2-5: team-orchestrator 에이전트에 위임**

- `parallel` / `sequential` / `pipeline`: team-orchestrator에 단일 Task 위임
- `collaborative`: team-orchestrator가 TeamCreate API로 자율 협업 구성

실행 상세(에이전트 스폰, 상태 추적, 품질 게이트 적용, 리포트 생성)는 `agents/team-orchestrator.md` 참조.

**워크플로우 선택 가이드:**

| 조건 | 권장 Workflow |
|------|---------------|
| 읽기 전용 + 독립적 | parallel |
| 순서 의존 + 단순 체인 | sequential |
| 순서 의존 + 품질 보증 | pipeline |
| 실시간 소통 필요 | collaborative |
| 비용 최소화 | sequential |
| 속도 최적화 | parallel |

### `/novel-dev:team-nov create <name>` — 사용자 정의 팀 생성

대화형 위자드로 커스텀 팀을 생성합니다. `templates/team.template.json` 기반:

1. 팀 이름, 설명, 카테고리
2. 에이전트 선택 (`agents/` 디렉토리에서 동적 탐색)
3. 워크플로우 유형 (sequential/parallel/pipeline/collaborative)
4. 품질 게이트 설정 (선택)

결과를 `teams/{name}.team.json`에 저장합니다.

### `/novel-dev:team-nov status` — 활성 팀 세션 상태

`.omc/state/team-*.json` 파일에서 `running` 또는 `initializing` 상태의 세션을 조회하여 팀 이름, 진행률, 경과 시간을 표시합니다.

---

## Error Handling Strategy

| 시나리오 | 동작 |
|----------|------|
| 팀 정의 파일 미존재 | 에러 메시지 + `/novel-dev:team-nov list`로 사용 가능한 팀 안내 |
| 챕터 파일 미존재 | 대상 파일 경로 오류 안내 + 중단 |
| 에이전트 스폰 실패 | team-orchestrator 에러 처리에 따름, 사용자에게 실패 에이전트 목록 표시 |
| 품질 게이트 max_iterations 초과 | 최종 상태 리포트 출력 + 수동 수정 안내 |
| collaborative 교착 | 타임아웃(5분/에이전트) 후 강제 종료 + 부분 결과 보고 |

에이전트 수준의 상세 에러 처리(재시도, partial report, timeout)는 `agents/team-orchestrator.md` Error Handling 섹션 참조.

---

## Non-Chapter Tasks

`args.chapter` 유무로 컨텍스트 로드 전략을 분기합니다:

- **chapter-based** (chapter 인자 있음): 챕터 파일 + 캐릭터 + 세계관 + 스타일 가이드 + 최근 요약 3개 로드
- **project-based** (chapter 인자 없음): `meta/` + `characters/` + `world/` + `plot/` 전체 로드 (planning-team 등)

---

## Related Skills

| 비교 | 기존 스킬 | /novel-dev:team-nov 대응 | 차이 |
|------|-----------|-----------|------|
| 검증 | `/verify-chapter N` | `/novel-dev:team-nov run verification-team N` | verify-chapter = 경량 자동 호출, 더 엄격 (beta-reader ≥80, genre-validator ≥95). verification-team = 팀 인프라 기반, 확장 가능 (beta-reader ≥75, genre-validator ≥90). threshold 차이는 의도적 설계 — verify-chapter는 자동 품질 게이트용으로 높은 기준 적용. |
| 퇴고 | `/revise-pipeline N` | `/novel-dev:team-nov run revision-team N` | revise-pipeline = 최소 3단계 순차 (critic→editor→proofreader). revision-team = 4단계 + consistency-verifier + max 3회 재시도 루프 (강화 버전). |
| 배치 | `/swarm review N` | `/novel-dev:team-nov run deep-review-team N` | /swarm = 배치 병렬 (같은 작업 × 여러 대상). /novel-dev:team-nov = 팀 협업 (여러 역할 × 하나의 대상). 공존. |
| 설계 | `/04-style` ~ `/12-hook` 개별 호출 | `/novel-dev:team-nov run design-execution-team` | 개별 스킬 = 수동 순차 호출. design-execution-team = 의존 그래프 기반 자동 병렬/순차 실행. |
| 설계 검증 | `/verify-design` | `/novel-dev:team-nov run design-review-team` | verify-design = 경량 2에이전트 (consistency+genre). design-review-team = 4에이전트 심층 리뷰 (문학성+일관성+장르+구조). |
| 플롯 검증 | 없음 | `/novel-dev:team-nov run plot-review-team` | gen-plot 결과를 4에이전트가 병렬 검증 (극적 구조, 연속성, 장르 비트, 아크 밸런스). |

---

## Output Paths

| 유형 | 경로 | 비고 |
|------|------|------|
| 팀 실행 결과 | `reviews/team/{team-name}_ch{N}_{timestamp}.json` | 영구 보존 |
| 팀 실행 상태 | `.omc/state/team-{id}.json` | 7일 보존 후 정리 대상 |
| 종합 리포트 | stdout | 화면 출력만 (team-orchestrator가 생성) |

---

## State Lifecycle

- `initializing` → `running` → `completed` / `failed`
- 완료 후 **7일 보존**, 이후 자동 정리 대상
- **재개(resume)**: 미지원 — 실패 시 수동 재실행 필요. 상태 파일은 디버깅 참조용으로 보존
- `/novel-dev:team-nov cleanup`: 향후 추가 예정 (현재 scope 외)

---

## Dependencies

- `agents/team-orchestrator.md` — 오케스트레이션 위임 대상
- `teams/*.team.json` — 팀 정의 (에이전트 목록은 여기서 동적 로드)
- `templates/team.template.json` — `/novel-dev:team-nov create` 위자드 기본 템플릿

## Documentation

- **Usage Examples**: `examples/example-usage.md`
