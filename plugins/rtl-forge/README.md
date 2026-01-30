# RTL-Forge v2.0

> Simulation-First Verilog/SystemVerilog RTL Design & Verification Plugin

## 핵심 철학

**Simulation-First: 코드 먼저, 검증 즉시, 문서는 필요할 때만**

| v1.x (Document-First) | v2.0 (Simulation-First) |
|----------------------|------------------------|
| 모든 변경에 문서 필수 | 분류별 차등 문서화 |
| 타이밍 다이어그램 필수 | MAJOR/ARCH만 필요 |
| 전체 승인 필수 | TRIVIAL/MINOR는 자유 |
| 모든 에이전트 Opus | 스마트 모델 라우팅 |
| Hash 기반 write guard | 분류 기반 write guard |

## 설치

```bash
# oh-my-claudecode 플러그인 매니저
node tools/plugin-manager/manager.mjs install ./plugins/rtl-forge
node tools/plugin-manager/manager.mjs enable rtl-forge

# 도구 감지 실행 (선택)
node plugins/rtl-forge/scripts/detect-tools.mjs
```

## 변경 분류

모든 RTL 변경은 자동으로 분류됩니다:

| Level | Examples | 승인 | 문서 |
|-------|----------|------|------|
| **TRIVIAL** | 주석, 공백, lint fix | 없음 | 없음 |
| **MINOR** | 버그 수정, 파라미터 변경 | 사후 리뷰 | 커밋 메시지 |
| **MAJOR** | FSM 변경, 포트 추가 | 사전 승인 | 변경 문서 |
| **ARCHITECTURAL** | 새 모듈, CDC 추가 | Ralplan | 전체 스펙 |

## 사용법

### 빠른 시작

```
"FIFO write pointer 버그 수정해줘"     → sim-first-workflow (MINOR)
"새 CDC bridge 모듈 추가해줘"           → arch-design (ARCHITECTURAL)
"이 모듈 리뷰해줘"                     → rtl-review
"시뮬레이션 실패 디버깅해줘"            → systematic-debugging
```

### 커맨드

```bash
/approve-change              # MAJOR/ARCH 변경 승인
/show-pending                # 대기 중인 변경 (분류 레벨 표시)
/rtl-review                  # RTL 코드 리뷰
/note learning "내용"        # 프로젝트 노트
```

## 에이전트 (12개)

| Agent | Model | 역할 |
|-------|-------|------|
| rtl-architect | opus | 아키텍처 분석, Ralplan |
| rtl-coder | sonnet | RTL 코드 작성/수정 |
| rtl-critic | opus | 리뷰, Ralplan Critic |
| verification-engineer | sonnet | UVM 테스트벤치 |
| verification-runner | sonnet | 시뮬레이션 실행 |
| assertion-writer | sonnet | SVA 어서션 |
| lint-reviewer | haiku | Lint, 코딩 스타일 |
| cdc-analyst | opus | CDC 분석 |
| synthesis-advisor | sonnet | 합성 조언 |
| coverage-analyst | haiku | 커버리지 분석 |
| doc-writer | haiku | 문서화 |
| change-classifier | haiku | LLM 분류 폴백 |

## 훅

| Hook | 트리거 | 설명 |
|------|--------|------|
| rtl-write-guard | PreToolUse | 분류 기반 쓰기 라우팅 |
| post-write-verify | PostToolUse | 자동 Verilator/Slang 린트 |
| auto-skill-trigger | UserPrompt | 키워드 기반 스킬 활성화 |

## 도구 지원

| 카테고리 | 도구 |
|----------|------|
| **린트** | Verilator, Slang, Verible |
| **시뮬레이션** | Questa, VCS, Xcelium |
| **분석** | Slang (AST, 계층, 심볼) |

`scripts/detect-tools.mjs`로 자동 감지 후 `.rtl-forge/tool-config.json`에 저장.

## 라이선스

MIT

## 저자

WookLabs
