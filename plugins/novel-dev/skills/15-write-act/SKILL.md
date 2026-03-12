---
name: 15-write-act
description: "Use this skill when writing chapters in bulk by act unit. Triggers on: 'N막 써줘', '막 집필', 'write act'."
user-invocable: true
---

# /write-act - 막(Act) 단위 집필

$ARGUMENTS

## 실행 단계

1. **막 정보 로드**
   - `plot/structure.json`에서 해당 막의 회차 범위 확인
   - 예: Act 1 = 1-15화

2. **순차 집필**
   ```
   for chapter in act_chapters:
       /write {chapter}  # Claude novelist
   ```

   > **성인소설**: `/write-act-2pass`를 사용하세요. Pass 1(Claude)이 ADULT 마커와 함께 집필하고, Pass 2(`adult-rewriter.mjs`)가 Grok API로 마커 구간을 대체합니다.

3. **회차별 사후 처리**
   - 요약 생성 (`context/summaries/`)
   - 상태 업데이트 (`meta/ralph-state.json`)

4. **막 완료 후 검증** (`--team` 여부에 따라 분기)

   **`--team` 없음** (기존 동작):
   - `/revise` (막 전체) — Claude editor 수행
   - `/evaluate` (막 전체) — Claude critic/beta-reader 수행
   - `/consistency-check` — Claude consistency-verifier 수행

   **`--team` 있음** (revision-team 대체):
   - 기존 `/revise` + `/evaluate` + `/consistency-check` 대신 revision-team이 실행됩니다.
   - 해당 막의 각 챕터에 대해 순차적으로 `revision-team-gate` 호출:
     ```
     for chapter in act_chapters:
         revision-team-gate {chapter}
     ```
   - 개별 챕터 검증 실패가 나머지 챕터 검증을 중단하지 않습니다.
   - 결과: `reviews/team/revision-team_ch{N}_{timestamp}.json`

> **Note**: 2-Pass 모드에서도 검증/퇴고는 Claude가 수행합니다.
> 성인 콘텐츠 평가 시 서사 구조와 일관성만 검토합니다.

## Quick Reference
```bash
/write-act 1          # 1막 집필 (기존 검증)
/write-act 1 --team   # 1막 집필 + revision-team 최종 검증
```

## Documentation

**Detailed Guide**: See `references/detailed-guide.md`
**Usage Examples**: See `examples/example-usage.md`
