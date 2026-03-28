---
date: 2026-03-29
topic: prose-quality
---

# AI 문체 개선: 유려한 산문 품질

## Problem Frame

AI(Claude)가 소설을 집필할 때 특유의 "끊어쓰기" 문체가 나타난다. 단문 나열, 나열식 구조("X였다. Y였다."), 리스트화된 내적 독백, 복문 부재 등으로 인해 문학적 몰입감이 부족하다. 유명 작가 수준의 유려한 산문을 기대하는 사용자에게 현재 출력은 "웹소설 중급" 수준에 머문다.

### 구체적 AI 문체 문제 패턴

1. **단문 남발**: "도현은 뛰고 있었다." "잡혔다." "살아야 한다." — 1줄 1문장 과다
2. **나열식 구조**: "X였다. Y였다. Z였다." 동일 어미 반복
3. **사고 리스트화**: "하나, ~ 둘, ~ 셋, ~" 내적 독백 항목화
4. **복문 부재**: 종속절·삽입절 거의 없어 리듬 단조
5. **감정 직설화**: "심장이 미쳤다" — show don't tell 위반
6. **과도한 설명**: 독자가 유추할 수 있는 것까지 풀어서 설명
7. **전환어 부재**: 문장 간 연결이 끊기고 점프하는 느낌

## Requirements

**스타일 가이드 강화**
- R1. style-guide.json에 "prose_rules" 섹션 추가 — AI 문체 금지 패턴(anti-patterns)과 권장 패턴(positive-patterns) 정의
- R2. anti-patterns: 연속 3문장 이상 단문 금지, 동일 어미 연속 사용 금지, 리스트형 내적 독백 금지, 직접적 감정 서술 최소화
- R3. positive-patterns: 복문·종속절 적극 활용, 감각 묘사로 감정 전달(show don't tell), 문장 길이 변주(단문-중문-장문 리듬), 삽입구·부연절로 호흡 만들기

**Few-Shot 스타일 라이브러리**
- R4. 장르별 문체 프리셋 제공 — 장르마다 참조 작가 스타일의 예시 문장 세트
- R5. 각 프리셋은 "같은 장면을 AI 문체 vs 유려한 문체"로 before/after 쌍 제공
- R6. 프리셋 목록: 판타지(전민희/이영도 스타일), 로맨스(구병모/박경리 스타일), 스릴러(나관중/정유정 스타일), 현대문학(신경숙/김영하 스타일) — 최소 4개 장르

**Novelist/Narrator 에이전트 적용**
- R7. novelist.md와 narrator.md 시스템 프롬프트에 prose_rules 참조 지시 추가
- R8. 집필 시 해당 프로젝트의 style-guide.json + 장르 매칭 few-shot 예시를 컨텍스트로 주입
- R9. Pass 1(초고)에서부터 유려한 문체 적용 — "내용 먼저, 문체 나중"이 아님

**Proofreader AI 문체 감지**
- R10. proofreader 에이전트에 "AI 문체 패턴 감지" 체크리스트 추가
- R11. 감지 항목: 연속 단문, 동일 어미 반복, 리스트형 독백, 직접 감정 서술, 과잉 설명
- R12. 감지 시 구체적 리라이트 제안 (단순 지적이 아닌 대안 문장 제시)

## Success Criteria

- 동일 플롯으로 집필 시, 연속 단문 3문장 이상 구간이 현저히 감소
- 복문(종속절 포함 문장) 비율 30% 이상
- proofreader가 AI 문체 패턴 0건 보고 가능
- before/after 비교에서 체감 품질 차이 확인 가능

## Scope Boundaries

- 스토리/플롯 품질은 이 개선의 범위 밖 (구조는 유지, 문장만 개선)
- 영어 문체는 범위 밖 (한국어 산문 전용)
- style-library 스킬의 기존 기능은 유지, 확장만

## Key Decisions

- 3중 적용: style-guide 규칙 + few-shot 예시 + proofreader 감지/교정
- Pass 1부터 적용: 초고 단계에서 이미 유려하게, proofreader는 미세 보정
- 장르별 프리셋: 프로젝트 초기화 시 장르에 맞는 프리셋 자동 매칭
- before/after 쌍: AI가 학습하기 가장 효과적인 형태

## Outstanding Questions

### Deferred to Planning
- [Affects R4][Needs research] 장르별 프리셋의 구체적 예시 문장 작성 — 저작권 문제 없는 수준에서 "스타일 모방" 예시를 어떻게 작성할지
- [Affects R8][Technical] few-shot 예시 주입 시 토큰 비용 최적화 — 매번 전체 라이브러리를 넣으면 비효율적

## Next Steps

→ `/ce:plan` for structured implementation planning
