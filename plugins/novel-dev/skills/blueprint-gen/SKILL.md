---
name: blueprint-gen
description: 아이디어로 BLUEPRINT.md 작품 기획서 생성
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Task
  - AskUserQuestion
---

# Blueprint Gen Skill

소설 아이디어를 체계적인 BLUEPRINT.md 작품 기획서로 변환합니다.

## 워크플로우

### Phase 1: 아이디어 수집

사용자 입력이 충분한지 확인:

**충분한 경우:**
```
/blueprint-gen "재벌 3세와 평범한 여대생의 계약 연애, 가짜로 시작해서 진짜가 되는 로맨스"
```
→ 바로 Phase 2로

**불충분한 경우:**
```
/blueprint-gen "로맨스 소설"
```
→ 인터뷰 모드 시작

### 인터뷰 질문 (AskUserQuestion 사용)

1. **장르**: 어떤 장르인가요? (로맨스/판타지/BL/스릴러)
2. **핵심 트로프**: 주요 클리셰는? (계약연애/회귀/헌터)
3. **톤**: 분위기는? (달달/긴장/코믹/무거움)
4. **주인공**: 주인공은 어떤 인물인가요?
5. **갈등**: 핵심 갈등/장애물은?
6. **목표 화수**: 몇 화 정도 예상하시나요?

### Phase 2: 레시피 매칭

장르/트로프를 분석하여 가장 적합한 레시피 선택:

```
Task(subagent_type="oh-my-claudecode:architect-low",
  prompt="사용자 아이디어를 분석하여 가장 적합한 레시피 선택:
  - romance, romance-contract, romance-ceo
  - fantasy, fantasy-regression, fantasy-hunter
  - bl, thriller

  아이디어: {user_idea}")
```

### Phase 3: 블루프린트 생성

plot-architect 에이전트로 BLUEPRINT.md 생성:

```
Task(subagent_type="novel-dev:plot-architect",
  prompt="다음 아이디어로 BLUEPRINT.md를 생성하세요.

  아이디어: {user_idea}
  레시피: {matched_recipe}
  템플릿: templates/BLUEPRINT.template.md

  모든 섹션을 채워주세요:
  - 로그라인 (한 문장)
  - 시놉시스 (200자, 1000자)
  - 핵심 캐릭터 (주인공, 상대역)
  - 3막 구조 플롯
  - 필수 트로프와 감정 비트
  - 세계관 키워드
  ")
```

### Phase 4: 파일 저장

```
novels/{novel_id}/BLUEPRINT.md
```

또는 프로젝트가 아직 없으면:
```
.claude/blueprints/{title-slug}.md
```

### Phase 5: 다음 단계 안내

```
✅ BLUEPRINT.md 생성 완료

파일: {path}
장르: {genre}
레시피: {recipe}
목표: {target_chapters}화

다음 단계:
1. /blueprint-review  - 기획서 검토 및 개선
2. /init --from-blueprint  - 프로젝트 구조 생성
```

## 출력 예시

```markdown
<!-- Generated: 2025-01-24T18:00:00Z -->
<!-- Recipe: romance-contract -->

# 계약의 온도

> 빚 때문에 재벌 3세의 가짜 여자친구가 된 여대생이
> 계약 기간 동안 진짜 사랑을 깨닫게 되는 이야기

## 기본 정보

| 항목 | 값 |
|------|-----|
| **장르** | 로맨스 |
| **서브장르** | 현대 로맨스, 계약 연애 |
| **등급** | 15+ |
| **목표 화수** | 60화 |
| **회차당 글자수** | 5000자 |
| **톤/분위기** | 달달, 코믹, 설렘 |

...
```

## 옵션

### --recipe
레시피를 직접 지정:
```bash
/blueprint-gen "아이디어" --recipe=romance-contract
```

### --interview
항상 인터뷰 모드로 시작:
```bash
/blueprint-gen --interview
```

### --output
저장 경로 지정:
```bash
/blueprint-gen "아이디어" --output=novels/my-novel/BLUEPRINT.md
```
