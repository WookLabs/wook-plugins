# /novel-dev:team-nov 사용 예시

## 시나리오 1: 챕터 검증

집필 완료된 5화를 검증 팀으로 품질 확인:

```bash
/novel-dev:team-nov run verification-team 5
```

**실행 과정:**
1. `verification-team.team.json` 로드
2. 비용 안내: "3개 에이전트, ~90K 토큰"
3. 사용자 확인 후 실행
4. critic + beta-reader + genre-validator 병렬 실행
5. 품질 게이트 적용 (critic>=85, beta-reader>=75, genre-validator>=90)
6. 종합 리포트 출력

**예상 결과:**
```
+==================================================+
|          TEAM RESULTS: 검증 팀                     |
+==================================================+
|                                                   |
|  대상: Chapter 5                                  |
|  워크플로우: parallel                              |
|                                                   |
|  Agent           | Score | Verdict   | Threshold  |
|  ----------------|-------|-----------|------------|
|  critic          |  87   | PASS      | >= 85      |
|  beta-reader     |  82   | PASS      | >= 75      |
|  genre-validator |  91   | PASS      | >= 90      |
|                                                   |
|  종합 판정: PASS                                   |
|  종합 점수: 86.4/100                               |
|                                                   |
+==================================================+
```

---

## 시나리오 2: 심층 리뷰

1화 작성 후 심층 리뷰 팀으로 다관점 분석:

```bash
/novel-dev:team-nov run deep-review-team 1
```

**실행 과정:**
1. `deep-review-team.team.json` 로드
2. 비용 안내: "6개 에이전트, ~180K 토큰"
3. 6개 에이전트 병렬 실행
4. 1화 특별 기준 적용 (강화된 thresholds)
5. majority consensus 판정

**예상 결과:**
```
+==================================================+
|          TEAM RESULTS: 심층 리뷰 팀                |
+==================================================+
|                                                   |
|  대상: Chapter 1 (1화 특별 기준 적용)              |
|                                                   |
|  Agent                    | Score | Verdict       |
|  -------------------------|-------|---------------|
|  critic                   |  91   | PASS (>=90)   |
|  beta-reader              |  84   | PASS (>=80)   |
|  consistency-verifier     |  93   | PASS (>=90)   |
|  engagement-optimizer     |  78   | WARNING(>=80) |
|  character-voice-analyzer |  86   | PASS (>=85)   |
|  prose-quality-analyzer   |  79   | PASS (>=75)   |
|                                                   |
|  종합 판정: APPROVED WITH NOTES (5/6 PASS)         |
|                                                   |
|  주요 이슈:                                       |
|  [engagement-optimizer] 중반부 긴장 저하            |
|  → 5~7번째 문단 사이 페이싱 개선 권장              |
|                                                   |
|  권장 조치:                                       |
|  - /revise 1 --focus pacing                       |
|                                                   |
+==================================================+
```

---

## 시나리오 3: 퇴고 파이프라인

critic 점수가 낮은 7화를 퇴고 팀으로 개선:

```bash
/novel-dev:team-nov run revision-team 7
```

**실행 과정:**
1. `revision-team.team.json` 로드
2. pipeline 워크플로우 실행:
   - Step 1: critic → 품질 진단 (점수 72, 개선 지점 3건)
   - Step 2: editor → 피드백 기반 수정
   - Step 3: proofreader → 교정
   - Step 4: consistency-verifier → 일관성 재검증
3. 품질 게이트 확인 → 통과 시 완료, 미달 시 재시도 (max 3회)

**예상 결과:**
```
+==================================================+
|          TEAM RESULTS: 퇴고 팀                     |
+==================================================+
|                                                   |
|  대상: Chapter 7                                  |
|  워크플로우: pipeline (2 iterations)               |
|                                                   |
|  Iteration 1:                                     |
|  - diagnose: 72/100 (BELOW THRESHOLD)             |
|  - revise: 3 issues addressed                     |
|  - proofread: 5 corrections                       |
|  - verify: 82/100 (BELOW THRESHOLD)               |
|  → Retry                                          |
|                                                   |
|  Iteration 2:                                     |
|  - diagnose: 86/100 (PASS)                        |
|  - revise: 1 issue addressed                      |
|  - proofread: 2 corrections                       |
|  - verify: 88/100 (PASS)                          |
|  → Quality Gate PASSED                            |
|                                                   |
|  최종 점수: 87/100 (+15 from initial)              |
|  반복 횟수: 2                                      |
|                                                   |
+==================================================+
```

---

## 시나리오 4: 사용자 정의 팀

특정 요구에 맞는 커스텀 팀 생성:

```bash
/novel-dev:team-nov create voice-check-team
```

**대화형 위자드:**
```
Q1: 팀 이름을 입력하세요 → voice-check-team
Q2: 팀 설명 → 캐릭터 음성 일관성 전문 검증 팀
Q3: 에이전트를 선택하세요 (복수 선택)
    → character-voice-analyzer, consistency-verifier
Q4: 워크플로우 유형
    → parallel
Q5: 품질 게이트 활성화?
    → 예, character-voice-analyzer >= 85, consistency-verifier >= 85
```

**생성 결과:** `teams/voice-check-team.team.json`

이후 사용:
```bash
/novel-dev:team-nov run voice-check-team 3
```

---

## 시나리오 5: 팀 목록 및 상태 확인

```bash
# 사용 가능한 팀 확인
/novel-dev:team-nov list

# 특정 팀 상세 정보
/novel-dev:team-nov info writing-team-2pass

# 실행 중인 팀 세션 확인
/novel-dev:team-nov status
```

---

## 시나리오 6: 설계 실행 + 리뷰

초기 설정(init) 완료 후 전체 설계를 팀으로 실행하고 리뷰:

```bash
# 1. 9개 설계 스킬을 의존 그래프 기반으로 자동 실행
/novel-dev:team-nov run design-execution-team

# 2. 설계 산출물을 4에이전트가 병렬 리뷰
/novel-dev:team-nov run design-review-team
```

**실행 과정:**
1. `design-execution-team` 7단계 파이프라인:
   - Step 1: style-curator + lore-keeper 병렬 (문체 + 세계관)
   - Step 2: lore-keeper (캐릭터 설계)
   - Step 3: lore-keeper + plot-architect 병렬 (관계 + 타임라인)
   - Step 4: plot-architect (메인 아크)
   - Step 5: plot-architect (서브 아크)
   - Step 6: plot-architect (복선)
   - Step 7: plot-architect (훅)
2. `design-review-team` 4에이전트 병렬 리뷰:
   - critic (문학적 깊이), lore-keeper (일관성), genre-validator (장르), plot-architect (구조)
   - 품질 게이트: all_pass (critic>=80, lore-keeper>=85, genre-validator>=85, plot-architect>=80)

---

## 시나리오 7: 플롯 리뷰

gen-plot 완료 후 회차별 플롯을 팀으로 검증:

```bash
# 플롯 생성
/13-gen-plot

# 플롯 리뷰
/novel-dev:team-nov run plot-review-team
```

**실행 과정:**
1. critic + consistency-verifier + genre-validator + plot-architect 병렬 실행
2. 품질 게이트: all_pass (critic>=80, consistency-verifier>=85, genre-validator>=85, plot-architect>=80)
3. PASS → 집필 진행 가능, FAIL → 피드백 기반 플롯 수정 후 재실행

---

## 기존 명령어와의 관계

| 비교 | 기존 스킬 | /novel-dev:team-nov 대응 | 차이 |
|------|-----------|-----------|------|
| 검증 | `/verify-chapter N` | `/novel-dev:team-nov run verification-team N` | verify-chapter = 경량 자동 호출, 더 엄격. verification-team = 팀 인프라 기반, 확장 가능. |
| 퇴고 | `/revise-pipeline N` | `/novel-dev:team-nov run revision-team N` | revise-pipeline = 최소 3단계 순차. revision-team = 4단계 + consistency-verifier + max 3회 재시도. |
| 배치 | `/swarm review N` | `/novel-dev:team-nov run deep-review-team N` | /swarm = 배치 병렬 (같은 작업 × 여러 대상). /novel-dev:team-nov = 팀 협업 (여러 역할 × 하나의 대상). 공존. |

> **참고**: 기존 `/swarm`과 `/novel-dev:team-nov`은 공존합니다.
> `/swarm`은 배치 병렬 실행(같은 작업을 여러 대상에), `/novel-dev:team-nov`은 팀 기반 협업(여러 역할이 하나의 대상에)에 적합합니다.
