---
name: swarm
description: |
  여러 에이전트가 병렬로 소설 작업을 수행합니다.
  <example>swarm으로 검증해줘</example>
  <example>병렬 검증</example>
  <example>swarm 집필</example>
  <example>동시에 여러 챕터</example>
  <example>swarm review 5</example>
  <example>swarm design characters</example>
user-invocable: true
---

# /swarm - Swarm Writing

> **Note**: 이 문서의 코드 블록은 AI 오케스트레이터를 위한 실행 패턴 명세입니다. 실행 가능한 TypeScript/JavaScript 코드가 아닙니다.

> **아키텍처 노트**: 이 스킬은 작업 풀 관리와 배치 실행을 `oh-my-claudecode:swarm`에 위임합니다.
> novel-dev 고유의 모드 정의, 에이전트 라우팅, 도메인별 태스크 타입만 이 스킬에서 관리합니다.

여러 에이전트가 동시에 태스크 풀에서 작업을 가져가며 병렬로 처리하는 Swarm 패턴.

## Quick Start

```bash
/swarm verify 1-12       # 1~12화 병렬 검증
/swarm review 5          # 5화 다관점 병렬 리뷰
/swarm design characters # 캐릭터 병렬 설계
```

## Phase 0: 비용 경고 (Cost Warning)

실행 전 사용자에게 비용을 안내합니다:

> **Swarm 비용 안내**
> 요청된 워커 수: N개 (사용자 지정)
> 모드별 에이전트: verify(consistency-verifier), review(critic+beta-reader+engagement-optimizer+character-voice-analyzer), design(lore-keeper)
>
> 예상 토큰 사용량: 워커당 ~30K 입력 + ~8K 출력

AskUserQuestion으로 사용자 확인:
- "진행" — 전체 워커 투입
- "2워커만" — 최소 병렬로 시작
- "순차 실행" — 워커 1개로 순차 처리

## Swarm 모드

### Mode 1: Swarm Verification (검증 스웜)

여러 검증 에이전트가 동시에 다른 챕터를 검증합니다.

```
/swarm verify 1-12       # 1~12화 전체 검증
/swarm verify 5-8        # 5~8화만 검증
/swarm verify all        # 작성 완료된 전체 챕터 검증
```

#### 실행 프로토콜

**Step 1: 대상 챕터 목록 생성**

```spec
// 범위 파싱
const range = parseRange(args); // e.g. "1-12" → [1,2,...,12]

// 실제 존재하는 챕터만 필터
const targets = range.filter(n =>
  exists(`chapters/chapter_${pad(n)}.md`)
);
```

**Step 2: 태스크 풀 초기화**

```json
{
  "swarm_id": "swarm_{timestamp}",
  "mode": "verification",
  "total_tasks": 12,
  "max_workers": 5,
  "tasks": [
    { "id": "t1", "target": "chapter_001", "status": "pending" },
    { "id": "t2", "target": "chapter_002", "status": "pending" }
  ]
}
```

상태 파일 저장: `.omc/state/swarm-state.json`

**Step 3: Worker 병렬 실행**

최대 5개 Worker를 동시에 실행. 각 Worker는 consistency-verifier 에이전트를 호출:

```spec
// 배치 1: 최대 5개 동시 실행
const batch1 = targets.slice(0, 5).map(chapter =>
  Task({
    subagent_type: "novel-dev:consistency-verifier",
    model: "sonnet",
    prompt: `챕터 ${chapter} 일관성 검증:

    읽기 대상:
    - chapters/chapter_${pad(chapter)}.md
    - chapters/chapter_${pad(chapter)}.json
    - meta/characters.json
    - meta/world.json
    - meta/wisdom/plot-threads.md

    검증 항목:
    1. 캐릭터 외모/나이/말투 일관성
    2. 세계관 규칙 준수
    3. 타임라인 모순
    4. 복선 일관성
    5. 용어 통일

    JSON 형식으로 반환:
    {
      "chapter": N,
      "score": 0-100,
      "verdict": "PASS" | "WARNING" | "FAIL",
      "issues": [
        { "type": "...", "description": "...", "severity": "critical|major|minor", "confidence": 0-100 }
      ],
      "summary": "..."
    }`
  })
);

const results1 = await Promise.all(batch1);
// 배치 2: 남은 태스크 처리
// ... 반복
```

**Step 4: 결과 수집 및 종합 리포트**

```
+==================================================+
|          SWARM VERIFICATION RESULTS              |
+==================================================+
|                                                  |
|  모드: Verification                              |
|  대상: 12 챕터                                   |
|  소요: 병렬 5-worker, 총 12 태스크               |
|                                                  |
|  결과:                                           |
|  PASS: 9 챕터                                    |
|  WARNING: 2 챕터 (ch07, ch11)                    |
|  FAIL: 1 챕터 (ch09)                             |
|                                                  |
|  ch09 이슈: 타임라인 모순 (3건)                   |
|  ch07 이슈: 캐릭터 음성 드리프트 (2건)            |
|  ch11 이슈: 페이싱 느림 (1건)                     |
|                                                  |
+==================================================+
```

결과 저장: `reviews/swarm/swarm_{id}_verification.json`

---

### Mode 2: Swarm Review (리뷰 스웜)

하나의 챕터를 여러 관점에서 동시에 리뷰합니다.

```
/swarm review 5          # 5화 다관점 리뷰
/swarm review 5 --deep   # 5화 심층 리뷰 (5 Worker)
```

#### Worker 구성

| Worker | Agent | Model | 관점 |
|--------|-------|-------|------|
| W1 | critic | opus | 문학 품질 (구조, 문체, 깊이) |
| W2 | beta-reader | sonnet | 독자 경험 (몰입, 감정, 후킹) |
| W3 | consistency-verifier | sonnet | 설정 일관성 (캐릭터, 세계관, 타임라인) |
| W4 | engagement-optimizer | sonnet | 페이싱 (긴장 곡선, 장면 리듬, 비트 타이밍) |
| W5 | character-voice-analyzer | sonnet | 음성 일관성 (말투, OOC 감지, 관계 역학) |

기존 verify-chapter의 3개 검증을 5개로 확장한 심층 리뷰.

#### 실행 프로토콜

**Step 1: 챕터 컨텍스트 준비**

```spec
const chapterNum = parseChapterNum(args);
const chapterMd = read(`chapters/chapter_${pad(chapterNum)}.md`);
const chapterJson = read(`chapters/chapter_${pad(chapterNum)}.json`);
const characters = read('meta/characters.json');
const world = read('meta/world.json');
const brief = read('meta/brief.json');
const wisdom = read('meta/wisdom/');
```

**Step 2: 5개 Worker 동시 실행**

```spec
const [criticResult, betaResult, consistencyResult, pacingResult, voiceResult] =
  await Promise.all([
    Task({
      subagent_type: "novel-dev:critic",
      model: "opus",
      prompt: `챕터 ${chapterNum} 문학 품질 평가:
        - chapters/chapter_${pad(chapterNum)}.md 읽기
        - 구조적 완성도, 문체 수준, 서사적 깊이 평가
        - 점수 (0-100), 이슈, 권장 사항 JSON 반환`
    }),
    Task({
      subagent_type: "novel-dev:beta-reader",
      model: "sonnet",
      prompt: `챕터 ${chapterNum} 독자 경험 분석:
        - chapters/chapter_${pad(chapterNum)}.md 읽기
        - 몰입도, 감정 반응, 이탈 위험 구간, 후킹 효과 분석
        - 점수 (0-100), 이슈, 권장 사항 JSON 반환`
    }),
    Task({
      subagent_type: "novel-dev:consistency-verifier",
      model: "sonnet",
      prompt: `챕터 ${chapterNum} 설정 일관성 검증:
        - chapters/chapter_${pad(chapterNum)}.md + meta/ 읽기
        - 캐릭터, 세계관, 타임라인, 용어 일관성 검사
        - 점수 (0-100), 이슈, 권장 사항 JSON 반환`
    }),
    Task({
      subagent_type: "novel-dev:engagement-optimizer",
      model: "sonnet",
      prompt: `챕터 ${chapterNum} 페이싱 분석:
        - chapters/chapter_${pad(chapterNum)}.md 읽기
        - 긴장 곡선, 장면 리듬, 비트 타이밍 분석
        - 점수 (0-100), 이슈, 권장 사항 JSON 반환`
    }),
    Task({
      subagent_type: "novel-dev:character-voice-analyzer",
      model: "sonnet",
      prompt: `챕터 ${chapterNum} 캐릭터 음성 분석:
        - chapters/chapter_${pad(chapterNum)}.md + meta/wisdom/voice-patterns.md 읽기
        - 말투 일관성, OOC 감지, 관계 역학 분석
        - 점수 (0-100), 이슈, 권장 사항 JSON 반환`
    })
  ]);
```

**Step 3: 종합 리포트**

```
+==================================================+
|          SWARM REVIEW: Chapter 5                 |
+==================================================+
|                                                  |
|  Worker         | Score | Verdict                |
|  --------------|-------|-------------------------|
|  critic         |  87   | PASS                   |
|  beta-reader    |  82   | PASS                   |
|  consistency    |  91   | PASS                   |
|  pacing         |  76   | WARNING                |
|  voice          |  88   | PASS                   |
|                                                  |
|  종합 점수: 84.8 / 100                            |
|  종합 판정: APPROVED (4/5 PASS)                   |
|                                                  |
|  주요 이슈:                                      |
|  [pacing] 중반부 긴장 저하 (신뢰도 82%)           |
|  [critic] 대화 자연스러움 부족 (신뢰도 75%)        |
|                                                  |
+==================================================+
```

결과 저장: `reviews/swarm/chapter_${N}_swarm_review.json`

#### 판정 기준

| Validator | Normal | Chapter 1 (Masterpiece) |
|-----------|--------|------------------------|
| critic | >= 85 | >= 90 |
| beta-reader | >= 75 | >= 80 |
| consistency | >= 85 | >= 90 |
| pacing | >= 70 | >= 80 |
| voice | >= 80 | >= 85 |

- 5개 모두 PASS: **APPROVED**
- 4개 PASS + 1개 WARNING: **APPROVED WITH NOTES**
- 3개 이하 PASS: **REVISION REQUIRED**

---

### Mode 3: Swarm Design (설계 스웜)

설계 단계에서 여러 요소를 동시에 작업합니다.

```
/swarm design characters       # 캐릭터 병렬 설계
/swarm design world            # 세계관 요소 병렬 설계
/swarm design all              # 전체 설계 요소 병렬 처리
```

#### 서브모드

**A. 캐릭터 병렬 설계 (`/swarm design characters`)**

```spec
// characters.json에서 설계 대상 추출
const chars = read('meta/characters.json');
const undesigned = chars.filter(c => !c.detailed);

// 각 캐릭터에 lore-keeper Worker 할당
const results = await batchExecute(undesigned, 5, char =>
  Task({
    subagent_type: "novel-dev:lore-keeper",
    model: "sonnet",
    prompt: `캐릭터 상세 설계: ${char.name}
      - meta/characters.json, meta/world.json 읽기
      - 기본 신상, 배경, 성격, 관계, 음성 패턴 설계
      - characters/${char.id}.json으로 저장`
  })
);
```

Worker 할당 예시:
```
Worker 1: 캐릭터 A 상세 설계 → characters/char_a.json
Worker 2: 캐릭터 B 상세 설계 → characters/char_b.json
Worker 3: 캐릭터 C 상세 설계 → characters/char_c.json
Worker 4: 캐릭터 D 상세 설계 → characters/char_d.json
Worker 5: 캐릭터 E 상세 설계 → characters/char_e.json
```

**B. 세계관 병렬 설계 (`/swarm design world`)**

```
Worker 1: 장소 X 세계관 설계     → meta/world/locations.json
Worker 2: 마법 시스템 규칙 설계   → meta/world/magic-system.json
Worker 3: 사회 구조 설계         → meta/world/society.json
Worker 4: 역사/연대기 구축       → meta/world/history.json
Worker 5: 타임라인 구축          → meta/world/timeline.json
```

**C. 전체 병렬 설계 (`/swarm design all`)**

캐릭터 + 세계관 + 플롯 구조를 동시 작업:
```
Worker 1: 캐릭터 전체            → characters/
Worker 2: 장소/세계관            → meta/world/
Worker 3: 메인 아크              → meta/main-arc.json
Worker 4: 서브 아크들            → meta/sub-arcs/
Worker 5: 타임라인               → meta/timeline.json
```

---

## Swarm 관리 프로토콜

### 작업 조율 (Coordination)

작업 풀 관리, 배치 실행, 재시도, 진행률 표시는 `oh-my-claudecode:swarm`에 위임합니다.

novel-dev swarm은 다음만 담당합니다:
- **모드별 태스크 정의**: verify/review/design 각 모드의 작업 목록 생성
- **에이전트 라우팅**: 모드별 적절한 에이전트 매핑
- **도메인 소유권**: 소설 파일 구조 기반의 소유권 규칙
- **결과 통합**: 소설 도메인에 맞는 결과 병합 및 보고서 생성

oh-my-claudecode:swarm에 위임하는 항목:
- 태스크 풀 관리 (pending/claimed/done 상태)
- 배치 실행 엔진 (워커 수 제어)
- 재시도 로직 (실패 시 자동 재시도)
- 진행률 표시 (.omc/state/)
- 타임아웃 관리

### A. 태스크 정의 (novel-dev 책임)

novel-dev가 정의하는 작업 구조:

```json
{
  "swarm_id": "swarm_20260129_143000",
  "mode": "verification",
  "started_at": "2026-01-29T14:30:00Z",
  "total_tasks": 12,
  "max_workers": 5,
  "tasks": [
    { "id": "t1", "target": "chapter_001", "status": "pending", "agent": "consistency-verifier" },
    { "id": "t2", "target": "chapter_002", "status": "pending", "agent": "consistency-verifier" }
  ]
}
```

이 작업 정의를 `oh-my-claudecode:swarm`에 전달하여 실행 위임.

### B. 충돌 방지 (novel-dev 책임)

소설 파일 구조 기반의 도메인별 소유권 규칙:

| 작업 유형 | 파일 접근 | 충돌 전략 |
|-----------|-----------|-----------|
| 검증 (verify) | 읽기 전용 | 동일 파일 동시 접근 허용 |
| 리뷰 (review) | 읽기 전용 | 동일 파일 동시 접근 허용 |
| 설계 (design) | 쓰기 | 파일 소유권 분리 (Worker당 비중복 파일 세트) |

설계 모드 소유권 규칙 (novel-dev가 정의):
```json
{
  "ownership": {
    "W1": ["characters/char_a.json"],
    "W2": ["characters/char_b.json"],
    "W3": ["meta/world/locations.json"],
    "W4": ["meta/world/magic-system.json"],
    "W5": ["meta/timeline.json"]
  },
  "shared_read": ["meta/characters.json", "meta/world.json", "meta/brief.json"]
}
```

- 각 Worker에 비중복 쓰기 파일 세트 할당
- 공유 참조 파일은 읽기 전용으로 모든 Worker 접근 허용
- Worker가 소유권 외 파일에 쓰기 시도 시 차단

이 소유권 규칙을 `oh-my-claudecode:swarm`에 전달하여 충돌 방지 위임.

### C. 결과 집계 (novel-dev 책임)

모든 Worker 완료 후 종합 리포트 생성:

```
+==================================================+
|          SWARM RESULTS SUMMARY                   |
+==================================================+
|                                                  |
|  Swarm ID: swarm_20260129_143000                 |
|  모드: Verification                              |
|  대상: 12 챕터                                   |
|  소요: 병렬 5-worker, 3 배치, 총 12 태스크        |
|                                                  |
|  결과:                                           |
|  PASS: 9 챕터                                    |
|  WARNING: 2 챕터 (ch07, ch11)                    |
|  FAIL: 1 챕터 (ch09)                             |
|                                                  |
|  ch09 이슈: 타임라인 모순 (3건)                   |
|  ch07 이슈: 캐릭터 음성 드리프트 (2건)            |
|  ch11 이슈: 페이싱 느림 (1건)                     |
|                                                  |
|  권장 조치:                                      |
|  1. /revise 9 --focus timeline                   |
|  2. /revise 7 --focus voice                      |
|  3. /revise 11 --focus pacing                    |
|                                                  |
+==================================================+
```

---

## 출력 파일

| 모드 | 저장 경로 | 형식 |
|------|-----------|------|
| verify | `reviews/swarm/swarm_{id}_verification.json` | JSON |
| review | `reviews/swarm/chapter_{N}_swarm_review.json` | JSON |
| design | 각 설계 파일 (characters/, meta/) | JSON |
| 종합 | `reviews/swarm/swarm_{id}_summary.json` | JSON |

---

## 의존 에이전트

| Agent | Model | 사용 모드 |
|-------|-------|-----------|
| consistency-verifier | sonnet | verify |
| critic | opus | review |
| beta-reader | sonnet | review |
| engagement-optimizer | sonnet | review |
| character-voice-analyzer | sonnet | review |
| lore-keeper | sonnet | design |
| plot-architect | opus | design (arc) |

---

## Documentation

**Swarm 패턴 상세 가이드**: See `references/swarm-patterns.md`
- 3가지 모드별 실행 절차
- Worker 수 최적화
- 충돌 방지 전략
- 에러 복구 절차
