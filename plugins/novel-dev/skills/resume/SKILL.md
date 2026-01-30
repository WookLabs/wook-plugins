---
name: resume
description: |
  중단된 집필 세션을 자동 감지하고 이어서 작업합니다.
  <example>이어서 써줘</example>
  <example>resume</example>
  <example>계속 집필</example>
  <example>어디까지 했지</example>
  <example>/resume</example>
  <example>중단된 거 이어서</example>
  <example>다시 시작</example>
user-invocable: true
---

# /resume - 중단된 세션 복구

중단된 write-all 집필 세션을 자동으로 감지하고 복구합니다.

## Quick Start
```bash
/resume              # 자동 감지 후 복구 옵션 제공
/resume --continue   # 즉시 이어서 집필
/resume --status     # 진행 상황만 확인
/resume --reset      # 세션 초기화
```

## 세션 감지 프로토콜

### Step 1: 상태 파일 확인

`meta/ralph-state.json` 존재 여부를 확인합니다.

**파일 없음** → "중단된 세션이 없습니다. /write-all로 새 세션을 시작하세요." 출력 후 종료.

**파일 있음** → Step 2로 진행.

### Step 2: 복구 가능 여부 판정

상태 파일에서 다음 필드를 확인합니다:

| 필드 | 조건 | 의미 |
|------|------|------|
| `ralph_active` | `true` | 세션이 활성 상태에서 중단됨 |
| `can_resume` | `true` | 복구 가능한 체크포인트 존재 |
| `completed_at` | 존재 | 이미 완료된 세션 (복구 불필요) |

**판정 로직**:
```
if completed_at exists:
    "이미 완료된 세션입니다. 새 세션은 /write-all로 시작하세요."
    종료

if ralph_active == true OR can_resume == true:
    복구 가능 → Step 3
else:
    "복구 가능한 세션이 없습니다."
    종료
```

### Step 3: 세션 정보 분석

상태 파일에서 다음을 추출합니다:

- `project_id` → 프로젝트 이름
- `completed_chapters` 배열 → 완료된 챕터 수
- `total_chapters` → 전체 챕터 수
- `current_act` → 현재 막
- `current_chapter` → 현재 회차
- `last_checkpoint` → 마지막 체크포인트 시간
- `last_quality_score` → 마지막 품질 점수
- `failed_chapters` → 실패한 챕터 목록
- `circuit_breaker` → Circuit Breaker 상태

### Step 4: 복구 정보 표시

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

**추가 정보** (해당 시):
- 실패 챕터가 있으면: `실패 챕터: {failed_chapters}`
- Circuit Breaker 발동 시: `Circuit Breaker 활성: {failure_count}회 실패`
- Wisdom 존재 시: `이전 세션에서 {count}건의 지혜가 축적되었습니다`

### Step 5: 복구 옵션 제공

AskUserQuestion으로 사용자에게 옵션을 제공합니다:

**질문**: "어떻게 진행하시겠습니까?"

| 옵션 | 설명 |
|------|------|
| **1. 이어서 집필** | 중단 지점({current_chapter}화)부터 계속 |
| **2. 현재 챕터 재시작** | {current_chapter}화만 다시 작성 |
| **3. 상태만 확인** | 상세 진행 상황 표시 후 종료 |
| **4. 세션 초기화** | 상태 리셋 (백업 생성 후) |

### Step 6: 선택 실행

#### 옵션 1 - 이어서 집필

1. Circuit Breaker 상태 확인 및 복원
2. `/write-all --resume` 실행
3. `current_chapter`부터 자동 재개

#### 옵션 2 - 현재 챕터 재시작

1. `current_chapter`에서 해당 챕터 번호 추출
2. `/write {current_chapter}` 실행
3. 단일 챕터만 재작성

#### 옵션 3 - 상태만 확인

상세 진행 보고서 출력:

```
+--------------------------------------------------+
|          세션 상세 현황                            |
+--------------------------------------------------+
|                                                  |
|  -- 진행 상황 --                                  |
|  전체: {total_chapters}화                         |
|  완료: {completed_chapters.length}화              |
|  실패: {failed_chapters.length}화                 |
|  남은: {remaining}화                              |
|  진행률: {percentage}%                            |
|                                                  |
|  -- 품질 정보 --                                  |
|  마지막 점수: {last_quality_score}                |
|  Circuit Breaker: {triggered ? "활성" : "정상"}   |
|  실패 이유: {failure_reasons}                     |
|                                                  |
|  -- 시간 정보 --                                  |
|  시작: {started_at}                               |
|  마지막 체크포인트: {last_checkpoint}              |
|  경과: {elapsed}                                  |
|                                                  |
|  -- 완료된 챕터 --                                |
|  {completed_chapters}                             |
|                                                  |
+--------------------------------------------------+
```

#### 옵션 4 - 세션 초기화

1. 현재 `ralph-state.json`을 `meta/backups/`에 백업
2. `ralph-state.json`을 초기 상태로 리셋:
   ```json
   {
     "ralph_active": false,
     "can_resume": false,
     "mode": null,
     "reset_at": "{timestamp}",
     "reset_reason": "user_requested"
   }
   ```
3. "세션이 초기화되었습니다. /write-all로 새 세션을 시작하세요." 출력

## Wisdom 연동

복구 시 `meta/wisdom/` 폴더를 확인합니다:

1. `meta/wisdom/` 디렉토리 존재 확인
2. 존재하면 내부 `.md` 파일 수 카운트
3. 복구 정보 표시 시 다음 메시지 추가:
   ```
   이전 세션에서 {count}건의 지혜가 축적되었습니다.
   ```
4. "이어서 집필" 선택 시 wisdom 내용을 요약하여 컨텍스트에 포함

## --옵션 직접 실행

명령줄 옵션이 있으면 AskUserQuestion 없이 즉시 실행합니다:

| 옵션 | 동작 |
|------|------|
| `--continue` | 옵션 1 (이어서 집필) 즉시 실행 |
| `--status` | 옵션 3 (상태만 확인) 즉시 실행 |
| `--reset` | 옵션 4 (세션 초기화) 즉시 실행 |

## Edge Cases

### 백업에서 복구

`ralph-state.json`이 손상된 경우:
1. `meta/backups/` 디렉토리에서 최신 `ralph-state-*.json` 검색
2. 백업이 있으면 복원 제안
3. 백업도 없으면 "복구 불가능. /write-all로 새 세션을 시작하세요." 출력

### 부분 완료 챕터

`chapters/chapter_{N}.md` 파일은 존재하지만 `completed_chapters`에 N이 없는 경우:
- 해당 챕터는 집필 중 중단된 것으로 판단
- "현재 챕터 재시작" 옵션에서 이 챕터를 대상으로 지정

### Circuit Breaker 활성 상태

`circuit_breaker.triggered == true`인 경우:
- 복구 정보에 경고 표시
- "이어서 집필" 선택 시 Circuit Breaker 상태도 함께 복원
- 사용자에게 이전 실패 원인 안내

## Documentation

**Session Recovery Guide**: See `references/session-recovery.md`
- ralph-state.json 필드 상세 설명
- 백업 복구 절차
- 부분 완료 챕터 처리 방법
