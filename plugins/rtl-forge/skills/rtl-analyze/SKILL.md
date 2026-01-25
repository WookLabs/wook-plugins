---
name: rtl-analyze
description: Slang 기반 RTL 정밀 분석. 신호 추적, 계층 분석, 심볼 검색.
allowed-tools: Read, Bash
---

# RTL Analyze (Slang 기반 정밀 분석)

## 핵심 기능

Slang의 정확한 SystemVerilog 파싱을 활용하여 RTL 코드를 분석합니다.

| 분석 유형 | 설명 | 활용 |
|----------|------|------|
| **신호 추적** | 신호의 driver/load 찾기 | "이 신호 어디서 오는지" |
| **계층 분석** | 모듈 인스턴스 트리 | 전체 구조 파악 |
| **심볼 검색** | 모든 신호/모듈/파라미터 | 정의 위치 찾기 |
| **포트 매핑** | 모듈 연결 관계 | 인터페이스 분석 |
| **타입 정보** | 신호 폭/타입 | 비트 폭 확인 |

---

## Slang 명령어 레퍼런스

### 1. 심볼 덤프 (가장 많이 사용)

```bash
# 모든 심볼 목록
slang --dump-symbols {file}.sv

# 특정 탑 모듈 지정
slang --top {module_name} --dump-symbols {file}.sv

# 여러 파일
slang --dump-symbols file1.sv file2.sv pkg.sv
```

**출력 예시:**
```
module top
  wire [7:0] data_in
  wire [7:0] data_out
  reg [3:0] state
  instance u_fifo (fifo)
    wire [7:0] din
    wire [7:0] dout
```

### 2. AST JSON 출력 (상세 분석용)

```bash
# AST를 JSON으로 출력
slang --ast-json {file}.sv -o ast.json

# 파이프로 직접 파싱
slang --ast-json {file}.sv | jq '.members'
```

**JSON 구조:**
```json
{
  "kind": "CompilationUnit",
  "members": [
    {
      "kind": "ModuleDeclaration",
      "name": "fifo",
      "members": [
        {"kind": "Port", "name": "clk", "direction": "In"},
        {"kind": "Port", "name": "data", "direction": "InOut", "width": 8}
      ]
    }
  ]
}
```

### 3. 계층 덤프

```bash
# 모듈 인스턴스 계층
slang --dump-hierarchy {file}.sv

# 특정 탑 모듈
slang --top soc_top --dump-hierarchy *.sv
```

**출력 예시:**
```
soc_top
├── u_cpu (cpu_core)
│   ├── u_alu (alu)
│   └── u_regfile (register_file)
├── u_bus (axi_bus)
└── u_mem (memory_ctrl)
```

### 4. 린트 (문법/스타일 검사)

```bash
# 린트만 실행
slang --lint-only {file}.sv

# 경고 레벨 조정
slang --lint-only -Wextra {file}.sv
slang --lint-only -Wno-unused {file}.sv
```

### 5. 전처리 결과

```bash
# 매크로 확장 후 코드
slang -E {file}.sv

# include 경로 지정
slang -I./include -E {file}.sv
```

### 6. 정의 검색

```bash
# 특정 심볼 찾기 (grep과 조합)
slang --dump-symbols {file}.sv | grep "data_valid"

# JSON에서 특정 심볼 (jq 사용)
slang --ast-json {file}.sv | jq '.. | select(.name? == "data_valid")'
```

---

## 활용 시나리오

### 시나리오 1: 신호 추적

```
질문: "data_valid 신호가 어디서 구동되는지 찾아줘"

분석 절차:
1. slang --dump-symbols로 심볼 위치 확인
2. slang --ast-json으로 assignment 분석
3. driver 모듈/라인 특정
```

```bash
# 1단계: 심볼 존재 확인
slang --dump-symbols design.sv | grep data_valid

# 2단계: AST에서 assignment 찾기
slang --ast-json design.sv | jq '.. | select(.kind? == "Assignment") | select(.left?.name? == "data_valid")'
```

### 시나리오 2: 모듈 계층 파악

```
질문: "전체 디자인 구조 보여줘"

분석 절차:
1. slang --dump-hierarchy로 트리 출력
2. 주요 서브모듈 식별
3. 인터페이스 연결 분석
```

```bash
slang --top chip_top --dump-hierarchy rtl/*.sv
```

### 시나리오 3: 포트 정보 추출

```
질문: "fifo 모듈의 포트 목록 알려줘"

분석 절차:
1. slang --ast-json으로 모듈 파싱
2. Port kind 필터링
```

```bash
slang --ast-json fifo.sv | jq '.members[] | select(.kind == "ModuleDeclaration") | .members[] | select(.kind == "Port")'
```

### 시나리오 4: 파라미터 값 확인

```
질문: "DATA_WIDTH 파라미터가 어디서 어떻게 설정되는지"

분석 절차:
1. 파라미터 정의 위치 찾기
2. 인스턴스별 오버라이드 확인
```

```bash
slang --dump-symbols design.sv | grep -i "parameter.*DATA_WIDTH"
```

### 시나리오 5: CDC 경계 식별

```
질문: "클럭 도메인 크로싱 포인트 찾아줘"

분석 절차:
1. 모든 클럭 신호 식별
2. 각 레지스터의 클럭 연결 분석
3. 다른 클럭 도메인 간 신호 추적
```

```bash
# 클럭 신호 찾기
slang --dump-symbols design.sv | grep -E "clk|clock"

# 플롭의 클럭 연결 분석 (AST)
slang --ast-json design.sv | jq '.. | select(.kind? == "ProceduralBlock")'
```

---

## Include/Define 처리

```bash
# Include 경로
slang -I./rtl -I./include {file}.sv

# Define 전달
slang -DSIMULATION -DDATA_WIDTH=32 {file}.sv

# 파일 리스트 사용
slang -f filelist.f
```

**filelist.f 예시:**
```
+incdir+./include
+define+SIMULATION
./rtl/top.sv
./rtl/fifo.sv
./rtl/ctrl.sv
```

---

## 에러 처리

### 파싱 에러 시

```bash
# 상세 에러 메시지
slang --color-diagnostics {file}.sv

# 에러 위치 표시
slang --error-limit=10 {file}.sv
```

### 미지원 구문 우회

```bash
# 특정 경고 무시
slang -Wno-unknown-pragma {file}.sv

# 느슨한 파싱 모드
slang --compat vcs {file}.sv
```

---

## 트리거 키워드

- "신호 추적", "신호 찾아", "어디서 구동"
- "계층 분석", "구조 보여줘", "모듈 트리"
- "심볼 검색", "정의 찾아", "포트 목록"
- "slang 분석", "AST 분석"

---

## 관련 스킬

- **rtl-review**: 종합 리뷰 (slang 린트 포함)
- **systematic-debugging**: 디버깅 시 신호 추적 활용
- **spec-driven-design**: 스펙 대비 포트 검증

---

## 출력 템플릿

### 신호 추적 결과

```markdown
## 신호 추적: {signal_name}

### 정의 위치
- 파일: {file}:{line}
- 타입: {type} [{width}]
- 모듈: {module_name}

### Driver (구동원)
| 위치 | 조건 | 값 |
|------|------|-----|
| {file}:{line} | {condition} | {expression} |

### Load (사용처)
| 위치 | 용도 |
|------|------|
| {file}:{line} | {usage} |

### 계층 경로
{hierarchy_path}
```

### 계층 분석 결과

```markdown
## 모듈 계층: {top_module}

### 인스턴스 트리
```
{hierarchy_tree}
```

### 모듈별 요약
| 모듈 | 인스턴스 수 | 역할 |
|------|------------|------|
| {module} | {count} | {description} |
```
