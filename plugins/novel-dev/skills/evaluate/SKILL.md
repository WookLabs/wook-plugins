---
name: evaluate
description: "[13단계] 평가 - 품질 평가"
user-invocable: true
---

[NOVEL-SISYPHUS: 평가]

$ARGUMENTS

## 실행 단계

1. **대상 결정**
   - 회차 지정: 해당 회차
   - 미지정: 현재 막 전체

2. **critic 에이전트 호출**
   ```
   Task(subagent_type="critic", prompt="
   원고: {chapter.md}
   플롯: {chapter.json}
   캐릭터 설정: {characters}
   세계관: {world.json}

   평가 기준 (각 25점):
   1. 서사/문체 품질
   2. 플롯 정합성
   3. 캐릭터 일관성
   4. 설정 준수

   점수와 상세 피드백을 JSON으로 출력해주세요.
   ")
   ```

3. **파일 저장**
   - `reviews/chapter_reviews/chapter_{N}_review.json`
   - 막 단위: `reviews/act_{M}_review.json`

4. **History 업데이트** (NEW)
   - `reviews/history/` 디렉토리 없으면 생성
   - 첫 평가: `reviews/history/chapter_{N}.json` 생성, version=1
   - 재평가: 기존 history에 새 version 추가
   - 스키마: `schemas/chapter-history.schema.json` 참조

## 등급 기준

| 점수 | 등급 | 의미 |
|------|------|------|
| 90+ | S | 출판 품질 |
| 80-89 | A | 우수 |
| 70-79 | B | 양호 (품질 게이트 통과) |
| 60-69 | C | 개선 필요 |
| 60 미만 | F | 재작성 권장 |
