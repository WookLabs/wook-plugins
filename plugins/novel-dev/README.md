# Novel-Sisyphus

AI 소설 창작을 위한 멀티에이전트 오케스트레이션 플러그인

oh-my-claude-sisyphus의 컨셉을 기반으로 한국어 소설 창작에 특화된 Claude Code 플러그인입니다.

## 요구사항

- **Node.js** 18+ (필수)
- **Python** 3.10+ (필수 - 스키마 검증 및 Ralph 루프 지속성에 사용)
- **Claude Code** 최신 버전

## 특징

- **17개 전문 에이전트**: 핵심 7 + 파이프라인 2 + 검증/분석 6 + 문체/오케스트레이션 2
- **38개 스킬 (36개 사용자 호출 가능)**: 기획 3 + 설계 10 + 집필 5 + 검증 5 + 분석 3 + 품질 4 + 자동화 2 + 유틸리티 4
- **Ralph Loop**: 막(Act) 단위 자동 집필 + 퇴고 + 평가 사이클
- **품질 게이트**: 70점 기준 자동 재작업 시스템
- **일관성 검사**: 캐릭터, 세계관, 타임라인 자동 검증

## 설치

### 방법 1: Marketplace에서 설치 (권장)

```bash
# 1. Marketplace 추가 (Private repo - GITHUB_TOKEN 필요)
GITHUB_TOKEN=$(gh auth token) claude plugin marketplace add https://github.com/WookLabs/novel-dev

# 2. 플러그인 설치
claude plugin install novel-dev@novel-dev
```

> **Note**: Private repository입니다. `gh auth login`으로 GitHub 인증 후 사용하세요.

### 방법 2: 로컬 설치

1. 플러그인 복사
```bash
git clone https://github.com/WookLabs/novel-dev.git
cd novel-dev
npm install
```

2. `.claude/settings.json`에 플러그인 등록
```json
{
  "plugins": [
    { "path": "./novel-dev" }
  ]
}
```

3. Claude Code 세션 재시작

## 업데이트

```bash
claude plugins update novel-dev
```

또는 플러그인을 삭제 후 재설치:
```bash
claude plugin uninstall novel-dev@novel-dev
claude plugin install novel-dev@novel-dev
```

### 캐시 문제 해결

플러그인 업데이트 후 이전 명령어가 남아있는 경우:
```bash
rm -rf ~/.claude/plugins/cache
```
Claude Code 재시작 후 자동으로 새로 로드됩니다.

## 워크플로우 (19단계)

```
┌─────────────────────────────────────────────────────────────┐
│                    🎨 기획 단계 (Planning)                    │
├─────────────────────────────────────────────────────────────┤
│  01. /blueprint-gen    아이디어 → BLUEPRINT.md 생성          │
│  02. /blueprint-review BLUEPRINT.md 검토 및 개선             │
│  03. /init             프로젝트 구조 생성                     │
│  04. /design-style     문체/서술 스타일 설계                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    🌍 설계 단계 (Design)                      │
├─────────────────────────────────────────────────────────────┤
│  05. /world            세계관/배경 설정                       │
│  06. /character        캐릭터 프로필 설계                     │
│  07. /design-relationship 캐릭터 관계망 설계                  │
│  08. /design-timeline  시간 흐름 설계                        │
│  09. /main-arc         메인 플롯 아크 설계                    │
│  10. /sub-arc          서브플롯 설계                          │
│  11. /foreshadow       복선 설계 및 배치                      │
│  12. /hook             떡밥/미스터리 훅 설계                  │
│  13. /gen-plot         회차별 플롯 JSON 생성                  │
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
│  19. /check            전체 설정 일관성 검사                  │
└─────────────────────────────────────────────────────────────┘
```

## 커맨드 레퍼런스 (38개 스킬, 36개 사용자 호출 가능)

### 기획 단계 (3개)
| 커맨드 | 설명 | 비고 |
|--------|------|------|
| `/brainstorm` | 소크라틱 대화로 소설 아이디어 정제 | |
| `/blueprint-gen` | 아이디어 → BLUEPRINT.md 기획서 생성 | |
| `/blueprint-review` | BLUEPRINT.md 검토 및 개선 | |

### 설계 단계 (10개)
| 커맨드 | 설명 | 비고 |
|--------|------|------|
| `/init` | BLUEPRINT.md 기반 프로젝트 초기화 | BLUEPRINT.md 필수 |
| `/design-style` | 문체/서술 스타일 설계 | |
| `/design-world` | 세계관/배경 설정 | |
| `/design-character` | 캐릭터 프로필 설계 | |
| `/design-relationship` | 캐릭터 관계 네트워크 설계 | |
| `/design-timeline` | 타임라인/이벤트 설계 | |
| `/design-main-arc` | 메인 플롯 아크 설계 | |
| `/design-sub-arc` | 서브플롯 설계 | |
| `/design-foreshadow` | 복선 요소 설계 및 배치 | |
| `/design-hook` | 훅/클리프행어/미스터리 설계 | |

### 집필 단계 (5개)
| 커맨드 | 설명 | 비고 |
|--------|------|------|
| `/gen-plot` | 회차별 플롯 파일 생성 | |
| `/write [N]` | 특정 회차 집필 | |
| `/write-act [N]` | 막 단위 일괄 집필 | |
| `/write-all` | 1화~끝 자동 집필 (Ralph Loop) | |
| `/write-2pass` | 2-Pass 파이프라인 (Claude + Grok) | |

### 검증/퇴고 단계 (5개)
| 커맨드 | 설명 | 비고 |
|--------|------|------|
| `/revise [N]` | 원고 퇴고/수정 | |
| `/evaluate [N]` | 다차원 품질 평가 | |
| `/consistency-check` | 전체 설정 일관성 검사 | |
| `/resume` | 중단된 세션 이어쓰기 | |
| `/write-act-2pass` | 막 단위 2-Pass 일괄 집필 | |

### 분석/최적화 (3개)
| 커맨드 | 설명 | 비고 |
|--------|------|------|
| `/analyze-engagement` | 회차별 몰입도/이탈 위험/유지율/감정 곡선 분석 | retention + emotion-arc 통합 |
| `/multi-draft` | 동일 장면 다중 접근법 비교 | |
| `/evaluate --deep` | LongStoryEval 8축 심층 평가 | deep-evaluate 통합 |

### 품질/검증 (4개)
| 커맨드 | 설명 | 비고 |
|--------|------|------|
| `/adversarial-review` | 적대적 관점 챕터 검증 | |
| `/review` | 설계 결과물 다각도 검토 | |
| `/style-library` | Few-shot 스타일 예시 라이브러리 | |
| `/swarm` | 여러 에이전트 병렬 작업 | |

### 자동화/팀 (1개)
| 커맨드 | 설명 | 비고 |
|--------|------|------|
| `/team-nov` | 에이전트 팀 관리/실행 | |

### 유틸리티 (4개)
| 커맨드 | 설명 | 비고 |
|--------|------|------|
| `/help` | 플러그인 사용법 안내 | |
| `/status` | 워크플로우 진행 상태 | |
| `/stats` | 프로젝트 통계 (글자수, 진행률) | |
| `/quickstart` | 5단계 퀵스타트 가이드 | |

## 에이전트 (17개)

### 핵심 에이전트 (7개)
| 에이전트 | 모델 | 역할 | 권한 |
|---------|------|------|------|
| novelist | opus | 본문 집필 | 편집 |
| editor | sonnet | 퇴고/교정 | 편집 |
| critic | opus | 품질 평가 | READ-ONLY |
| plot-architect | opus | 플롯 설계 | READ-ONLY |
| lore-keeper | sonnet | 설정 관리 | 편집 |
| proofreader | haiku | 맞춤법 검사 | READ-ONLY |
| summarizer | haiku | 회차 요약 | READ-ONLY |

### 파이프라인 에이전트 (2개)
| 에이전트 | 모델 | 역할 | 권한 |
|---------|------|------|------|
| quality-oracle | opus | 2-Pass 품질 판정 | READ-ONLY |
| prose-surgeon | opus | 문장 수술/리라이트 | 편집 |

### 검증/분석 에이전트 (6개)
| 에이전트 | 모델 | 역할 | 권한 |
|---------|------|------|------|
| beta-reader | sonnet | 독자 관점 몰입도 분석 | READ-ONLY |
| chapter-verifier | sonnet | 병렬 검증 오케스트레이터 | READ-ONLY |
| consistency-verifier | sonnet | 일관성 검증 (캐릭터, 타임라인, 설정, 플롯) | READ-ONLY |
| engagement-optimizer | sonnet | 몰입도 최적화, 텐션 곡선, 페이싱 분석 | READ-ONLY |
| character-voice-analyzer | sonnet | 말투 일관성, OOC 탐지, 대화 분석 | READ-ONLY |
| genre-validator | sonnet | 장르별 필수 요소 검증 | READ-ONLY |

### 문체/오케스트레이션 (2개)
| 에이전트 | 모델 | 역할 | 권한 |
|---------|------|------|------|
| style-curator | sonnet | 스타일 라이브러리 관리, Few-shot 예시 큐레이션 | 편집 |
| team-orchestrator | sonnet | 에이전트 팀 조율/병렬 실행 | 편집 |

## 프로젝트 구조

```
novels/{novel_id}/
├── meta/
│   ├── project.json        # 프로젝트 정보
│   └── style-guide.json    # 문체 가이드
├── world/
│   ├── world.json          # 세계관
│   ├── locations.json      # 장소
│   └── terms.json          # 용어
├── characters/
│   ├── {char_id}.json      # 캐릭터
│   ├── index.json          # 목록
│   └── relationships.json  # 관계
├── plot/
│   ├── structure.json      # 플롯 구조
│   ├── main-arc.json       # 메인 아크
│   ├── sub-arcs/           # 서브 아크
│   ├── foreshadowing.json  # 복선
│   └── hooks.json          # 떡밥
├── chapters/
│   ├── chapter_001.json    # 회차 메타
│   └── chapter_001.md      # 회차 본문
├── context/summaries/      # 회차 요약
├── reviews/                # 평가 결과
└── exports/                # 내보내기
```

## Ralph Loop

`/write_all` 실행 시 활성화되는 자동 집필 모드:

1. **막 단위 집필**: 각 회차 순차 집필
2. **자동 퇴고**: 막 완료 시 editor 호출
3. **품질 평가**: critic이 70점 기준 평가
4. **재작업**: 70점 미만 시 최대 3회 재시도
5. **사용자 확인**: 막 완료 시 승인 대기

### Promise 태그
- `<promise>CHAPTER_N_DONE</promise>` - 회차 완료
- `<promise>ACT_N_DONE</promise>` - 막 완료
- `<promise>NOVEL_DONE</promise>` - 전체 완료

## 품질 평가 기준

| 항목 | 배점 | 내용 |
|------|------|------|
| 서사/문체 품질 | 25점 | 문장력, 표현력, 일관성 |
| 플롯 정합성 | 25점 | 설계와 일치, 논리성 |
| 캐릭터 일관성 | 25점 | 설정 준수, 말투 |
| 설정 준수 | 25점 | 세계관, 타임라인 |

**품질 게이트**: 70점 이상 통과

## BLUEPRINT.md 워크플로우

소설 시작 전 체계적인 기획:

```bash
/blueprint-gen "아이디어"   # 기획서 생성 (1단계)
/blueprint-review           # 검토 및 개선 (2단계)
/init                       # 프로젝트 생성 (3단계) - BLUEPRINT.md 필수
```

기획서는 `./BLUEPRINT.md`에 저장되며, 장르, 타겟 독자층, 캐릭터 원형, 핵심 갈등, 플롯 구조 등을 포함합니다.

> **Note**: `/init`은 BLUEPRINT.md가 있어야 실행됩니다.

## 장르 레시피

장르별 최적화된 기본값:
- **로맨스**: `romance`, `romance-contract`, `romance-ceo`
- **판타지**: `fantasy`, `fantasy-regression`, `fantasy-hunter`
- **기타**: `bl`, `thriller`

사용 예시:
```bash
/init --recipe=romance-contract
```

레시피는 장르에 적합한 플롯 구조, 템포, 필수 씬 등을 자동 설정합니다.

## What's New in v7.0

### 에이전트 정리 (20→17)
- `prose-quality-analyzer` 제거 → `quality-oracle`로 기능 통합
- `scene-drafter` 제거 → `novelist`의 Scene-by-Scene Mode로 대체
- `assembly-agent` 제거 → `novelist` 워크플로우에 통합

### 스킬 정리 (48→38)
- `/deep-evaluate` → `/evaluate --deep`으로 통합 (8축 루브릭은 references/로 이동)
- `/check-retention`, `/emotion-arc` → `/analyze-engagement`에 흡수
- `/ai-slop-detector`, `/validate-genre` → `/evaluate`에 통합
- `/timeline` → `/design-timeline --view`로 통합
- `/analyze` (범용 라우터), `/21-wisdom`, `/cancel-novel-autopilot` 제거

## Previous Releases

### v6.4.0

#### 에이전트 카탈로그 현대화
- 20개 에이전트 frontmatter 표준화 (산출물 기반 description)
- READ-ONLY 에이전트 10개에 `permissionMode: plan` 적용
- 에이전트별 color 코드 부여

#### Hook 시스템 현대화
- `hook-utils.mjs` 공유 모듈 도입 (중복 코드 제거)
- SessionStart SOP 주입 (에이전트 위임 테이블 자동 표시)

#### 스킬 시스템 개선
- 48개 스킬 frontmatter 표준화 ("Use this skill when..." 형식)
- `validate-skills.mjs` 신규 검증 스크립트

#### 검증 파이프라인 강화
- 에이전트 frontmatter 검증 (`validate-agents.mjs` 확장)
- 스킬 frontmatter 검증 (`validate-skills.mjs` 신규)
- prebuild에 `validate:skills` 통합

## Previous Releases

### v3.0

- **chapter-verifier**: Automated verification agent that validates chapters before completion claims
- **consistency-verifier**: Detects contradictions in character traits, timeline, settings, and factual consistency across chapters
- **engagement-optimizer**: Analyzes and optimizes pacing, tension curves, emotional beats, and hook density for maximum reader engagement

### v2.0

- **Hook-Based Workflow Control**: Ralph Loop Persistence, Schema Validation, Session Initialization
- **Progressive Disclosure Structure**: 3-tier documentation (SKILL.md, references, examples)
- **Parallel Verification System**: `/verify-chapter` 3-way validator orchestration

## 라이선스

MIT

## 기반 프로젝트

- [oh-my-claude-sisyphus](https://github.com/Yeachan-Heo/oh-my-claude-sisyphus)
