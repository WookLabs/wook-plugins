# RTL-Forge v2.1 — Logic-First Edition

Verilog/SystemVerilog RTL Design & Verification Plugin

## 핵심 철학

**Logic-First: 사고 먼저, 코드 다음, 검증 즉시**

- **Dual Iron Law**:
  1. **사고 없이 코드 수정 금지** — Logic reasoning 없이 RTL 수정 불가 (MINOR-LOGIC 이상)
  2. **증거 없이 완료 주장 금지** — 시뮬레이션 결과가 증거다
- **5단계 분류**: TRIVIAL / MINOR-MECHANICAL / MINOR-LOGIC / MAJOR / ARCHITECTURAL
- **로직 추론 체계**: Tier 0~3, 변경 규모별 사고 깊이 자동 라우팅
- **스마트 모델 라우팅**: opus/sonnet/haiku 적재적소 배치
- **Enhanced Swarm**: 3~5 에이전트 병렬 분석 (선택적 확장)

---

## 에이전트 구성 (15개)

### Smart Model Routing

| Agent | Model | 역할 |
|-------|-------|------|
| `rtl-architect` | **opus** | Logic-First 사고 총괄, 마이크로아키텍처 분석, Ralplan Planner/Advisor, Swarm Integrator |
| `rtl-coder` | **sonnet** | RTL 코드 작성/수정 (Write/Edit 가능) |
| `rtl-critic` | **opus** | 변경 제안 검토, Ralplan Critic, 신뢰도 점수 |
| `verification-engineer` | **sonnet** | UVM 테스트벤치 분석, 커버리지 검토, Formal Verification 방법론 조언 |
| `verification-runner` | **sonnet** | 시뮬레이션 실행 (Questa/VCS/Xcelium) |
| `assertion-writer` | **sonnet** | SVA/PSL 어서션 작성 및 분석 |
| `lint-reviewer` | **haiku** | 코딩 스타일, 합성 가능성 검사 |
| `cdc-analyst` | **sonnet** | CDC 분석, 메타스테빌리티 검토, Swarm 참여 |
| `synthesis-advisor` | **sonnet** | PPA 트레이드오프, PI/PD 전력 설계, RTL 최적화 패턴, Swarm 참여 |
| `coverage-analyst` | **haiku** | 코드/기능/어서션 커버리지 분석 |
| `doc-writer` | **haiku** | 문서화 (변경 문서, 스펙) |
| `change-classifier` | **haiku** | LLM 폴백 변경 분류 |
| `rdc-analyst` | **sonnet** | RDC(Reset Domain Crossing) 분석, 리셋 트리 토폴로지 |
| `timing-analyst` | **sonnet** | STA/SDC 타이밍 분석, setup/hold 위반, MCMM |
| `dft-advisor` | **haiku** | DFT 체크리스트, 스캔 체인/BIST/JTAG readiness |

**모델 분포**: opus 2, sonnet 8, haiku 5 (~65% 토큰 절감)

---

## 변경 분류 시스템 (5단계)

| Level | Examples | Logic Tier | Workflow | Approval |
|-------|----------|-----------|----------|----------|
| **TRIVIAL** | 주석, 공백, lint fix, TB | Tier 0 (없음) | Direct write | 없음 |
| **MINOR-MECHANICAL** | 신호 rename, 파라미터 값, 폭 변경 | Tier 0 (없음) | Write + Lint + Sim | 사후 리뷰 |
| **MINOR-LOGIC** | always 블록 버그 수정, 초기화 수정 | Tier 1 (Quick Check) | Logic Check → Write + Verify | 사후 리뷰 |
| **MAJOR** | FSM 변경, 포트 추가, 파이프라인 | Tier 2 (Logic Ralplan) | Swarm → Approve → Write → Verify | 사전 승인 |
| **ARCHITECTURAL** | 새 모듈, CDC 추가, 구조 변경 | Tier 3 (Full Ralplan) | Enhanced Swarm → Ralplan → Full Verify | 다단계 |

---

## 로직 추론 체계

| Tier | 이름 | 에이전트 | 대상 | 출력 |
|------|------|---------|------|------|
| 0 | None | — | TRIVIAL, MINOR-MECHANICAL | — |
| 1 | Quick Check | rtl-architect (inline) | MINOR-LOGIC | Logic Memo (간략) |
| 2 | Logic Ralplan | 3-agent swarm | MAJOR | Logic Memo (상세) |
| 2-S | Enhanced Swarm | 5-agent swarm (선택적) | MAJOR (복잡) | Logic Memo (종합) |
| 3 | Full Ralplan | Ralplan + 5-agent swarm | ARCHITECTURAL | Logic Memo + 설계 스펙 |

### Swarm 구성

- **기본 3-agent**: rtl-architect + cdc-analyst + synthesis-advisor
- **확장 +2 (선택적)**: +rdc-analyst (multi-power domain), +timing-analyst (timing-critical path)
- **Note**: dft-advisor는 swarm 미참여 (체크리스트 기반, 실시간 설계 분석 아님)

---

## 전문 영역

### CDC (Clock Domain Crossing)
- **담당**: cdc-analyst (sonnet)
- **분석**: 클럭 도메인 경계, 동기화기 검증, 메타스테빌리티 MTBF

### RDC (Reset Domain Crossing)
- **담당**: rdc-analyst (sonnet)
- **분석**: 리셋 도메인 교차, async reset de-assertion 동기화, reset tree topology

### STA/Timing (Static Timing Analysis)
- **담당**: timing-analyst (sonnet)
- **분석**: SDC 제약 생성/검증, setup/hold 위반, MCMM, false/multi-cycle path

### PI/PD (Power Intent / Power Domain)
- **담당**: synthesis-advisor (sonnet, 확장)
- **분석**: UPF/CPF 해석, IR drop, isolation/retention/level-shifter, power sequencing

### RTL Optimization
- **담당**: synthesis-advisor (sonnet, 확장)
- **분석**: resource sharing, pipeline balancing, FSM encoding, memory inference, retiming

### DFT (Design for Test)
- **담당**: dft-advisor (haiku)
- **분석**: 스캔 체인 readiness, BIST 패턴, JTAG boundary scan, DFT 규칙 위반

### Formal Verification
- **담당**: verification-engineer (sonnet, 확장)
- **분석**: property checking, equivalence checking, verification method selection

---

## 스킬 (11개)

| Skill | 설명 | 용도 |
|-------|------|------|
| `sim-first-workflow` | **핵심** Logic-First 워크플로우 | RTL 변경 메인 흐름 |
| `logic-reasoning` | **NEW** 로직 사고 프로세스 (Tier 0~3) | 코드 수정 전 사고 |
| `rtl-classify` | 5단계 변경 분류 가이드 | TRIVIAL~ARCHITECTURAL 분류 |
| `verify-and-claim` | 결정론적 검증 게이트 (Dual Iron Law) | 증거 기반 완료 주장 |
| `arch-design` | 아키텍처 설계 (ARCHITECTURAL 전용) | 새 모듈, 구조 변경 |
| `rtl-review` | RTL 코드 리뷰 (신뢰도 점수) | 종합 리뷰 |
| `systematic-debugging` | 4단계 체계적 디버깅 | 시뮬 실패 분석 |
| `rtl-analyze` | Slang/Verilator 기반 정밀 분석 | 신호 추적, 계층 분석 |
| `rtl-init` | 프로젝트 초기화 | CLAUDE.md 생성 |
| `timing-diagram` | ASCII 타이밍 다이어그램 | MAJOR/ARCHITECTURAL용 |
| `notepad-wisdom` | 프로젝트 지식 관리 | 노트패드 |

---

## 커맨드 (4개)

| Command | 설명 |
|---------|------|
| `/approve-change` | MAJOR/ARCHITECTURAL 변경 승인 |
| `/show-pending` | 대기 중인 변경 (분류 레벨 표시) |
| `/rtl-review` | RTL 코드 리뷰 트리거 |
| `/note` | 프로젝트 노트패드 기록 |

---

## 훅 (3개)

| Hook | Trigger | 설명 |
|------|---------|------|
| `rtl-write-guard` | PreToolUse (Edit/Write) | 5단계 분류 기반 RTL 쓰기 라우팅 (MINOR-LOGIC 시 로직 추론 안내) |
| `post-write-verify` | PostToolUse (Edit/Write) | 자동 린트 (Verilator/Slang) |
| `auto-skill-trigger` | UserPromptSubmit | 키워드 기반 스킬 활성화 |

---

## 워크플로우 예시

### MINOR-LOGIC: 버그 수정

```
사용자: "FIFO write pointer 초기화 버그 수정해줘"

1. write-guard가 자동 분류: MINOR-LOGIC
2. 🧠 Logic Quick Check (Tier 1):
   - rtl-architect가 Q&A 형식으로 원인/해법 추론
   - Logic Memo 생성
3. rtl-coder (sonnet)가 코드 수정
4. post-write-verify가 자동 린트 실행
5. verification-runner (sonnet)가 시뮬레이션
6. verify-and-claim: Logic Memo ✓ + 린트 0 errors + 시뮬 PASS → 완료
```

### MAJOR: FSM 상태 추가

```
사용자: "AXI arbiter FSM에 RETRY 상태 추가해줘"

1. write-guard가 자동 분류: MAJOR
2. 🧠 Logic Ralplan (Tier 2):
   - 3-agent swarm 병렬 분석:
     - rtl-architect: 구조적 영향 분석
     - cdc-analyst: CDC 경계 영향 확인
     - synthesis-advisor: PPA 트레이드오프 평가
   - Logic Memo 생성 (종합)
3. 사용자 승인 (/approve-change)
4. rtl-coder (sonnet): RTL 작성
5. 자동 린트 + 시뮬레이션
6. verify-and-claim: Logic Memo ✓ + 전체 검증 통과 → 완료
```

### ARCHITECTURAL: 새 모듈

```
사용자: "CDC bridge 모듈을 추가해줘"

1. write-guard가 자동 분류: ARCHITECTURAL
2. arch-design 스킬 활성화
3. 🧠 Full Ralplan (Tier 3):
   - Enhanced 5-agent swarm:
     - rtl-architect + cdc-analyst + synthesis-advisor
     - + rdc-analyst (multi-power) + timing-analyst (timing-critical)
   - Ralplan 루프:
     - rtl-architect (opus): 설계 계획 + Logic Memo
     - rtl-critic (opus): 계획 리뷰 → OKAY
4. 사용자 승인 (/approve-change)
5. rtl-coder (sonnet): RTL 작성
6. 자동 린트 + 시뮬레이션 + 커버리지
7. rtl-review: 전체 리뷰
8. verify-and-claim: Logic Memo ✓ + 모든 검증 통과 → 완료
```

---

## 디렉토리 구조

```
rtl-forge/
├── .claude-plugin/
│   └── plugin.json
├── agents/                      # 15개 에이전트 (opus 2, sonnet 8, haiku 5)
│   ├── rtl-architect.md         # Logic-First 총괄 + Swarm Integrator
│   ├── rtl-coder.md
│   ├── rtl-critic.md
│   ├── verification-engineer.md # + Formal Verification
│   ├── verification-runner.md
│   ├── assertion-writer.md
│   ├── lint-reviewer.md
│   ├── cdc-analyst.md           # sonnet (v2.0: opus → sonnet)
│   ├── synthesis-advisor.md     # + PI/PD, RTL Optimization
│   ├── coverage-analyst.md
│   ├── doc-writer.md
│   ├── change-classifier.md
│   ├── rdc-analyst.md           # NEW v2.1
│   ├── timing-analyst.md        # NEW v2.1
│   └── dft-advisor.md           # NEW v2.1
├── commands/                    # 4개
│   ├── approve-change.md
│   ├── show-pending.md
│   ├── rtl-review.md
│   └── note.md
├── skills/                      # 12개 (v2.0: 11 → 12, +logic-reasoning)
│   ├── sim-first-workflow/      # Logic-First 철학으로 재작성
│   ├── logic-reasoning/         # NEW v2.1
│   ├── rtl-classify/            # 5단계 분류
│   ├── verify-and-claim/        # Dual Iron Law
│   ├── arch-design/             # Enhanced Swarm 연동
│   ├── rtl-review/
│   ├── systematic-debugging/
│   ├── rtl-analyze/
│   ├── rtl-init/
│   ├── timing-diagram/
│   └── notepad-wisdom/
├── hooks/
│   ├── hooks.json
│   ├── rtl-write-guard.mjs      # MINOR-LOGIC/MECHANICAL 분기
│   ├── post-write-verify.mjs
│   └── auto-skill-trigger.mjs
├── scripts/
│   ├── classify-change.mjs      # subClassification 필드 추가
│   ├── detect-tools.mjs
│   ├── approve-change.mjs
│   ├── show-pending.mjs
│   └── note.mjs
├── schemas/
│   ├── change-classification.schema.json
│   └── tool-config.schema.json
├── AGENTS.md
└── README.md
```

---

## For AI Agents

### 핵심 규칙

1. **Dual Iron Law 준수** — 사고 없이 코드 수정 금지 + 증거 없이 완료 주장 금지
2. **5단계 분류 준수** — write-guard가 자동 분류, 분류에 맞는 워크플로우 실행
3. **로직 추론 필수** — MINOR-LOGIC 이상은 logic-reasoning 스킬 선행
4. **스마트 모델 라우팅** — opus/sonnet/haiku 에이전트별 지정 모델 사용
5. **코딩 스타일 준수** — docs/CODING_STYLE.md 참조
6. **신뢰도 80 이상만 보고** — 낮은 확신 결과는 보고하지 않음

### 에이전트 호출 패턴

```javascript
// RTL 분석 + Logic-First 사고 (opus)
Task(subagent_type="rtl-forge:rtl-architect", model="opus", ...)

// RTL 수정 (sonnet - 직접 Write/Edit 가능)
Task(subagent_type="rtl-forge:rtl-coder", model="sonnet", ...)

// 린트 검사 (haiku)
Task(subagent_type="rtl-forge:lint-reviewer", model="haiku", ...)

// 시뮬레이션 실행 (sonnet)
Task(subagent_type="rtl-forge:verification-runner", model="sonnet", ...)

// 변경 리뷰 (opus)
Task(subagent_type="rtl-forge:rtl-critic", model="opus", ...)

// CDC 분석 (sonnet)
Task(subagent_type="rtl-forge:cdc-analyst", model="sonnet", ...)

// RDC 분석 (sonnet) — NEW v2.1
Task(subagent_type="rtl-forge:rdc-analyst", model="sonnet", ...)

// 타이밍 분석 (sonnet) — NEW v2.1
Task(subagent_type="rtl-forge:timing-analyst", model="sonnet", ...)

// DFT 체크리스트 (haiku) — NEW v2.1
Task(subagent_type="rtl-forge:dft-advisor", model="haiku", ...)
```
