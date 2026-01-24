---
name: write-all
description: "[11단계] 전체 집필 - 1화부터 목표화수까지 자동 집필 (Ralph Loop)"
user-invocable: true
---

[NOVEL-SISYPHUS: 전체 자동 집필 - RALPH LOOP]

## 마스터피스 모드

품질 기준 강화 버전입니다:
- 품질 기준: 70점 → **85점**
- 검증 체계: 단일 critic → **다중 검증자 (3 agents)**
- 실패 처리: Circuit Breaker 패턴

### 다중 검증자 시스템

| Validator | 일반 기준 | 1화 기준 | 역할 |
|-----------|---------|---------|------|
| critic | ≥85점 | **≥90점** | 품질 평가 (25x4=100) |
| beta-reader | ≥75점 | **≥80점** | 몰입도/이탈 예측 |
| genre-validator | ≥90점 | **≥95점** | 장르 요구사항 충족 |

**모든 validator가 통과해야 품질 게이트 통과**

### 1화 특별 품질 게이트

1화는 독자 유지율에 가장 큰 영향을 미치므로 강화된 기준 적용:

**1화 품질 체크리스트:**
- [ ] 첫 문단에 강력한 위기/호기심 요소 존재
- [ ] 주인공의 특별함을 3문단 내에 제시
- [ ] 3~5화 내 사이다 제공 계획 수립
- [ ] 독자 유지율 예측 ≥75%
- [ ] 장르 핵심 요소가 명확히 드러남

**동작 방식:**
- 1화 집필 시 `checkConsensus(results, 1)` 호출
- 자동으로 CHAPTER_1_THRESHOLDS 적용
- 실패 시 더 상세한 diagnostic 제공

$ARGUMENTS

## 옵션

| 옵션 | 설명 |
|------|------|
| `--resume` | 이전 세션에서 중단된 지점부터 이어서 집필 |
| `--restart` | 이전 진행 상황 무시하고 처음부터 다시 시작 |
| (없음) | 기본 동작 - 복구 가능 시 확인 후 결정 |

### 세션 복구

이전 세션이 중단된 경우:
1. 세션 시작 시 복구 가능 여부 알림
2. `/write-all --resume` → 중단점에서 이어서 집필
3. `/write-all --restart` → 처음부터 다시 시작

복구 정보는 `meta/ralph-state.json`에 저장됩니다.

## THE NOVEL OATH

소설 완성까지 멈추지 않는 자동 집필 모드입니다.

## Promise 태그

| 단계 | Promise |
|------|---------|
| 회차 완료 | `<promise>CHAPTER_{N}_DONE</promise>` |
| 막 완료 | `<promise>ACT_{N}_DONE</promise>` |
| 전체 완료 | `<promise>NOVEL_DONE</promise>` |

## 실행 흐름 (v2)

```
for act in acts:
    for chapter in act.chapters:
        /write {chapter}

        # Multi-Validator 품질 게이트
        results = parallel_validate(critic, beta-reader, genre-validator)

        if all_passed(results):
            <promise>CHAPTER_{chapter}_DONE</promise>
            continue

        # Diagnostic 기반 수정 루프
        for retry in range(3):
            diagnostic = generate_diagnostic(results)
            /revise {chapter} with diagnostic
            results = parallel_validate(...)

            if all_passed(results):
                break

            if same_failure_3_times(diagnostic):
                # Circuit Breaker
                action = ask_user(["수동 수정", "기준 완화", "스킵", "중단"])
                handle_circuit_breaker(action)
                break

        <promise>CHAPTER_{chapter}_DONE</promise>

    # 막 단위 검증
    /revise (막 전체)
    /consistency-check

    # 막 완료
    <promise>ACT_{act}_DONE</promise>

<promise>NOVEL_DONE</promise>
```

## 상태 파일

`meta/ralph-state.json` (세션 복구 지원):
```json
{
  "ralph_active": true,
  "mode": "write-all",
  "project_id": "novel_20250117_143052",
  "current_act": 1,
  "current_chapter": 5,
  "total_chapters": 50,
  "total_acts": 3,
  "completed_chapters": [1, 2, 3, 4],
  "failed_chapters": [],
  "act_complete": false,
  "quality_score": 0,
  "last_quality_score": 75,
  "retry_count": 0,
  "iteration": 1,
  "max_iterations": 100,
  "can_resume": true,
  "last_checkpoint": "2026-01-21T10:30:00Z",
  "started_at": "2026-01-21T09:00:00Z",
  "quality_threshold": 85,
  "validators": ["critic", "beta-reader", "genre-validator"],
  "circuit_breaker": {
    "failure_count": 0,
    "failure_reasons": [],
    "triggered": false
  },
  "last_validation": {
    "critic": 87,
    "beta_reader": 78,
    "genre_validator": 92,
    "all_passed": true
  }
}
```

### 체크포인트 시스템

- **자동 저장**: 회차 완료 시마다 체크포인트 저장
- **백업 유지**: 최근 3개 백업 자동 보관 (`meta/backups/`)
- **복구 지원**: 중단된 세션에서 이어서 집필 가능

## 품질 게이트 로직 (v2 - Multi-Validator)

1. **평가 기준**: 3개 validator 모두 통과
   - critic >= 85점
   - beta-reader >= 75점 (engagement)
   - genre-validator >= 90점 (compliance)

2. **검증 프로세스**:
   ```
   /write {chapter}
       │
       v
   [Multi-Validator 병렬 실행]
       │
       ├─> critic (품질)
       ├─> beta-reader (몰입도)
       └─> genre-validator (장르)
       │
       v
   [Consensus 판정]
       │
       ├─ ALL PASS → 다음 회차 진행
       │
       └─ ANY FAIL → Diagnostic 생성
           │
           v
       [editor에게 수정 지시]
           │
           v
       [재검증] (최대 3회)
           │
           └─ 동일 실패 3회 → Circuit Breaker
   ```

3. **Circuit Breaker**:
   - 동일 이유로 3회 실패 시 자동 중단
   - 사용자에게 선택지 제공:
     - (A) 수동 수정 후 재시도
     - (B) 기준 완화 (legacy 70점)
     - (C) 해당 회차 스킵
     - (D) 집필 중단

4. **Diagnostic 출력**:
   - 실패 원인 분석 (root_cause)
   - 심각도 (critical/major/minor)
   - 구체적 수정 제안 (suggested_fix)
   - 예상 수정 노력 (quick/moderate/significant)

## Multi-Validator 호출 패턴

회차 집필 완료 후 다음을 수행:

```javascript
// 1. 3개 validator 병렬 호출
const validationPromises = [
  Task({
    subagent_type: "novel-dev:critic",
    prompt: `Chapter ${chapter} 평가...`
  }),
  Task({
    subagent_type: "novel-dev:beta-reader",
    prompt: `Chapter ${chapter} 몰입도 분석...`
  }),
  Task({
    subagent_type: "novel-dev:genre-validator",
    prompt: `Chapter ${chapter} 장르 검증...`
  })
];

// 2. 병렬 실행 대기
const [criticResult, betaResult, genreResult] = await Promise.all(validationPromises);

// 3. Consensus 판정
const allPassed =
  criticResult.score >= 85 &&
  betaResult.engagement_score >= 75 &&
  genreResult.compliance_score >= 90;
```

## Ralph Loop 특징

- **불굴의 의지**: 전체 완성까지 자동 진행
- **품질 보장**: 각 막마다 품질 게이트 통과 확인
- **중단 불가**: Promise 태그로 진행 상황 추적
- **사용자 확인**: 막 단위로 사용자 승인 대기
