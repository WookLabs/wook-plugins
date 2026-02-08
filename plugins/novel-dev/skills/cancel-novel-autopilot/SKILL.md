---
name: cancel-novel-autopilot
description: 활성 Novel Autopilot 세션 안전 중단
user-invocable: true
---

[NOVEL-DEV: CANCEL NOVEL AUTOPILOT]

## 취소 프로토콜

Novel Autopilot을 안전하게 중단합니다.

## 실행

1. **상태 확인**: `meta/autopilot-state.json` 읽기
2. **현재 작업 중단**:
   - Phase 2 진행 중이면 Ralph Loop 중단
   - 현재 회차 완료 대기 (진행 중인 집필은 완료)
3. **상태 저장**:
   - `autopilot_active: false`
   - `can_resume: true`
   - 현재 Phase 및 진행 상황 보존
4. **알림**: 중단 완료 및 재개 방법 안내

## 상태 변경

**Before:**
```json
{
  "autopilot_active": true,
  "current_phase": 2,
  "...": "..."
}
```

**After:**
```json
{
  "autopilot_active": false,
  "can_resume": true,
  "cancelled_at": "2026-01-22T15:30:00Z",
  "cancelled_phase": 2,
  "current_phase": 2,
  "...": "..."
}
```

## 재개 방법

취소 후 재개:
```
/novel-autopilot --resume
```

처음부터 다시:
```
/novel-autopilot --restart
```

## Magic Keywords

다음 키워드로도 취소 가능:
- "취소", "중단", "멈춰"
- "cancel", "stop", "abort"

## 출력

```markdown
## Autopilot 중단됨

| 항목 | 내용 |
|------|------|
| 중단 Phase | Phase 2 (Execution) |
| 완료된 회차 | 15/50화 |
| 현재 막 | Act 1 |

### 재개 방법
- `/novel-autopilot --resume` - 중단점에서 이어서
- `/novel-autopilot --restart` - 처음부터 다시

### 관련 상태 파일
- `meta/autopilot-state.json` - Autopilot 상태
- `meta/ralph-state.json` - Ralph Loop 상태
```
