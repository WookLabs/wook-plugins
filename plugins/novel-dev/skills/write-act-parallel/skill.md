---
name: write-act-parallel
description: "Use this skill when writing an entire act with Claude-Codex parallel pipeline. Triggers on: '병렬 막 집필', 'write act parallel'."
user-invocable: true
---

# /write-act-parallel - Act 단위 병렬 협업 집필

$ARGUMENTS

Act의 모든 챕터를 순차적으로 `/write-parallel`로 집필합니다.

## Quick Start

```bash
/write-act-parallel 2              # 2막 전체를 병렬 협업으로
/write-act-parallel 2 --pick       # 병합 없이 더 나은 버전만 선택
/write-act-parallel 2 --2pass      # 병합 + Grok 성인 리라이트
```

## 실행 단계

1. `plot/structure.json`에서 해당 Act의 챕터 범위 확인
2. 각 챕터에 대해 `/write-parallel {chapter}` 동일 플래그로 실행
3. Act 완료 후 `/act-review {act}` 실행

## 비용

Act 전체 × 2배 (Claude + Codex 병렬). 품질 최대화 목적.
