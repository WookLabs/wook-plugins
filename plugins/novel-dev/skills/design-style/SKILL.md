---
name: design-style
description: 작품 문체 및 서술 스타일 설계
user-invocable: true
---

# /design-style - 문체 설계

작품의 서술 시점, 톤, 문장 스타일, 대화체 등을 정의합니다.

## Quick Start

```bash
/design-style           # 인터뷰 모드
/design-style --quick   # 장르 기본값 사용
```

## What It Creates

### meta/style-guide.json
- 서술 시점 (1인칭/3인칭)
- 시제 (과거형/현재형)
- 톤과 분위기
- 페이싱
- 대화 스타일
- 묘사 밀도
- 문장 리듬
- 금지어/선호 표현
- 챕터 구조 규칙

## Key Features

### 장르별 기본값
장르에 따라 적절한 기본값 제안:
- 로맨스: 감정 묘사 중심, 달달한 톤
- 판타지: 세계관 묘사, 액션 페이싱
- 스릴러: 짧은 문장, 긴장감 유지

### 캐릭터 말투 연동
문체 설계는 이후 캐릭터 설계에서 말투 설정의 기준이 됩니다.

## Documentation

See `skills/design-style/references/detailed-guide.md` for full workflow.
