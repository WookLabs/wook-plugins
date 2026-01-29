---
description: "[0단계] 브레인스토밍 - 소설 아이디어를 소크라틱 대화로 정제합니다"
argument-hint: <아이디어 (선택)>
allowed-tools:
  - Read
  - Write
  - AskUserQuestion
model: sonnet
---

# /brainstorm

소설 아이디어를 소크라틱 대화로 체계적으로 정제합니다.
blueprint-gen 전에 사용하여 아이디어의 깊이와 방향을 잡습니다.

## 사용법

```bash
# 아이디어와 함께
/brainstorm "평범한 대학생이 갑자기 마법을 쓸 수 있게 되는 현대 판타지"

# 아이디어 없이 시작
/brainstorm

# 이전 결과 이어서
/brainstorm --continue

# 특정 영역 집중
/brainstorm --focus=character
```

## 브레인스토밍 규칙

1. **한 번에 하나의 질문만** - 절대 여러 질문을 동시에 하지 않는다
2. **200-300 단어 이내 응답** - 짧고 집중적으로
3. **최소 2-3가지 대안 제시** - 항상 선택지를 준다
4. **사용자 의도 존중** - 아이디어를 바꾸지 않고 발전시킨다
5. **AskUserQuestion 적극 활용** - 구조화된 선택지 제공

## 단계 흐름

```
Phase 1: 씨앗 (Seed)     → 초기 아이디어 파악, 핵심 감정 질문
Phase 2: 뿌리 (Root)     → 독자층, 갈등, 톤, 분량 결정
Phase 3: 줄기 (Stem)     → 주인공, 세계관, 핵심 전제 설계
Phase 4: 가지 (Branch)   → 오프닝, 클라이맥스, 결말 방향
Phase 5: 열매 (Fruit)    → 결과 정리 → meta/brainstorm-result.md 저장
```

## 생성 파일

```
meta/brainstorm-result.md
├── 핵심 아이디어 (로그라인)
├── 방향 정리 (장르, 독자층, 톤, 갈등, 분량)
├── 주인공 원형
├── 세계관 방향
├── 구조 (오프닝, 전제, 클라이맥스, 결말)
└── 추가 아이디어
```

## 옵션

| 옵션 | 설명 |
|------|------|
| `--continue` | 이전 브레인스토밍 결과를 이어서 발전 |
| `--focus=AREA` | 특정 영역 집중 (character/world/plot) |

## 다음 단계

1. `/blueprint-gen` - 브레인스토밍 결과를 기반으로 블루프린트 생성
2. `/blueprint-review` - 기획서 검토 및 개선
