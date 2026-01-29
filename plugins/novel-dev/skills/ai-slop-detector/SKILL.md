---
name: ai-slop-detector
description: |
  AI스러운 문장 패턴을 감지하고 재작성을 제안합니다.
  <example>AI 느낌 검사해줘</example>
  <example>slop 체크</example>
  <example>문장 자연스러움 검사</example>
  <example>AI 탐지</example>
  <example>이거 AI가 쓴 것 같은데</example>
  <example>문장이 너무 뻔해</example>
  <example>ai-slop 검사</example>
user-invocable: true
allowed-tools:
  - Read
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

# AI-Slop Detector

Claude Book 프레임워크의 Perplexity Gate를 소설 창작에 맞게 경량화한 스킬.
AI가 생성한 "평범한" 문장을 감지하고 9가지 재작성 기법을 제안합니다.

## Quick Start

```bash
/ai-slop-detector                    # 최신 원고 전체 검사
/ai-slop-detector chapter_005.md     # 특정 챕터 검사
/ai-slop-detector --strict           # 엄격 모드 (임계값 하향)
/ai-slop-detector --focus=burstiness # 특정 감지 기준만
```

## 워크플로우

### Phase 1: 대상 원고 로드

사용자가 대상을 지정하지 않은 경우:

```
AskUserQuestion:
  question: "어떤 원고를 검사할까요?"
  options:
    - "최근 작성한 챕터"
    - "특정 챕터 번호 지정"
    - "현재 막 전체"
    - "전체 원고"
```

대상 파일 로드:
```
- manuscripts/chapter_*.md (원고 본문)
- meta/style-guide.json (스타일 가이드 - 의도적 표현 구분용)
```

### Phase 2: AI-Slop 시그널 단어 감지

한국어 AI 생성 텍스트에서 빈출하는 패턴을 스캔합니다.
패턴 사전: `references/slop-patterns.md` 참조.

**감지 카테고리:**

| 카테고리 | 설명 | 심각도 |
|---------|------|--------|
| 과도한 수식어 | "심오한", "본질적인", "근본적인" 등 | MEDIUM |
| 클리셰 비유 | "마치 ~처럼", "심장이 요동치다" 등 | HIGH |
| 감정 과잉 서술 | "형언할 수 없는", "가슴 깊은 곳에서" 등 | HIGH |
| AI 특유 전환어 | "그럼에도 불구하고", "흥미롭게도" 등 | MEDIUM |
| 번역체 표현 | "탐구하다", "영역", "태피스트리" 등 | HIGH |
| 설명 과잉 | 감정을 직접 명명, Show 대신 Tell | MEDIUM |
| 리스트형 나열 | "첫째...둘째...셋째..." 서술체 | LOW |

**스캔 방법:**

1. `references/slop-patterns.md`에서 패턴 목록 로드
2. 원고 전문을 문장 단위로 분리
3. 각 문장에 대해 패턴 매칭 수행
4. 매칭된 문장에 카테고리와 심각도 태그 부여
5. 스타일 가이드에서 의도적으로 허용한 표현은 제외

### Phase 3: Burstiness (문장 리듬) 분석

균일한 문장 길이는 AI 생성 텍스트의 대표적 특징입니다.

**측정 방법:**

1. 원고를 문장 단위로 분리 (마침표/물음표/느낌표 기준)
2. 슬라이딩 윈도우 (5문장)로 이동하며 분석
3. 각 윈도우에서 문장 길이(글자 수)의 표준편차 계산
4. 전체 원고의 평균 Burstiness 점수 산출

**판정 기준 (한국어 기준):**

| 표준편차 (sigma) | Burstiness 점수 | 판정 |
|-----------------|----------------|------|
| sigma >= 15 | 0.8 - 1.0 | 우수 (자연스러운 리듬) |
| 10 <= sigma < 15 | 0.5 - 0.8 | 양호 |
| 5 <= sigma < 10 | 0.3 - 0.5 | 주의 (단조로움 경향) |
| sigma < 5 | 0.0 - 0.3 | 경고 (AI 생성 의심) |

**참고 기준:**
- 인간 작가: 짧은 문장(3-10자)과 긴 문장(30-60자)을 자연스럽게 혼합
- AI 생성: 대부분 15-25자 범위에 집중, 극단적 장단 없음

### Phase 4: 반복 구조 감지

**감지 항목:**

1. **동일 문장 구조 반복**
   - 주어+동사+목적어 패턴이 3회 이상 연속
   - 예: "그녀는 ~했다. 그녀는 ~했다. 그녀는 ~했다."
   - 판정: 3회 연속 = WARNING, 4회 이상 = ALERT

2. **동일 시작어 반복**
   - 2문단(약 10문장) 내에서 같은 단어로 시작하는 문장이 3회 이상
   - 예: "그는... 그는... 그는..."
   - 판정: 3회 = WARNING, 5회 이상 = ALERT

3. **접속사 패턴 반복**
   - 같은 접속사가 5문장 내 3회 이상
   - 예: "그리고... 그리고... 그리고..."
   - 판정: 3회 = WARNING

4. **문단 구조 반복**
   - 연속된 문단이 동일한 구조 (서술-대화-서술, 서술-대화-서술)
   - 판정: 3문단 동일 = WARNING

### Phase 5: 종합 점수 산출

```
AI-Slop Score = (시그널 단어 밀도 x 0.35)
              + (1 - Burstiness 점수) x 0.30
              + (반복 구조 밀도 x 0.35)

밀도 = 플래그된 문장 수 / 전체 문장 수
```

| 종합 점수 | 판정 | 의미 |
|-----------|------|------|
| 0.00 - 0.10 | CLEAN | AI 흔적 거의 없음 |
| 0.10 - 0.25 | MILD | 약간의 패턴, 자연스러운 범위 |
| 0.25 - 0.50 | MODERATE | AI 패턴 감지됨, 부분 재작성 권장 |
| 0.50 - 0.75 | HIGH | 다수 AI 패턴, 전면 재작성 권장 |
| 0.75 - 1.00 | CRITICAL | 대부분 AI 생성 의심 |

### Phase 6: 재작성 제안 생성

감지된 각 문장에 대해 9가지 재작성 기법 중 가장 적합한 것을 제안합니다.

#### 9가지 재작성 기법

| # | 기법 | 설명 | 적용 조건 |
|---|------|------|----------|
| 1 | **단편화(Fragmentation)** | 완전한 문장을 의도적으로 끊기 | 과도한 수식어, 긴 복합문 |
| 2 | **감각 구체화** | 추상적 서술을 구체적 감각으로 전환 | 감정 과잉 서술, 추상적 비유 |
| 3 | **캐릭터 음성 주입** | 해당 캐릭터의 고유 화법으로 재작성 | 무색무취한 서술체 |
| 4 | **클리셰 전복** | 예상되는 표현을 정반대로 뒤집기 | 클리셰 비유, 뻔한 표현 |
| 5 | **리듬 파괴** | 장단 문장 교차, 갑작스러운 짧은 문장 | 낮은 Burstiness 구간 |
| 6 | **서사적 생략** | 설명 대신 빈 공간, 독자 추론 유도 | 설명 과잉, Tell 위주 |
| 7 | **비유어 희소화** | 비유 대신 직접 서술로 전환 | 비유 남용 구간 |
| 8 | **시제/인칭 변주** | 의도적 시제 전환으로 긴장감 생성 | 단조로운 시제 지속 |
| 9 | **대화로 전환** | 서술을 대화로 바꿔 생동감 부여 | 긴 서술 블록, 감정 설명 |

**기법 자동 매칭 규칙:**

```
과도한 수식어     → 단편화(1), 비유어 희소화(7)
클리셰 비유       → 클리셰 전복(4), 감각 구체화(2)
감정 과잉 서술    → 감각 구체화(2), 서사적 생략(6)
AI 특유 전환어    → 단편화(1), 대화로 전환(9)
번역체 표현       → 캐릭터 음성 주입(3), 비유어 희소화(7)
낮은 Burstiness  → 리듬 파괴(5), 단편화(1)
반복 구조         → 시제/인칭 변주(8), 대화로 전환(9)
```

### Phase 7: 리포트 출력

```
+==================================================+
|          AI-SLOP DETECTION REPORT                 |
+==================================================+
|  대상: {파일명}                                   |
|  전체 문장: {N}                                   |
|  플래그된 문장: {n} ({percent}%)                   |
|  Burstiness 점수: {score} ({판정})                |
|  종합 AI-Slop 점수: {score} ({판정})              |
+==================================================+
|                                                   |
|  --- 시그널 단어 감지 ({count}건) ---              |
|                                                   |
|  [Line {N}] {심각도} {카테고리}                    |
|  "{원문}"                                         |
|  -> 제안: {기법명} 적용                            |
|  -> "{재작성 예시}"                                |
|                                                   |
|  --- Burstiness 경고 ({count}건) ---              |
|                                                   |
|  [Line {N}-{M}] 5문장 연속 평균 {avg}자, sigma={s}|
|  -> 제안: {기법명} 적용                            |
|  -> 현재: "{문장1}" / "{문장2}" / ...              |
|  -> 개선: 짧은 문장 삽입 권장                      |
|                                                   |
|  --- 반복 구조 경고 ({count}건) ---                |
|                                                   |
|  [Line {N}-{M}] {반복 유형}                        |
|  -> 패턴: "{반복 패턴}"                            |
|  -> 제안: {기법명} 적용                            |
|                                                   |
|  --- 요약 ---                                      |
|  시그널 단어: {n}건 (HIGH: {h}, MED: {m}, LOW: {l})|
|  Burstiness 경고: {n}구간                          |
|  반복 구조: {n}건                                   |
|                                                    |
|  우선 수정 권장 (상위 5건):                         |
|  1. Line {N}: {요약} -> {기법}                     |
|  2. Line {N}: {요약} -> {기법}                     |
|  3. ...                                            |
+==================================================+
```

## 에이전트 활용

| 단계 | 에이전트 | 모델 | 역할 |
|------|---------|------|------|
| 패턴 스캔 | editor | sonnet | 시그널 단어/반복 구조 감지 |
| Burstiness 분석 | editor | sonnet | 문장 리듬 수치 분석 |
| 재작성 제안 | editor | opus | 9가지 기법 적용한 대안 문장 생성 |
| 스타일 확인 | lore-keeper | haiku | 스타일 가이드와 대조하여 의도적 표현 필터링 |

**에이전트 호출 예시:**

```typescript
// Phase 2-4: 통합 감지
Task(subagent_type="novel-dev:editor",
  model="sonnet",
  prompt=`다음 원고에서 AI-Slop 패턴을 감지하세요.

원고:
{manuscript_text}

감지 기준:
1. AI 시그널 단어/표현 (references/slop-patterns.md 참조)
2. Burstiness 분석 (5문장 윈도우, sigma < 5 경고)
3. 반복 구조 (동일 구조 3회+, 동일 시작어 3회+, 접속사 반복)

각 감지 항목에 대해:
- 줄번호
- 원문
- 카테고리 및 심각도
- 권장 재작성 기법 (9가지 중 선택)
`)

// Phase 6: 재작성 제안 (심각도 HIGH 항목만)
Task(subagent_type="novel-dev:editor",
  model="opus",
  prompt=`다음 플래그된 문장들을 재작성하세요.

캐릭터 정보: {character_context}
스타일 가이드: {style_guide}

플래그 목록:
{flagged_items}

각 문장에 대해:
- 지정된 재작성 기법 적용
- 원문의 의미는 보존
- 캐릭터 음성과 작품 톤에 맞게 조정
- 2-3개의 대안 제시
`)
```

## 옵션

### --strict

엄격 모드. 임계값을 낮춰 더 많은 패턴을 감지합니다.
- Burstiness 경고: sigma < 8 (기본 5)
- 시그널 단어: LOW 심각도도 모두 표시
- 반복 구조: 2회 연속부터 감지

### --focus

특정 감지 기준만 실행:
```bash
/ai-slop-detector --focus=signals     # 시그널 단어만
/ai-slop-detector --focus=burstiness  # Burstiness만
/ai-slop-detector --focus=repetition  # 반복 구조만
```

### --rewrite

감지와 함께 즉시 재작성까지 수행:
```bash
/ai-slop-detector --rewrite           # HIGH 심각도만 재작성
/ai-slop-detector --rewrite=all       # 모든 감지 항목 재작성
```

### --compare

수정 전후 비교:
```bash
/ai-slop-detector --compare           # 이전 검사 결과와 비교
```

## 통합 포인트

- `/revise` 파이프라인에서 자동 호출 가능 (재작성 전 AI-slop 감지)
- `/evaluate` 품질 점수에 AI-slop 점수 반영
- `/write` 완료 후 자동 검사 옵션
- 스타일 가이드(`meta/style-guide.json`)의 허용 표현은 자동 제외

## 결과 저장

검사 결과는 아래 경로에 JSON으로 저장:
```
reviews/ai-slop-report_{chapter}.json
```

```json
{
  "check_date": "2025-01-29T10:00:00Z",
  "target": "chapter_005.md",
  "total_sentences": 234,
  "flagged_sentences": 18,
  "flagged_ratio": 0.077,
  "burstiness_score": 0.42,
  "repetition_count": 5,
  "overall_slop_score": 0.31,
  "overall_verdict": "MODERATE",
  "flags": [
    {
      "line": 23,
      "category": "signal_word",
      "subcategory": "excessive_modifier",
      "severity": "MEDIUM",
      "original": "그럼에도 불구하고 그녀의 심오한 결심은...",
      "suggested_technique": "fragmentation",
      "rewrite": "하지만 그녀는 이미 결정했다."
    }
  ],
  "burstiness_warnings": [
    {
      "start_line": 45,
      "end_line": 49,
      "avg_length": 24,
      "sigma": 3.2,
      "suggested_technique": "rhythm_break"
    }
  ],
  "repetition_warnings": [
    {
      "start_line": 78,
      "end_line": 82,
      "type": "same_starter",
      "pattern": "그는",
      "count": 4,
      "suggested_technique": "pov_shift"
    }
  ]
}
```

## Learn More

- [Slop Patterns Dictionary](references/slop-patterns.md) - 한국어 AI-slop 패턴 전체 사전
