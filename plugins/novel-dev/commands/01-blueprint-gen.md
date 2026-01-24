---
description: "[1단계] 블루프린트 생성 - BLUEPRINT.md 작품 기획서 생성"
argument-hint: <아이디어>
allowed-tools:
  - Read
  - Write
  - Task
  - AskUserQuestion
model: sonnet
---

# /blueprint-gen

소설 아이디어를 체계적인 BLUEPRINT.md로 변환합니다.

## 사용법

```bash
# 아이디어와 함께
/blueprint-init "재벌과 평범녀의 계약 연애"

# 인터뷰 모드
/blueprint-init

# 레시피 지정
/blueprint-init "회귀물" --recipe=fantasy-regression
```

## 생성 파일

```
BLUEPRINT.md
├── 기본 정보 (장르, 화수, 톤)
├── 로그라인 & 시놉시스
├── 핵심 캐릭터
├── 플롯 구조 (3막)
├── 필수 요소 (트로프, 감정비트)
├── 세계관 키워드
└── 검증 기준
```

## 워크플로우

### 1. 아이디어 분석
- 사용자 입력이 충분하면 바로 진행
- 불충분하면 인터뷰 질문 (장르, 트로프, 톤, 주인공, 갈등, 화수)

### 2. 레시피 매칭
- 장르/트로프 분석하여 적합한 레시피 자동 선택
- 사용 가능: romance, romance-contract, romance-ceo, fantasy, fantasy-regression, fantasy-hunter, bl, thriller

### 3. 블루프린트 생성
- plot-architect 에이전트로 템플릿 채우기
- 모든 섹션 완성

### 4. 파일 저장
- 프로젝트 있으면: `novels/{novel_id}/BLUEPRINT.md`
- 없으면: `.claude/blueprints/{title-slug}.md`

## 옵션

| 옵션 | 설명 |
|------|------|
| `--recipe=NAME` | 레시피 직접 지정 |
| `--interview` | 항상 인터뷰 모드 |
| `--output=PATH` | 저장 경로 지정 |

## 다음 단계

1. `/blueprint-review` - 기획서 검토
2. `/init --from-blueprint` - 프로젝트 생성
