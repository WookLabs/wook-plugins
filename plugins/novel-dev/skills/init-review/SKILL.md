---
name: init-review
description: 초기 설정 검토 및 평가 (momus + critic 이중 검토)
user-invocable: true
---

[NOVEL-SISYPHUS: 초기 설정 리뷰]

## 실행 단계

1. **현재 프로젝트 로드**
   - `novels/*/meta/project.json` 중 가장 최신 또는 지정된 프로젝트
   - `novels/*/plot/structure.json`
   - `novels/*/meta/style-guide.json`

2. **momus 에이전트 호출 (구조적 비평)**
   ```
   Task(subagent_type="oh-my-claude-sisyphus:momus", prompt="
   다음 소설 프로젝트 초기 설계를 비판적으로 검토해주세요:

   ## 프로젝트 정보
   {project.json 내용}

   ## 플롯 구조
   {structure.json 내용}

   ## 문체 가이드
   {style-guide.json 내용}

   ## 검토 요청
   1. 구조적 결함: 플롯 구조에 논리적 허점이 있는가?
   2. 숨겨진 위험: 집필 중 문제가 될 수 있는 요소는?
   3. 미흡한 부분: 설계에서 빠진 것은 무엇인가?
   4. 개선 제안: 구체적이고 실행 가능한 수정안
   5. 강점 분석: 잘 설계된 부분과 그 이유

   솔직하고 날카롭게 평가해주세요. 칭찬보다 개선점이 중요합니다.
   ")
   ```

3. **critic 에이전트 호출 (품질 평가)**
   ```
   Task(subagent_type="critic", prompt="
   다음 소설 프로젝트 초기 설정을 평가해주세요:

   프로젝트: {project.json 내용}
   플롯 구조: {structure.json 내용}

   평가 항목 (각 20점):
   1. 장르와 톤의 일관성
   2. 목표 화수 대비 플롯 구조의 적절성
   3. 로그라인/시놉시스의 매력도
   4. 트로프 조합의 참신성
   5. 상업적 잠재력

   점수와 함께 구체적 근거를 제시해주세요.
   ")
   ```

4. **리뷰 종합 및 저장**
   - momus 피드백과 critic 점수를 종합
   - `reviews/init_review.json`에 저장
   - 70점 미만 시 `/init` 재실행 권고

## 출력 예시

```json
{
  "review_type": "init",
  "reviewed_at": "2025-01-17T15:00:00Z",

  "momus_review": {
    "structural_flaws": [
      "1막이 15화로 설정되어 있으나, 계약 성립까지 너무 길어질 수 있음",
      "클라이맥스 배치가 45화로 늦음 - 독자 이탈 위험"
    ],
    "hidden_risks": [
      "계약 연애 트로프는 '왜 계약하는가'의 설득력이 핵심 - 현재 설정 불충분",
      "두 주인공의 갈등 요소가 약함"
    ],
    "missing_elements": [
      "서브플롯 부재 - 단조로워질 위험",
      "조연 캐릭터 설정 없음"
    ],
    "improvement_suggestions": [
      "1막을 10화로 축소, 빠른 계약 성립",
      "직장/가족 서브플롯 추가",
      "라이벌 캐릭터 도입 고려"
    ],
    "strengths": [
      "로그라인이 명확하고 매력적",
      "톤 설정이 장르에 적합"
    ]
  },

  "critic_review": {
    "scores": {
      "genre_tone_consistency": 18,
      "structure_appropriateness": 14,
      "logline_appeal": 17,
      "trope_originality": 13,
      "commercial_potential": 16
    },
    "total_score": 78,
    "feedback": [
      "장르와 톤이 잘 맞습니다.",
      "플롯 구조 조정 필요 - 1막이 너무 김",
      "로그라인은 매력적이나 차별화 요소 부족"
    ]
  },

  "verdict": "PASS_WITH_WARNINGS",
  "action_required": [
    "1막 분량 축소 권장",
    "서브플롯 설계 필요"
  ]
}
```

## Verdict 기준

| 점수 | 판정 | 권장 행동 |
|------|------|----------|
| 85+ | `PASS` | 다음 단계 진행 |
| 70-84 | `PASS_WITH_WARNINGS` | 권장 사항 검토 후 진행 |
| 50-69 | `NEEDS_REVISION` | `/init` 재실행 권고 |
| <50 | `FAIL` | 아이디어 재검토 필요 |
