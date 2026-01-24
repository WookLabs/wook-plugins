# Novel-Sisyphus

AI 소설 창작을 위한 멀티에이전트 오케스트레이션 플러그인

oh-my-claude-sisyphus의 컨셉을 기반으로 한국어 소설 창작에 특화된 Claude Code 플러그인입니다.

## 특징

- **7개 전문 에이전트**: 작가, 편집자, 평론가, 설정관리자, 플롯설계자, 교정자, 요약자
- **18개 커맨드**: 초기화부터 내보내기까지 전체 집필 워크플로우 지원
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

### 방법 3: oh-my-claude-sisyphus에서 설치

oh-my-claude-sisyphus가 설치되어 있다면:
```
/oh-my-claude-sisyphus:install-novel-dev
```

## 업데이트

```bash
claude plugins update novel-dev
```

또는 플러그인을 삭제 후 재설치:
```bash
claude plugin uninstall novel-dev@novel-dev
claude plugin install novel-dev@novel-dev
```

## 워크플로우

```
/init → /design_* → /gen_plot → /write_all → /export
```

### Phase 1: 초기화
```bash
/init "현대 로맨스, 계약 연애 트로프, 50화 분량"
```

### Phase 2: 설계
```bash
/design_world        # 세계관 설계
/design_character    # 캐릭터 설계
/design_main_arc     # 메인 플롯 설계
/design_sub_arc      # 서브플롯 설계
/design_foreshadowing # 복선 배치
/design_hook         # 떡밥 설계
```

### Phase 3: 플롯 생성
```bash
/gen_plot            # 전체 회차 플롯 JSON 생성
```

### Phase 4: 집필
```bash
/write 1             # 1화 집필
/write_act 1         # 1막 전체 집필
/write_all           # 전체 자동 집필 (Ralph Loop)
```

### Phase 5: 퇴고 및 평가
```bash
/revise              # 퇴고
/evaluate            # 품질 평가
/consistency_check   # 일관성 검사
```

### Phase 6: 완료
```bash
/timeline            # 타임라인 시각화
/stats               # 진행 통계
/export md           # 마크다운으로 내보내기
```

## 에이전트

| 에이전트 | 모델 | 역할 |
|---------|------|------|
| novelist | opus | 본문 집필 |
| editor | sonnet | 퇴고/교정 |
| critic | opus | 품질 평가 (READ-ONLY) |
| lore-keeper | sonnet | 설정 관리 |
| plot-architect | opus | 플롯 설계 |
| proofreader | haiku | 맞춤법 검사 |
| summarizer | haiku | 회차 요약 |

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

## 라이선스

MIT

## 기반 프로젝트

- [oh-my-claude-sisyphus](https://github.com/Yeachan-Heo/oh-my-claude-sisyphus)
