---
name: write-act-2pass
description: "Use this skill when writing act-level bulk chapters using the 2-pass pipeline. Triggers on: '막 2패스', 'write act 2pass'."
user-invocable: true
---

# /write-act-2pass - 막 단위 2-Pass 집필

$ARGUMENTS

지정한 막(Act)의 모든 회차를 2-Pass로 순차 집필합니다.
Claude가 집필하고 Grok이 성인 장면을 리라이트합니다.

## Quick Start

```bash
/write-act-2pass 1          # 1막 전체를 캐릭터 협업 + 2-Pass로 집필 (기본값)
/write-act-2pass 2          # 2막 전체를 캐릭터 협업 + 2-Pass로 집필
/write-act-2pass 1 --solo   # 1막 전체를 novelist 단독 + 2-Pass로 집필
/write-act-2pass 1 --codex  # 1막 전체를 Codex(GPT-5.4) + Grok 2-Pass로 집필
```

## Prerequisites

`~/.env` 파일에 API 키 설정:
```
XAI_API_KEY=xai-xxxxxxxxxxxx
# --codex 사용 시: Codex CLI가 자체 인증 처리 (별도 키 불필요)
```

## 실행 단계

1. **막 정보 로드**
   - `plot/structure.json`에서 해당 막의 회차 범위 확인
   - 예: Act 1 = 1-15화

1-B. **Codex 집필 (--codex)**

   `$ARGUMENTS`에 `--codex`가 있으면 각 회차를 Codex(GPT-5.4) + Grok으로 집필합니다:
   ```
   for chapter in act_chapters:
       # writing-team-codex-2pass 사용
       Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
       팀 실행: writing-team-codex-2pass
       대상: Chapter {chapter}
       프로젝트: {projectPath}
       ")
   ```
   이 경우 `1-A 기본 집필` 단계를 건너뜁니다.

1-A. **기본 집필: 캐릭터 협업 + 2-Pass**

   기본적으로 각 회차를 collab 2-pass 팀으로 집필합니다:
   ```
   for chapter in act_chapters:
       # writing-team-collab-2pass 사용 (기본값)
       Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
       팀 실행: writing-team-collab-2pass
       대상: Chapter {chapter}
       프로젝트: {projectPath}
       ")
   ```
   이 경우 `2. 순차 집필 (--solo, 2-Pass)` 단계를 건너뜁니다.

2. **순차 집필 (--solo, 2-Pass)**

   `$ARGUMENTS`에 `--solo`가 있으면 각 회차를 novelist 단독 + 2-Pass로 집필합니다:
   ```
   for chapter in act_chapters:
       /write-2pass {chapter} --solo
   ```

   각 회차별:
   - **Pass 1**: Claude가 전체 챕터 집필 (ADULT 마커 삽입)
   - **Pass 2**: `adult-rewriter.mjs`로 Grok 리라이트
   - summarizer → 요약 생성
   - `meta/ralph-state.json` → 상태 업데이트

3. **회차별 품질 검증 (Claude)**
   - critic, beta-reader, genre-validator 병렬 실행
   - 서사 구조, 캐릭터 일관성, 플롯 정합성 평가

4. **막 완료 후 자동 트리거**
   - `/act-review` — 막 단위 리뷰 + 선택적 심층 평가

## /write-act과의 차이

| 항목 | /write-act | /write-act-2pass |
|------|-----------|-----------------|
| 집필 엔진 | writer_mode에 따라 결정 | 항상 Claude + Grok |
| 성인 장면 | Claude 자기검열 | Grok 리미트 해제 리라이트 |
| 용도 | 범용 | 성인소설 전용 |

## Error Handling

### 막 정보 없음
```
[ERROR] plot/structure.json에서 Act {N} 정보를 찾을 수 없습니다.
→ /gen-plot으로 플롯을 먼저 생성하세요
```

### Pass 2 실패 (특정 회차)
```
[WARNING] {N}화 Grok 리라이트 실패. Claude 원본 유지.
→ 나머지 회차는 계속 진행됩니다.
```
