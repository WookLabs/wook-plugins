---
name: adversarial-review
description: 적대적 관점(악마의 변호인)에서 챕터 검증
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

# Adversarial Review Skill

> **Note**: 이 문서의 코드 블록은 AI 오케스트레이터를 위한 실행 패턴 명세입니다. 실행 가능한 TypeScript/JavaScript 코드가 아닙니다.

챕터를 적대적 관점에서 검증하는 스킬입니다. superpowers의 "Defensive Distrust" 패턴을 적용하여, 검증자가 작성자의 출력을 적극적으로 의심하고 독립적으로 검증합니다.

> **핵심 원칙**: "작성자가 수상하게 빨리 끝냈다. 보고서는 불완전하거나 부정확하거나 낙관적일 수 있다. 모든 것을 독립적으로 검증해야 한다."

## 워크플로우

### Phase 0: 비용 경고 (Cost Warning)

실행 전 사용자에게 비용을 안내합니다:

> **적대적 검증 비용 안내**
> 이 작업은 5축 병렬 검증을 수행합니다:
> - 5x 검증 에이전트 (PLOT, CHARACTER, WORLD, EMOTION, TRUST)
> - 교차 검증 시 추가 에이전트 호출 가능
>
> 예상 토큰 사용량: 회차당 ~80K 입력 + ~12K 출력

AskUserQuestion으로 사용자 확인:
- "전체 검증" — 5축 모두 실행
- "핵심 축만" — PLOT, CHARACTER만 검증 (~40% 비용)
- "단일 축" — 가장 우려되는 축 하나만 검증

### Phase 1: 검증 대상 및 레벨 결정

사용자가 지정하지 않은 경우 자동 감지 후 AskUserQuestion으로 확인:

```spec
// 1. 대상 챕터 결정
const targetChapter = detectLatestWrittenChapter()
  || await AskUserQuestion("어떤 챕터를 검증할까요?", [
    "최근 작성한 챕터",
    "특정 챕터 번호 지정",
    "전체 챕터 검증"
  ])

// 2. 검증 레벨 결정
const level = await AskUserQuestion("검증 강도를 선택하세요:", [
  "Level 1: 친절한 독자 (일반적 품질 체크)",
  "Level 2: 까다로운 편집자 (모든 논리적 허점 공격)",
  "Level 3: 적대적 비평가 ('이 작품이 왜 나쁜지' 관점)"
])
```

### Phase 2: 컨텍스트 로딩

적대적 검증을 위한 포괄적 컨텍스트 수집:

```
필수 로드:
- chapters/chapter_{N}.md          (검증 대상 본문)
- chapters/chapter_{N}.json        (챕터 플롯 요구사항)
- characters/*.json                (전체 캐릭터 설정)
- world/world.json                 (세계관 설정)
- plot/main-arc.json               (메인 플롯)
- plot/foreshadowing.json          (복선 설정)

관련 챕터:
- chapters/chapter_{N-3 ~ N-1}.md  (이전 3개 챕터 본문)
- context/summaries/*.md           (이전 챕터 요약)

이력:
- reviews/adversarial-*.json       (이전 적대적 검증 결과)
```

### Phase 3: 5축 적대적 공격 (병렬 실행)

5개의 공격 축을 병렬로 실행합니다:

```spec
// 1. 플롯 구멍 탐지 (consistency-verifier)
const plotAttack = Task({
  subagent_type: "novel-dev:consistency-verifier",
  model: "sonnet",
  prompt: `적대적 관점에서 플롯 구멍을 찾으세요.

검증 대상: ${chapterContent}
이전 챕터: ${previousChapters}
플롯 요구사항: ${plotRequirements}

공격 방법:
1. 모든 사건의 인과관계를 의심하라
2. "왜 이 시점에 이 사건이?"를 반복하라
3. 시간순서, 물리적 가능성, 정보 흐름을 검증하라
4. 이전 챕터와의 모순을 빠짐없이 찾아라
5. "독자가 '말이 안 되잖아'라고 소리칠 부분"을 찾아라

발견된 모든 구멍에 대해:
- 정확한 위치 (파일:라인)
- 근거 (대조 증거)
- 심각도 (CRITICAL / HIGH / MEDIUM)
- 독자 신뢰 영향도 (1-10)
`
})

// 2. 캐릭터 불일치 공격 (character-voice-analyzer)
const characterAttack = Task({
  subagent_type: "novel-dev:character-voice-analyzer",
  model: "sonnet",
  prompt: `적대적 관점에서 캐릭터 불일치를 찾으세요.

검증 대상: ${chapterContent}
캐릭터 설정: ${characterProfiles}

공격 방법:
1. 캐릭터 프로필과 행동/대사의 모든 불일치를 찾아라
2. "이 성격의 인물이 정말 이렇게 말하겠는가?" 의심하라
3. 감정 변화의 논리성을 공격하라 (감정 비약 탐지)
4. 캐릭터 지식 상태를 추적하라 (모르는 것을 아는 경우)
5. 관계 설정과 실제 상호작용의 모순을 찾아라

유형별 분류:
- OOC (Out of Character): 성격 위반
- VOICE: 말투/어투 불일치
- EMOTION: 감정 비약 (2문단 이내 급변)
- KNOWLEDGE: 정보 보유 모순
- RELATIONSHIP: 관계 설정 위반
`
})

// 3. 세계관 위반 탐지 (lore-keeper)
const worldAttack = Task({
  subagent_type: "novel-dev:lore-keeper",
  model: "sonnet",
  prompt: `적대적 관점에서 세계관 위반을 찾으세요.

검증 대상: ${chapterContent}
세계관 설정: ${worldSettings}

공격 방법:
1. 마법/과학 체계 규칙 위반을 찾아라
2. 지리/장소 묘사 불일치를 찾아라
3. 사회 구조/규칙 위반을 찾아라
4. 용어 사용 오류를 찾아라
5. 시대/문화적 아나크로니즘을 찾아라

"작가가 자기 세계관 규칙을 잊었을 가능성"을 항상 의심하라.
`
})

// 4. 감정 비약 탐지 (beta-reader)
const emotionAttack = Task({
  subagent_type: "novel-dev:beta-reader",
  model: "sonnet",
  prompt: `적대적 독자 관점에서 감정 전달 실패 지점을 찾으세요.

검증 대상: ${chapterContent}

공격 방법:
1. 감정 전환이 부자연스러운 모든 지점을 찾아라
2. "독자가 납득하지 못할 감정 변화"를 식별하라
3. 감정 A에서 감정 B까지 걸린 문단 수를 측정하라
4. 2문단 이내 급격한 감정 전환은 모두 플래그하라
5. "작가만 이해하고 독자는 모를 감정"을 찾아라

감정 비약 기준:
- 분노 → 사랑: 최소 5문단 필요
- 슬픔 → 기쁨: 최소 3문단 필요
- 공포 → 평온: 최소 4문단 필요
- 의심 → 신뢰: 최소 6문단 필요
`
})

// 5. 독자 신뢰 파괴 탐지 (critic)
const trustAttack = Task({
  subagent_type: "novel-dev:critic",
  model: "opus",
  prompt: `적대적 비평가 관점에서 독자 신뢰를 파괴하는 요소를 찾으세요.

검증 대상: ${chapterContent}
검증 레벨: ${level}

공격 방법:
1. 데우스 엑스 마키나 (갑작스러운 해결책) 탐지
2. 플롯 아머 (주인공 보정) 탐지
3. 설명 없는 능력 발현 탐지
4. 우연의 남용 탐지
5. 이중 기준 (같은 상황, 다른 결과) 탐지
6. 독자 기대 배반 (나쁜 의미에서) 탐지

Level 1 (친절한 독자):
- 일반적 품질 체크만 수행
- 장르 관습으로 용인 가능한 것은 PASS

Level 2 (까다로운 편집자):
- 모든 논리적 허점 공격
- 장르 관습도 근거 요구

Level 3 (적대적 비평가):
- "이 작품이 왜 나쁜지" 관점에서 공격
- 어떤 양보도 없이 최고 수준 요구
- 발표/출판 기준으로 판단
`
})

// 병렬 실행
const [plot, character, world, emotion, trust] = await Promise.all([
  plotAttack,
  characterAttack,
  worldAttack,
  emotionAttack,
  trustAttack
])
```

### Phase 4: 이슈 통합 및 심각도 분류

5축 공격 결과를 통합하여 심각도별 분류:

```spec
// 심각도 기준
const SEVERITY = {
  CRITICAL: {
    criteria: "독자가 즉시 알아차리고 작품 신뢰를 잃을 수준",
    examples: [
      "파괴된 다리를 건넘",
      "사망한 캐릭터 재등장 (의도 아닌)",
      "마법 체계 핵심 규칙 위반"
    ],
    action: "반드시 수정"
  },
  HIGH: {
    criteria: "주의 깊은 독자가 발견하고 불만을 느낄 수준",
    examples: [
      "캐릭터 성격 급변 (근거 부족)",
      "시간대 모순",
      "정보 보유 모순"
    ],
    action: "수정 강력 권장"
  },
  MEDIUM: {
    criteria: "반복되면 누적 불만이 되는 수준",
    examples: [
      "감정 비약 (급진적이나 해석 가능)",
      "우연의 빈도 높음",
      "용어 미세 불일치"
    ],
    action: "수정 권장"
  }
}

// 중복 제거 및 병합
const allIssues = deduplicateAndMerge([
  ...plot.issues.map(i => ({ ...i, axis: "PLOT" })),
  ...character.issues.map(i => ({ ...i, axis: "CHARACTER" })),
  ...world.issues.map(i => ({ ...i, axis: "WORLD" })),
  ...emotion.issues.map(i => ({ ...i, axis: "EMOTION" })),
  ...trust.issues.map(i => ({ ...i, axis: "TRUST" }))
])

// 교차 확인: 2개 이상 축에서 동일 이슈 발견 시 심각도 상향
const crossValidated = allIssues.map(issue => {
  const axes = allIssues.filter(i => i.location === issue.location).map(i => i.axis)
  if (axes.length >= 2) {
    issue.severity = escalateSeverity(issue.severity)
    issue.cross_validated = true
    issue.detected_by = axes
  }
  return issue
})
```

### Phase 5: 3실패 구조 질문 (Structural Question Protocol)

동일 문제가 이전 검증에서 반복 발견된 경우:

```spec
// 이전 검증 이력 로드
const previousReviews = loadPreviousAdversarialReviews()

// 반복 이슈 탐지
const recurringIssues = crossValidated.filter(issue => {
  const pastOccurrences = previousReviews.filter(r =>
    r.issues.some(pi => pi.category === issue.category && pi.target === issue.target)
  )
  return pastOccurrences.length >= 2 // 이전 2회 + 현재 1회 = 3회
})

// 3실패 시 구조적 질문
for (const issue of recurringIssues) {
  const structuralQuestion = `
⚠️ 3회 실패 감지: "${issue.description}"

이 문제가 반복되는 이유를 근본적으로 질문합니다:
1. ${getStructuralQuestion1(issue)} // e.g., "이 캐릭터의 설계 자체가 문제인가?"
2. ${getStructuralQuestion2(issue)} // e.g., "이 플롯 라인이 근본적으로 작동하지 않는가?"
3. ${getStructuralQuestion3(issue)} // e.g., "접근법을 완전히 바꿔야 하는가?"
`

  await AskUserQuestion(structuralQuestion, [
    "방향 전환: 근본적으로 재설계",
    "심화 수정: 더 강도 높은 수정 시도",
    "보류: 이후 챕터에서 자연스럽게 해결",
    "수용: 이 수준으로 진행"
  ])
}
```

**3실패 구조 질문 유형별 예시:**

| 반복 이슈 카테고리 | 구조 질문 1 | 구조 질문 2 | 구조 질문 3 |
|-------------------|------------|------------|------------|
| 캐릭터 동기 불분명 | 이 캐릭터의 Want/Need 설계가 모호한가? | 이 캐릭터가 이 플롯에 맞지 않는가? | 캐릭터를 재설계해야 하는가? |
| 플롯 구멍 반복 | 이 플롯 라인의 전제가 약한가? | 사건 순서를 재구성해야 하는가? | 이 서브플롯을 폐기해야 하는가? |
| 감정 비약 반복 | 캐릭터 감정 아크가 설계되지 않았는가? | 장면 전환 구조가 문제인가? | 스타일 가이드의 페이싱 기준이 잘못되었는가? |
| 세계관 위반 반복 | 세계관 규칙이 불명확하게 정의되었는가? | 이 규칙이 스토리와 충돌하는가? | 세계관 규칙을 수정해야 하는가? |

### Phase 6: 검증 결과 출력

#### 헤더 리포트

```
+==================================================+
|       ADVERSARIAL REVIEW REPORT                   |
+==================================================+
|  대상: chapter_005.md                             |
|  검증 레벨: Level 2 (까다로운 편집자)              |
|  발견된 이슈: 7건                                 |
|  심각도: CRITICAL 2 / HIGH 3 / MEDIUM 2           |
+==================================================+
```

#### 상세 이슈 리포트

```markdown
## CRITICAL Issues

### [CRITICAL #1] 플롯 구멍: 파괴된 다리 횡단
- **축**: PLOT
- **위치**: chapter_005.md:line 45
- **근거**: chapter_003.md:line 89 "다리가 무너졌다"
- **설명**: 3장에서 명시적으로 파괴된 다리를 5장에서 아무 설명 없이 건넜습니다.
- **독자 영향**: 독자가 즉시 알아차리고 작가의 일관성을 의심합니다.
- **교차 검증**: PLOT + WORLD 2축에서 동시 탐지
- **수정 제안**:
  1. 다리가 임시 복구되었다는 언급 추가
  2. 다른 경로로 강을 건넌 것으로 변경
  3. 3장의 다리 파괴를 부분 파괴로 수정

### [CRITICAL #2] 캐릭터 불일치: 내성적 캐릭터의 군중 연설
- **축**: CHARACTER + EMOTION
- **위치**: chapter_005.md:line 112
- **근거**: characters/mina.md "극도로 수줍음, 3인 이상 대화 회피"
- **설명**: 내성적으로 설정된 미나가 100명 앞에서 자발적으로 연설합니다.
- **독자 영향**: 캐릭터 신뢰 붕괴. "작가가 자기 캐릭터를 잊었나?"
- **교차 검증**: CHARACTER + EMOTION + TRUST 3축에서 동시 탐지
- **수정 제안**:
  1. 연설 전 극도의 긴장/강제 상황 추가 (5+ 문단)
  2. 연설 중/후 심리적 대가 묘사 (패닉어택, 구토 등)
  3. 다른 캐릭터가 대신 연설하도록 변경

---

## HIGH Issues

### [HIGH #1] 감정 비약: 분노에서 사랑으로 2문단
- **축**: EMOTION
- **위치**: chapter_005.md:line 78-82
- **설명**: 78행에서 격노하던 캐릭터가 82행에서 사랑 고백을 합니다.
- **기준 위반**: 분노->사랑 최소 5문단 필요, 실제 2문단
- **수정 제안**: 중간 과도기 감정 3문단 추가 (분노->혼란->이해->수용->사랑)

[... 추가 HIGH/MEDIUM 이슈 ...]
```

#### 축별 요약

```markdown
## 축별 분석 요약

| 공격 축 | 이슈 수 | 최고 심각도 | 점수 |
|---------|---------|------------|------|
| PLOT (플롯 구멍) | 2 | CRITICAL | 65/100 |
| CHARACTER (캐릭터 불일치) | 2 | CRITICAL | 70/100 |
| WORLD (세계관 위반) | 1 | HIGH | 82/100 |
| EMOTION (감정 비약) | 1 | HIGH | 75/100 |
| TRUST (독자 신뢰) | 1 | MEDIUM | 80/100 |

**종합 적대적 점수**: 74/100
**판정**: REVISE_REQUIRED
```

#### 판정 기준

```spec
const VERDICTS = {
  BATTLE_HARDENED: {
    range: "90-100",
    meaning: "적대적 검증을 통과. 출판/연재 품질.",
    action: "진행 OK"
  },
  MINOR_WOUNDS: {
    range: "80-89",
    meaning: "경미한 이슈만 존재. 선택적 수정.",
    action: "진행 가능, 수정 권장"
  },
  REVISE_REQUIRED: {
    range: "65-79",
    meaning: "논리적 허점 존재. 수정 후 재검증 필요.",
    action: "수정 후 재검증"
  },
  FUNDAMENTAL_ISSUES: {
    range: "50-64",
    meaning: "근본적 문제 존재. 상당한 수정 필요.",
    action: "대규모 수정 또는 재작성 검토"
  },
  REWRITE_NEEDED: {
    range: "0-49",
    meaning: "적대적 검증 실패. 전면 재작성 필요.",
    action: "재작성 권장"
  }
}
```

### Phase 7: 검증 결과 저장

```spec
// JSON 결과 저장
const report = {
  review_type: "adversarial",
  chapter: targetChapter,
  level: level, // 1, 2, or 3
  timestamp: new Date().toISOString(),
  total_score: 74,
  verdict: "REVISE_REQUIRED",
  issue_counts: { critical: 2, high: 3, medium: 2 },
  axes: {
    plot: { score: 65, issues: [...] },
    character: { score: 70, issues: [...] },
    world: { score: 82, issues: [...] },
    emotion: { score: 75, issues: [...] },
    trust: { score: 80, issues: [...] }
  },
  recurring_issues: [...],
  structural_questions: [...],
  cross_validated_issues: [...]
}

// 저장 경로
Write(`reviews/adversarial-chapter_${N}-${timestamp}.json`, JSON.stringify(report))
```

### Phase 8: 다음 단계 안내

```markdown
## 다음 단계

### BATTLE_HARDENED (90+)
적대적 검증을 통과했습니다! 이 챕터는 까다로운 독자도 만족시킬 품질입니다.
다음: /write (다음 챕터) 또는 /revise-pipeline (최종 교정)

### REVISE_REQUIRED (65-79)
수정이 필요한 이슈가 있습니다.

우선순위별 수정 순서:
1. CRITICAL 이슈 (즉시 수정)
2. HIGH 이슈 (수정 강력 권장)
3. MEDIUM 이슈 (선택적 수정)

수정 후: /adversarial-review (재검증)

### REWRITE_NEEDED (0-49)
근본적 문제가 있습니다. 재작성을 권장합니다.

재작성 전 확인:
1. 플롯 아웃라인이 논리적인가? → /review --target=chapters/chapter_{N}.json
2. 캐릭터 설계가 충분한가? → /review --target=characters/
3. 세계관 규칙이 명확한가? → /review --target=world/
```

## 3단계 에스컬레이션 상세

### Level 1: 친절한 독자

```
관점: "이 소설을 즐기려는 독자"
관용도: 높음
장르 관습: 대부분 수용
공격 대상: 명백한 오류만
용도: 초고 단계, 빠른 피드백
```

- 명백한 플롯 구멍만 지적
- 장르 관습 내 편의성 허용
- 감정 비약 기준 완화 (2문단 → 1문단)
- "독자가 너무 신경 쓰지 않을 것"은 PASS

### Level 2: 까다로운 편집자

```
관점: "출판사 편집자"
관용도: 보통
장르 관습: 근거 요구
공격 대상: 모든 논리적 허점
용도: 퇴고 단계, 품질 향상
```

- 모든 인과관계 검증
- 장르 관습도 작품 내 근거 요구
- 감정 비약 기준 표준 적용
- "프로 작가라면 고쳤을 것"이 기준

### Level 3: 적대적 비평가

```
관점: "이 작품을 싫어하는 비평가"
관용도: 제로
장르 관습: 불인정
공격 대상: 모든 약점
용도: 최종 검증, 출판 전 체크
```

- "이 작품이 왜 나쁜지"를 증명하려는 관점
- 어떤 양보도 없음
- 모든 우연은 "작가의 게으름"으로 판정
- 문학적 수준에서 판단
- 1개의 결함이라도 있으면 지적

## 옵션

### --level

검증 레벨 직접 지정:
```bash
/adversarial-review --level=1    # 친절한 독자
/adversarial-review --level=2    # 까다로운 편집자
/adversarial-review --level=3    # 적대적 비평가
```

### --axis

특정 축만 검증:
```bash
/adversarial-review --axis=plot         # 플롯 구멍만
/adversarial-review --axis=character    # 캐릭터 불일치만
/adversarial-review --axis=world        # 세계관 위반만
/adversarial-review --axis=emotion      # 감정 비약만
/adversarial-review --axis=trust        # 독자 신뢰만
```

### --target

특정 챕터 지정:
```bash
/adversarial-review 5                   # 5화 검증
/adversarial-review 1-10                # 1~10화 범위 검증
/adversarial-review --target=latest     # 최근 작성 챕터
```

### --compare

이전 검증과 비교:
```bash
/adversarial-review 5 --compare         # 이전 검증 대비 변화 표시
```

비교 시 출력:
```markdown
## 이전 검증 대비 변화

| 항목 | 이전 | 현재 | 변화 |
|------|------|------|------|
| CRITICAL | 3 | 1 | -2 개선 |
| HIGH | 2 | 2 | 0 유지 |
| MEDIUM | 4 | 1 | -3 개선 |
| 종합 점수 | 58 | 78 | +20 개선 |

해결된 이슈:
- [CRITICAL] 파괴된 다리 횡단 -> 우회 경로 추가로 해결
- [CRITICAL] 사망 캐릭터 재등장 -> 해당 장면 삭제

여전히 남은 이슈:
- [HIGH] 캐릭터 감정 비약 (78행)
```

## 통합 워크플로우

```
챕터 작성 완료
  |
  v
/adversarial-review --level=1 (초고 단계)
  |
  v
수정 반영
  |
  v
/adversarial-review --level=2 (퇴고 단계)
  |
  v
수정 반영
  |
  v
/adversarial-review --level=3 --compare (최종 검증)
  |
  +-- BATTLE_HARDENED (90+) --> 다음 챕터 진행
  |
  +-- REVISE_REQUIRED (65-79) --> 추가 수정 후 재검증
  |
  +-- REWRITE_NEEDED (<50) --> 재작성 또는 구조적 질문
```

## Devil's Advocate 에이전트 행동 규칙

적대적 검증 에이전트가 따라야 할 핵심 규칙:

1. **선의의 해석 금지**: 모호한 부분은 항상 나쁘게 해석하라
2. **독립 검증**: 작성자의 의도를 추측하지 말고, 텍스트만으로 판단하라
3. **근거 필수**: 모든 지적에는 반드시 텍스트 근거(파일:라인)를 제시하라
4. **복수 관점**: 최소 "장르 독자", "일반 독자", "비평가" 3관점 적용하라
5. **정량화**: 감정 비약은 문단 수로, 시간 모순은 시간으로 정량화하라
6. **대안 제시**: 공격만 하지 말고 반드시 수정 방향을 제시하라
