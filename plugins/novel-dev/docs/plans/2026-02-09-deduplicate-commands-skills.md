# Commands/Skills 중복 해소 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** commands/와 skills/의 33개 중복 제거, 캐시 클리어 안내 추가, ghost entry 원인 근절

**Architecture:** 중복 33개 커맨드 파일 삭제. command-only 3개(AGENTS.md, novel-autopilot, cancel-novel-autopilot)는 유지. skills/가 없는 command는 skill로 마이그레이션하거나 유지.

**Tech Stack:** Markdown, Git

---

## 현황

| 카테고리 | 수량 | 처리 |
|----------|------|------|
| DUPLICATE (command + skill 둘 다 존재) | 33개 | command 삭제 |
| COMMAND-ONLY (command만 존재) | 3개 | 유지 또는 skill로 마이그레이션 |
| SKILL-ONLY (skill만 존재) | 11개 | 변경 없음 |

Skills는 commands를 참조하지 않음 (grep 확인 완료).

---

### Task 1: 중복 커맨드 파일 33개 삭제

**Files to DELETE:**
```
commands/00-brainstorm.md
commands/01-blueprint-gen.md
commands/02-blueprint-review.md
commands/03-init.md
commands/04-design-style.md
commands/05-design-world.md
commands/06-design-character.md
commands/07-design-relationship.md
commands/08-design-timeline.md
commands/09-design-main-arc.md
commands/10-design-sub-arc.md
commands/11-design-foreshadow.md
commands/12-design-hook.md
commands/13-gen-plot.md
commands/14-write.md
commands/15-write-act.md
commands/16-write-all.md
commands/17-revise.md
commands/18-evaluate.md
commands/19-consistency-check.md
commands/20-resume.md
commands/21-wisdom.md
commands/22-swarm.md
commands/analyze-engagement.md
commands/check-retention.md
commands/help.md
commands/quickstart.md
commands/stats.md
commands/status.md
commands/style-library.md
commands/timeline.md
commands/validate-genre.md
commands/verify-chapter.md
```

**Files to KEEP:**
```
commands/AGENTS.md              ← 에이전트 메타데이터 (skill 아님)
commands/novel-autopilot.md     ← command-only (skill 없음)
commands/cancel-novel-autopilot.md ← command-only (skill 없음)
```

**Step 1: 삭제 실행**

```bash
cd plugins/novel-dev
git rm commands/00-brainstorm.md commands/01-blueprint-gen.md commands/02-blueprint-review.md \
  commands/03-init.md commands/04-design-style.md commands/05-design-world.md \
  commands/06-design-character.md commands/07-design-relationship.md commands/08-design-timeline.md \
  commands/09-design-main-arc.md commands/10-design-sub-arc.md commands/11-design-foreshadow.md \
  commands/12-design-hook.md commands/13-gen-plot.md commands/14-write.md \
  commands/15-write-act.md commands/16-write-all.md commands/17-revise.md \
  commands/18-evaluate.md commands/19-consistency-check.md commands/20-resume.md \
  commands/21-wisdom.md commands/22-swarm.md \
  commands/analyze-engagement.md commands/check-retention.md commands/help.md \
  commands/quickstart.md commands/stats.md commands/status.md \
  commands/style-library.md commands/timeline.md commands/validate-genre.md \
  commands/verify-chapter.md
```

**Step 2: 남은 파일 확인**

```bash
ls commands/
# Expected: AGENTS.md, novel-autopilot.md, cancel-novel-autopilot.md
```

**Step 3: Commit**

```bash
git commit -m "refactor: remove 33 duplicate command files (skills/ is authoritative)"
```

---

### Task 2: novel-autopilot을 skill로 마이그레이션

command-only인 `novel-autopilot`과 `cancel-novel-autopilot`을 skills/ 체계로 이동.

**Step 1: 디렉토리 생성 및 파일 이동**

```bash
mkdir -p skills/novel-autopilot/references
# novel-autopilot.md → skills/novel-autopilot/SKILL.md (frontmatter 추가)
# cancel-novel-autopilot.md → 본문에 통합 또는 별도 skill
```

**Step 2: SKILL.md 작성**

`skills/novel-autopilot/SKILL.md`:
```yaml
---
name: novel-autopilot
description: 아이디어부터 완성 원고까지 전체 자동 집필
user-invocable: true
---
```
본문은 `commands/novel-autopilot.md`에서 복사 (frontmatter 제외).

`skills/cancel-novel-autopilot/SKILL.md`:
```yaml
---
name: cancel-novel-autopilot
description: 활성 Novel Autopilot 세션 안전 중단
user-invocable: true
---
```

**Step 3: 원본 command 파일 삭제**

```bash
git rm commands/novel-autopilot.md commands/cancel-novel-autopilot.md
```

**Step 4: Commit**

```bash
git commit -m "refactor: migrate novel-autopilot commands to skills/"
```

---

### Task 3: commands/ 디렉토리 정리

commands/에 AGENTS.md만 남음. 이 파일은 command가 아닌 메타데이터이므로 적절한 위치로 이동.

**Step 1: AGENTS.md 이동**

AGENTS.md는 agents/ 디렉토리에 이미 존재하므로 commands/AGENTS.md가 중복인지 확인 후:
- 중복이면 삭제
- 고유 내용이면 agents/AGENTS.md에 병합

**Step 2: commands/ 디렉토리가 비면 삭제 (또는 유지)**

commands/ 디렉토리가 비면 삭제하거나, 향후 command-only 용도로 유지.

**Step 3: Commit**

```bash
git commit -m "refactor: clean up commands/ directory"
```

---

### Task 4: 로컬 캐시 클리어

**Step 1: 로컬 플러그인 캐시 삭제**

```bash
rm -rf ~/.claude/plugins/cache
```

**Step 2: Claude Code 재시작 후 확인**

```bash
# 스킬 목록에서 ghost entry 없는지 확인
# /novel-dev:13-plot 이 없어야 함
# /novel-dev:13-gen-plot 이 없어야 함
# /novel-dev:gen-plot 만 존재해야 함
```

---

### Task 5: README 업데이트

**Step 1: 설치 가이드에 캐시 클리어 안내 추가**

README.md의 업데이트 섹션에 추가:
```markdown
### 캐시 문제 해결

플러그인 업데이트 후 이전 명령어가 남아있는 경우:
\```bash
rm -rf ~/.claude/plugins/cache
\```
Claude Code 재시작 후 자동으로 새로 로드됩니다.
```

**Step 2: 워크플로우 표에서 /plot → /gen-plot 수정**

README.md 라인 90: `/plot` → `/gen-plot`

**Step 3: Commit**

```bash
git commit -m "docs(README): add cache clear guide, fix /plot → /gen-plot"
```

---

### Task 6: 최종 검증 + version bump + push

**Step 1: 검증**

```bash
# commands/ 에 중복 파일 없는지
ls commands/

# skills에서 commands/ 참조 없는지
grep -r "commands/" skills/

# ghost entry 소스 없는지
ls commands/ | grep plot
```

**Step 2: Version bump**

plugin.json: `5.0.2` → `5.1.0` (구조 변경이므로 minor bump)

**Step 3: Push**

```bash
cd C:\work\17_oh-my-plugin
git push origin master
```
