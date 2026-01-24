---
description: "[4단계] 문체 설계 - 작품의 문체와 서술 스타일 정의"
---

[NOVEL-SISYPHUS: 문체 설계]

## Prerequisites

- `meta/project.json` must exist
- Run after `/init` (03단계)

## 실행 단계

1. **프로젝트 로드**
   - `meta/project.json` (장르, 톤 정보)
   - `BLUEPRINT.md` (있을 경우)

2. **문체 인터뷰** (AskUserQuestion 사용)

   **질문 1: 서술 시점**
   - 1인칭 (주인공 시점)
   - 3인칭 제한 시점 (특정 캐릭터 따라가기)
   - 3인칭 전지적 시점 (모든 것을 아는 화자)

   **질문 2: POV 유형**
   - 단일 POV (한 캐릭터만)
   - 다중 POV (여러 캐릭터 번갈아)

   **질문 3: 문장 스타일**
   - 짧고 간결한 문장
   - 길고 유려한 문장
   - 혼합 (상황에 따라)

   **질문 4: 묘사 밀도**
   - 높음 (상세한 배경/감정 묘사)
   - 중간 (균형 잡힌 묘사)
   - 낮음 (액션/대화 중심)

   **질문 5: 대화 스타일**
   - 자연스러운 구어체
   - 세련된 문어체
   - 장르 특화 (판타지 고어체, 사극 등)

   **질문 6: 금지어/선호어** (선택)
   - 피하고 싶은 표현 (예: 갑자기, 문득)
   - 선호하는 표현

3. **plot-architect 에이전트로 문체 가이드 생성**

   ```
   Task(subagent_type="novel-dev:plot-architect", prompt="
   프로젝트: {project.json}
   사용자 선택: {interview_results}
   장르: {genre}

   다음을 포함한 상세 문체 가이드를 생성하세요:

   1. 서술 시점과 시제
   2. 톤과 분위기 (장르에 맞게)
   3. 문장 리듬과 페이싱
   4. 대화체 스타일
   5. 묘사 밀도와 방식
   6. 금지어 목록 (장르 클리셰 포함)
   7. 선호 표현 목록
   8. 챕터 구조 (훅 시작, 클리프행어 끝)
   9. Show don't tell 적용 수준
   10. 특별 지침 (해당 장르 특화)
   ")
   ```

4. **파일 저장**
   - `meta/style-guide.json`

## 출력 예시

```json
{
  "narrative_voice": "3인칭 제한 시점",
  "pov_type": "multiple",
  "tense": "과거형",
  "tone": ["달달", "설렘", "코믹"],
  "pacing_default": "medium",
  "dialogue_style": "자연스러운 구어체, 캐릭터별 말투 차별화",
  "description_density": "medium",
  "sentence_rhythm": "mixed",
  "taboo_words": [
    "갑자기", "문득", "그런데", "하지만",
    "매우", "정말", "너무", "엄청"
  ],
  "preferred_expressions": [
    "시선이 마주치다",
    "심장이 쿵 내려앉다",
    "입꼬리가 올라가다"
  ],
  "chapter_structure": {
    "opening_hook": true,
    "scene_count_range": [2, 4],
    "ending_hook": true
  },
  "show_dont_tell": "balanced",
  "special_instructions": "로맨스 장르: 감정 묘사는 신체 반응과 내면 독백을 적절히 혼합. 달달한 장면에서는 페이싱을 늦추고 묘사를 늘림. 갈등 장면에서는 짧은 문장으로 긴장감 유지."
}
```

## 다음 단계

문체 설계 완료 후:
- `/world` - 세계관 설계
- `/character` - 캐릭터 설계 (문체에 맞는 말투 설정)
