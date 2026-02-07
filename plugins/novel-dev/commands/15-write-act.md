---
description: 막 집필
---

[NOVEL-SISYPHUS: 막 집필]

$ARGUMENTS

## 실행 단계

1. **막 정보 로드**
   - `plot/structure.json`에서 해당 막의 회차 범위 확인
   - 예: Act 1 = 1-15화

2. **순차 집필**
   ```
   for chapter in act_chapters:
       /09-write {chapter}
   ```

3. **막 완료 후 자동 트리거**
   - `/12-revise` (막 전체)
   - `/13-evaluate` (막 전체)
   - `/14-check`
