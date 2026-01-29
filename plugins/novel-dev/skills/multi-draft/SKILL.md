---
name: multi-draft
description: |
  같은 장면을 여러 접근법으로 작성하고 비교합니다.
  <example>이 장면 여러 버전으로 써봐</example>
  <example>multi draft</example>
  <example>다른 방식으로도 써봐</example>
  <example>A/B 테스트</example>
  <example>초안 비교</example>
  <example>/multi-draft</example>
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

# Multi-Draft Skill

> **Note**: 이 문서의 코드 블록은 AI 오케스트레이터를 위한 실행 패턴 명세입니다. 실행 가능한 TypeScript/JavaScript 코드가 아닙니다.

같은 챕터 또는 장면을 2-3가지 다른 접근법으로 작성하고, 객관적으로 비교한 뒤 최적 초안을 선택하는 스킬입니다.

## 워크플로우

### Phase 1: 대상 및 접근법 정의

#### Step 1: 대상 장면 결정

```spec
// 대상 결정
const target = detectTarget()
  || await AskUserQuestion("어떤 장면을 여러 버전으로 작성할까요?", [
    "특정 챕터 전체 (예: 5화)",
    "특정 장면만 (예: 5화 고백 장면)",
    "특정 구간 (예: 5화 45행~89행)"
  ])

// 대상 컨텍스트 로드
const context = {
  plotRequirements: Read(`chapters/chapter_${N}.json`),
  characters: Read(`characters/*.json`),
  world: Read(`world/world.json`),
  styleGuide: Read(`meta/style-guide.json`),
  previousSummaries: Read(`context/summaries/chapter_${N-1}_summary.md`),
  foreshadowing: Read(`plot/foreshadowing.json`)
}
```

#### Step 2: 접근법 선택

AskUserQuestion으로 비교할 접근법을 선택합니다:

```spec
const approachType = await AskUserQuestion(
  "어떤 차원에서 변주할까요? (복수 선택 가능)",
  [
    "톤 변주: 밝은 vs 어두운 vs 중립",
    "시점 변주: 1인칭 vs 3인칭 vs 다시점",
    "구조 변주: 시간순 vs 역순 vs 교차",
    "스타일 변주: 묘사 중심 vs 대화 중심 vs 액션 중심",
    "감정 변주: 감정 절제 vs 감정 폭발 vs 내면 독백",
    "직접 지정 (커스텀 접근법)"
  ]
)
```

**접근법 프리셋:**

| 변주 차원 | Draft A | Draft B | Draft C |
|----------|---------|---------|---------|
| **톤** | 밝고 희망적 | 어둡고 긴장감 | 중립적 서사 |
| **시점** | 1인칭 내면독백 | 3인칭 전지적 | 다시점 교차 |
| **구조** | 시간순 전개 | 결말부터 역순 | 두 시간대 교차 |
| **스타일** | 감각 묘사 중심 | 대화 중심 | 액션/사건 중심 |
| **감정** | 감정 절제 (여백) | 감정 폭발 (직접) | 내면 독백 (깊이) |

**커스텀 지정 시:**
```spec
if (approachType === "직접 지정") {
  const customApproaches = await AskUserQuestion(
    "각 초안의 접근법을 설명해주세요.\n예: 'A는 유머러스하게, B는 비극적으로, C는 미스터리하게'",
    [] // 자유 입력
  )
}
```

#### Step 3: 초안 수 결정

```spec
const draftCount = await AskUserQuestion("몇 개의 초안을 작성할까요?", [
  "2개 (빠른 비교)",
  "3개 (다각도 비교, 권장)"
])
```

### Phase 2: 병렬 초안 작성

각 초안을 독립된 novelist 에이전트에게 병렬로 위임합니다:

```spec
// 공통 컨텍스트 (모든 초안이 공유)
const sharedContext = `
## 공통 요구사항 (모든 초안 동일)
- 플롯: ${context.plotRequirements}
- 등장인물: ${context.characters}
- 세계관: ${context.world}
- 복선: ${context.foreshadowing}
- 이전 내용: ${context.previousSummaries}

## 필수 준수 사항
- 챕터 플롯의 모든 비트를 포함할 것
- 필수 복선을 자연스럽게 심을 것
- 챕터 엔드 훅을 포함할 것
- 캐릭터 설정을 준수할 것
`

// Draft A
const draftA = Task({
  subagent_type: "novel-dev:novelist",
  model: "opus",
  prompt: `다음 장면을 작성하세요.

${sharedContext}

## 이 초안의 접근법: ${approach_A}
${getApproachGuidelines(approach_A)}

## 출력
- 파일명: drafts/chapter_${N}_draft_A.md
- 접근법 태그를 파일 상단에 주석으로 기록
`
})

// Draft B
const draftB = Task({
  subagent_type: "novel-dev:novelist",
  model: "opus",
  prompt: `다음 장면을 작성하세요.

${sharedContext}

## 이 초안의 접근법: ${approach_B}
${getApproachGuidelines(approach_B)}

## 출력
- 파일명: drafts/chapter_${N}_draft_B.md
- 접근법 태그를 파일 상단에 주석으로 기록
`
})

// Draft C (3개 선택 시)
const draftC = draftCount === 3 ? Task({
  subagent_type: "novel-dev:novelist",
  model: "opus",
  prompt: `다음 장면을 작성하세요.

${sharedContext}

## 이 초안의 접근법: ${approach_C}
${getApproachGuidelines(approach_C)}

## 출력
- 파일명: drafts/chapter_${N}_draft_C.md
- 접근법 태그를 파일 상단에 주석으로 기록
`
}) : null

// 병렬 실행
const drafts = await Promise.all(
  [draftA, draftB, draftC].filter(Boolean)
)
```

**접근법별 세부 가이드라인:**

```spec
function getApproachGuidelines(approach) {
  const guidelines = {
    // 톤 변주
    "밝은": `
      - 희망적이고 따뜻한 분위기
      - 유머 요소 자연스럽게 삽입
      - 갈등도 성장의 기회로 프레이밍
      - 밝은 감각 묘사 (햇살, 미소, 따뜻함)
    `,
    "어두운": `
      - 긴장감과 불안감 유지
      - 캐릭터의 그림자와 두려움 강조
      - 환경 묘사로 분위기 조성 (어둠, 침묵, 차가움)
      - 갈등의 무게감 강조
    `,

    // 시점 변주
    "1인칭": `
      - POV 캐릭터의 내면 독백 중심
      - 제한된 시점: POV가 모르는 것은 독자도 모름
      - 감각과 감정을 직접적으로 전달
      - "나는", "내가" 사용
    `,
    "3인칭": `
      - 전지적 또는 제한적 3인칭
      - 객관적 묘사와 내면 묘사의 균형
      - 여러 캐릭터의 시각을 보여줄 수 있음
      - 거리감 있는 서술로 서사적 무게감
    `,
    "다시점": `
      - 2-3 캐릭터 시점 교차
      - 각 시점 전환 시 명확한 구분
      - 같은 사건을 다른 각도에서 조명
      - 시점 간 정보 격차 활용한 서스펜스
    `,

    // 구조 변주
    "시간순": `
      - 사건 발생 순서대로 전개
      - 자연스러운 인과관계 구축
      - 시간의 흐름에 따른 감정 축적
    `,
    "역순": `
      - 결말/결과부터 시작
      - 어떻게 여기까지 왔는지 역추적
      - 미스터리와 호기심 유발
      - 아는 결말에 도달하는 긴장감
    `,
    "교차": `
      - 현재와 과거 (또는 두 시간대) 교차
      - 두 시간대가 서로를 조명
      - 점진적 수렴으로 서스펜스 구축
      - 교차점에서 반전/깨달음
    `,

    // 스타일 변주
    "묘사 중심": `
      - 감각 묘사 풍부: 시각, 청각, 촉각, 후각, 미각
      - 환경과 분위기로 감정 전달
      - 문장이 길고 리듬감 있음
      - 은유와 비유 적극 활용
    `,
    "대화 중심": `
      - 대화 비율 70%+ 목표
      - 캐릭터 목소리로 정보와 감정 전달
      - 대화 사이 최소한의 행동/표정 묘사
      - 서브텍스트(말 속에 숨겨진 의미) 활용
    `,
    "액션 중심": `
      - 짧고 강렬한 문장
      - 행동과 사건 중심 전개
      - 빠른 페이싱
      - 묘사는 동적 요소에 집중
    `
  }
  return guidelines[approach] || approach
}
```

### Phase 3: 비교 분석

모든 초안이 완성되면 critic 에이전트가 객관적으로 비교합니다:

```spec
const comparison = Task({
  subagent_type: "novel-dev:critic",
  model: "opus",
  prompt: `다음 초안들을 객관적으로 비교 분석하세요.

## 초안 목록
- Draft A (${approach_A}): ${draftA_content}
- Draft B (${approach_B}): ${draftB_content}
${draftC_content ? `- Draft C (${approach_C}): ${draftC_content}` : ""}

## 플롯 요구사항
${context.plotRequirements}

## 비교 기준 (각 0-100)

### 1. 플롯 충실도 (PLOT)
- 챕터 플롯의 모든 비트를 포함했는가?
- 복선이 자연스럽게 심겨졌는가?
- 엔드 훅이 강력한가?

### 2. 캐릭터 진정성 (CHA)
- 캐릭터가 설정에 맞게 행동하는가?
- 캐릭터의 목소리가 살아있는가?
- 캐릭터 간 케미스트리가 느껴지는가?

### 3. 감정 임팩트 (EMO)
- 독자가 감정적으로 반응할 장면이 있는가?
- 감정의 깊이와 진정성은?
- 장르별 필수 감정 비트가 포함되었는가?

### 4. 독자 몰입도 (ENJ)
- 페이지 터너 퀄리티는?
- 페이싱이 적절한가?
- 독자가 지루해할 구간이 있는가?

### 5. 문체 품질 (STY)
- 문장이 매끄럽고 자연스러운가?
- 장르에 맞는 문체인가?
- 한국어 표현의 수준은?

### 6. 독창성 (ORI)
- 뻔하지 않은 전개가 있는가?
- 접근법이 장면에 신선함을 더하는가?
- 클리셰를 피했는가?

## 출력 형식

각 초안의 각 기준별 점수와 종합 점수, 그리고:
- 각 초안의 가장 강력한 순간 (best moment)
- 각 초안의 가장 약한 순간 (worst moment)
- 하이브리드 가능성 (두 초안의 장점을 결합)
- 최종 추천과 근거
`
})
```

추가로 beta-reader 에이전트가 독자 경험 관점에서 비교:

```spec
const readerComparison = Task({
  subagent_type: "novel-dev:beta-reader",
  model: "sonnet",
  prompt: `독자 관점에서 다음 초안들을 비교하세요.

## 초안 목록
- Draft A: ${draftA_content}
- Draft B: ${draftB_content}
${draftC_content ? `- Draft C: ${draftC_content}` : ""}

질문:
1. 어떤 초안이 가장 "페이지를 넘기고 싶은" 충동을 주는가?
2. 어떤 초안에서 캐릭터에 가장 감정이입이 되는가?
3. 어떤 초안의 엔딩이 가장 다음 화가 궁금한가?
4. 어떤 초안이 가장 "이 소설 추천하고 싶다"고 느끼게 하는가?

각 질문에 대해 순위를 매기고 이유를 설명하세요.
`
})

// 병렬 실행
const [criticResult, readerResult] = await Promise.all([
  comparison,
  readerComparison
])
```

### Phase 4: 비교 결과 출력

```markdown
+==================================================+
|          MULTI-DRAFT COMPARISON                   |
+==================================================+
|                                                   |
|  대상: chapter_005.md (고백 장면)                  |
|  초안 수: 3                                       |
|  변주 차원: 시점                                   |
|                                                   |
+--------------------------------------------------+
|                                                   |
|  Draft A: 1인칭 내면독백 중심                      |
|  +-- PLOT: 85  CHA: 90  EMO: 92  ENJ: 71         |
|  +-- STY: 88   ORI: 80                            |
|  +-- 종합: 84.3                                   |
|  +-- 강점: 감정 몰입 극대화, 심쿵 포인트 강렬      |
|  +-- 약점: 페이싱 느림, 다른 캐릭터 시각 부재      |
|  +-- 글자수: 4,200자                              |
|  +-- BEST: "심장이 너무 빠르게 뛰어서..." (L.45)  |
|  +-- WORST: 3-4문단 내면 독백 과다 (L.78-92)      |
|                                                   |
|  Draft B: 3인칭 액션 중심                          |
|  +-- PLOT: 88  CHA: 82  EMO: 74  ENJ: 88         |
|  +-- STY: 85   ORI: 78                            |
|  +-- 종합: 82.5                                   |
|  +-- 강점: 페이싱 빠름, 장면 전환 매끄러움          |
|  +-- 약점: 감정 전달 부족, 표면적 묘사             |
|  +-- 글자수: 3,800자                              |
|  +-- BEST: 고백 직전 침묵 장면 (L.67)             |
|  +-- WORST: 감정 설명 부족한 반응 (L.82)          |
|                                                   |
|  Draft C: 다시점 교차                              |
|  +-- PLOT: 90  CHA: 88  EMO: 82  ENJ: 85         |
|  +-- STY: 82   ORI: 92                            |
|  +-- 종합: 86.5                                   |
|  +-- 강점: 서스펜스 극대화, 양측 심리 동시 전달     |
|  +-- 약점: 시점 전환 시 혼란 가능성               |
|  +-- 글자수: 4,500자                              |
|  +-- BEST: 두 시점 수렴하는 순간 (L.110)          |
|  +-- WORST: 첫 시점 전환 어색 (L.35)              |
|                                                   |
+--------------------------------------------------+
|                                                   |
|  CRITIC 추천: Draft C (종합 86.5, 균형 최고)       |
|  READER 추천: Draft A (감정 임팩트 최대)           |
|                                                   |
|  HYBRID 제안: Draft A의 감정 묘사 + Draft C 구조   |
|  "Draft C의 다시점 교차 구조를 유지하되,            |
|   주인공 시점에서 Draft A의 내면독백 깊이를 적용"   |
|                                                   |
+==================================================+
```

**점수 레이더 차트 (텍스트 표현):**

```markdown
## 점수 비교 레이더

         PLOT
          |
    ORI --+-- CHA
   /      |      \
  /       |       \
STY ------+------ EMO
          |
         ENJ

Draft A: EMO 압도적 (92), ENJ 약점 (71)
Draft B: ENJ 최고 (88), EMO 약점 (74)
Draft C: 가장 균형 잡힌 분포 (82-92)
```

### Phase 5: 사용자 선택

```spec
const choice = await AskUserQuestion(
  "어떤 초안을 채택하시겠습니까?",
  [
    `Draft A 채택 (${approach_A}, 종합 ${scoreA})`,
    `Draft B 채택 (${approach_B}, 종합 ${scoreB})`,
    ...(draftC ? [`Draft C 채택 (${approach_C}, 종합 ${scoreC})`] : []),
    "하이브리드: 두 초안의 장점 결합",
    "전부 폐기 후 새로운 접근법"
  ]
)
```

### Phase 6: 선택 후 처리

#### 단일 초안 채택 시

```spec
if (choice.startsWith("Draft")) {
  const selected = choice.includes("A") ? "A" : choice.includes("B") ? "B" : "C"

  // 선택된 초안을 정식 챕터로 저장
  const draftContent = Read(`drafts/chapter_${N}_draft_${selected}.md`)
  Write(`chapters/chapter_${N}.md`, draftContent)

  // 메타데이터 기록
  Write(`drafts/chapter_${N}_selection.json`, JSON.stringify({
    selected_draft: selected,
    approach: approaches[selected],
    scores: allScores,
    reason: choice,
    timestamp: new Date().toISOString(),
    alternatives_preserved: true
  }))

  console.log(`Draft ${selected} 채택 완료. chapters/chapter_${N}.md로 저장되었습니다.`)
  console.log("미채택 초안은 drafts/ 폴더에 보존됩니다.")
}
```

#### 하이브리드 채택 시

```spec
if (choice === "하이브리드") {
  const hybridSpec = await AskUserQuestion(
    "어떤 요소를 결합할까요?",
    [
      `Draft A 기반 + Draft B의 페이싱`,
      `Draft B 기반 + Draft A의 감정 묘사`,
      `Draft C 구조 + Draft A의 내면 독백`,
      "직접 지정"
    ]
  )

  // 하이브리드 작성을 novelist에게 위임
  const hybridDraft = Task({
    subagent_type: "novel-dev:novelist",
    model: "opus",
    prompt: `다음 두 초안의 장점을 결합한 하이브리드 초안을 작성하세요.

## 결합 지시
${hybridSpec}

## 초안 A
${draftA_content}

## 초안 B
${draftB_content}

${draftC_content ? `## 초안 C\n${draftC_content}` : ""}

## 결합 원칙
1. 지정된 기반 초안의 전체 구조를 유지하세요
2. 지정된 요소만 다른 초안에서 가져오세요
3. 결합이 자연스럽게 이어지도록 연결 부분을 다듬으세요
4. 두 초안의 톤이 충돌하지 않도록 통일하세요

## 출력
- 파일명: drafts/chapter_${N}_draft_hybrid.md
`
  })

  // 하이브리드를 다시 critic에게 검증
  const hybridReview = Task({
    subagent_type: "novel-dev:critic",
    model: "opus",
    prompt: `하이브리드 초안을 원본 초안들과 비교 평가하세요.
    하이브리드가 원본 초안들의 장점을 성공적으로 결합했는지 확인하세요.

    하이브리드: ${hybridDraft}
    원본 A: ${draftA_content}
    원본 B: ${draftB_content}
    `
  })

  // 결과에 따라 하이브리드 채택 또는 재시도
}
```

#### 전부 폐기 시

```spec
if (choice === "전부 폐기") {
  const newApproach = await AskUserQuestion(
    "새로운 접근법을 설명해주세요. 이전 초안에서 배운 것을 반영합니다.",
    [] // 자유 입력
  )

  // 이전 초안의 강점/약점을 컨텍스트로 전달하여 새 초안 작성
  console.log("이전 초안들은 drafts/ 폴더에 보존됩니다.")
  console.log("/multi-draft를 다시 실행하여 새 초안을 작성하세요.")
}
```

### Phase 7: 결과 저장

```spec
// 비교 분석 결과 저장
Write(`drafts/chapter_${N}_comparison.json`, JSON.stringify({
  chapter: N,
  timestamp: new Date().toISOString(),
  approaches: {
    A: { name: approach_A, score: scoreA, file: `chapter_${N}_draft_A.md` },
    B: { name: approach_B, score: scoreB, file: `chapter_${N}_draft_B.md` },
    ...(draftC ? { C: { name: approach_C, score: scoreC, file: `chapter_${N}_draft_C.md` } } : {})
  },
  critic_analysis: criticResult,
  reader_analysis: readerResult,
  selected: choice,
  hybrid_spec: hybridSpec || null
}))

// drafts/ 디렉토리 구조
// drafts/
//   chapter_005_draft_A.md
//   chapter_005_draft_B.md
//   chapter_005_draft_C.md
//   chapter_005_draft_hybrid.md (하이브리드 시)
//   chapter_005_comparison.json
//   chapter_005_selection.json
```

## 옵션

### --approaches

접근법을 직접 지정:
```bash
/multi-draft 5 --approaches="1인칭,3인칭,다시점"
/multi-draft 5 --approaches="밝은,어두운"
/multi-draft 5 --approaches="대화 중심,묘사 중심,액션 중심"
```

### --count

초안 수 지정:
```bash
/multi-draft 5 --count=2    # 2개 초안
/multi-draft 5 --count=3    # 3개 초안 (기본값)
```

### --scene

특정 장면만 비교:
```bash
/multi-draft 5 --scene="고백 장면"
/multi-draft 5 --scene="전투 장면"
/multi-draft 5 --scene=2    # 2번째 씬만
```

### --auto

자동 채택 모드 (최고 점수 초안 자동 선택):
```bash
/multi-draft 5 --auto
```

### --quick

빠른 비교 모드 (sonnet 에이전트 사용, 짧은 분량):
```bash
/multi-draft 5 --quick
```

## 접근법 프리셋 상세

### 장르별 추천 접근법

```spec
const genrePresets = {
  "로맨스": {
    recommended: "감정 변주",
    approaches: ["감정 절제 (여백의 미)", "감정 폭발 (직접 묘사)", "내면 독백 (깊이)"],
    reason: "로맨스는 감정 전달 방식이 독자 만족도에 가장 큰 영향"
  },
  "판타지": {
    recommended: "스타일 변주",
    approaches: ["묘사 중심 (세계관 몰입)", "액션 중심 (전투 긴장감)", "대화 중심 (캐릭터 케미)"],
    reason: "판타지는 세계관과 액션의 균형이 핵심"
  },
  "미스터리": {
    recommended: "구조 변주",
    approaches: ["시간순 (클래식 추리)", "역순 (결과부터)", "다시점 (용의자별)"],
    reason: "미스터리는 정보 공개 순서가 서스펜스의 핵심"
  },
  "공포": {
    recommended: "톤 변주",
    approaches: ["심리적 공포 (암시)", "직접적 공포 (묘사)", "일상 속 공포 (대비)"],
    reason: "공포는 분위기 조성 방식에 따라 효과가 극적으로 달라짐"
  },
  "SF": {
    recommended: "시점 변주",
    approaches: ["1인칭 (발견의 경이)", "3인칭 (객관적 서사)", "다시점 (사회적 영향)"],
    reason: "SF는 시점에 따라 기술/사회 묘사의 깊이가 달라짐"
  }
}
```

### 특수 상황 프리셋

| 상황 | 추천 접근법 | 이유 |
|------|-----------|------|
| 클라이맥스 장면 | 구조 변주 (시간순/역순/교차) | 클라이맥스는 구조가 임팩트를 좌우 |
| 고백/감정 장면 | 감정 변주 (절제/폭발/독백) | 감정 전달 방식이 핵심 |
| 전투/액션 장면 | 스타일 변주 (묘사/대화/액션) | 속도감과 긴장감의 균형 |
| 반전 장면 | 시점 변주 (1인칭/3인칭/다시점) | 정보 제한이 반전 효과에 영향 |
| 일상 장면 | 톤 변주 (밝은/중립/어두운) | 톤이 장면의 의미를 결정 |

## 통합 워크플로우

```
챕터 플롯 확정
  |
  v
/multi-draft (접근법 선택)
  |
  v
병렬 초안 작성 (2-3개 novelist 에이전트)
  |
  v
critic + beta-reader 비교 분석
  |
  v
비교 리포트 출력
  |
  v
사용자 선택
  |
  +-- 단일 채택 --> chapters/chapter_N.md 저장
  |
  +-- 하이브리드 --> novelist가 결합 --> critic 재검증
  |
  +-- 전부 폐기 --> 새 접근법으로 재시도
  |
  v
/verify-chapter 또는 /adversarial-review
```

## 비교 기준 가중치

기본 가중치 (장르별 조정 가능):

| 기준 | 가중치 | 설명 |
|------|--------|------|
| PLOT (플롯 충실도) | 20% | 플롯 요구사항 준수 |
| CHA (캐릭터 진정성) | 20% | 캐릭터 설정 준수 및 매력 |
| EMO (감정 임팩트) | 20% | 감정적 반응 유발력 |
| ENJ (독자 몰입도) | 20% | 페이지 터너 퀄리티 |
| STY (문체 품질) | 10% | 문장력과 표현력 |
| ORI (독창성) | 10% | 신선함과 창의성 |

**장르별 가중치 조정:**

| 장르 | PLOT | CHA | EMO | ENJ | STY | ORI |
|------|------|-----|-----|-----|-----|-----|
| 로맨스 | 15% | 20% | 25% | 15% | 15% | 10% |
| 판타지 | 20% | 15% | 15% | 25% | 10% | 15% |
| 미스터리 | 25% | 15% | 15% | 25% | 10% | 10% |
| 공포 | 15% | 15% | 30% | 20% | 10% | 10% |
| 일상 | 10% | 25% | 25% | 15% | 15% | 10% |
