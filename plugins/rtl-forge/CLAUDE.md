# RTL Forge — Superpowers Domain Routing

## RTL 도메인 감지

`.v` 또는 `.sv` 파일을 다루는 작업은 RTL(하드웨어) 도메인이다.
RTL은 소프트웨어가 아니므로, 소프트웨어용 superpowers 스킬 대신 RTL 전용 스킬을 사용한다.

## Superpowers → RTL 라우팅 테이블

| superpowers 스킬 | RTL 대체 스킬 | 이유 |
|-----------------|-------------|------|
| `brainstorming` | `/rtl-analyze` | RTL 분석은 신호 역추적, CDC, FSM 상태 분석 등 구조화된 Phase가 필요. 자유 형식 brainstorming은 부적합 |
| `writing-plans` | `/rtl-plan` | RTL 수정 계획은 타이밍 다이어그램 + Top-Down 수정 순서가 필수. SW식 계획은 타이밍 관계를 놓침 |
| `systematic-debugging` | `/rtl-analyze` | RTL 디버깅은 파형 분석, sensitivity list, blocking/non-blocking 검사 등 HW 고유 체크리스트 사용 |
| `test-driven-development` | 해당 없음 | RTL에는 전통적 단위테스트가 없음. 검증은 시뮬레이션 + 파형 확인으로 수행 |
| `verification-before-completion` | `/rtl-apply` Phase 3 + 이 스킬 병행 | rtl-apply의 Syntax/일관성 검사 후, verification 스킬로 최종 확인 가능 |
| `dispatching-parallel-agents` | `/rtl-format` 과 병행 | 여러 .v 파일 동시 포매팅 시 병렬 에이전트 활용 가능 |
| `requesting-code-review` | 그대로 사용 | RTL 코드 리뷰에도 적용 가능. 단, RTL 코딩 표준(rules.md) 기준으로 리뷰 |

## 라우팅 규칙

1. **파일 타입 감지**: 작업 대상이 `.v` 또는 `.sv` 파일이면 RTL 도메인
2. **대체 스킬 우선**: 위 테이블에서 "RTL 대체 스킬"이 있으면 superpowers 대신 RTL 스킬 사용
3. **병행 가능**: "병행" 표시된 스킬은 superpowers와 RTL 스킬을 함께 사용
4. **그대로 사용**: 표시된 스킬은 RTL 컨텍스트에서도 superpowers 그대로 적용

## RTL 워크플로우

```
문제 발견 / 기능 추가 요청
  │
  ▼
/rtl-analyze  ← brainstorming + systematic-debugging 대체
  │
  ▼
/rtl-plan     ← writing-plans 대체
  │
  ▼
/rtl-apply    ← verification-before-completion 포함
  (내부: sonnet 에이전트로 rtl-format 자동 적용)
```

## 코딩 표준

모든 Verilog/SystemVerilog 코드는 `rtl-format/rules.md`의 18개 규칙을 따른다.
코드 리뷰, 수정 제안, 새 코드 작성 시 이 규칙을 기준으로 판단한다.
