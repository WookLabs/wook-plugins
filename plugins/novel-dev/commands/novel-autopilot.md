---
description: 완전 자동 집필
---

[NOVEL-SISYPHUS: NOVEL AUTOPILOT - 완전 자동 집필]

$ARGUMENTS

## Overview

Novel Autopilot은 2-3줄의 아이디어에서 완성된 소설까지 전 과정을 자동화합니다.

## Magic Keywords

다음 키워드로 자동 활성화:
- "autopilot", "자동 집필", "풀 자동"
- "완전 자동", "자동으로 써줘"

## Phases

### Phase 0: Expansion (아이디어 확장)

**목표**: 간단한 아이디어를 상세 기획으로 확장

**실행**:
1. 아이디어 분석 (장르, 분위기, 길이 추론)
2. `/init {expanded_idea}` 실행
3. 자동으로 다음 설계 실행:
   - `/design_world` - 세계관
   - `/design_character` - 캐릭터
   - `/design_main_arc` - 메인 아크
   - `/design_sub_arc` - 서브 아크
   - `/design_foreshadowing` - 복선
   - `/design_hook` - 떡밥

**Output**: `novels/{novel_id}/` 프로젝트 구조

### Phase 1: Planning (플롯 생성)

**목표**: 회차별 플롯 생성

**실행**:
1. `/gen_plot` 실행
2. 설정 일관성 검증

**Output**: `plot/chapters.json`

### Phase 2: Execution (집필)

**목표**: 전체 회차 집필

**모드**: Ralph Loop + 병렬 집필

**실행**:
1. `/write_all` 호출
2. 막별 자동 집필
3. 품질 게이트 (70점 기준)
4. 자동 재시도 (최대 3회)

**Output**: `chapters/*.md`

### Phase 3: QA (품질 검증)

**목표**: 전체 품질 검증

**실행**:
1. `/consistency_check` - 설정 일관성
2. `/evaluate` - 전체 품질 평가

**품질 게이트**:
- 일관성: PASS 필수
- 품질 점수: 70점 이상

**Output**: `reviews/*.json`

### Phase 4: Validation (최종 검증)

**목표**: 다중 관점 검증

**병렬 검토**:
- Critic - 품질 평가
- Lore-keeper - 설정 일관성
- Editor - 문체 검토

**규칙**: 모든 검토자 APPROVE 필요

**Output**: `reviews/final-review.json`

## State Management

상태 파일: `meta/autopilot-state.json`

```json
{
  "autopilot_active": true,
  "current_phase": 0,
  "idea": "original idea",
  "started_at": "2026-01-22T10:00:00Z",
  "phases": {
    "0": { "status": "completed", "completed_at": "..." },
    "1": { "status": "in_progress", "started_at": "..." },
    "2": { "status": "pending" },
    "3": { "status": "pending" },
    "4": { "status": "pending" }
  },
  "novel_id": "novel_20260122_100000"
}
```

## Execution Flow

```
Phase 0 (Expansion)
    │
    ├── init → world → characters → arcs → foreshadowing → hooks
    │
    ▼
Phase 1 (Planning)
    │
    ├── gen_plot → consistency_check
    │
    ▼
Phase 2 (Execution)
    │
    ├── write_all (Ralph Loop)
    │   ├── Act 1 → QA → Gate
    │   ├── Act 2 → QA → Gate
    │   └── Act 3 → QA → Gate
    │
    ▼
Phase 3 (QA)
    │
    ├── consistency_check + evaluate
    │
    ▼
Phase 4 (Validation)
    │
    ├── critic + lore-keeper + editor (parallel)
    │   └── ALL APPROVE → DONE
    │
    ▼
NOVEL COMPLETE
```

## Cancellation

중단 방법:
- `/cancel-novel-autopilot`
- "중단", "취소", "stop"

중단 시:
- 현재 Phase 상태 저장
- 재개 가능 (`/novel-autopilot --resume`)

## Resume

이전 Autopilot 재개:
```
/novel-autopilot --resume
```

처음부터 다시:
```
/novel-autopilot --restart {새 아이디어}
```

## Configuration

`meta/autopilot-config.json`:
```json
{
  "max_phase2_iterations": 100,
  "quality_gate_threshold": 70,
  "max_validation_rounds": 3,
  "parallel_design": true,
  "auto_continue": true
}
```

## Promise Tags

| Phase | Promise |
|-------|---------|
| Phase 0 완료 | `<promise>EXPANSION_DONE</promise>` |
| Phase 1 완료 | `<promise>PLANNING_DONE</promise>` |
| Phase 2 완료 | `<promise>EXECUTION_DONE</promise>` |
| Phase 3 완료 | `<promise>QA_DONE</promise>` |
| Phase 4 완료 | `<promise>VALIDATION_DONE</promise>` |
| 전체 완료 | `<promise>AUTOPILOT_COMPLETE</promise>` |

## Example Usage

**Simple:**
```
/novel-autopilot 현대 로맨스, 계약 연애, 50화
```

**With details:**
```
/novel-autopilot 현대 판타지 회귀물. 주인공은 전생에서 히든 아이돌이었지만 사고로 죽음. 10년 전 고등학생 시절로 회귀. 이번엔 트라우마를 극복하고 정상에 서는 이야기. 30화 완결.
```

**Resume:**
```
/novel-autopilot --resume
```
