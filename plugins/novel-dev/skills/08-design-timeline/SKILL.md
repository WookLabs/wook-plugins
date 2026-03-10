---
name: 08-design-timeline
description: "Use this skill when designing timeline and events for a novel. Triggers on: '타임라인', '시간순', 'timeline design'."
user-invocable: true
---

# /design-timeline - 타임라인 설계

작품 내 시간 흐름과 이벤트를 설계합니다.

## Quick Start

```bash
/design-timeline              # 타임라인 설계
/design-timeline --regression # 회귀물 모드
```

## What It Creates

### plot/timeline.json
- 시간대 구분 (현재/과거/미래)
- 주요 이벤트 시간순 배치
- 시간 도약 포인트
- 회상 씬 배치
- 회귀물: 원래 타임라인 vs 변경된 타임라인

## Options

### --view (integrated from /timeline)

기존 타임라인을 시각화합니다:

```bash
/design-timeline --view           # 현재 타임라인 시각화
/design-timeline --view --ascii   # ASCII 차트 출력
```

- 작품 내 시간 흐름을 시각적으로 표시
- 이벤트 간 시간 간격, 동시 발생 이벤트 표시
- 캐릭터별 타임라인 오버레이

## When to Use

- 회귀물/시간여행 장르
- 과거 회상이 많은 스토리
- 여러 시점 교차 구조
- 기존 타임라인 확인/시각화 (`--view`)
