# Swarm Patterns - 상세 가이드

소설 창작에 특화된 Swarm 패턴의 상세 실행 절차, 최적화 전략, 에러 복구 방법을 정리합니다.

---

## 1. 모드별 실행 절차

### 1.1 Verification Swarm (검증 스웜)

**목적:** 여러 챕터를 동시에 일관성 검증하여 전체 프로젝트의 품질을 빠르게 확인.

**절차:**

```
1. 입력 파싱
   - 범위 지정: "1-12" → [1, 2, ..., 12]
   - 키워드: "all" → 존재하는 모든 chapter_*.md
   - 단일: "5" → [5]

2. 필터링
   - chapters/chapter_XXX.md 파일 존재 여부 확인
   - 존재하지 않는 챕터 제외, 경고 출력

3. 태스크 풀 생성
   - 각 챕터에 대해 1개 태스크 생성
   - 태스크 ID: "t{순번}"
   - 초기 상태: "pending"

4. 배치 실행
   - 태스크를 max_workers(기본 5) 크기 배치로 분할
   - 배치 내 태스크는 Promise.all로 병렬 실행
   - 각 태스크: consistency-verifier 에이전트 호출
   - 배치 완료 후 다음 배치 실행

5. 결과 수집
   - 각 Worker 결과를 파싱
   - score, verdict, issues 추출
   - 신뢰도 75% 이상 이슈만 최종 리포트에 포함

6. 종합 리포트 생성
   - PASS/WARNING/FAIL 카운트
   - 주요 이슈 요약
   - 권장 조치 목록
   - JSON 파일 저장
```

**검증 항목 체크리스트:**

| # | 항목 | 설명 |
|---|------|------|
| 1 | 캐릭터 외모 일관성 | 키, 머리색, 특징적 외모 변경 없는지 |
| 2 | 캐릭터 말투 일관성 | 존댓말/반말 전환, 특징적 어미 유지 |
| 3 | 캐릭터 성격 일관성 | 의도치 않은 성격 변화 |
| 4 | 세계관 규칙 준수 | 마법 체계, 사회 규칙 위반 |
| 5 | 타임라인 모순 | 시간 순서, 날짜, 기간 오류 |
| 6 | 장소 묘사 일관성 | 같은 장소의 다른 묘사 |
| 7 | 사망 캐릭터 재등장 | 퇴장한 캐릭터가 재등장 |
| 8 | 용어 통일 | 같은 대상에 다른 명칭 사용 |
| 9 | 복선 일관성 | 심은 복선과 회수 내용의 모순 |
| 10 | 사실적 오류 | 현실 기반 설정의 팩트 오류 |

---

### 1.2 Review Swarm (리뷰 스웜)

**목적:** 단일 챕터를 다각도로 동시 분석하여 심층적인 품질 평가 수행.

**절차:**

```
1. 대상 챕터 확인
   - chapter_XXX.md 존재 확인
   - chapter_XXX.json (플롯 데이터) 로드

2. 컨텍스트 준비
   - 챕터 본문, 플롯, 캐릭터, 세계관, wisdom 로드
   - 각 Worker에 필요한 컨텍스트만 선별 전달

3. 5개 Worker 동시 실행
   W1: critic (opus)              → 문학 품질
   W2: beta-reader (sonnet)       → 독자 경험
   W3: consistency-verifier (sonnet) → 설정 일관성
   W4: engagement-optimizer (sonnet)    → 페이싱
   W5: character-voice-analyzer (sonnet) → 음성 일관성

4. 결과 통합
   - 5개 점수 수집
   - 가중 평균 계산 (critic 가중치 1.5, 나머지 1.0)
   - 교차 이슈 분석 (2+ Worker가 동일 구간 지적 시 신뢰도 상향)

5. 판정
   - 각 Worker 점수가 임계값 이상인지 확인
   - 종합 판정: APPROVED / APPROVED WITH NOTES / REVISION REQUIRED

6. 리포트 저장
```

**Worker별 평가 관점:**

| Worker | 핵심 질문 | 주요 지표 |
|--------|-----------|-----------|
| critic | "문학적으로 가치 있는가?" | 구조, 문체, 깊이, 독창성 |
| beta-reader | "독자가 계속 읽을까?" | 몰입도, 감정 이입, 이탈 위험 구간 |
| consistency-verifier | "설정과 모순이 없는가?" | 캐릭터, 세계관, 타임라인 오류 |
| engagement-optimizer | "리듬이 적절한가?" | 긴장 곡선, 장면 전환, 비트 밀도 |
| character-voice-analyzer | "캐릭터답게 말하는가?" | 말투, OOC 빈도, 관계 반영 |

**교차 이슈 분석 규칙:**
```
같은 구간(paragraph/scene)을 2+ Worker가 지적:
  → 해당 이슈의 신뢰도 +15%
  → 심각도 한 단계 상향 (minor → major)

같은 구간을 3+ Worker가 지적:
  → 해당 이슈의 신뢰도 +30%
  → 심각도: critical로 상향
```

---

### 1.3 Design Swarm (설계 스웜)

**목적:** 설계 단계에서 독립적인 요소들을 동시에 작업하여 설계 시간 단축.

**절차:**

```
1. 설계 대상 분석
   - characters: characters.json에서 미설계 캐릭터 추출
   - world: world.json에서 미설계 요소 추출
   - all: 전체 미설계 요소 추출

2. 의존성 분석
   - 상호 참조가 필요한 요소 식별
   - 독립적으로 설계 가능한 요소만 병렬 처리
   - 의존성 있는 요소는 선행 요소 완료 후 처리

3. 소유권 할당
   - 각 Worker에 비중복 쓰기 파일 세트 할당
   - 공유 참조 파일은 읽기 전용

4. Worker 병렬 실행
   - 각 Worker: lore-keeper 에이전트로 설계
   - 공통 컨텍스트(world.json, brief.json) 제공

5. 결과 통합
   - 각 Worker 출력물 검증
   - 상호 참조 일관성 확인
   - 불일치 발견 시 조정 Worker 추가 실행

6. 최종 저장
```

**의존성 그래프 예시:**

```
[독립]     캐릭터 A ────────────────── characters/char_a.json
[독립]     캐릭터 B ────────────────── characters/char_b.json
[독립]     장소 설계 ────────────────── meta/world/locations.json
[의존: 장소] 마법 시스템 ──────────── meta/world/magic-system.json
[의존: 캐릭터] A-B 관계 설계 ─────── meta/relationships.json
```

→ 1차 배치: 캐릭터 A, B, 장소 (독립)
→ 2차 배치: 마법 시스템 (장소 의존), A-B 관계 (캐릭터 의존)

---

## 2. Worker 수 최적화

### 권장 Worker 수

| 모드 | 태스크 수 | 권장 Worker | 이유 |
|------|-----------|-------------|------|
| verify | 1-5 | 태스크 수 | 배치 불필요 |
| verify | 6-10 | 5 | 2 배치로 처리 |
| verify | 11-20 | 5 | 4 배치까지 허용 |
| verify | 21+ | 5 | 배치 증가, 5 이상은 리소스 낭비 |
| review | 항상 | 5 | 고정 5관점 |
| design | 1-3 | 태스크 수 | 소규모 |
| design | 4-10 | 4 | 쓰기 충돌 최소화 |
| design | 11+ | 5 | 최대 5, 의존성 주의 |

### Worker 수 조절 기준

```
최적 Worker 수 = min(max_workers, pending_tasks, resource_limit)

resource_limit 결정 요인:
- 읽기 전용 작업 (verify, review): 5
- 쓰기 작업 (design): 4 (충돌 방지)
- 복잡한 작업 (opus 에이전트): 3 (응답 시간 고려)
```

---

## 3. 충돌 방지 전략

### 3.1 읽기 전용 모드 (verify, review)

```
충돌 위험: 없음
전략: 제한 없이 동시 접근 허용
주의: Worker가 수정을 시도하면 차단
```

### 3.2 쓰기 모드 (design)

**소유권 할당 규칙:**

```
1. 각 Worker에 고유한 출력 파일 세트 할당
2. Worker는 자신의 소유 파일만 생성/수정 가능
3. 공유 참조 파일 (meta/world.json 등)은 읽기 전용
4. 소유권은 Swarm 시작 시 확정, 실행 중 변경 불가
```

**소유권 파일 구조:**

```json
{
  "swarm_id": "swarm_20260129_143000",
  "ownership": {
    "W1": {
      "write": ["characters/char_protagonist.json"],
      "read": ["meta/world.json", "meta/brief.json"]
    },
    "W2": {
      "write": ["characters/char_antagonist.json"],
      "read": ["meta/world.json", "meta/brief.json"]
    }
  },
  "shared_read_only": [
    "meta/characters.json",
    "meta/world.json",
    "meta/brief.json"
  ]
}
```

### 3.3 후처리 일관성 검증

설계 Swarm 완료 후 반드시 실행:

```javascript
// 모든 Worker 완료 후
Task({
  subagent_type: "novel-dev:consistency-verifier",
  model: "sonnet",
  prompt: `Swarm 설계 결과 교차 검증:
    - 새로 생성/수정된 파일 전체 읽기
    - 상호 참조 일관성 확인
    - 모순 발견 시 목록 출력`
});
```

---

## 4. 에러 복구 절차

### 4.1 개별 Worker 실패

```
상황: Worker 1개가 타임아웃 또는 에러로 실패

복구 절차:
1. 해당 태스크 상태를 "failed"로 변경
2. 재시도 카운트 확인 (최대 2회)
3. 재시도 가능 시:
   - 태스크 상태를 "pending"으로 복원
   - 다음 배치에 포함하여 재실행
4. 재시도 불가 시:
   - 실패 태스크로 최종 기록
   - 리포트에 수동 처리 필요 표시
   - 나머지 태스크는 정상 계속
```

### 4.2 다수 Worker 실패

```
상황: 배치 내 3개 이상 Worker 동시 실패

복구 절차:
1. 현재 배치 중단
2. max_workers를 2로 축소
3. 남은 태스크 재실행
4. 연속 3배치 실패 시 Swarm 중단
5. 부분 결과 저장 후 사용자에게 보고
```

### 4.3 전체 Swarm 실패

```
상황: Swarm 자체가 초기화 실패

복구 절차:
1. 상태 파일 (.omc/state/swarm-state.json) 삭제
2. 소유권 파일 삭제
3. 사용자에게 원인 보고
4. 개별 커맨드로 대체 제안:
   - verify 실패 → /verify-chapter N 개별 실행
   - review 실패 → /verify-chapter N (기본 3 검증)
   - design 실패 → /design-character, /design-world 개별 실행
```

### 4.4 부분 완료 재개

```
상황: Swarm 도중 세션이 중단됨

재개 절차:
1. .omc/state/swarm-state.json 로드
2. completed 태스크 스킵
3. in_progress 태스크를 pending으로 재설정
4. pending 태스크부터 재개
```

```
/swarm resume    # 마지막 Swarm 재개
```

---

## 5. 성능 벤치마크 (참고)

| 모드 | 순차 실행 | Swarm (5W) | 시간 절감 |
|------|-----------|-----------|-----------|
| verify 12ch | ~24분 | ~10분 | ~58% |
| review 1ch | ~10분 | ~4분 | ~60% |
| design 5char | ~15분 | ~6분 | ~60% |

*벤치마크는 에이전트 응답 시간에 따라 변동됩니다.*

---

## 6. 기존 스킬과의 관계

| Swarm 모드 | 기존 스킬 | 차이점 |
|------------|-----------|--------|
| verify | verify-chapter | verify-chapter는 단일 챕터 3검증, swarm verify는 다수 챕터 동시 검증 |
| review | verify-chapter | verify-chapter는 3관점, swarm review는 5관점 심층 리뷰 |
| design | design-character | design-character는 순차, swarm design은 다수 캐릭터 동시 설계 |
| verify | consistency-check | consistency-check는 전체 일괄, swarm verify는 챕터별 병렬 |
