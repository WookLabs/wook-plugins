---
name: logic-reasoning
description: 로직 사고 프로세스 스킬. RTL 변경 전 로직 추론을 수행하고 Q&A 형태의 로직 메모를 생성한다. 4-Tier 사고 체계와 스웜 분석을 지원.
allowed-tools: Read, Grep, Glob
triggers:
  - "로직 분석"
  - "왜 이렇게"
  - "logic reasoning"
  - "사고 과정"
  - "스웜 분석"
  - "다관점 분석"
related-skills:
  - sim-first-workflow
  - rtl-classify
  - verify-and-claim
  - arch-design
---

# Logic Reasoning Skill

## 핵심 철학

> **"사고 없이 코드 수정 금지"** — RTL Iron Law #1

RTL 변경은 소프트웨어 변경과 근본적으로 다르다. 하드웨어 로직은 한 번 실리콘에 구워지면 수정이 불가능하며, 단 하나의 로직 오류가 칩 전체를 무용화할 수 있다. 따라서 **코드를 수정하기 전에 반드시 로직에 대한 깊은 사고**가 선행되어야 한다.

이 스킬은 변경 분류(TRIVIAL/MINOR-MECHANICAL/MINOR-LOGIC/MAJOR/ARCHITECTURAL)에 따라 적절한 깊이의 로직 사고를 수행하고, Q&A 형태의 "로직 메모"로 사고 과정을 기록한다.

---

## Logic Reasoning Tiers

변경 레벨별 "로직 사고 깊이"를 차별화한다.

### Tier 0: No Logic Check (TRIVIAL, MINOR-MECHANICAL)

로직 사고가 필요 없는 변경. 바로 코드 수정 후 린트.

- **TRIVIAL**: 주석, 공백 등 로직 무관 변경
- **MINOR-MECHANICAL**: 인스턴스 연결, 네이밍, 포맷팅, 와이어 연결, 다듬기 등 기계적 작업

```
수정 요청 접수 -> 분류: TRIVIAL 또는 MINOR-MECHANICAL
    |
    v
rtl-coder 코드 수정 -> 린트 -> Done
```

**출력**: 로직 메모 없음

### Tier 1: Quick Logic Check (MINOR-LOGIC용)

```
수정 요청 접수 -> 분류: MINOR-LOGIC
    |
    v
[rtl-architect (sonnet)] 경량 로직 분석
    - Q: 이 변경의 의도는?
    - Q: 영향 받는 신호/블록은?
    - Q: 잠재적 부작용은?
    |
    v
로직 메모 생성 (.omc/rtl-forge/logic-memos/{file}-{timestamp}.md)
    |
    v
rtl-coder 코드 수정 -> 린트
```

**에이전트**: rtl-architect (sonnet)
**출력**: 3-5개 Q&A의 경량 로직 메모

### Tier 2: Logic Ralplan (MAJOR용 - 기본 경로)

```
수정 요청 접수 -> 분류: MAJOR
    |
    v
[rtl-architect (opus)] 로직 분석 + 설계 제안
    - Q: 이 변경의 의도는?
    - Q: 영향 받는 신호/블록은?
    - Q: 부작용과 회귀 위험은?
    - Q: 최적 구현 전략은?
    - Q: 대안적 접근법은?
    |
    v
[rtl-critic (opus)] 로직 분석 리뷰
    - 분석의 완전성 평가
    - 놓친 부작용 지적
    - OKAY / REVISE 판정
    |
    v (REVISE면 rtl-architect 재분석)
로직 메모 생성 (상세 Q&A + Critic 피드백)
    |
    v
사용자 승인 (/approve-change)
    |
    v
rtl-coder 코드 수정 -> 린트 -> 시뮬
```

**에이전트**: rtl-architect (opus) + rtl-critic (opus)
**출력**: 5-10개 Q&A + Critic 리뷰의 표준 로직 메모

### Tier 2-S: Enhanced Swarm Analysis (MAJOR용 - 스웜 경로)

MAJOR 변경에서 다관점 분석이 필요할 때 사용하는 멀티 에이전트 스웜 패턴. 최대 5개의 전문 에이전트가 **병렬로** 각자의 관점에서 로직을 분석한다.

```
수정 요청 접수 -> 분류: MAJOR (스웜 분석 트리거)
    |
    v
스웜 에이전트 선택 (문맥 기반)
    |
    v
┌─────────────────────────────────────────────────────┐
│  병렬 스웜 분석 (최대 5 에이전트, 선택적 활성화)          │
│                                                       │
│  [rtl-architect (opus)]    아키텍처 관점 분석          │  << 항상 활성화
│    - 모듈 간 인터페이스 영향                            │
│    - 계층 구조 정합성                                   │
│    - 설계 패턴 준수 여부                                │
│    - 타이밍 인식 설계 가이던스                            │
│                                                       │
│  [cdc-analyst (sonnet)]    CDC 관점 분석               │  << 클럭 도메인 관련 시
│    - 클럭 도메인 교차 영향                              │
│    - 동기화 요구사항                                    │
│    - 메타스태빌리티 우려                                │
│                                                       │
│  [rdc-analyst (sonnet)]    RDC 관점 분석               │  << 리셋 관련 변경 시
│    - 리셋 도메인 교차 영향                              │
│    - Async reset de-assertion 동기화                   │
│    - Reset tree topology / release ordering           │
│                                                       │
│  [synthesis-advisor (sonnet)]  합성/PI/PD/최적화 관점  │  << 합성/구조 변경 시
│    - 합성 가능성, 타이밍 영향                            │
│    - PI/PD 영향 (전력 도메인, IR drop)                  │
│    - RTL 최적화 기회                                    │
│                                                       │
│  [timing-analyst (sonnet)]  타이밍/STA 관점            │  << 타이밍 크리티컬 시
│    - STA 영향 예측                                     │
│    - SDC 제약 영향                                     │
│    - Setup/hold 위반 위험                              │
└─────────────────────────────────────────────────────┘
    |
    v (N개 분석 결과 수집)
[rtl-architect (opus)] 분석 통합 + 종합 판단
    |
    v
[rtl-critic (opus)] 종합 분석 리뷰 -> OKAY / REVISE
    |
    v
로직 메모 생성 (멀티 관점 Q&A + 통합 판단 + Critic 피드백)
    |
    v
사용자 승인 (/approve-change) -> rtl-coder 수정 -> 린트 -> 시뮬
```

**에이전트**: rtl-architect(opus) + cdc-analyst(sonnet) + rdc-analyst(sonnet) + synthesis-advisor(sonnet) + timing-analyst(sonnet) + rtl-critic(opus)
**출력**: 관점별 분석 + 통합 판단 + Critic 리뷰의 종합 로직 메모

> **Note**: `dft-advisor`는 스웜 분석에 의도적으로 제외. DFT는 체크리스트 기반 리뷰(haiku) 수준이며, 실시간 스웜 분석의 깊이와 맞지 않음. DFT 리뷰는 코드 수정 완료 후 별도로 호출.

### Tier 3: Full Ralplan (ARCHITECTURAL용)

기존 v2.0의 ARCHITECTURAL 플로우를 유지. 추가로 로직 메모가 스펙 문서와 함께 생성됨.

---

## 스웜 에이전트 선택적 활성화 규칙

스웜 분석 시 모든 에이전트를 항상 활성화하지 않는다. 변경의 문맥에 따라 필요한 에이전트만 선택적으로 활성화한다.

| 조건 | 활성화 에이전트 | 최소/최대 |
|------|----------------|----------|
| 모든 MAJOR 스웜 | rtl-architect (항상) | 1 |
| 클럭 도메인 교차 영향 | + cdc-analyst | 2 |
| 리셋 신호/도메인 관련 변경 | + rdc-analyst | 2-3 |
| 합성/구조적 변경 | + synthesis-advisor | 2-3 |
| 타이밍 크리티컬 경로 영향 | + timing-analyst | 2-3 |
| 다클럭 + 합성 + 타이밍 (복합) | 전체 5개 | 5 |
| 사용자 명시적 전체 스웜 요청 | 전체 5개 | 5 |

**기본 스웜 (하위 호환)**: rtl-architect + cdc-analyst + synthesis-advisor (기존 3개)
**풀 스웜**: rtl-architect + cdc-analyst + rdc-analyst + synthesis-advisor + timing-analyst (5개)

### 스웜 트리거 조건

MAJOR 중에서 스웜 분석을 사용하는 경우:
- 다수 클럭 도메인에 걸친 변경
- 합성에 영향을 줄 수 있는 구조적 변경
- 3개 이상 모듈에 영향을 미치는 변경
- 리셋 신호/도메인에 관련된 변경
- 타이밍 크리티컬 경로에 영향을 미치는 변경
- 사용자가 명시적으로 스웜 분석을 요청한 경우
- 기본값: MAJOR는 스웜 분석을 기본 경로로 사용 (단순한 MAJOR는 Tier 2 Logic Ralplan으로 대체 가능)

---

## 에이전트 라우팅 테이블

| Tier | 에이전트 | 모델 | 용도 |
|------|----------|------|------|
| Tier 0 | (없음) | - | TRIVIAL, MINOR-MECHANICAL |
| Tier 1 (Quick) | rtl-architect | sonnet | MINOR-LOGIC 경량 분석 |
| Tier 2 (Standard) | rtl-architect + rtl-critic | opus + opus | MAJOR 표준 분석 |
| Tier 2-S (Swarm) | rtl-architect + cdc-analyst + rdc-analyst + synthesis-advisor + timing-analyst + rtl-critic | opus + sonnet×4 + opus | MAJOR 다관점 병렬 분석 |
| Tier 3 (Full) | 기존 ralplan | opus | ARCHITECTURAL 풀 합의 |

---

## 로직 메모 형식

로직 메모는 형식적 문서가 아닌 **"사고의 흔적"**이다.

### 파일 위치

`.omc/rtl-forge/logic-memos/{source-file-stem}-{YYYYMMDD-HHmm}.md`

### 단일 에이전트 형식 (Tier 1, 2)

```markdown
# Logic Memo: {변경 요약}

- **File**: {파일 경로}
- **Classification**: {MINOR-LOGIC|MAJOR|ARCHITECTURAL}
- **Date**: {timestamp}
- **Analyst**: rtl-architect

---

## 1. 변경 의도 (Why)

**Q: 이 변경은 왜 필요한가?**
A: {분석 결과}

## 2. 영향 분석 (What)

**Q: 어떤 신호/블록이 영향을 받는가?**
A: {영향 받는 요소 목록과 이유}

## 3. 부작용 분석 (Side Effects)

**Q: 이 변경으로 인한 잠재적 부작용은?**
A: {부작용 분석}

## 4. 구현 전략 (How) [MAJOR 이상]

**Q: 최적 구현 전략은?**
A: {구현 방안}

## 5. 대안 분석 (Alternatives) [MAJOR 이상]

**Q: 대안적 접근법은?**
A: {대안과 트레이드오프}

## 6. Critic 피드백 [MAJOR 이상]

**Verdict**: {OKAY|REVISE}
**Feedback**: {rtl-critic의 피드백}

---

## 결론

{변경 진행 여부와 주의사항 요약}
```

### 스웜 분석 형식 (Tier 2-S)

```markdown
# Logic Memo (Swarm Analysis): {변경 요약}

- **File**: {파일 경로}
- **Classification**: MAJOR (Swarm)
- **Date**: {timestamp}
- **Analysts**: {활성화된 에이전트 목록}
- **Swarm Config**: {기본 3 / 풀 5 / 선택적 N}

---

## [Architecture] 아키텍처 관점
**Analyst**: rtl-architect (opus)

**Q: 모듈 간 인터페이스에 미치는 영향은?**
A: {분석 결과}

**Q: 설계 패턴/계층 구조 정합성은?**
A: {분석 결과}

**Q: 타이밍 인식 설계 관점에서 우려 사항은?**
A: {분석 결과}

---

## [CDC] 클럭 도메인 교차 관점 (조건부)
**Analyst**: cdc-analyst (sonnet)

**Q: CDC 영향이 있는가?**
A: {분석 결과}

**Q: 동기화 요구사항은?**
A: {분석 결과}

---

## [RDC] 리셋 도메인 교차 관점 (조건부)
**Analyst**: rdc-analyst (sonnet)

**Q: 리셋 도메인 교차가 있는가?**
A: {분석 결과}

**Q: Async reset de-assertion 동기화가 필요한가?**
A: {분석 결과}

**Q: Reset tree topology / release ordering 영향은?**
A: {분석 결과}

---

## [Synthesis + PI/PD] 합성/전력 관점 (조건부)
**Analyst**: synthesis-advisor (sonnet)

**Q: 합성 가능성에 영향이 있는가?**
A: {분석 결과}

**Q: 타이밍/리소스 영향은?**
A: {분석 결과}

**Q: 전력 도메인(UPF/CPF) 영향은?**
A: {분석 결과}

**Q: RTL 최적화 기회가 있는가?**
A: {분석 결과}

---

## [Timing/STA] 타이밍 분석 관점 (조건부)
**Analyst**: timing-analyst (sonnet)

**Q: STA에 미치는 영향은?**
A: {분석 결과}

**Q: SDC 제약 업데이트가 필요한가?**
A: {분석 결과}

**Q: Setup/hold 위반 위험은?**
A: {분석 결과}

---

## 통합 판단
**Integrator**: rtl-architect (opus)

{N개 관점의 종합 분석, 충돌 해결, 최종 권고}

---

## Critic 피드백
**Verdict**: {OKAY|REVISE}
**Feedback**: {rtl-critic의 피드백}

---

## 결론

{변경 진행 여부와 주의사항 요약}
```

---

## Dual Output Contract

모든 로직 메모는 두 가지 형태로 출력된다:

1. **마크다운 로직 메모**: `.omc/rtl-forge/logic-memos/{file}-{timestamp}.md` — 사람이 읽는 Q&A 형태
2. **JSON 요약**: `.omc/rtl-forge/logic-memos/{file}-{timestamp}.json` — 자동화 연동용

### JSON 요약 형식

```json
{
  "file": "{파일 경로}",
  "classification": "MINOR-LOGIC|MAJOR|ARCHITECTURAL",
  "tier": "1|2|2S|3",
  "timestamp": "{ISO timestamp}",
  "analyst": "rtl-architect",
  "swarm_config": null | { "agents": ["rtl-architect", "cdc-analyst", ...], "type": "default|full|selective" },
  "questions": [
    { "category": "why", "question": "이 변경은 왜 필요한가?", "answer": "..." },
    { "category": "what", "question": "영향 받는 신호/블록은?", "answer": "..." }
  ],
  "critic_verdict": null | "OKAY" | "REVISE",
  "conclusion": "변경 진행 권고/보류 권고",
  "memo_path": ".omc/rtl-forge/logic-memos/{file}-{timestamp}.md"
}
```
