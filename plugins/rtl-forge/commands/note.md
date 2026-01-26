---
description: 프로젝트 노트패드에 학습, 결정, 이슈, 문제를 기록합니다
---

# Note

RTL 프로젝트 지식을 노트패드에 기록하는 명령어입니다.

## Usage

```
/note learning "2-FF synchronizer는 메타스테빌리티를 완전히 해결하지 못한다"
/note decision "AXI4-Lite 대신 APB를 선택: 면적 절약"
/note issue "CDC 경로에서 gray 코딩 누락 발견"
/note problem "합성 후 타이밍 클로저 실패"
```

## Description

프로젝트 진행 중 발견한 지식과 결정사항을 기록하여 팀 지식으로 축적합니다.

### 노트 유형

| 유형 | 용도 | 예시 |
|------|------|------|
| learning | 기술적 발견, 패턴 | "Async FIFO는 최소 2사이클 레이턴시" |
| decision | 아키텍처 결정 | "Round-robin 대신 priority arbiter 선택" |
| issue | 발견된 문제점 | "reset 동기화 누락" |
| problem | 해결 필요한 블로커 | "timing violation at 500MHz" |

### 노트 저장 위치

노트는 현재 플랜 디렉토리에 저장됩니다:
- `.omc/rtl-forge/notepads/{plan-name}/learnings.md`
- `.omc/rtl-forge/notepads/{plan-name}/decisions.md`
- `.omc/rtl-forge/notepads/{plan-name}/issues.md`
- `.omc/rtl-forge/notepads/{plan-name}/problems.md`

### 노트 활용

- 코드 리뷰 시 참조
- 새 팀원 온보딩
- 유사 프로젝트 시작 시 참고
- 포스트모템 분석

## Best Practices

1. **구체적으로 작성**: "타이밍 문제" (X) → "CDC 경로에서 setup 위반 2ns" (O)
2. **이유 포함**: 왜 그런 결정/발견이 있었는지
3. **파일 참조**: 관련 RTL 파일명 포함
4. **타이밍 정보**: 관련 있으면 타이밍 다이어그램 포함
