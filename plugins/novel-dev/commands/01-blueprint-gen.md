---
description: 블루프린트 생성
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

### 1. 아이디어 분석 (AskUserQuestion 사용)

사용자 입력이 불충분하면 **클릭 가능한 UI**로 질문:

```javascript
// 예시: 장르 선택
AskUserQuestion({
  questions: [{
    question: "어떤 장르의 소설을 쓰시나요?",
    header: "장르",
    options: [
      { label: "로맨스 (권장)", description: "사랑과 관계 중심의 이야기" },
      { label: "판타지", description: "마법, 이세계, 초능력 요소" },
      { label: "스릴러/미스터리", description: "긴장감과 반전 중심" },
      { label: "일상/힐링", description: "따뜻하고 잔잔한 이야기" }
    ],
    multiSelect: false
  }]
});

// 예시: 트로프 선택 (다중 선택)
AskUserQuestion({
  questions: [{
    question: "포함하고 싶은 요소를 모두 선택하세요",
    header: "트로프",
    options: [
      { label: "계약 연애", description: "가짜 연애에서 진짜로" },
      { label: "재회", description: "과거의 인연이 다시" },
      { label: "신분 차이", description: "재벌/서민 등" },
      { label: "라이벌→연인", description: "적에서 연인으로" }
    ],
    multiSelect: true
  }]
});
```

**인터뷰 질문 순서:**
1. 장르 선택 (단일)
2. 세부 장르/트로프 선택 (다중)
3. 분위기/톤 선택 (단일)
4. 목표 화수 선택 (단일)
5. 등급 선택 (단일)

### 2. 레시피 매칭
- 장르/트로프 분석하여 적합한 레시피 자동 선택
- 사용 가능 레시피 (17종):

| 장르 | 레시피 |
|------|--------|
| 로맨스 | romance, romance-contract, romance-ceo |
| 판타지 | fantasy, fantasy-regression, fantasy-hunter |
| BL/GL | bl, gl |
| 스릴러 | thriller |
| SF | sf |
| 무협 | martial-arts |
| 역사물 | historical |
| 공포 | horror |
| 순문학 | literary |
| 라이트노벨 | light-novel |
| 스포츠 | sports |
| 일상물 | slice-of-life |

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
