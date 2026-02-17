# Team Workflow Patterns

팀 워크플로우 유형별 실행 패턴 상세 가이드.

## 1. Parallel (병렬)

### 개요

모든 에이전트가 동시에 독립적으로 실행되며, 전원 완료 후 결과를 집계합니다.

### 적합한 상황
- 읽기 전용 작업 (검증, 리뷰, 분석)
- 에이전트 간 의존성이 없는 경우
- 속도가 중요한 경우

### 사용 팀
- `verification-team` (3개 검증 에이전트)
- `deep-review-team` (6개 리뷰 에이전트)

### 실행 흐름

```
┌──────────────────────────────────────────────┐
│  Phase 1: 컨텍스트 로드                        │
│  ↓                                            │
│  Phase 2: 에이전트 동시 실행                    │
│  ┌─────────┐ ┌───────────┐ ┌───────────────┐  │
│  │ critic  │ │beta-reader│ │genre-validator│  │
│  │ (opus)  │ │ (sonnet)  │ │  (sonnet)     │  │
│  └────┬────┘ └─────┬─────┘ └──────┬────────┘  │
│       │            │              │            │
│  Phase 3: 결과 수집 (Promise.all)              │
│       └────────────┼──────────────┘            │
│                    ↓                           │
│  Phase 4: 품질 게이트 적용                      │
│  Phase 5: 종합 리포트                          │
└──────────────────────────────────────────────┘
```

### 결과 집계 방식

**all_pass**: 모든 에이전트가 기준 점수 이상 → PASS
```
critic >= 85 AND beta-reader >= 75 AND genre-validator >= 90
→ 하나라도 실패 시 전체 FAIL
```

**majority**: 과반수 통과 → PASS
```
6개 에이전트 중 4개 이상 PASS → APPROVED
3개 이하 PASS → REVISION REQUIRED
```

### 주의사항
- 에이전트 수만큼 토큰이 동시 소모됨
- 하나의 에이전트 실패가 전체를 블록하지 않음
- 타임아웃된 에이전트는 INCONCLUSIVE로 처리

---

## 2. Sequential (순차)

### 개요

에이전트가 정의된 순서대로 하나씩 실행되며, 이전 출력이 다음 입력이 됩니다.

### 적합한 상황
- 이전 단계 결과가 다음 단계 입력으로 필요한 경우
- 각 단계가 이전 단계를 보완/정제하는 경우
- 비용을 최소화해야 하는 경우

### 사용 팀
- `writing-team` (집필 → 교정 → 요약)

### 실행 흐름

```
┌──────────────────────────────────────────────┐
│  Step 1: novelist (opus)                      │
│  → 챕터 초고 생성                              │
│  ↓ output: chapters/chapter_XXX.md            │
│                                               │
│  Step 2: proofreader (haiku)                  │
│  → 맞춤법/문법 교정                            │
│  ↓ output: 교정된 챕터                         │
│                                               │
│  Step 3: summarizer (haiku)                   │
│  → 챕터 요약 생성                              │
│  ↓ output: context/summaries/chapter_XXX.md   │
└──────────────────────────────────────────────┘
```

### 출력 전달 규칙

각 단계의 출력은 다음 단계 프롬프트에 포함됩니다:

```spec
// Step N+1 프롬프트에 Step N 결과 포함
prompt = `
  이전 단계 결과:
  ${previousStepOutput}

  현재 작업:
  ${currentStepInstructions}
`;
```

### 주의사항
- 하나의 단계 실패 시 전체 파이프라인 중단
- 실행 시간은 모든 단계의 합산
- 앞 단계가 느리면 뒷 단계가 대기

---

## 3. Pipeline (파이프라인)

### 개요

Sequential과 유사하지만, 단계 간 품질 게이트가 있으며 실패 시 재시도가 가능합니다.

### 적합한 상황
- 단계별 품질 보증이 필요한 경우
- 수정-검증 루프가 필요한 경우
- 최종 결과물의 품질이 중요한 경우

### 사용 팀
- `writing-team-2pass` (초안 → 조립 → 진단 → 수술 → 교정)
- `revision-team` (진단 → 수정 → 교정 → 검증)

### 실행 흐름

```
┌──────────────────────────────────────────────┐
│  Step 1: diagnose (critic)                    │
│  → 현재 품질 진단                              │
│  ↓                                            │
│  Step 2: revise (editor)                      │
│  → 피드백 기반 수정                            │
│  ↓                                            │
│  Step 3: proofread (proofreader)              │
│  → 최종 교정                                  │
│  ↓                                            │
│  Step 4: verify (consistency-verifier)        │
│  → 일관성 재검증                               │
│  ↓                                            │
│  ┌─ Quality Gate ──────────────────────┐      │
│  │  consistency-verifier >= 85?         │      │
│  │  YES → COMPLETE                      │      │
│  │  NO  → retry (max 3 iterations)     │      │
│  └─────────────────────────────────────┘      │
└──────────────────────────────────────────────┘
```

### 재시도 로직

```spec
let iteration = 0;
while (iteration < workflow.max_iterations) {
  const result = await executeAllSteps(workflow.steps);

  if (qualityGatePass(result)) {
    break;  // 성공
  }

  iteration++;
  if (iteration < workflow.max_iterations) {
    // 실패 이유를 다음 반복에 전달
    context.previousFailure = result.failureReason;
  }
}
```

### 주의사항
- max_iterations 초과 시 최종 결과 반환 (FAIL 상태)
- 재시도는 전체 파이프라인이 아닌 실패 단계부터 재실행
- 각 재시도는 이전 실패 이유를 참조

---

## 4. Collaborative (자율 협업)

### 개요

팀 리더가 Claude Code의 TeamCreate/SendMessage를 사용하여 팀원을 자율적으로 조율합니다. 가장 유연하지만 가장 비용이 높은 방식입니다.

### 적합한 상황
- 에이전트 간 실시간 소통이 필요한 경우
- 작업 범위가 동적으로 변하는 경우
- 창의적 협업이 필요한 경우

### 사용 팀
- `planning-team` (설계 협업)

### 실행 흐름

```
┌──────────────────────────────────────────────┐
│  TeamCreate("planning-team-{id}")             │
│  ↓                                            │
│  Spawn: plot-architect (lead)                 │
│  Spawn: lore-keeper (worker)                  │
│  Spawn: style-curator (support)                │
│  ↓                                            │
│  plot-architect ←→ lore-keeper                │
│  (SendMessage로 구조 ↔ 설정 조율)              │
│  ↓                                            │
│  style-curator: 문체 가이드 정리               │
│  ↓                                            │
│  TeamDelete()                                 │
└──────────────────────────────────────────────┘
```

### 팀 리더 역할

리더 에이전트는:
1. 작업 방향 설정 (TaskCreate)
2. 팀원에 작업 할당 (TaskUpdate owner)
3. 진행 상황 모니터링 (TaskList)
4. 팀원 간 결과 전달 (SendMessage)
5. 최종 결과 통합

### 주의사항
- 가장 많은 토큰 소모 (에이전트 간 메시지 교환 포함)
- 팀 규모 3-4명 이하 권장
- 실행 시간 예측이 어려움
- 반드시 shutdown_request → TeamDelete로 정리

---

## Workflow 선택 가이드

| 조건 | 권장 Workflow |
|------|---------------|
| 읽기 전용 + 독립적 | parallel |
| 순서 의존 + 단순 체인 | sequential |
| 순서 의존 + 품질 보증 | pipeline |
| 실시간 소통 필요 | collaborative |
| 비용 최소화 | sequential |
| 속도 최적화 | parallel |
| 품질 최적화 | pipeline (with retries) |

## Chapter 1 특별 규칙

1화는 독자 유지의 결정적 지점이므로 모든 팀에서 강화된 기준이 적용됩니다:

| 에이전트 | 일반 기준 | 1화 기준 |
|----------|-----------|----------|
| critic | >= 85 | >= 90 |
| beta-reader | >= 75 | >= 80 |
| genre-validator | >= 90 | >= 95 |
| consistency-verifier | >= 85 | >= 90 |
| engagement-optimizer | >= 70 | >= 80 |
| character-voice-analyzer | >= 80 | >= 85 |

오케스트레이터는 chapter 번호가 1일 때 자동으로 강화된 기준을 적용합니다.
