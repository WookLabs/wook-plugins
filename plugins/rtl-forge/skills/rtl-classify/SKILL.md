---
name: rtl-classify
description: RTL 변경 분류 가이드. TRIVIAL/MINOR-MECHANICAL/MINOR-LOGIC/MAJOR/ARCHITECTURAL 5단계 분류 기준과 워크플로우 라우팅.
allowed-tools: Read, Bash
---

# RTL Change Classification

## 목적

RTL 변경의 규모와 위험도를 자동으로 분류하여 적절한 워크플로우로 라우팅합니다.

## 분류 체계

### TRIVIAL (직접 수정 가능)

**기준**:
- 헤더 파일만 수정 (.vh, .svh)
- 주석만 수정 (// 또는 /* */)
- 공백/포맷팅만 변경
- Lint 경고 수정 (Verilator/Slang warning resolution)
- 테스트벤치 파일 (tb_*.sv, *_tb.sv, test_*.sv)

**워크플로우**: Direct write → 자동 린트
**승인**: 불필요
**문서**: 불필요

### MINOR-MECHANICAL (기계적 수정)

**기준**:
- 신호 rename (find-references 포함)
- 파라미터 값 변경
- Wire/reg 비트폭 변경
- Localparam 추가
- 포트 순서 변경 (기능 불변)

**워크플로우**: Write → Lint → Simulate → 완료
**승인**: 사후 리뷰 (rtl-review)
**문서**: 커밋 메시지로 충분
**로직 추론**: 불필요 (Tier 0)

### MINOR-LOGIC (논리 변경)

**기준**:
- 단일 always 블록 버그 수정
- Combinational logic 수정
- 초기화 값 수정
- 단순 FSM 버그 수정 (상태 추가/삭제 없음)
- Off-by-one 오류 수정

**워크플로우**: Logic Quick Check → Write → Lint → Simulate → 완료
**승인**: 사후 리뷰 (rtl-review)
**문서**: 커밋 메시지 + 로직 메모
**로직 추론**: Tier 1 (Quick Check - 단일 에이전트 논리 검증)

### MAJOR (승인 필요)

**기준**:
- FSM 상태 추가/삭제
- 파이프라인 스테이지 변경
- 모듈 포트 추가/삭제
- 클럭/리셋 로직 변경
- 복수 always 블록 수정
- 인터페이스 타이밍 변경

**워크플로우**: /approve-change → Write → Lint → Simulate → Review → 변경 문서
**승인**: 사전 승인 (/approve-change)
**문서**: 변경 문서 (docs/changes/)
**로직 추론**: Tier 2 (Logic Ralplan - 3-agent swarm: Planner → Architect → Critic)

### ARCHITECTURAL (Ralplan 루프)

**기준**:
- 새 모듈 생성
- 모듈 삭제
- 클럭 도메인 크로싱 추가
- 톱레벨 인터페이스 변경
- 주요 계층 구조 변경
- 새 버스 프로토콜 도입

**워크플로우**: Ralplan Loop → Write → Lint → Simulate → Coverage → Full Review → 전체 문서
**승인**: 다단계 (Ralplan: Planner → Architect → Critic)
**문서**: 전체 스펙 + 타이밍 다이어그램
**로직 추론**: Tier 3 (Full Ralplan + 5-agent enhanced swarm)

---

## 자동 분류 로직

`scripts/classify-change.mjs`가 다음을 분석:

1. **파일 패턴**: 테스트벤치/헤더 → TRIVIAL
2. **변경 내용 분석**:
   - 주석만? → TRIVIAL
   - 공백만? → TRIVIAL
   - 신호 rename/파라미터 변경만? → MINOR-MECHANICAL
   - 로직 수정? → MINOR-LOGIC
   - 포트 변경? → MAJOR
   - FSM 패턴? → MAJOR
   - CDC 패턴? → ARCHITECTURAL
   - 모듈 선언? → ARCHITECTURAL
3. **신뢰도 점수**: 0-100, 80 미만이면 LLM 폴백 (change-classifier 에이전트)
4. **MINOR 세분화**: `subClassification` 필드로 MECHANICAL/LOGIC 구분

## LLM 폴백 분류

자동 분류기 신뢰도 < 80일 때:
- change-classifier 에이전트 (haiku) 호출
- 변경 diff + 파일 컨텍스트 전달
- LLM이 분류 + 근거 반환

---

## 분류별 요약 매트릭스

| | TRIVIAL | MINOR-MECHANICAL | MINOR-LOGIC | MAJOR | ARCHITECTURAL |
|---|---------|------------------|-------------|-------|---------------|
| 승인 | ✗ | 사후 | 사후 | 사전 | Ralplan |
| 린트 | ✓(자동) | ✓(자동) | ✓(자동) | ✓(자동) | ✓(자동) |
| 시뮬레이션 | ✗ | ✓ | ✓ | ✓ | ✓ |
| 커버리지 | ✗ | ✗ | ✗ | 선택 | ✓(필수) |
| 타이밍 다이어그램 | ✗ | ✗ | ✗ | 인터페이스 변경시 | ✓(필수) |
| 변경 문서 | ✗ | ✗ | ✗ | ✓ | ✓(전체) |
| 코드 리뷰 | ✗ | 선택 | 선택 | ✓ | ✓(다중) |
| 로직 추론 | ✗ | Tier 0 (불필요) | Tier 1 (Quick Check) | Tier 2 (Logic Ralplan) | Tier 3 (Full Ralplan) |
| 로직 메모 | ✗ | ✗ | ✓ | ✓ | ✓ |

## 트리거 키워드

- "변경 분류", "classify", "분류해줘"
- "이 변경 레벨이 뭐야?"

## 관련 스킬

- `sim-first-workflow`: 분류 후 실행되는 메인 워크플로우
- `verify-and-claim`: 결정론적 검증 게이트
