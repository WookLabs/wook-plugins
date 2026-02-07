---
description: "novel-dev 전체 워크플로우 및 사용법 안내"
---

[NOVEL-DEV HELP]

## 🎯 Quick Start

```bash
# 1. 아이디어 브레인스토밍 (선택)
/brainstorm "재벌 3세와 계약 연애하는 로맨스"

# 2. 블루프린트 생성
/blueprint-gen "재벌 3세와 계약 연애하는 로맨스"

# 3. 블루프린트 검토 및 개선
/blueprint-review

# 4. 프로젝트 초기화
/init

# 5. 이후 단계별 진행...
```

## 📋 전체 워크플로우 (23단계: 0-22)

```
┌─────────────────────────────────────────────────────────────┐
│                    🎨 기획 단계 (Planning)                    │
├─────────────────────────────────────────────────────────────┤
│  00. /brainstorm       아이디어 소크라틱 대화 정제 (선택)     │
│  01. /blueprint-gen    아이디어 → BLUEPRINT.md 생성          │
│  02. /blueprint-review BLUEPRINT.md 검토 및 개선             │
│  03. /init             프로젝트 구조 생성                     │
│  04. /design-style     문체/서술 스타일 설계                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    🌍 설계 단계 (Design)                      │
├─────────────────────────────────────────────────────────────┤
│  05. /design-world        세계관/배경 설정                    │
│  06. /design-character    캐릭터 프로필 설계                  │
│  07. /design-relationship 캐릭터 관계망 설계                  │
│  08. /design-timeline     시간 흐름 설계                      │
│  09. /design-main-arc     메인 플롯 아크 설계                 │
│  10. /design-sub-arc      서브플롯 설계                       │
│  11. /design-foreshadow   복선 설계 및 배치                   │
│  12. /design-hook         떡밥/미스터리 훅 설계               │
│  13. /gen-plot            회차별 플롯 JSON 생성               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    ✍️ 집필 단계 (Writing)                     │
├─────────────────────────────────────────────────────────────┤
│  14. /write [N]        특정 회차 집필                         │
│  15. /write-act [N]    특정 막 전체 집필                      │
│  16. /write-all        1화~끝까지 자동 집필 (Ralph Loop)      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    🔍 검증 단계 (Review)                      │
├─────────────────────────────────────────────────────────────┤
│  17. /revise [N]       원고 퇴고/수정                         │
│  18. /evaluate [N]     품질 평가 (critic + beta-reader)       │
│  19. /consistency-check 전체 설정 일관성 검사                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    🔧 관리 단계 (Management)                  │
├─────────────────────────────────────────────────────────────┤
│  20. /resume           중단된 집필 세션 복구                  │
│  21. /wisdom           집필 과정 지혜 관리                    │
│  22. /swarm            병렬 에이전트 검증/리뷰/설계           │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 v5.0 고급 기능

### 장면 단위 집필 (Scene-based Writing)
```bash
/write-scene
```
- **Quality Oracle**: 장면 전 품질 목표 설정
- **Prose Surgeon**: 장면 단위 외과적 퇴고
- 더 세밀한 통제로 높은 품질 달성

### 스타일 라이브러리 (Style Library)
```bash
/style-library add "문체 예시 텍스트"
/style-library search romance dialogue
/style-library stats
```
- Few-shot 학습을 위한 문체 예시 관리
- 5차원 자동 분류 (장르/씬유형/감정톤/시점/페이싱)
- 좋은 예시 + 안티 예시 페어링

### 다단계 퇴고 파이프라인
```bash
/revise-pipeline [N]
```
- **Draft**: 초고 퇴고 (구조, 흐름, 캐릭터)
- **Tone**: 톤/분위기 조율
- **Style**: 문장 수준 세련화
- **Final**: 최종 검증 및 마무리

### AI체 자동 감지 (AI Slop Detector)
```bash
/ai-slop-detector [N]
```
- 과도한 부사/형용사, 클리셰, 중복 패턴 자동 탐지
- 구체적 수정 제안 제공
- 점수 기반 판정 (0-100)

### 적대적 리뷰 (Adversarial Review)
```bash
/adversarial-review [N]
```
- 원고의 약점을 집중 공략하는 비판적 리뷰
- 논리적 허점, 캐릭터 일관성, 플롯 구멍 탐지
- 개선 우선순위와 구체적 액션 아이템 제공

## 🛠️ 유틸리티 명령어

| 명령어 | 설명 |
|--------|------|
| `/status` | 현재 프로젝트 진행 상태 확인 |
| `/stats` | 프로젝트 통계 (글자수, 진행률) |
| `/timeline` | 작품 내 시간 흐름 시각화 |
| `/validate-genre` | 장르 적합성 검증 |
| `/verify-chapter [N]` | 회차 병렬 검증 (critic+beta+genre) |
| `/analyze-engagement` | 회차별 몰입도 분석 |
| `/check-retention` | 회차간 이탈률 예측 |

## 🚀 자동화 명령어

| 명령어 | 설명 |
|--------|------|
| `/novel-autopilot` | 아이디어→완성 원고 전체 자동화 |
| `/write-all` | 1화부터 끝까지 Ralph Loop 집필 |
| `/write-grok` | Grok API로 생성 (Claude 제한 우회) |
| `/cancel-novel-autopilot` | Novel Autopilot 세션 취소 |

## 🎭 고급 스킬 (명령어 없음, /skill-name으로 호출)

| 스킬 | 설명 |
|------|------|
| `/write-scene` | v5.0 장면 단위 집필 (Quality Oracle + Prose Surgeon) |
| `/adversarial-review` | 적대적 리뷰 (원고 약점 집중 공략) |
| `/ai-slop-detector` | AI체(AI slop) 자동 감지 |
| `/analyze` | 원고 심층 분석 |
| `/deep-evaluate` | 심층 품질 평가 |
| `/emotion-arc` | 감정 아크 설계/분석 |
| `/multi-draft` | 멀티 드래프트 비교 집필 |
| `/review` | 원고 리뷰 |
| `/revise-pipeline` | v5.0 다단계 퇴고 파이프라인 |
| `/verify-design` | 설계 일관성 검증 |

## 📁 프로젝트 구조

```
novels/{novel_id}/
├── BLUEPRINT.md        # 작품 기획서
├── meta/
│   ├── project.json    # 프로젝트 메타데이터
│   ├── style-guide.json # 문체 가이드
│   ├── style-library.json # 문체 예시 라이브러리
│   ├── ralph-state.json # Ralph Loop 상태
│   ├── brainstorm-result.md # 브레인스토밍 결과
│   └── wisdom/         # 축적된 지혜
│       ├── style-discoveries.md
│       ├── voice-patterns.md
│       ├── plot-threads.md
│       └── terminology.md
├── world/
│   ├── world.json      # 세계관 설정
│   ├── locations.json  # 장소 DB
│   └── terms.json      # 용어 사전
├── characters/
│   ├── char_*.json     # 캐릭터 프로필
│   ├── index.json      # 캐릭터 목록
│   └── relationships.json # 관계 매트릭스
├── plot/
│   ├── structure.json  # 플롯 구조
│   ├── main-arc.json   # 메인 아크
│   ├── sub-arcs/       # 서브플롯들
│   ├── foreshadowing.json
│   ├── hooks.json
│   └── timeline.json   # 타임라인
├── chapters/
│   ├── chapter_*.json  # 회차별 플롯
│   └── chapter_*.md    # 원고
├── context/            # 컨텍스트 요약
├── reviews/            # 평가 기록
│   └── swarm/          # Swarm 검증 결과
└── exports/            # 내보내기 결과
```

## ❓ 도움이 필요하면

- `/quickstart` - 5단계 퀵스타트 가이드
- `/status` - 현재 상태 확인
- `/help` - 이 도움말 다시 보기

## 📚 더 알아보기

- **에이전트 목록**: `agents/AGENTS.md`
- **스키마 레퍼런스**: `schemas/QUICK_REFERENCE.md`
- **변경 이력**: `schemas/CHANGELOG.md`
