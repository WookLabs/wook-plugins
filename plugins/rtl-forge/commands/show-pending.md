---
description: 승인 대기 중인 스펙/변경 목록을 표시합니다
---

# Show Pending

승인 대기 중인 스펙 문서와 RTL 변경 목록을 표시하는 명령어입니다.

## Usage

```
/show-pending
/show-pending --type specs
/show-pending --type changes
/show-pending --verbose
```

## Description

이 명령어는 현재 승인을 기다리고 있는 모든 항목을 표시합니다.

### 표시 정보

#### Pending Specs
| 항목 | 설명 |
|------|------|
| ID | 스펙 식별자 |
| Title | 스펙 제목 |
| Author | 작성자 (agent) |
| Created | 생성 시간 |
| Status | 대기/검토중 |

#### Pending Changes
| 항목 | 설명 |
|------|------|
| ID | 변경 식별자 |
| File | 대상 RTL 파일 |
| Type | 추가/수정/삭제 |
| Author | 제안자 (rtl-coder) |
| Critic | rtl-critic 평가 |
| Status | 대기/검토중 |

### 옵션

- `--type specs`: 스펙만 표시
- `--type changes`: 변경만 표시
- `--verbose`: 상세 정보 (타이밍 다이어그램 포함)

## Files

- 대기 스펙: `.omc/rtl-forge/pending-specs.json`
- 대기 변경: `.omc/rtl-forge/pending-changes.json`
