---
name: 16-write-all
description: Ralph Loop으로 1화부터 완결까지 전체 자동 집필
user-invocable: true
---

# /write-all - Ralph Loop 전체 자동 집필

> **Note**: 이 문서의 코드 블록은 AI 오케스트레이터를 위한 실행 패턴 명세입니다. 실행 가능한 TypeScript/JavaScript 코드가 아닙니다.

완성까지 멈추지 않는 자동 집필 시스템입니다.

## Quick Start
```bash
/write-all          # 1화부터 끝까지 자동 집필
/write-all --resume # 중단된 지점부터 재개
/write-all --restart # 처음부터 다시 시작
```

## Writer Mode

`meta/project.json`의 `writer_mode`에 따라 집필 엔진이 결정됩니다:
- `"grok"`: 모든 회차를 Grok API로 생성 (성인소설 모드)
- `"hybrid"`: (deprecated) 성인 키워드 감지 시 Grok, 나머지 Claude. **성인소설은 `"grok"` 권장**
- `"claude"`: 기본 — Claude novelist 에이전트로 생성

> Grok 모드에서도 품질 검증(critic, beta-reader, genre-validator)과 퇴고(editor)는 **Claude가 수행**합니다.

## Masterpiece Mode

강화된 품질 보증 시스템:
- **Multi-Validator**: critic, beta-reader, genre-validator (3개 동시 검증)
- **Quality Threshold**: 85점 (일반) / 90점 (1화)
- **Circuit Breaker**: 동일 실패 3회 시 사용자 개입

### Quality Gates

| Validator | Regular | Chapter 1 | Role |
|-----------|---------|-----------|------|
| critic | ≥85 | ≥90 | Overall quality (100pt scale) |
| beta-reader | ≥80 | ≥85 | Engagement & retention |
| genre-validator | ≥95 | ≥97 | Genre compliance |

**All validators must pass** for chapter to proceed.

### Chapter 1 Special Requirements
- Strong hook in first paragraph
- Protagonist uniqueness within 3 paragraphs
- Promise of payoff within 3-5 chapters
- Predicted retention ≥75%

## Key Features

### Persistence
- Promise tag system (`<promise>CHAPTER_N_DONE</promise>`)
- Automatic checkpointing after each chapter
- Session recovery with full state restoration

### Quality Assurance
- Parallel validator execution (3x faster)
- Diagnostic-driven revision loop
- Circuit breaker for infinite loop prevention

### Session Management
- Auto-save every chapter completion
- 3 most recent backups maintained
- Resume from any checkpoint

## Documentation

**Detailed Guide**: See `references/detailed-guide.md`
- Ralph loop architecture
- Multi-validator system details
- Circuit breaker pattern
- Session recovery system
- Promise tag mechanics

**Usage Examples**: See `examples/example-usage.md`
- Full novel writing workflows
- Session recovery scenarios
- Quality gate examples
- Circuit breaker activation
- Act completion flow

## Phase 0: 비용 경고 (Cost Warning)

실행 전 사용자에게 비용을 안내합니다:

> **전체 집필 비용 안내**
> 대상: N화 집필 (사용자 지정 범위)
> 회차당: novelist(opus) + 검증 에이전트(sonnet)
>
> 예상 토큰 사용량: 회차당 ~80K 입력 + ~20K 출력
> 총 예상: N × 100K 토큰

**Grok 모드 추가 비용:**
> Grok API 비용: 회차당 ~$0.10-0.20
> 검증은 Claude가 수행하므로 검증 비용은 동일

AskUserQuestion으로 사용자 확인:
- "전체 진행" — 모든 회차 연속 집필
- "1막만" — 첫 번째 막만 집필
- "5화만 시범" — 5화만 먼저 작성 후 품질 확인

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
        # writer_mode에 따라 분기
        if writer_mode == "grok":
            assemble_context(chapter)   # assemble-grok-prompt.mjs
            grok_write(chapter)          # grok-writer.mjs
            save_chapter(chapter)
        elif writer_mode == "hybrid" and has_adult_keywords(chapter):
            assemble_context(chapter)
            grok_write(chapter)
            save_chapter(chapter)
        else:
            /write {chapter}             # Claude novelist

        # 공통 사후 처리
        generate_summary(chapter)
        update_state(chapter)

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
   - beta-reader >= 80점 (engagement)
   - genre-validator >= 95점 (compliance)

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

```spec
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
  betaResult.engagement_score >= 80 &&
  genreResult.compliance_score >= 95;
```

### Using verify-chapter Command

**RECOMMENDED**: Use the new `/verify-chapter` command for streamlined parallel validation:

```bash
# After writing a chapter
/write 5

# Run parallel verification
/verify-chapter 5
```

The `/verify-chapter` command automatically:
- Launches all 3 validators in parallel
- Applies confidence filtering (≥75)
- Enforces quality thresholds (critic ≥85, beta-reader ≥80, genre-validator ≥95)
- Returns structured verdict with scores and high-confidence issues
- Saves results to `reviews/verifications/chapter_${N}_verification.json`

**Integration Pattern**:
```
for each chapter:
  /write {N}
  verification = /verify-chapter {N}

  if verification.verdict == "PASS":
    <promise>CHAPTER_{N}_DONE</promise>
    continue

  if verification.verdict == "FAIL":
    diagnostic = generate_diagnostic(verification.high_confidence_issues)
    /revise {N} with diagnostic
    verification = /verify-chapter {N}  # retry

    if still failing after 3 retries:
      # Circuit Breaker
      ask_user(action)
```

## Ralph Loop 특징

- **불굴의 의지**: 전체 완성까지 자동 진행
- **품질 보장**: 각 막마다 품질 게이트 통과 확인
- **중단 불가**: Promise 태그로 진행 상황 추적
- **사용자 확인**: 막 단위로 사용자 승인 대기
