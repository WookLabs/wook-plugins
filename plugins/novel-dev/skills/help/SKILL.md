---
name: help
description: |
  novel-dev 플러그인 사용법과 전체 워크플로우를 보여줍니다.
  <example>도움말</example>
  <example>사용법</example>
  <example>/help</example>
  <example>워크플로우</example>
  <example>how to use</example>
user-invocable: true
---

# /help - Novel-Dev 도움말

novel-dev 플러그인의 사용법을 사용자 모드에 맞춰 점진적으로 표시합니다.

## 도움말 표시 로직

### Mode 감지
1. `.omc/state/novel-dev-prefs.json` 읽기
2. `mode` 값에 따라 표시 레벨 결정:
   - `simple` → Quick Start만 표시
   - `standard` → Quick Start + Standard Workflow 표시
   - `expert` 또는 파일 없음 → 전체 표시

### 플래그
- `--verbose` 또는 `--all`: 모든 기능 표시 (모드 무시)
- `--mode=simple|standard|expert`: 임시 모드 변경 (저장 안 함)

## 도움말 출력 구조

### Quick Start (항상 표시)
```
╔══════════════════════════════════════════╗
║   novel-dev 소설 창작 도우미             ║
╠══════════════════════════════════════════╣
║                                          ║
║   📖 5단계 퀵스타트                      ║
║                                          ║
║   1. /init        소설 기획              ║
║   2. /design      세계관·캐릭터·플롯     ║
║   3. /plot        회차별 플롯 생성       ║
║   4. /write-all   자동 집필              ║
║   5. /revise      퇴고                   ║
║                                          ║
║   처음이라면 /quickstart 을 실행하세요   ║
║                                          ║
╚══════════════════════════════════════════╝
```

### 현재 상태 표시 (프로젝트가 있을 때)
```
📍 현재 상태: Step 3/5 (플롯 생성 단계)
   다음 명령: /plot
```

프로젝트 상태 감지:
- `meta/project.json` 없음 → "프로젝트 없음. /init 으로 시작하세요"
- `meta/project.json` 있고 설계 미완 → "Step 2: /design"
- 설계 완료, 플롯 미생성 → "Step 3: /plot"
- 플롯 완료, 집필 미시작 → "Step 4: /write-all"
- 집필 완료 → "Step 5: /revise"

### Standard Workflow (standard, expert 모드에서 표시)
```
📋 Standard Workflow (17 커맨드)

  기획     /brainstorm → /blueprint-gen → /blueprint-review → /init
  설계     /design-style → /world → /character → /design-relationship
           /design-timeline → /main-arc → /sub-arc → /foreshadow → /hook
  집필     /plot → /write → /write-act → /write-all
  검토     /revise → /evaluate → /check
```

### Expert Skills (expert 모드 또는 --verbose에서 표시)
```
🔬 Expert Skills (40+)

  분석     /analyze · /deep-evaluate · /emotion-arc · /adversarial-review
  품질     /ai-slop-detector · /validate-genre · /check-retention
  도구     /multi-draft · /swarm · /wisdom · /resume
  통계     /stats · /status · /timeline · /analyze-engagement
```

### Footer (항상 표시)
```
💡 모드 변경: /help --mode=expert
   전체 표시: /help --verbose
   자동 집필: /novel-autopilot
```

## 출력 가이드라인

- Simple 모드: ~30줄 (Quick Start + 현재 상태 + Footer)
- Standard 모드: ~40줄 (+ Standard Workflow)
- Expert 모드: ~50줄 (+ Expert Skills)
- 깔끔하고 스캔 가능한 형식 유지
