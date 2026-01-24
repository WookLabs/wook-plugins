---
name: design-relationship
description: |
  Triggers when user wants to design character relationships.
  <example>관계 설계</example>
  <example>캐릭터 관계도</example>
  <example>/design-relationship</example>
  <example>인물 관계</example>
  <example>relationship design</example>
user-invocable: true
---

# /design-relationship - 관계 설계

캐릭터 간 관계 네트워크를 설계합니다.

## Quick Start

```bash
/design-relationship           # 전체 관계 설계
/design-relationship char_001  # 특정 캐릭터 중심
```

## What It Creates

### plot/relationships.json
- 핵심 관계 목록
- 관계 변화 아크
- 삼각관계/갈등 구조
- 숨겨진 관계
- 파벌/동맹

## When to Use

- 등장인물 10명 이상
- 복잡한 관계망 (삼각관계, 가족 갈등)
- 관계 변화가 플롯 핵심
