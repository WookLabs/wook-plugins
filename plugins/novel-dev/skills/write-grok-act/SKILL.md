---
name: write-grok-act
description: Grok API로 막(Act) 단위 일괄 집필
user-invocable: true
---

# /write-grok-act - Grok으로 막 단위 집필

$ARGUMENTS

지정한 막(Act)의 모든 회차를 Grok API로 순차 집필합니다.
`writer_mode` 설정과 무관하게 항상 Grok 파이프라인을 사용합니다.

## Quick Start

```bash
/write-grok-act 1     # 1막 전체를 Grok으로 집필
/write-grok-act 2     # 2막 전체를 Grok으로 집필
```

## Prerequisites

`~/.env` 파일에 API 키 설정:
```
XAI_API_KEY=xai-xxxxxxxxxxxx
```

API 키는 https://console.x.ai 에서 발급받을 수 있습니다.

## 실행 단계

1. **막 정보 로드**
   - `plot/structure.json`에서 해당 막의 회차 범위 확인
   - 예: Act 1 = 1-15화

2. **순차 집필 (Grok)**
   ```
   for chapter in act_chapters:
       /write-grok {chapter}
   ```

   각 회차별:
   - `assemble-grok-prompt.mjs` → 컨텍스트 조립
   - `grok-writer.mjs` → Grok API 호출 → 챕터 저장
   - summarizer → 요약 생성
   - `meta/ralph-state.json` → 상태 업데이트

3. **회차별 품질 검증 (Claude)**
   - critic, beta-reader, genre-validator 병렬 실행
   - 서사 구조, 캐릭터 일관성, 플롯 정합성만 평가
   - 성인 콘텐츠 자체는 평가 대상 아님

4. **막 완료 후 자동 트리거**
   - `/revise` (막 전체) — Claude editor 수행
   - `/evaluate` (막 전체) — Claude critic/beta-reader 수행
   - `/consistency-check` — Claude consistency-verifier 수행

> **Note**: Grok이 집필하고 Claude가 검증/퇴고합니다.
> 성인 콘텐츠 평가 시 서사 구조와 일관성만 검토합니다.

## /write-act과의 차이

| 항목 | /write-act | /write-grok-act |
|------|-----------|----------------|
| 집필 엔진 | writer_mode에 따라 결정 | 항상 Grok |
| writer_mode 필요 | 예 | 아니오 |
| 용도 | 범용 | 성인소설 전용 |

## Error Handling

### API 키 없음
```
[ERROR] XAI_API_KEY를 찾을 수 없습니다.
→ ~/.env 파일에 XAI_API_KEY=xai-xxx 추가
```

### 막 정보 없음
```
[ERROR] plot/structure.json에서 Act {N} 정보를 찾을 수 없습니다.
→ /gen-plot으로 플롯을 먼저 생성하세요
```
