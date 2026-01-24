# {{title}} - AI 협업 가이드

> 이 파일은 `/init` 실행 시 자동 생성됩니다. 필요에 따라 수정하세요.

## 프로젝트 개요

| 항목 | 값 |
|------|-----|
| **프로젝트 ID** | {{project_id}} |
| **장르** | {{genre}} |
| **목표 화수** | {{target_chapters}}화 |
| **회차당 분량** | {{words_per_chapter}}자 |
| **현재 진행** | 0/{{target_chapters}} (0%) |

## 핵심 설정 (빠른 참조)

### 주요 캐릭터
{{#characters}}
- **{{name}}** ({{role}}): {{one_line}}
{{/characters}}

### 핵심 갈등
{{central_conflict}}

### 톤 & 분위기
{{tone}}

## 작업 규칙

### 집필 시 준수사항
- **시점**: {{pov}} 시점 유지
- **분량**: {{words_per_chapter}}자 ±10%
- **문체**: {{narrative_voice}}
- **대화 비율**: {{dialogue_ratio}}%

### 금지 표현
{{#taboo_words}}
- {{.}}
{{/taboo_words}}

### 품질 기준
| 모드 | critic | beta-reader | genre-validator |
|------|--------|-------------|-----------------|
| Standard | ≥70 | ≥70 | ≥85 |
| Masterpiece (`/write-all`) | ≥85 | ≥80 | ≥95 |

## 현재 상태

- **마지막 작업**: 프로젝트 초기화 완료
- **다음 할 일**: `/design-world` 로 세계관 설계
- **미해결 이슈**: 없음

## 워크플로우 가이드

### 설계 단계 (현재)
```bash
/design-style      # 문체/서술 스타일 설계
/world             # 세계관 설계
/character         # 캐릭터 설계
/main-arc          # 메인 플롯 아크
/sub-arc           # 서브플롯
/foreshadow        # 복선 배치
/hook              # 떡밥 설계
/plot              # 회차별 플롯 생성
```

### 설계 검토
```bash
/review            # 설계 결과물 검토 (APPROVED/REVISE/REJECT)
/analyze           # 문제점 분석
```

### 집필 단계
```bash
/write 1           # 1화 집필
/write-act 1       # 1막 전체 집필
/write-all         # 전체 자동 집필 (Ralph Loop)
```

### 검토/수정 단계
```bash
/evaluate 1        # 1화 품질 평가
/revise 1          # 1화 퇴고
/check             # 전체 일관성 검사
```

### 유틸리티
```bash
/status            # 진행 상태
/stats             # 통계
/analyze-engagement # 몰입도 분석
```

## 참조 파일 경로

| 파일 | 경로 | 설명 |
|------|------|------|
| 프로젝트 설정 | `meta/project.json` | 기본 메타데이터 |
| 스타일 가이드 | `meta/style-guide.json` | 문체, 톤, 금지어 |
| 세계관 | `world/world.json` | 배경, 규칙, 장소 |
| 캐릭터 | `characters/*.json` | 캐릭터 프로필 |
| 플롯 구조 | `plot/structure.json` | 막 구분, 시놉시스 |
| 메인 아크 | `plot/main-arc.json` | 메인 플롯 |
| 서브 아크 | `plot/sub-arcs/*.json` | 서브플롯 |
| 복선 | `plot/foreshadowing.json` | 복선 목록 |
| 떡밥 | `plot/hooks.json` | 미스터리 훅 |
| 회차 플롯 | `chapters/chapter_*.json` | 회차별 상세 플롯 |
| 원고 | `chapters/chapter_*.md` | 실제 원고 |

## 에이전트 역할

| 에이전트 | 역할 | 호출 시점 |
|----------|------|-----------|
| plot-architect | 플롯 설계 | /plot, /main-arc |
| lore-keeper | 설정 관리 | /world, /character |
| novelist | 본문 집필 | /write |
| editor | 퇴고 | /revise |
| critic | 품질 평가 | /evaluate |
| beta-reader | 몰입도 분석 | /evaluate, /analyze-engagement |

## 주의사항

1. **일관성 유지**: 설정 변경 시 `/check`로 검증
2. **품질 게이트**: 70점 미만 회차는 자동 재작업
3. **복선 관리**: 심은 복선은 반드시 회수
4. **캐릭터 목소리**: 말투, 성격 일관성 유지

---

*이 파일은 프로젝트 진행에 따라 자동 업데이트됩니다.*
