---
description: "[20단계] 세션 복구 - 중단된 집필 세션을 감지하고 복구합니다"
---

[NOVEL-DEV: SESSION RESUME]

$ARGUMENTS

## 동작 흐름

1. `meta/ralph-state.json` 확인
2. 세션 상태 분석 및 표시
3. 복구 옵션 제공 (AskUserQuestion)
4. 선택에 따라 실행

## 옵션

| 옵션 | 설명 |
|------|------|
| `--continue` | 중단 지점부터 즉시 이어서 집필 |
| `--status` | 진행 상황만 확인 |
| `--reset` | 세션 초기화 (백업 생성 후) |
| (없음) | 자동 감지 후 복구 옵션 대화형 제공 |

## 상태 감지

### 복구 가능 조건

`meta/ralph-state.json`이 존재하고 다음 중 하나를 만족:
- `ralph_active == true` (활성 세션 중단)
- `can_resume == true` (체크포인트 존재)

### 복구 불가 조건

- 파일 없음 → "중단된 세션이 없습니다"
- `completed_at` 존재 → "이미 완료된 세션입니다"
- `ralph_active == false` AND `can_resume == false` → "복구 가능한 세션이 없습니다"

## 복구 옵션

AskUserQuestion으로 제공:

1. **이어서 집필** - `/write-all --resume` 호출
2. **현재 챕터 재시작** - `/write {current_chapter}` 호출
3. **상태만 확인** - 상세 진행 현황 출력
4. **세션 초기화** - `ralph-state.json` 백업 후 리셋

## 복구 정보 표시

```
+--------------------------------------------------+
|          중단된 세션 발견                          |
+--------------------------------------------------+
|                                                  |
|  프로젝트: {project_id}                          |
|  진행: {completed}/{total} 챕터 완료              |
|  현재 위치: {current_act}막 {current_chapter}화   |
|  마지막 작업: {last_checkpoint}                   |
|  품질 점수 평균: {avg_score}                      |
|                                                  |
+--------------------------------------------------+
```

## Wisdom 연동

`meta/wisdom/` 폴더가 존재하면:
- 축적된 wisdom 파일 수 표시
- 복구 시 wisdom 컨텍스트 자동 포함

## 의존 파일

| 파일 | 용도 |
|------|------|
| `meta/ralph-state.json` | 세션 상태 및 체크포인트 |
| `meta/backups/ralph-state-*.json` | 백업 상태 파일 |
| `meta/wisdom/*.md` | 축적된 지혜 (선택) |
| `chapters/chapter_*.md` | 완료된 챕터 파일 |

## 관련 명령어

| 명령어 | 관계 |
|--------|------|
| `/write-all` | 전체 집필 시작 / 재개 대상 |
| `/write` | 단일 챕터 재시작 대상 |
| `/status` | 워크플로우 전체 상태 (resume은 세션 복구 특화) |
