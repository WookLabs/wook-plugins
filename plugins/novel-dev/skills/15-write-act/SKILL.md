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
   - `meta/project.json`에서 `writer_mode` 확인
   - 예: Act 1 = 1-15화

2. **순차 집필**
   ```
   for chapter in act_chapters:
       /write {chapter}  # writer_mode에 따라 Grok 또는 Claude
   ```

   - `writer_mode: "grok"` → 모든 회차를 Grok API로 생성
   - `writer_mode: "hybrid"` → (deprecated) 성인 키워드 감지 시 Grok. **성인소설은 `"grok"` 권장**
   - `writer_mode: "claude"` → Claude novelist 에이전트로 생성

3. **회차별 사후 처리**
   - 요약 생성 (`context/summaries/`)
   - 상태 업데이트 (`meta/ralph-state.json`)

4. **막 완료 후 자동 트리거**
   - `/revise` (막 전체) — Claude editor 수행
   - `/evaluate` (막 전체) — Claude critic/beta-reader 수행
   - `/consistency-check` — Claude consistency-verifier 수행

> **Note**: Grok 모드에서도 검증/퇴고는 Claude가 수행합니다.
> 성인 콘텐츠 평가 시 서사 구조와 일관성만 검토합니다.

## Documentation

**Detailed Guide**: See `references/detailed-guide.md`
**Usage Examples**: See `examples/example-usage.md`
