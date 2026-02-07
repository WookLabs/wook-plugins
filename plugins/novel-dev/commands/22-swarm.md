---
description: "[22단계] 병렬 검증 - 병렬 에이전트 Swarm으로 검증/리뷰/설계를 수행합니다"
argument-hint: <mode> <target>
allowed-tools:
  - Read
  - Task
  - Glob
  - Write
  - Grep
model: sonnet
---

[NOVEL-DEV: SWARM]

$ARGUMENTS

## 사용법

```
/swarm verify 1-12        : 1~12화 병렬 검증
/swarm verify all         : 전체 챕터 병렬 검증
/swarm review 5           : 5화 다관점 병렬 리뷰 (5 Worker)
/swarm design characters  : 캐릭터 병렬 설계
/swarm design world       : 세계관 요소 병렬 설계
/swarm design all         : 전체 설계 요소 병렬 처리
/swarm resume             : 중단된 Swarm 재개
```

## 모드별 실행

### verify - 병렬 검증

**입력:** 챕터 범위 (예: `1-12`, `5-8`, `all`)

**프로토콜:**
1. 범위 파싱 및 존재하는 챕터 필터링
2. 태스크 풀 초기화 (`.omc/state/swarm-state.json`)
3. 최대 5개 Worker로 consistency-verifier 에이전트 병렬 실행
4. 배치 단위 진행 (태스크 > 5개 시 다중 배치)
5. 결과 수집 및 종합 리포트 생성
6. 결과 저장: `reviews/swarm/swarm_{id}_verification.json`

**각 Worker 수행:**
- `chapters/chapter_XXX.md` + `meta/` 파일 읽기
- 캐릭터, 세계관, 타임라인, 복선, 용어 일관성 검증
- 점수 (0-100), 판정 (PASS/WARNING/FAIL), 이슈 목록 반환

### review - 다관점 병렬 리뷰

**입력:** 챕터 번호 (예: `5`)

**프로토콜:**
1. 대상 챕터 및 컨텍스트 로드
2. 5개 Worker 동시 실행:
   - W1: critic (opus) - 문학 품질
   - W2: beta-reader (sonnet) - 독자 경험
   - W3: consistency-verifier (sonnet) - 설정 일관성
   - W4: pacing-analyzer (sonnet) - 페이싱
   - W5: character-voice-analyzer (sonnet) - 음성 일관성
3. 5개 결과 통합 및 교차 이슈 분석
4. 종합 판정: APPROVED / APPROVED WITH NOTES / REVISION REQUIRED
5. 결과 저장: `reviews/swarm/chapter_{N}_swarm_review.json`

### design - 병렬 설계

**입력:** 서브모드 (`characters`, `world`, `all`)

**프로토콜:**
1. 설계 대상 분석 및 의존성 파악
2. 비중복 파일 소유권 할당
3. 최대 5개 Worker로 lore-keeper 에이전트 병렬 실행
4. 설계 완료 후 교차 일관성 검증
5. 결과 저장: 각 설계 파일 (characters/, meta/)

**충돌 방지:** 각 Worker에 고유 쓰기 파일 할당. 공유 참조 파일은 읽기 전용.

### resume - 중단 재개

**프로토콜:**
1. `.omc/state/swarm-state.json` 로드
2. completed 태스크 스킵
3. in_progress 태스크를 pending으로 재설정
4. pending 태스크부터 재개

## 에러 처리

- 개별 Worker 실패: 최대 2회 자동 재시도
- 다수 Worker 실패: Worker 수 축소 후 재시도
- 전체 실패: 부분 결과 저장, 개별 커맨드 대체 제안

## 상세 가이드

패턴 상세: `skills/swarm/references/swarm-patterns.md`
