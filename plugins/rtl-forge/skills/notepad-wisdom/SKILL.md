---
name: notepad-wisdom
description: 설계 지식 캡처 시스템. 학습/결정/이슈/문제 기록. "기록해", "노트", "remember" 시 사용.
allowed-tools: Read, Write
---

# Notepad Wisdom

RTL 설계 지식을 캡처하고 축적하는 시스템.

## 핵심 원칙

**설계는 지식의 축적이다.**

- 모든 디버깅 세션은 학습 기회다
- 모든 아키텍처 결정은 문서화되어야 한다
- 모든 이슈는 미래의 참고 자료다
- 블로커는 기록되고 추적되어야 한다

## 지식 카테고리

### 1. Learnings (learnings.md)

기술적 발견과 패턴.

**기록 대상:**
- 모듈 동작 특성 발견
- 타이밍 관계 이해
- 프로토콜 세부사항
- 도구 사용법 발견

**예시:**
```
## 2026-01-24 14:30

### AXI4-Lite 응답 타이밍
- RVALID는 RREADY와 무관하게 assert 가능
- RREADY가 low여도 RVALID는 유지되어야 함
- Handshake는 둘 다 high일 때만 완료

이유: AXI4 스펙 A3.3.1 "Dependencies between channel handshake signals"
```

### 2. Decisions (decisions.md)

아키텍처 및 설계 결정.

**기록 대상:**
- 동기 vs 비동기 선택
- 파이프라인 깊이 결정
- 인터페이스 프로토콜 선택
- 클록 도메인 분할 결정

**예시:**
```
## 2026-01-24 15:00

### FIFO 깊이 결정: 16 entries

**선택**: 16-entry FIFO
**대안**: 8-entry or 32-entry

**근거**:
- Burst length: 최대 16 beats (AXI4)
- Latency: 평균 4 cycles (worst 8 cycles)
- Area: 16 entries = 512 FFs (acceptable)

**트레이드오프**:
- 8-entry: Area 절감, but overflow 위험
- 32-entry: Safer, but 2x area cost

**결론**: 16 entries가 성능/면적 최적점
```

### 3. Issues (issues.md)

알려진 이슈와 해결방법.

**기록 대상:**
- 도구 버그와 workaround
- 제한사항과 회피 방법
- 타이밍 위반 해결책
- 시뮬레이션 quirks

**예시:**
```
## 2026-01-24 16:00

### Vivado가 debug logic을 최적화 제거

**문제**:
- `(* mark_debug = "true" *)` 설정해도 ILA에서 신호 사라짐
- Synthesis 후 netlist에서 사라진 신호 확인됨

**원인**:
- Vivado가 사용되지 않는 로직으로 판단
- debug 속성이 synthesis constraints로 전달 안됨

**해결**:
```verilog
(* dont_touch = "true" *)
(* mark_debug = "true" *)
wire debug_signal;
```

**참고**: UG901 "dont_touch prevents optimization"
```

### 4. Problems (problems.md)

현재 블로커와 미해결 문제.

**기록 대상:**
- 디버깅 중인 버그
- 타이밍 클로저 실패
- 검증 실패 케이스
- 리소스 부족 문제

**예시:**
```
## 2026-01-24 17:00 [ACTIVE]

### Setup violation @ data_path/register_file

**증상**:
- WNS: -0.234 ns
- Critical path: mux_select → register_write
- Frequency: 목표 200MHz, 달성 185MHz

**시도한 것**:
- [x] Retiming: 효과 없음 (mux가 combinational)
- [x] Pipeline 추가: 레이턴시 증가로 스펙 위반
- [ ] Mux 분할: 시도 중

**다음 단계**:
1. Mux를 2-stage로 분할 (8:1 → 4:1 + 2:1)
2. One-hot encoding 고려
3. 필요시 클록 주파수 재협상

**임팩트**: HIGH - 테이프아웃 블로커
```

## 저장 위치

```
.omc/rtl-forge/notepads/{design-name}/
├── learnings.md      # 기술적 발견
├── decisions.md      # 아키텍처 결정
├── issues.md         # 알려진 이슈
└── problems.md       # 현재 블로커
```

## 타임스탬프 형식

모든 항목은 자동으로 타임스탬프가 추가됨:

```
## 2026-01-24 14:30

[내용]
```

Problems에는 상태 태그 추가:
- `[ACTIVE]` - 현재 작업 중
- `[BLOCKED]` - 외부 의존성 대기 중
- `[RESOLVED]` - 해결됨 (날짜와 함께)

## 사용법

### /note 커맨드

```bash
# 학습 내용 기록
/note learning "AXI4 RVALID는 RREADY와 무관하게 assert 가능"

# 결정 기록
/note decision "FIFO 깊이 16으로 결정 - burst length 고려"

# 이슈 기록
/note issue "Vivado가 mark_debug 신호를 최적화 제거. dont_touch 필요"

# 문제 기록
/note problem "Setup violation -0.234ns @ register_file. 타이밍 클로저 블로커"

# 현재 설계의 모든 노트 표시
/note show
```

### 자동 캡처 트리거

다음 키워드 감지 시 자동으로 notepad에 기록 제안:

- "기록해", "노트", "remember" → AskUserQuestion으로 카테고리 선택
- "왜 이렇게 했지?" → decisions.md 검색 후 표시
- "이 문제 전에도 봤는데" → issues.md 검색 후 표시
- "블로커" → problems.md에 자동 기록

## 설계별 격리

각 설계는 독립적인 notepad를 가짐:

```
.omc/rtl-forge/notepads/
├── axi_dma/
│   ├── learnings.md
│   ├── decisions.md
│   ├── issues.md
│   └── problems.md
├── pcie_controller/
│   ├── learnings.md
│   ├── decisions.md
│   ├── issues.md
│   └── problems.md
└── ...
```

현재 설계는 다음 중 하나로 결정:
1. 명시적 지정: `/note --design axi_dma learning "..."`
2. 현재 작업 디렉토리에서 추론
3. 사용자에게 질문

## 지식 활용

### 설계 시작 시

```bash
/note show
```

이전 학습/결정/이슈를 리뷰하여 같은 실수 방지.

### 디버깅 시

이슈 검색:
```bash
/note search "vivado"
/note search "setup violation"
```

### 설계 리뷰 시

Decisions 리뷰:
```bash
/note show decisions
```

모든 아키텍처 결정의 근거 확인.

### 문제 해결 후

Problems를 RESOLVED로 마크하고 해결 방법을 learnings로 이동:

```bash
/note resolve-problem "Setup violation" --solution "Mux를 2-stage로 분할"
```

자동으로:
1. problems.md에서 `[RESOLVED 2026-01-24]` 마크
2. 해결책을 learnings.md에 추가

## 금지 사항

1. 일회성 메모는 notepad에 기록하지 않음
   - "TODO: 나중에 테스트" ❌
   - "내일 Bob한테 물어보기" ❌

2. 코드 스니펫만 붙여넣기 금지
   - 맥락과 설명 필수

3. 타임스탬프 수동 편집 금지
   - 자동 생성 타임스탬프 사용

4. 카테고리 혼용 금지
   - Learning은 learnings.md에만
   - 여러 카테고리에 걸친 경우 가장 적합한 곳 선택

## 베스트 프랙티스

### 학습 기록

- **WHAT**: 무엇을 발견했는가
- **WHY**: 왜 그런가
- **REFERENCE**: 출처 (스펙 섹션, 문서 링크)

### 결정 기록

- **CONTEXT**: 어떤 상황에서 결정했는가
- **OPTIONS**: 어떤 대안들이 있었는가
- **RATIONALE**: 왜 이것을 선택했는가
- **TRADEOFFS**: 무엇을 포기했는가

### 이슈 기록

- **SYMPTOM**: 어떤 문제가 관찰되는가
- **CAUSE**: 근본 원인은 무엇인가
- **WORKAROUND**: 어떻게 해결하는가
- **REFERENCE**: 관련 버그 리포트/문서

### 문제 기록

- **STATUS**: [ACTIVE/BLOCKED/RESOLVED]
- **IMPACT**: 영향도 (LOW/MEDIUM/HIGH/CRITICAL)
- **TRIED**: 시도한 해결책들
- **NEXT**: 다음 시도할 것들
- **DEADLINE**: 해결 필요 시점 (있다면)

## 통합

Notepad Wisdom은 다른 RTL-Forge 스킬들과 통합됨:

- **rtl-change-protocol**: 승인된 변경의 근거를 decisions.md에 자동 기록
- **rtl-review**: 리뷰 중 발견한 이슈를 issues.md에 제안
- **timing-diagram**: 타이밍 분석 결과를 learnings.md에 기록

## 예외

없음. 모든 중요한 지식은 기록되어야 함.

**"기록하지 않은 지식은 사라진 지식이다."**
