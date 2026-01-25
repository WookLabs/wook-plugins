# RTL-Forge

Verilog/SystemVerilog RTL Design & Verification Plugin

## 핵심 철학

**Iron Law: RTL은 승인된 문서를 구현한다. 문서 없이 RTL 없다.**

- 문서 기반 설계: 스펙 → 리뷰 → 승인 → RTL
- 모든 신호 변경은 물리적 타이밍에 영향을 준다
- 변경에는 반드시 명분과 이유가 필요하다
- 타이밍 다이어그램 없이 변경 불가
- 사용자 승인 없이 RTL 수정 불가
- 시뮬레이션은 Questa/VCS/Xcelium, 합성/STA는 AI 범위 밖

## 에이전트 구성

모든 에이전트는 **Opus** 모델 사용 (RTL은 대충할 부분이 없음)

### READ-ONLY 에이전트 (8개)

| Agent | 역할 |
|-------|------|
| `rtl-architect` | 마이크로아키텍처 분석, 모듈 분할, 인터페이스 설계 |
| `verification-engineer` | UVM 테스트벤치 분석, 커버리지 검토 |
| `assertion-writer` | SVA/PSL 어서션 분석, 프로토콜 검증 |
| `lint-reviewer` | 코딩 스타일, 합성 가능성, sim/synth 불일치 |
| `cdc-analyst` | CDC 분석, 메타스테빌리티 검토 |
| `synthesis-advisor` | 타이밍 경로 분석, PPA 트레이드오프 |
| `coverage-analyst` | 코드/기능/어서션 커버리지 분석 |
| `rtl-critic` | 변경 제안 검토, 비판적 분석 |

### PROPOSE-ONLY 에이전트 (1개)

| Agent | 역할 |
|-------|------|
| `rtl-coder` | RTL 코드 작성 제안 (직접 수정 불가, 사용자 승인 필요) |

### DOCS-ONLY 에이전트 (1개)

| Agent | 역할 |
|-------|------|
| `doc-writer` | 마이크로아키텍처 문서, 인터페이스 명세 작성 |

## RTL 변경 프로토콜

모든 RTL 변경은 다음 절차를 **반드시** 거쳐야 함:

```
1. 변경 이유 (REASON)
   - 무엇이 문제인가?
   - 왜 이 변경이 필요한가?
   - 명분은 무엇인가?

2. BEFORE 타이밍 다이어그램
   - 현재 동작을 사이클 단위로 시각화

3. AFTER 타이밍 다이어그램
   - 변경 후 예상 동작 시각화

4. 영향 분석 (IMPACT)
   - 직접 영향받는 모듈
   - 타이밍 영향
   - 검증 필요 항목

5. 사용자 승인 (APPROVAL)
   - /approve-change 또는 /reject-change
```

## 스킬

| Skill | 설명 |
|-------|------|
| `spec-driven-design` | 문서 기반 설계 워크플로우 (스펙 → 리뷰 → 승인 → RTL) |
| `rtl-change-protocol` | RTL 변경 승인 프로토콜 (문서 기반) |
| `timing-diagram` | ASCII 타이밍 다이어그램 생성 가이드 |
| `rtl-review` | RTL 코드 리뷰, LSP 정적 분석, 스펙 대비 검증 |
| `notepad-wisdom` | 프로젝트 지식 관리 및 노트패드 활용 |
| `verification-sim` | 시뮬레이션 기반 검증 (Questa/VCS/Xcelium) |
| `systematic-debugging` | 시뮬레이터 기반 체계적 디버깅 프로토콜 |
| `rtl-analyze` | Slang 기반 RTL 정밀 분석 (신호 추적, 계층 분석) |
| `rtl-init` | RTL 프로젝트 초기화 (CLAUDE.md 생성) |

## 커맨드

| Command | 설명 |
|---------|------|
| `/approve-spec` | 스펙 문서 승인 |
| `/reject-spec --reason "이유"` | 스펙 문서 거부 |
| `/approve-change` | RTL 변경 승인 |
| `/reject-change --reason "이유"` | RTL 변경 거부 |
| `/show-pending` | 대기 중인 스펙/변경 목록 |
| `/note` | 프로젝트 노트패드에 기록 |

## 훅

| Hook | Trigger | 설명 |
|------|---------|------|
| `rtl-write-guard` | PreToolUse (Edit, Write) | RTL 파일 무단 수정 차단 |
| `auto-skill-trigger` | UserPromptSubmit | 키워드 기반 자동 스킬 활성화 (한글/영어) |

## 워크플로우 예시

### RTL 코드 수정 요청

```
사용자: "FIFO에 backpressure 처리를 추가해줘"

1. rtl-architect가 현재 FIFO 분석
2. rtl-coder가 변경 제안 작성
   - 변경 이유
   - BEFORE 타이밍 다이어그램
   - AFTER 타이밍 다이어그램
   - 영향 분석
3. rtl-critic이 제안 검토
4. 사용자에게 승인 요청
5. /approve-change 후 수정 실행
```

### RTL 코드 리뷰

```
사용자: "이 모듈 리뷰해줘"

1. rtl-architect: 아키텍처 분석
2. lint-reviewer: Lint 검사
3. cdc-analyst: CDC 분석
4. synthesis-advisor: 합성 검토
5. 종합 리뷰 리포트 생성
```

## 디렉토리 구조

```
rtl-forge/
├── .claude-plugin/
│   └── plugin.json              # 플러그인 매니페스트
├── agents/                      # 10개 Opus 에이전트
│   ├── rtl-architect.json
│   ├── rtl-coder.json
│   ├── verification-engineer.json
│   ├── assertion-writer.json
│   ├── lint-reviewer.json
│   ├── cdc-analyst.json
│   ├── synthesis-advisor.json
│   ├── coverage-analyst.json
│   ├── rtl-critic.json
│   └── doc-writer.json
├── commands/                    # 6개 커맨드
│   ├── approve-spec.mjs
│   ├── reject-spec.mjs
│   ├── approve-change.mjs
│   ├── reject-change.mjs
│   ├── show-pending.mjs
│   └── note.mjs
├── skills/                      # 9개 스킬
│   ├── spec-driven-design/
│   ├── rtl-change-protocol/
│   ├── timing-diagram/
│   ├── rtl-review/
│   ├── notepad-wisdom/
│   ├── verification-sim/
│   ├── systematic-debugging/
│   ├── rtl-analyze/
│   └── rtl-init/
├── hooks/                       # 2개 훅
│   ├── rtl-write-guard.mjs
│   └── auto-skill-trigger.mjs
├── schemas/                     # JSON 스키마
│   ├── phase-contract.schema.json
│   ├── rtl-analysis-output.schema.json
│   ├── testbench-gen-output.schema.json
│   ├── simulation-output.schema.json
│   └── coverage-output.schema.json
├── docs/
│   ├── SKILLS.md                # 스킬 상세 문서
│   └── CODING_STYLE.md          # RTL 코딩 스타일 가이드
├── AGENTS.md                    # 이 파일
└── README.md
```

## 코딩 스타일

**참조: docs/CODING_STYLE.md**

| 규칙 | 설명 |
|------|------|
| Indent | 2-space |
| Always block | 한 변수만 할당 |
| If-else | One-liner + 세로정렬 |
| 정렬 컬럼 | 2의 배수로 올림 |
| Operators | `\|` `&` 비트연산자 |
| Prefix | `i_` `o_` `r_` `w_` |

## For AI Agents

### 핵심 규칙

1. **RTL 파일 직접 수정 금지** - 반드시 rtl-change-protocol 사용
2. **타이밍 다이어그램 필수** - 모든 분석/제안에 포함
3. **사용자 승인 필수** - /approve-change 없이 수정 불가
4. **모든 분석은 Opus** - haiku/sonnet 사용 금지
5. **코딩 스타일 준수** - docs/CODING_STYLE.md 참조

### 에이전트 호출 패턴

```javascript
// RTL 분석 시
Task(subagent_type="rtl-forge:rtl-architect", model="opus", ...)

// RTL 수정 제안 시
Task(subagent_type="rtl-forge:rtl-coder", model="opus", ...)
// → 반드시 rtl-change-protocol 따라야 함

// 변경 검토 시
Task(subagent_type="rtl-forge:rtl-critic", model="opus", ...)
```

### 금지 사항

- ❌ rtl-coder가 직접 RTL 파일 수정
- ❌ 타이밍 다이어그램 없이 변경 제안
- ❌ 이유/명분 없이 변경 제안
- ❌ 사용자 승인 건너뛰기
- ❌ haiku/sonnet 모델 사용

### 허용 사항

- ✅ READ-ONLY 에이전트의 분석 및 제안
- ✅ doc-writer의 문서 파일 작성
- ✅ rtl-change-protocol을 통한 승인된 변경
