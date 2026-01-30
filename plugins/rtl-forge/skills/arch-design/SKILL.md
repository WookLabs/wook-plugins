---
name: arch-design
description: 아키텍처 설계 워크플로우. ARCHITECTURAL 변경 전용. Ralplan 루프, 스펙 문서, 타이밍 다이어그램. "설계하자", "새 모듈", "아키텍처" 시 사용.
allowed-tools: Read, Write, Edit, Task, AskUserQuestion
---

# Architecture Design (아키텍처 설계)

## 사용 시점

ARCHITECTURAL 레벨 변경에만 적용:
- 새 모듈 생성
- 모듈 삭제
- 클럭 도메인 크로싱 추가
- 톱레벨 인터페이스 변경
- 주요 계층 구조 변경
- 새 버스 프로토콜 도입

> **참고**: TRIVIAL/MINOR/MAJOR 변경은 `sim-first-workflow`를 사용합니다.
> 이 스킬은 ARCHITECTURAL 변경 전용입니다.

---

## Ralplan 통합

ARCHITECTURAL 변경은 Ralplan 루프를 통해 합의를 도출합니다:

```
┌─────────────────────────────────────────┐
│           ARCHITECTURAL FLOW            │
│                                         │
│  1. rtl-architect (Planner)             │
│     → 설계 계획 수립                     │
│     → 스펙 문서 초안 작성                │
│                                         │
│  2. rtl-architect (Advisor)             │
│     → 아키텍처 검증                      │
│     → 기존 코드와의 호환성 분석          │
│                                         │
│  1.5. Enhanced Swarm Analysis           │
│     → 5-agent 병렬 분석 (선택적 확장)    │
│     → rtl-architect + cdc-analyst       │
│       + synthesis-advisor               │
│       + rdc-analyst (if multi-power)    │
│       + timing-analyst (if timing-critical)│
│                                         │
│  3. rtl-critic (Critic)                 │
│     → 계획 리뷰                          │
│     → OKAY / REJECT 판정               │
│                                         │
│  REJECT → 피드백 반영 → 1번 재시작      │
│  OKAY → 구현 진행                       │
└─────────────────────────────────────────┘
```

---

## 워크플로우

### Phase 1: 요구사항 수집

AskUserQuestion으로 수집:

1. **기본 정보**
   - 모듈/블록 이름
   - 목적과 주요 기능
   - 성능 요구사항 (주파수, 스루풋, 레이턴시)

2. **인터페이스**
   - 입출력 포트 개요
   - 프로토콜 (AXI, AHB, custom)
   - 클럭/리셋 요구사항

3. **제약 사항**
   - 면적 제약
   - 전력 제약
   - 기존 모듈과의 호환성

### Phase 2: Ralplan 루프

rtl-architect와 rtl-critic 에이전트를 활용하여 설계 계획 합의:

**Planner (rtl-architect)**:
- 아키텍처 스펙 초안 작성
- 인터페이스 스펙 작성
- 마이크로아키텍처 스펙 작성
- 타이밍 다이어그램 생성

**Advisor (rtl-architect)**:
- 기존 코드베이스 분석
- 호환성 검증
- 최적화 제안

**Critic (rtl-critic)**:
- 완전성 검증
- 실현 가능성 평가
- 위험 요소 식별

**Logic Memo Output**:
Ralplan 루프 완료 후 Logic Memo 자동 생성:
- 설계 결정 근거 (Q&A 형식)
- 아키텍처 트레이드오프 분석 결과
- Swarm 분석 요약 (각 에이전트별)

### Phase 2.5: 전문 영역 분석

ARCHITECTURAL 변경의 영향 범위에 따라 선택적으로 전문 에이전트 분석 수행:

| 조건 | 에이전트 | 분석 내용 |
|------|---------|----------|
| Multi-power domain | rdc-analyst | 리셋 도메인 교차 검증 |
| Timing-critical path | timing-analyst | STA 관점 설계 검증 |
| DFT 요구사항 존재 | dft-advisor | 스캔 체인, BIST 체크리스트 |

### Phase 3: 스펙 문서 생성

합의된 계획을 기반으로 문서 생성:

| 문서 | 위치 | 내용 |
|------|------|------|
| 아키텍처 스펙 | `docs/{module}-arch.md` | 블록 다이어그램, 서브모듈, 클럭/리셋 |
| 인터페이스 스펙 | `docs/{module}-interface.md` | 포트 목록, 프로토콜, 타이밍 |
| 마이크로아키텍처 | `docs/{module}-uarch.md` | FSM, 데이터패스, 파이프라인 |

### Phase 4: 사용자 승인

다단계 승인:
1. 아키텍처 스펙 리뷰 → `/approve-change`
2. 인터페이스 스펙 리뷰
3. 최종 승인

### Phase 5: RTL 구현

승인된 스펙 기반으로 구현:
1. RTL 코드 작성 (rtl-coder, sonnet)
2. 린트 검증 (자동, Verilator/Slang)
3. 시뮬레이션 (Questa/VCS/Xcelium)
4. 커버리지 수집 (필수)
5. 전체 리뷰 (rtl-review)

### Phase 6: Verify-and-Claim

구현 완료 전 필수 검증:
- 린트: 0 errors
- 시뮬레이션: all tests PASS
- 커버리지: Line ≥95%, Branch ≥90%, FSM = 100%
- 어서션: 0 failures

---

## 스펙 문서 템플릿

### 아키텍처 스펙

```markdown
# {MODULE} 아키텍처 스펙

## 상태: DRAFT | APPROVED

## 개요
- 목적: {purpose}
- 주요 기능: {features}

## 블록 다이어그램
{ASCII block diagram}

## 서브모듈
| 모듈명 | 역할 | 모델 레벨 |
|--------|------|----------|

## 클럭 도메인
| 클럭 | 주파수 | 용도 |
|------|--------|------|

## 리셋 전략
- 극성: {polarity}
- 방식: {async/sync}
```

### 인터페이스 스펙

```markdown
# {MODULE} 인터페이스 스펙

## 상태: DRAFT | APPROVED

## 포트 목록
| 이름 | 방향 | 폭 | 설명 |
|------|------|-----|------|

## 타이밍 다이어그램
{ASCII timing diagram - timing-diagram 스킬 활용}

## 프로토콜
- 핸드셰이크: {rules}
- 에러 처리: {strategy}
```

---

## Dual Output Contract

### Markdown (사용자용)
완전한 스펙 문서 세트

### JSON (자동화용)
```json
{
  "module": "{name}",
  "classification": "ARCHITECTURAL",
  "ralplan_iterations": 2,
  "verdict": "OKAY",
  "specs": {
    "arch": "docs/{module}-arch.md",
    "interface": "docs/{module}-interface.md",
    "uarch": "docs/{module}-uarch.md"
  },
  "status": "APPROVED"
}
```

---

## 에이전트 라우팅

| 역할 | 에이전트 | 모델 |
|------|---------|------|
| 설계 계획 | rtl-architect | opus |
| 코드 작성 | rtl-coder | sonnet |
| 리뷰 | rtl-critic | opus |
| 린트 | lint-reviewer | haiku |
| 검증 | verification-runner | sonnet |
| 문서 | doc-writer | haiku |
| RDC 분석 | rdc-analyst | sonnet |
| 타이밍 분석 | timing-analyst | sonnet |
| DFT 체크리스트 | dft-advisor | haiku |

---

## 트리거 키워드

- "설계하자", "새 모듈"
- "아키텍처", "architecture"
- "인터페이스 정의"
- "블록 설계"
- "톱레벨 변경"

## 관련 스킬

- `sim-first-workflow`: 구현 단계의 메인 워크플로우
- `rtl-classify`: 변경이 ARCHITECTURAL인지 확인
- `verify-and-claim`: 구현 후 검증
- `timing-diagram`: 타이밍 다이어그램 생성
- `rtl-review`: 코드 리뷰
- `logic-reasoning`: 로직 추론 (Tier 3 Full Ralplan 연동)
