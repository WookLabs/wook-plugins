---
name: 15-write-act
description: 막(Act) 단위 일괄 집필
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

4. **막 완료 후 자동 트리거**
   - `/revise` (막 전체) — Claude editor 수행
   - `/evaluate` (막 전체) — Claude critic/beta-reader 수행
   - `/consistency-check` — Claude consistency-verifier 수행

> **Note**: 2-Pass 모드에서도 검증/퇴고는 Claude가 수행합니다.
> 성인 콘텐츠 평가 시 서사 구조와 일관성만 검토합니다.

## Documentation

**Detailed Guide**: See `references/detailed-guide.md`
**Usage Examples**: See `examples/example-usage.md`
