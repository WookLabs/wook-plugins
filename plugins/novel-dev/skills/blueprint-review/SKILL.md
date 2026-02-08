---
name: blueprint-review
description: BLUEPRINT.md 기획서 검토 및 개선
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Task
  - AskUserQuestion
---

# Blueprint Review Skill

BLUEPRINT.md를 다각도로 검토하고 개선점을 제안합니다.

## 워크플로우

### Phase 1: 블루프린트 로드

```
- novels/{novel_id}/BLUEPRINT.md
- 또는 .claude/blueprints/*.md
```

### Phase 2: 병렬 검토 (3개 에이전트)

```
# 1. 구조 검토 (critic)
Task(subagent_type="novel-dev:critic",
  prompt="BLUEPRINT.md의 플롯 구조를 검토하세요:
  - 3막 구조의 균형
  - 갈등의 강도
  - 캐릭터 아크의 명확성
  - 논리적 허점")

# 2. 상업성 검토 (beta-reader)
Task(subagent_type="novel-dev:beta-reader",
  prompt="BLUEPRINT.md의 상업성을 검토하세요:
  - 독자 후킹 요소
  - 트렌드 적합성
  - 이탈 위험 요소
  - 1화 흡입력")

# 3. 장르 적합성 (genre-validator)
Task(subagent_type="novel-dev:genre-validator",
  prompt="BLUEPRINT.md의 장르 적합성을 검토하세요:
  - 필수 트로프 포함 여부
  - 장르 독자 기대 충족
  - 클리셰 밸런스")
```

### Phase 3: 리뷰 종합

```markdown
## BLUEPRINT.md 검토 결과

### 종합 점수: {N}/100

| 검토 영역 | 점수 | 상태 |
|-----------|------|------|
| 구조 | {N}/100 | ✅/⚠️/❌ |
| 상업성 | {N}/100 | ✅/⚠️/❌ |
| 장르 적합성 | {N}/100 | ✅/⚠️/❌ |

### 강점
- {강점 1}
- {강점 2}

### 개선 필요
- {문제 1}: {해결 방안}
- {문제 2}: {해결 방안}

### 권장 수정사항
1. {구체적 수정 1}
2. {구체적 수정 2}
```

### Phase 4: 수정 여부 확인

```
개선점이 발견되었습니다. 수정하시겠습니까?

1. "수정" - 권장사항 자동 반영
2. "직접 수정" - 수동으로 수정
3. "무시" - 현재 상태로 진행
```

### Phase 5: 자동 수정 (선택 시)

plot-architect로 개선사항 반영:

```
Task(subagent_type="novel-dev:plot-architect",
  prompt="BLUEPRINT.md를 다음 피드백 기반으로 개선하세요:

  피드백:
  {review_feedback}

  기존 BLUEPRINT.md:
  {current_blueprint}

  <!-- MANUAL --> 섹션은 보존하세요.")
```

### Phase 6: 승인

```
✅ BLUEPRINT.md 검토 완료

상태: 승인됨 / 수정됨 / 추가 검토 필요
점수: {N}/100

다음 단계:
- /init --from-blueprint  프로젝트 생성
```

## 검토 체크리스트

### 필수 요소
- [ ] 로그라인이 한 문장인가?
- [ ] 시놉시스가 200자/1000자 버전 모두 있는가?
- [ ] 주인공의 Want/Need가 명확한가?
- [ ] 3막 전환점이 정의되었는가?
- [ ] 필수 트로프가 장르에 맞는가?

### 상업성
- [ ] 1화 훅이 강력한가?
- [ ] 3-5화 내 사이다 요소가 있는가?
- [ ] 독자 몰입 요소가 충분한가?

### 일관성
- [ ] 캐릭터 목표와 플롯이 일치하는가?
- [ ] 세계관 설정이 플롯을 지원하는가?
- [ ] 톤/분위기가 장르에 맞는가?

## 옵션

### --auto-fix
피드백을 자동으로 반영:
```bash
/blueprint-review --auto-fix
```

### --strict
더 엄격한 기준으로 검토:
```bash
/blueprint-review --strict
```

### --focus
특정 영역만 검토:
```bash
/blueprint-review --focus=structure
/blueprint-review --focus=commercial
/blueprint-review --focus=genre
```
