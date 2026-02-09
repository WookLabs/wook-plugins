---
name: 21-wisdom
description: 집필 중 발견한 스타일 패턴, 복선, 용어 축적 및 재사용
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

# /wisdom - Wisdom Accumulation System

소설 집필 과정에서 발견한 지혜를 축적하고, 다음 챕터 집필에 자동으로 주입하는 시스템입니다.

## Quick Start
```bash
/wisdom              # 전체 wisdom 요약 표시
/wisdom show         # 전체 wisdom 요약 표시
/wisdom check        # 미회수 복선, 미사용 용어 등 진단
/wisdom add style "감정 묘사에 날씨를 대리자로 쓰면 효과적"
/wisdom add voice "강민호" "평소엔 반말, 긴장하면 존댓말로 전환"
/wisdom add thread "검은 반지" planted:3 target:12
/wisdom add term "영혼결속" "두 존재의 생명력을 연결하는 금지된 마법"
```

## Wisdom 디렉토리 구조

```
meta/wisdom/
  style-discoveries.md    # 문체/서술 발견사항
  voice-patterns.md       # 캐릭터별 말투/어조 패턴
  plot-threads.md         # 복선/떡밥 추적 (심은 챕터 -> 회수 예정 챕터)
  terminology.md          # 확정된 고유명사, 설정 용어
  lessons.md              # 집필 교훈 (효과적/비효과적 기법)
```

모든 파일은 마크다운 형식이며, 형식 가이드는 `references/wisdom-format.md`를 참조합니다.

## 핵심 프로토콜

### A. Wisdom 축적 프로토콜

챕터 집필 완료 후 자동 실행됩니다. `/write` 또는 `/write-all` 흐름에서 챕터가 완성될 때마다 아래 순서로 wisdom을 추출합니다.

#### 1. 스타일 발견 (`style-discoveries.md`)

완성된 챕터를 분석하여 효과적이었던 서술 기법을 기록합니다.

**탐지 대상**:
- 감각 묘사 기법 (시각, 청각, 촉각, 후각, 미각)
- 비유/은유 패턴
- 시점 전환 기법
- 긴장감 조절 방식
- Show vs Tell 비율
- 문장 호흡/리듬 패턴

**기록 형식**:
```markdown
## [챕터 N] 발견 제목
- **효과적**: 어떤 기법이 왜 효과적이었는지
- **적용**: 향후 어떤 상황에서 활용할 수 있는지
```

#### 2. 음성 패턴 (`voice-patterns.md`)

새로 등장하거나 변화한 캐릭터의 말투 특징을 기록합니다.

**탐지 대상**:
- 새 캐릭터 첫 등장 시 말투 프로파일링
- 기존 캐릭터의 감정별 말투 변화
- 캐릭터 간 대화 역학
- 특징적인 말버릇/구문 패턴

**기록 형식**:
```markdown
## 캐릭터명
- **기본 어조**: 반말/존댓말/혼합
- **특징적 표현**: "자주 쓰는 말버릇"
- **감정 변화 패턴**: 화날 때 / 슬플 때 / 기쁠 때
- **첫 등장**: 챕터 N
```

#### 3. 복선 추적 (`plot-threads.md`)

새로 심은 복선을 기록하고, 회수된 복선의 상태를 갱신합니다.

**탐지 대상**:
- 의미심장한 물건/장소/대사
- 떡밥이 될 수 있는 암시적 서술
- 캐릭터 간 미해결 갈등
- 세계관 미스터리

**기록 형식**:
```markdown
## [ACTIVE] 복선 제목
- **심은 위치**: 챕터 N, "관련 문장 또는 요약"
- **회수 예정**: 챕터 M
- **상태**: PLANTED / DEVELOPING / RESOLVED
- **메모**: 회수 방향성이나 주의사항
```

#### 4. 용어 확정 (`terminology.md`)

새 고유명사/설정 용어를 추가합니다.

**탐지 대상**:
- 고유명사 (인명, 지명, 조직명, 아이템명)
- 세계관 고유 개념
- 마법/기술/제도 용어
- 작품 내 은어/속어

**기록 형식**:
```markdown
## 용어
- **정의**: 설명
- **첫 등장**: 챕터 N
- **관련 설정**: 연관된 세계관 요소
```

#### 5. 집필 교훈 (`lessons.md`)

집필 과정에서 발견한 효과적/비효과적 기법을 기록합니다.

**기록 형식**:
```markdown
## [챕터 N] 교훈 제목
- **발견**: 무엇을 깨달았는지
- **효과적**: 잘 작동한 점
- **비효과적**: 잘 작동하지 않은 점
- **향후 적용**: 앞으로 어떻게 활용할지
```

### B. Wisdom 주입 프로토콜

다음 챕터 집필 시 자동으로 관련 wisdom을 컨텍스트에 주입합니다.

#### 주입 순서

1. **관련성 선별**: 축적된 wisdom 중 해당 챕터에 관련된 항목을 선별
   - 등장 캐릭터의 음성 패턴
   - 해당 챕터에서 회수 예정인 복선
   - 최근 발견한 효과적 스타일 기법
   - 챕터에 등장하는 용어

2. **프롬프트 주입**: novelist 에이전트 프롬프트에 컨텍스트로 추가
   ```
   ## Wisdom Context (자동 주입)

   ### 이번 챕터 등장 캐릭터 음성
   {관련 voice-patterns 발췌}

   ### 회수 예정 복선
   {이번 챕터에서 회수할 복선 목록}

   ### 적용할 스타일 기법
   {최근 발견한 효과적 기법}

   ### 관련 용어
   {이번 챕터에 등장하는 용어 정의}
   ```

3. **복선 경고**: 미회수 복선 중 회수 시점이 도래했거나 초과한 것을 경고
   ```
   [WARNING] 다음 복선의 회수 시점이 도래했습니다:
   - "검은 반지" (심은 위치: 3화, 회수 예정: 12화) - 현재 12화 집필 중
   ```

#### 토큰 예산

Wisdom 주입은 `/write`의 Context Budget System과 통합됩니다.

| Context Type | Tokens | Priority |
|--------------|--------|----------|
| 음성 패턴 (등장 캐릭터) | 3K | HIGH |
| 회수 예정 복선 | 2K | HIGH |
| 관련 용어 | 1K | MEDIUM |
| 스타일 기법 | 2K | MEDIUM |
| 집필 교훈 | 1K | LOW |

총 wisdom 예산: ~9K tokens (write의 120K 예산 중)

### C. Wisdom 진단 (`/wisdom check`)

축적된 wisdom의 상태를 점검합니다.

#### 점검 항목

1. **미회수 복선**: 회수 예정 챕터를 지났으나 RESOLVED되지 않은 복선
2. **오래된 복선**: PLANTED 상태로 10챕터 이상 방치된 복선
3. **미사용 용어**: 정의되었으나 본문에 한 번도 사용되지 않은 용어
4. **음성 미등록 캐릭터**: characters/*.json에는 있으나 voice-patterns에 없는 캐릭터
5. **스타일 비일관성**: style-discoveries에 기록된 기법이 최근 챕터에서 무시된 경우

#### 출력 형식

```
====================================================================
  Wisdom Health Check
====================================================================

  --- 복선 상태 ---------------------------------------------------
  [!] 미회수 복선 2건
      - "검은 반지" (3화 planted, 12화 예정 → 현재 15화)
      - "지하실 비밀문" (7화 planted, 10화 예정 → 현재 15화)

  [~] 장기 대기 복선 1건
      - "엄마의 편지" (2화 planted → 12챕터째 DEVELOPING)

  --- 용어 상태 ---------------------------------------------------
  [!] 미사용 용어 1건
      - "영혼결속" (5화 정의, 본문 미사용)

  --- 캐릭터 음성 -------------------------------------------------
  [!] 음성 미등록 2명
      - char_005 (이수진)
      - char_008 (박동혁)

  --- 스타일 적용 -------------------------------------------------
  [v] 최근 3챕터 스타일 일관성 양호

====================================================================
  요약: 문제 5건 (긴급 3, 주의 2)
  권장: /wisdom add thread 로 복선 상태 갱신
====================================================================
```

## 커맨드 상세

### `/wisdom` 또는 `/wisdom show`

전체 wisdom 요약을 표시합니다.

**실행 흐름**:
1. `meta/wisdom/` 디렉토리의 모든 파일 로드
2. 각 카테고리별 항목 수 집계
3. 최근 추가된 항목 하이라이트
4. 요약 출력

**출력 형식**:
```
====================================================================
  Wisdom Summary
====================================================================

  스타일 발견: 12건 (최근: "비 내리는 장면의 감각 묘사 기법")
  음성 패턴: 8명 등록
  복선 추적: 15건 (ACTIVE: 7, DEVELOPING: 3, RESOLVED: 5)
  용어 사전: 23개
  집필 교훈: 9건

  최근 업데이트: 챕터 14 집필 후

====================================================================
```

### `/wisdom add style "..."`

스타일 발견사항을 수동으로 추가합니다.

**실행 흐름**:
1. `meta/wisdom/style-discoveries.md` 로드 (없으면 생성)
2. 현재 집필 중인 챕터 번호 확인 (`meta/ralph-state.json`)
3. 형식에 맞춰 항목 추가
4. 파일 저장

### `/wisdom add voice "캐릭터" "패턴"`

캐릭터 음성 패턴을 수동으로 추가합니다.

**실행 흐름**:
1. `meta/wisdom/voice-patterns.md` 로드 (없으면 생성)
2. 해당 캐릭터 섹션이 있으면 업데이트, 없으면 신규 추가
3. 파일 저장

### `/wisdom add thread "복선" planted:N target:M`

복선을 수동으로 추가합니다.

**실행 흐름**:
1. `meta/wisdom/plot-threads.md` 로드 (없으면 생성)
2. ACTIVE 상태로 신규 복선 추가
3. 파일 저장

### `/wisdom add term "용어" "설명"`

용어를 수동으로 추가합니다.

**실행 흐름**:
1. `meta/wisdom/terminology.md` 로드 (없으면 생성)
2. 중복 확인 후 신규 용어 추가
3. 현재 챕터를 첫 등장으로 기록
4. 파일 저장

### `/wisdom check`

미회수 복선, 미사용 용어 등 wisdom 상태를 진단합니다. 위의 "Wisdom 진단" 섹션 참조.

**실행 흐름**:
1. 모든 wisdom 파일 로드
2. `meta/ralph-state.json`에서 현재 챕터 확인
3. `chapters/chapter_*.md`에서 본문 검색 (용어 사용 여부)
4. `characters/*.json`과 voice-patterns 대조
5. 진단 결과 출력

## /write 통합

### 집필 완료 후 자동 축적

`/write` 또는 `/write-all` 흐름에서 챕터 완성 직후 wisdom 축적 프로토콜이 자동 실행됩니다.

```
/write {N}
    |
    v
[챕터 작성 완료]
    |
    v
[Wisdom 축적 프로토콜]
    |-- 스타일 발견 추출
    |-- 음성 패턴 갱신
    |-- 복선 추적 갱신
    |-- 신규 용어 추출
    |-- 집필 교훈 기록
    |
    v
[Wisdom 파일 업데이트]
```

### 집필 시작 시 자동 주입

`/write` 흐름에서 컨텍스트 로딩 단계에 wisdom 주입이 추가됩니다.

```
/write {N}
    |
    v
[Context Loading]
    |-- Style guide (REQUIRED)
    |-- Chapter plot (REQUIRED)
    |-- Previous summaries (HIGH)
    |-- Character profiles (HIGH)
    |-- Wisdom injection (HIGH)    <-- 신규
    |   |-- 등장 캐릭터 음성 패턴
    |   |-- 회수 예정 복선
    |   |-- 관련 용어
    |   |-- 적용할 스타일 기법
    |-- World/Setting (MEDIUM)
    |-- Act context (MEDIUM)
    |
    v
[집필 시작]
```

## 의존 파일

| 파일 | 용도 |
|------|------|
| `meta/wisdom/style-discoveries.md` | 문체/서술 발견사항 |
| `meta/wisdom/voice-patterns.md` | 캐릭터별 말투 패턴 |
| `meta/wisdom/plot-threads.md` | 복선/떡밥 추적 |
| `meta/wisdom/terminology.md` | 고유명사/설정 용어 |
| `meta/wisdom/lessons.md` | 집필 교훈 |
| `meta/ralph-state.json` | 현재 챕터 정보 (읽기 전용) |
| `characters/*.json` | 캐릭터 프로필 (읽기 전용) |
| `chapters/chapter_*.json` | 챕터 플롯 (읽기 전용) |
| `chapters/chapter_*.md` | 완성된 원고 (읽기 전용) |

## 에이전트 활용

| 작업 | 에이전트 | 모델 |
|------|---------|------|
| 스타일 분석 | editor | sonnet |
| 음성 프로파일링 | critic | sonnet |
| 복선 탐지 | plot-architect | opus |
| 용어 추출 | lore-keeper | sonnet |

## 파일 초기화

`meta/wisdom/` 디렉토리가 없는 경우, `/wisdom` 최초 실행 시 자동 생성합니다.

```bash
meta/wisdom/
  style-discoveries.md    # "# Style Discoveries\n\n" 로 초기화
  voice-patterns.md       # "# Voice Patterns\n\n" 로 초기화
  plot-threads.md         # "# Plot Threads\n\n" 로 초기화
  terminology.md          # "# Terminology\n\n" 로 초기화
  lessons.md              # "# Lessons Learned\n\n" 로 초기화
```

## Documentation

**형식 가이드**: See `references/wisdom-format.md`
- 각 wisdom 파일의 상세 형식
- 항목 추가 규칙
- 상태 코드 정의
