---
name: rtl-review
description: RTL 코드 리뷰 및 스펙 대비 검증. LSP 기반 정적 분석 지원.
allowed-tools: Read, Task, Bash
---

# RTL Review

RTL 코드에 대한 종합적인 리뷰를 수행합니다.

## 사용 시점

- 새로운 RTL 모듈 검토
- 기존 코드 품질 분석
- **스펙 문서 대비 구현 검증**
- 시뮬레이션 전 최종 검토

---

## LSP 기반 정적 분석

### Verilog/SystemVerilog LSP 활용

| 기능 | 활용 | LSP 서버 |
|------|------|----------|
| **실시간 문법 검사** | 코드 작성 중 오류 즉시 감지 | svls, veridian, svlangserver |
| **정의로 이동** | 모듈/신호 정의 빠른 탐색 | 모든 LSP |
| **참조 찾기** | 신호 사용처 추적 | svls, veridian |
| **호버 정보** | 신호 타입/폭 확인 | 모든 LSP |
| **린트 통합** | Verilator/Slang 기반 실시간 린트 | veridian (Slang), svls |

### 추천 LSP 서버

```yaml
# 1. svls (Rust 기반, 빠름)
# https://github.com/dalance/svls
cargo install svls

# 2. veridian (Slang 기반, 정확한 파싱)
# https://github.com/vivekmalneedi/veridian
# Slang: https://github.com/MikePopoloski/slang

# 3. svlangserver (verible 기반)
# https://github.com/imc-trading/svlangserver
npm install -g @imc-trading/svlangserver
```

### LSP 설정 예시 (VS Code)
```json
{
  "verilog.linting.linter": "verilator",
  "verilog.languageServer.svls.enabled": true,
  "systemverilog.includeIndexing": ["**/*.sv", "**/*.svh"],
  "systemverilog.launchConfiguration": "veridian"
}
```

### CLI 기반 정적 분석

```bash
# Verilator Lint (빠른 린트)
verilator --lint-only -Wall {file}.sv

# Slang (정확한 SystemVerilog 파싱)
slang --lint-only {file}.sv

# Verible (Google, 스타일 검사)
verible-verilog-lint {file}.sv
verible-verilog-format {file}.sv  # 포맷팅
```

---

## 워크플로우

### 0. LSP/정적 분석 (자동)

```
LSP 또는 CLI 린트 도구 실행:
- 문법 오류 검출
- 타입 불일치 경고
- 미사용 신호 감지
- 코딩 스타일 위반
```

### 1. 스펙 대비 검증 🆕

```
스펙 문서와 RTL 대조:
- docs/{module}-interface.md 포트 목록 vs RTL 포트
- docs/{module}-uarch.md FSM 상태 vs RTL FSM
- 타이밍 다이어그램 vs 실제 동작
```

### 2. 아키텍처 분석

```
rtl-architect 에이전트 호출:
- 마이크로아키텍처 검토
- 모듈 분할 적절성
- 인터페이스 설계 검토
```

### 3. Lint 검토

```
lint-reviewer 에이전트 호출:
- 코딩 스타일 검사 (docs/CODING_STYLE.md 참조)
- 합성 가능성 확인
- 시뮬레이션/합성 불일치 검출
```

### 3.1 코딩 스타일 체크리스트

**docs/CODING_STYLE.md 기준으로 검사:**

| 항목 | 체크 |
|------|------|
| 2-space 들여쓰기 | [ ] |
| always 블록당 1개 변수 | [ ] |
| if-else 세로정렬 (2의 배수 컬럼) | [ ] |
| 포트 선언 세로정렬 | [ ] |
| 신호 선언 세로정렬 | [ ] |
| 비트 연산자 사용 (`\|` `&`) | [ ] |
| 네이밍 규칙 (i_, o_, r_, w_) | [ ] |

### 3. CDC 분석

```
cdc-analyst 에이전트 호출:
- 클럭 도메인 교차 식별
- 동기화 회로 검증
- 메타스테빌리티 위험 평가
```

### 4. 합성 검토

```
synthesis-advisor 에이전트 호출:
- 타이밍 경로 분석
- PPA 트레이드오프 검토
- 최적화 제안
```

## 출력 형식

```markdown
# RTL Review Report

## 요약
- 검토 모듈: [모듈명]
- 검토 일시: [날짜]
- 전체 평가: [PASS/CONDITIONAL/FAIL]

## 아키텍처 분석
[rtl-architect 결과]

## Lint 결과
[lint-reviewer 결과]

## CDC 분석
[cdc-analyst 결과]

## 합성 검토
[synthesis-advisor 결과]

## 권장 사항
[우선순위별 정리]

## 타이밍 다이어그램
[주요 인터페이스 타이밍]
```

## 자동 트리거

다음 패턴에서 자동 활성화:
- "review this RTL"
- "RTL 검토해줘"
- "모듈 분석해줘"
