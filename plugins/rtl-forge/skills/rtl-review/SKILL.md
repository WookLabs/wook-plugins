---
name: rtl-review
description: RTL 코드 리뷰. 신뢰도 점수 기반 분석, LSP/Slang 정적 분석, 듀얼 출력. "리뷰해", "검토해" 시 사용.
allowed-tools: Read, Task, Bash
---

# RTL Review

RTL 코드에 대한 종합적인 리뷰를 수행합니다.

## 사용 시점

- 새로운 RTL 모듈 검토
- 기존 코드 품질 분석
- MINOR 변경 사후 리뷰
- MAJOR/ARCHITECTURAL 변경 사전/사후 리뷰

---

## Confidence Scoring

모든 리뷰 항목에 신뢰도 점수 부여:

| 점수 | 의미 | 보고 여부 |
|------|------|----------|
| 90-100 | 도구 확인 (린트/시뮬) | ✓ 필수 보고 |
| 80-89 | 높은 확신 (패턴 매칭) | ✓ 보고 |
| 60-79 | 중간 확신 | ⚠️ 주의사항 포함 |
| < 60 | 낮은 확신 | ✗ 보고하지 않음 |

**규칙: 신뢰도 80 미만 결과는 리뷰 보고서에 포함하지 않는다.**

---

## 리뷰 워크플로우

### Step 0: 자동 정적 분석

```bash
# Verilator 린트
verilator --lint-only -Wall {file}.sv

# Slang 린트 + 파싱
slang --lint-only {file}.sv

# Verible 스타일 검사 (있으면)
verible-verilog-lint {file}.sv
```

### Step 1: 아키텍처 분석

```
rtl-architect 에이전트 호출 (opus):
- 마이크로아키텍처 검토
- 모듈 분할 적절성
- 인터페이스 설계 검토
```

### Step 2: Lint 검토

```
lint-reviewer 에이전트 호출 (haiku):
- 코딩 스타일 검사
- 합성 가능성 확인
- 시뮬레이션/합성 불일치 검출
```

### Step 3: CDC 분석 (해당 시)

```
cdc-analyst 에이전트 호출 (sonnet):
- 클럭 도메인 교차 식별
- 동기화 회로 검증
- 메타스테빌리티 위험 평가
```

### Step 4: 합성 검토

```
synthesis-advisor 에이전트 호출 (sonnet):
- 타이밍 경로 분석
- PPA 트레이드오프 검토
- 최적화 제안
```

---

## Dual Output Contract

### Markdown 보고서 (사용자용)

```markdown
# RTL Review Report

## 요약
- 검토 모듈: {module}
- 검토 일시: {date}
- 전체 평가: PASS / CONDITIONAL / FAIL

## 정적 분석 (신뢰도: 95)
- Verilator: {errors} errors, {warnings} warnings
- Slang: {status}

## 아키텍처 분석 (신뢰도: {score})
{findings with confidence >= 80 only}

## Lint 결과 (신뢰도: {score})
{findings with confidence >= 80 only}

## CDC 분석 (신뢰도: {score})
{findings with confidence >= 80 only}

## 합성 검토 (신뢰도: {score})
{findings with confidence >= 80 only}

## 권장 사항
{priority-ordered recommendations}
```

### JSON 요약 (자동화용)

```json
{
  "module": "{module}",
  "verdict": "PASS|CONDITIONAL|FAIL",
  "lint": {"verilator": {"errors": 0, "warnings": 2}, "slang": {"status": "clean"}},
  "findings": [
    {"category": "architecture", "severity": "INFO", "confidence": 85, "message": "..."},
    {"category": "cdc", "severity": "WARNING", "confidence": 92, "message": "..."}
  ],
  "recommendations": ["...", "..."]
}
```

---

## 에이전트 라우팅

| 분석 단계 | 에이전트 | 모델 |
|----------|---------|------|
| 아키텍처 | rtl-architect | opus |
| 린트 | lint-reviewer | haiku |
| CDC | cdc-analyst | sonnet |
| 합성 | synthesis-advisor | sonnet |

---

## 트리거 키워드

- "review this RTL", "RTL 검토해줘"
- "모듈 분석해줘", "코드 리뷰"
- "리뷰해", "검토해줘"

## 관련 스킬

- `sim-first-workflow`: 메인 워크플로우
- `verify-and-claim`: 검증 게이트
- `rtl-analyze`: Slang 기반 정밀 분석
