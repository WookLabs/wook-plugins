---
name: emotion-arc
description: |
  작품의 감정 곡선을 분석하고 6가지 기본 아크와 비교합니다.
  <example>감정 아크 분석해줘</example>
  <example>감정 곡선 확인</example>
  <example>이 챕터 감정 흐름은?</example>
  <example>emotion arc</example>
  <example>감정 분석</example>
  <example>감정선 체크</example>
  <example>/emotion-arc</example>
user-invocable: true
allowed-tools:
  - Read
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

# Emotion Arc Analyzer

MIT 연구의 6가지 기본 감정 아크를 기반으로 작품의 감정 곡선을 분석하고, 패턴 매칭 및 개선 제안을 제공합니다.

## Quick Start

```
/emotion-arc              # 전체 작품 감정 아크 분석
/emotion-arc --chapter=5  # 특정 챕터 내부 감정 흐름
/emotion-arc --range=1-5  # 챕터 범위 지정
/emotion-arc --suggest    # 다음 챕터 감정 방향 제안
```

## 6가지 기본 감정 아크 (MIT 연구)

| # | 아크 | 패턴 | 대표작 |
|---|------|------|--------|
| 1 | Rags to Riches | ↗ 지속 상승 | 신데렐라, 알라딘 |
| 2 | Riches to Rags | ↘ 지속 하강 | 로미오와 줄리엣 |
| 3 | Man in a Hole | ↘↗ 하강 후 상승 | 반지의 제왕 |
| 4 | Icarus | ↗↘ 상승 후 하강 | 그레이트 개츠비 |
| 5 | Cinderella | ↗↘↗ 상승-하강-상승 | 해리포터 |
| 6 | Oedipus | ↘↗↘ 하강-상승-하강 | 파우스트 |

상세 정보: [references/arc-patterns.md](references/arc-patterns.md)

## 워크플로우

### Phase 1: 컨텍스트 수집

분석에 필요한 파일 로드:

```
- chapters/*.json          (챕터 구조 및 씬 정보)
- manuscripts/chapter_*.md (실제 원고 텍스트)
- plot/main-arc.json       (메인 플롯 아크)
- plot/sub-arcs/*.json     (서브 플롯)
- plot/structure.json      (전체 구조)
- characters/*.json        (캐릭터 감정 상태 참조)
- project.json             (장르 정보)
```

분석 범위가 지정되지 않은 경우:

```
AskUserQuestion:
  question: "감정 아크를 어떤 범위에서 분석할까요?"
  options:
    - "전체 작품 (모든 챕터)"
    - "특정 챕터 내부 (씬별)"
    - "최근 작성 챕터들"
    - "특정 범위 지정"
```

### Phase 2: 챕터별 감정 점수 매기기

plot-architect 에이전트에게 감정 분석 위임:

```typescript
Task(subagent_type="novel-dev:plot-architect",
  model="opus",
  prompt=`다음 소설의 감정 아크를 분석해주세요.

프로젝트: {project.json}
장르: {genre}
챕터 데이터: {chapters}
원고 텍스트: {manuscripts}
플롯 구조: {plot_structure}

각 챕터(또는 주요 장면)에 대해 다음을 평가하세요:

1. **감정 극성 점수** (-10 ~ +10)
   - -10: 절망, 비극, 파멸
   - -5: 슬픔, 좌절, 위기
   - 0: 중립, 일상, 전환
   - +5: 희망, 성취, 설렘
   - +10: 환희, 승리, 카타르시스

2. **긴장도** (0 ~ 10)
   - 0: 완전 이완 (일상, 휴식)
   - 3: 낮은 긴장 (일상 속 불안)
   - 5: 중간 긴장 (갈등 진행)
   - 7: 높은 긴장 (위기 고조)
   - 10: 극도 긴장 (클라이맥스, 생사 기로)

3. **독자 감정 예측**
   - 주요 감정: (공포, 슬픔, 분노, 기쁨, 설렘, 안도, 긴장, 호기심 등)
   - 감정 강도: 약(1)/중(2)/강(3)

4. **핵심 감정 이벤트**
   - 해당 챕터에서 감정에 가장 큰 영향을 주는 사건/장면
   - 왜 그 점수를 부여했는지 근거

JSON 형식으로 출력:
{
  "chapters": [
    {
      "chapter": 1,
      "title": "...",
      "emotion_score": N,
      "tension": N,
      "reader_emotions": [{"emotion": "...", "intensity": N}],
      "key_event": "...",
      "reasoning": "..."
    }
  ]
}
`)
```

### Phase 3: 아크 패턴 매칭

감정 점수 시계열을 6가지 기본 아크와 비교:

**매칭 알고리즘:**

1. 감정 점수를 정규화 (0~1 범위)
2. 각 기본 아크의 이상적 곡선 생성 (동일 챕터 수 기준)
3. 유클리드 거리 또는 코사인 유사도로 비교
4. 가장 가까운 아크와 일치도(%) 산출

**이상적 곡선 정의:**

| 아크 | 정규화 패턴 (시작 → 끝) |
|------|------------------------|
| Rags to Riches | 0.1 → 0.3 → 0.5 → 0.7 → 0.9 |
| Riches to Rags | 0.9 → 0.7 → 0.5 → 0.3 → 0.1 |
| Man in a Hole | 0.5 → 0.2 → 0.1 → 0.3 → 0.7 |
| Icarus | 0.3 → 0.7 → 0.9 → 0.5 → 0.2 |
| Cinderella | 0.3 → 0.7 → 0.3 → 0.6 → 0.9 |
| Oedipus | 0.7 → 0.3 → 0.6 → 0.3 → 0.1 |

### Phase 4: 시각화 출력

#### 감정 곡선 ASCII 차트

```
감정 +10 |          *              *
      +5 |    *   /  \         /
       0 |--/--\/----\------/----
      -5 |/            \  /
     -10 |               *
         +---------------------------
          1  2  3  4  5  6  7  8  9  (챕터)

  매칭 아크: Cinderella (상승-하강-상승)
  일치도: 78%
```

**차트 생성 규칙:**
- Y축: -10 ~ +10 (5단위 눈금)
- X축: 챕터 번호
- 데이터 포인트: `*`
- 상승선: `/`, 하강선: `\`, 수평선: `-`
- 중립선(0)은 `--`로 표시

#### 긴장도 히트맵

```
챕터:  1  2  3  4  5  6  7  8  9
긴장: ░░ ▒▒ ▓▓ ██ ▒▒ ░░ ▓▓ ██ ██
       2  4  6  9  5  2  7  9  10
```

**히트맵 기호:**
- ░░ : 0-2 (이완)
- ▒▒ : 3-5 (보통)
- ▓▓ : 6-7 (높음)
- ██ : 8-10 (극도)

### Phase 5: 분석 및 제안

#### 5-1: 아크 매칭 결과

```markdown
## 감정 아크 분석 결과

### 매칭 아크: {아크명} ({패턴})
일치도: {N}%

### 6가지 아크 비교
| 아크 | 일치도 | 비고 |
|------|--------|------|
| Rags to Riches | {N}% | {코멘트} |
| Riches to Rags | {N}% | {코멘트} |
| Man in a Hole | {N}% | {코멘트} |
| Icarus | {N}% | {코멘트} |
| Cinderella | {N}% | {코멘트} |
| Oedipus | {N}% | {코멘트} |
```

#### 5-2: 감정 곡선 문제점 진단

| 문제 유형 | 감지 기준 | 영향 |
|-----------|-----------|------|
| 평탄 구간 | 연속 3+ 챕터 감정 변화 < 2 | 독자 지루함, 이탈 위험 |
| 급격한 전환 | 연속 챕터 감정 차이 > 8 | 감정적 비약, 몰입 파괴 |
| 긴장도 급락 | 클라이맥스 전 긴장도 40%+ 하락 | 서스펜스 붕괴 |
| 감정 단조 | 전체 점수가 +/- 한쪽에만 편중 | 감정적 깊이 부족 |
| 클라이맥스 부재 | 후반부 최고점이 전반부보다 낮음 | 반클라이맥스, 허무함 |

```markdown
### 문제점

1. **{문제 유형}** (챕터 {N}-{M})
   - 현상: {구체적 설명}
   - 원인: {추정 원인}
   - 영향: {독자 경험에 미치는 영향}
   - 심각도: 높음/보통/낮음
```

#### 5-3: 장르별 추천 아크

```typescript
const GENRE_ARC_MAP = {
  "로맨스":       { primary: "Cinderella", secondary: "Man in a Hole" },
  "스릴러":       { primary: "Man in a Hole", secondary: "Oedipus" },
  "비극":         { primary: "Riches to Rags", secondary: "Oedipus" },
  "성장물":       { primary: "Rags to Riches", secondary: "Man in a Hole" },
  "판타지":       { primary: "Cinderella", secondary: "Rags to Riches" },
  "미스터리":     { primary: "Man in a Hole", secondary: "Icarus" },
  "호러":         { primary: "Oedipus", secondary: "Riches to Rags" },
  "SF":           { primary: "Icarus", secondary: "Cinderella" },
  "역사소설":     { primary: "Oedipus", secondary: "Riches to Rags" },
  "코미디":       { primary: "Man in a Hole", secondary: "Cinderella" },
  "무협":         { primary: "Rags to Riches", secondary: "Cinderella" },
  "회귀물":       { primary: "Man in a Hole", secondary: "Rags to Riches" },
  "로판":         { primary: "Cinderella", secondary: "Rags to Riches" },
  "현판":         { primary: "Rags to Riches", secondary: "Man in a Hole" },
};
```

```markdown
### 장르 적합성

현재 장르: {장르}
추천 아크: {primary} (대표) / {secondary} (대안)
현재 아크: {detected_arc}
적합도: {HIGH/MEDIUM/LOW}

{장르에 맞는 아크 조정 제안}
```

#### 5-4: 다음 챕터 감정 방향 제안

```markdown
### 다음 챕터 감정 방향 제안

현재 감정 궤적: {최근 3챕터 흐름 요약}
현재 매칭 아크: {arc_name}

**추천 방향:**
1. **{아크 유지}**: 감정 점수 {N} → {M} (이유: {설명})
2. **{전환 옵션}**: 감정 점수 {N} → {M} (이유: {설명})

**긴장도 추천:** {N}/10
**핵심 감정 비트:** {추천 감정 이벤트}

**주의사항:**
- {급격한 전환 시 위험}
- {평탄 지속 시 위험}
```

## 전체 출력 템플릿

```markdown
# 감정 아크 분석 보고서

## 작품 정보
- 제목: {title}
- 장르: {genre}
- 분석 범위: 챕터 {start} ~ {end} ({total}개 챕터)

---

## 1. 감정 곡선

{ASCII 차트}

## 2. 긴장도 히트맵

{히트맵}

{경고/양호 메시지}

## 3. 아크 매칭

매칭 아크: **{아크명}** ({패턴})
일치도: **{N}%**

{6가지 아크 비교 테이블}

## 4. 챕터별 상세

| 챕터 | 감정 | 긴장 | 독자 감정 | 핵심 이벤트 |
|------|------|------|-----------|-------------|
| {N} | {score} | {tension} | {emotions} | {event} |

## 5. 진단

### 강점
{잘 작동하는 부분}

### 문제점
{감정 곡선 이슈}

### 장르 적합성
{장르별 아크 매칭 평가}

## 6. 제안

### 즉시 개선
{우선순위 높은 수정 사항}

### 다음 챕터 방향
{감정 방향 제안}

### 장기 아크 조정
{전체 아크 최적화 제안}
```

## 옵션

### --chapter

특정 챕터 내부의 씬별 감정 흐름 분석:
```bash
/emotion-arc --chapter=5
```

### --range

챕터 범위 지정:
```bash
/emotion-arc --range=1-10
/emotion-arc --range=5-
```

### --suggest

다음 챕터 감정 방향 제안에 집중:
```bash
/emotion-arc --suggest
```

### --compare

특정 아크와 현재 곡선 비교:
```bash
/emotion-arc --compare=cinderella
/emotion-arc --compare=man-in-a-hole
```

### --depth

분석 깊이 조절:
```bash
/emotion-arc --depth=quick      # 빠른 스캔 (sonnet)
/emotion-arc --depth=standard   # 표준 분석 (opus) [기본값]
/emotion-arc --depth=deep       # 심층 분석 (opus, 씬 단위)
```

## 에이전트 활용

| 분석 단계 | 에이전트 | 모델 |
|-----------|---------|------|
| 감정 점수 매기기 | plot-architect | opus |
| 독자 감정 예측 | beta-reader | sonnet |
| 장르 적합성 | genre-validator | sonnet |
| 종합 진단 | critic | opus |

## 출력 파일

분석 결과는 다음 위치에 저장:

```
validations/emotion-arc/
  emotion-arc-analysis.json    # 전체 분석 데이터
  emotion-arc-report.md        # 마크다운 보고서
```

## 연동 스킬

| 스킬 | 연동 방식 |
|------|-----------|
| `/analyze-engagement` | 감정 아크 + 몰입도 통합 분석 |
| `/check-retention` | 감정 급락 = 이탈 위험 구간 |
| `/design-main-arc` | 감정 아크 기반 플롯 설계 |
| `/revise` | 감정 곡선 문제 구간 우선 수정 |
| `/evaluate` | 감정 아크 점수를 품질 지표에 포함 |

## 예시 시나리오

### 시나리오 1: 중반부가 지루하다

1. 감정 아크 분석 실행
2. 챕터 4-7에서 감정 점수 변화 < 2 감지
3. 긴장도 히트맵에서 해당 구간 ░░ 연속
4. 진단: "평탄 구간 - 갈등 부재로 독자 이탈 위험"
5. 제안: 챕터 5에 반전 이벤트 삽입, 서브플롯 위기 진행

### 시나리오 2: 결말이 허무하다

1. 감정 아크 분석 실행
2. 마지막 챕터 감정 점수가 중반 최고점보다 낮음
3. 매칭 아크: Icarus (의도치 않은 비극)
4. 장르(로맨스)와 불일치 감지
5. 제안: 클라이맥스 감정 강도 상향, Cinderella 아크로 전환

### 시나리오 3: 감정 전환이 부자연스럽다

1. 감정 아크 분석 실행
2. 챕터 3→4에서 감정 점수 -7 → +6 (급격 전환) 감지
3. 진단: "13점 차이 - 감정적 비약, 독자 몰입 파괴"
4. 제안: 중간 챕터 삽입 또는 전환 완충 장면 추가
