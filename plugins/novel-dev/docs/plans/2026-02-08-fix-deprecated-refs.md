# Deprecated 에이전트 참조 일괄 수정 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** deprecated된 4개 에이전트(tension-tracker, pacing-analyzer, dialogue-analyzer, plot-consistency-analyzer) 참조를 신규 에이전트명으로 교체하고, 레거시 커맨드 번호(`/09-write` 등)를 현행 스킬명(`/write` 등)으로 통일한다.

**Architecture:** 단순 문자열 치환 작업. 코드 로직 변경 없음. 에이전트 매핑 4쌍 + 커맨드 번호 매핑 7쌍을 15개 파일에 걸쳐 적용. 각 파일별 atomic commit.

**Tech Stack:** Markdown, JavaScript (mjs). 테스트는 grep 검증.

---

## 에이전트 매핑 테이블

| Old (deprecated) | New (active) |
|---|---|
| `tension-tracker` | `engagement-optimizer` |
| `pacing-analyzer` | `engagement-optimizer` |
| `dialogue-analyzer` | `character-voice-analyzer` |
| `plot-consistency-analyzer` | `consistency-verifier` |

## 커맨드 번호 매핑 테이블

| Old | New |
|---|---|
| `/01-init` | `/init` |
| `/02-world` | `/design-world` |
| `/07-hook` | `/design-hook` |
| `/09-write` | `/write` |
| `/11-write-all` | `/write-all` |
| `/12-revise` | `/revise` |
| `/13-evaluate` | `/evaluate` |
| `/14-check` | `/consistency-check` |

## 외부 플러그인 참조 매핑

| Old | New |
|---|---|
| `oh-my-claude-sisyphus:beta-reader` | `novel-dev:beta-reader` |

---

### Task 1: verification/index.mjs — deprecated 에이전트 3건 수정

**Files:**
- Modify: `scripts/verification/index.mjs:58,78,88`

**Step 1: 수정 적용**

3개 NOVEL_CHECKS 항목의 agent 필드 변경:

```
Line 58: agent: 'pacing-analyzer'        → agent: 'engagement-optimizer'
Line 78: agent: 'dialogue-analyzer'       → agent: 'character-voice-analyzer'
Line 88: agent: 'plot-consistency-analyzer' → agent: 'consistency-verifier'
```

**Step 2: 검증**

Run: `grep -n "pacing-analyzer\|dialogue-analyzer\|plot-consistency-analyzer" scripts/verification/index.mjs`
Expected: 0건 (no matches)

**Step 3: Commit**

```bash
git add scripts/verification/index.mjs
git commit -m "fix(scripts): update deprecated agent refs in verification index"
```

---

### Task 2: adversarial-review SKILL.md — plot-consistency-analyzer 수정

**Files:**
- Modify: `skills/adversarial-review/SKILL.md:90`

**Step 1: 수정 적용**

```
Line 90:
  subagent_type: "novel-dev:plot-consistency-analyzer",
→ subagent_type: "novel-dev:consistency-verifier",
```

**Step 2: 검증**

Run: `grep -n "plot-consistency-analyzer" skills/adversarial-review/SKILL.md`
Expected: 0건

**Step 3: Commit**

```bash
git add skills/adversarial-review/SKILL.md
git commit -m "fix(adversarial-review): replace deprecated plot-consistency-analyzer ref"
```

---

### Task 3: check-retention command — 외부 플러그인 참조 3건 수정

**Files:**
- Modify: `commands/check-retention.md:40,63,275`

**Step 1: 수정 적용**

3곳 모두 동일 패턴:
```
oh-my-claude-sisyphus:beta-reader → novel-dev:beta-reader
```

**Step 2: 검증**

Run: `grep -n "oh-my-claude-sisyphus" commands/check-retention.md`
Expected: 0건

**Step 3: Commit**

```bash
git add commands/check-retention.md
git commit -m "fix(check-retention): replace external plugin ref with novel-dev:beta-reader"
```

---

### Task 4: analyze-engagement command — tension-tracker 2건 수정

**Files:**
- Modify: `commands/analyze-engagement.md:22,74`

**Step 1: 수정 적용**

```
Line 22: 2. **tension-tracker** 에이전트 호출 → 텐션 곡선 분석
→        2. **engagement-optimizer** 에이전트 호출 → 텐션 곡선 분석

Line 74: Task(subagent_type="novel-dev:tension-tracker", model="sonnet", prompt=`
→        Task(subagent_type="novel-dev:engagement-optimizer", model="sonnet", prompt=`
```

**Step 2: 검증**

Run: `grep -n "tension-tracker" commands/analyze-engagement.md`
Expected: 0건

**Step 3: Commit**

```bash
git add commands/analyze-engagement.md
git commit -m "fix(analyze-engagement cmd): replace deprecated tension-tracker refs"
```

---

### Task 5: analyze-engagement skill + detailed-guide — tension-tracker 2건 수정

**Files:**
- Modify: `skills/analyze-engagement/SKILL.md:39`
- Modify: `skills/analyze-engagement/references/detailed-guide.md:51-57`

**Step 1: SKILL.md 수정**

```
Line 39: 2. **tension-tracker** (sonnet) → Scene-by-scene tension levels
→        2. **engagement-optimizer** (sonnet) → Scene-by-scene tension levels & pacing
```

**Step 2: detailed-guide.md 수정**

```
Line 51: ### 2. Tension-Tracker (Tension Curve)
→        ### 2. Engagement-Optimizer (Tension Curve & Pacing)

Line 53: **Agent:** `novel-dev:tension-tracker`
→        **Agent:** `novel-dev:engagement-optimizer`

Line 57: Task(subagent_type="novel-dev:tension-tracker", model="sonnet", prompt=`
→        Task(subagent_type="novel-dev:engagement-optimizer", model="sonnet", prompt=`
```

**Step 3: 검증**

Run: `grep -rn "tension-tracker" skills/analyze-engagement/`
Expected: 0건

**Step 4: Commit**

```bash
git add skills/analyze-engagement/SKILL.md skills/analyze-engagement/references/detailed-guide.md
git commit -m "fix(analyze-engagement skill): replace deprecated tension-tracker refs"
```

---

### Task 6: 22-swarm command + swarm-patterns — pacing-analyzer 3건 수정

**Files:**
- Modify: `commands/22-swarm.md:58`
- Modify: `skills/swarm/references/swarm-patterns.md:84,106`

**Step 1: 22-swarm.md 수정**

```
Line 58: - W4: pacing-analyzer (sonnet) - 페이싱
→        - W4: engagement-optimizer (sonnet) - 페이싱
```

**Step 2: swarm-patterns.md 수정**

```
Line 84: W4: pacing-analyzer (sonnet)    → 페이싱
→        W4: engagement-optimizer (sonnet) → 페이싱

Line 106: | pacing-analyzer | "리듬이 적절한가?" | 긴장 곡선, 장면 전환, 비트 밀도 |
→         | engagement-optimizer | "리듬이 적절한가?" | 긴장 곡선, 장면 전환, 비트 밀도 |
```

**Step 3: 검증**

Run: `grep -rn "pacing-analyzer" commands/22-swarm.md skills/swarm/references/swarm-patterns.md`
Expected: 0건

**Step 4: Commit**

```bash
git add commands/22-swarm.md skills/swarm/references/swarm-patterns.md
git commit -m "fix(swarm): replace deprecated pacing-analyzer refs"
```

---

### Task 7: write-all detailed-guide — deprecated 2건 수정

**Files:**
- Modify: `skills/write-all/references/detailed-guide.md:549,555`

**Step 1: 수정 적용**

```
Line 549: subagent_type: "novel-dev:plot-consistency-analyzer",
→         subagent_type: "novel-dev:consistency-verifier",

Line 555: subagent_type: "novel-dev:pacing-analyzer",
→         subagent_type: "novel-dev:engagement-optimizer",
```

**Step 2: 검증**

Run: `grep -n "plot-consistency-analyzer\|pacing-analyzer" skills/write-all/references/detailed-guide.md`
Expected: 0건

**Step 3: Commit**

```bash
git add skills/write-all/references/detailed-guide.md
git commit -m "fix(write-all guide): replace deprecated agent refs in act validation"
```

---

### Task 8: novelist agent — tension-tracker 1건 수정

**Files:**
- Modify: `agents/novelist.md:340`

**Step 1: 수정 적용**

```
Line 340: 회차 완료 시 tension-tracker 자동 호출하여:
→         회차 완료 시 engagement-optimizer 자동 호출하여:
```

**Step 2: 검증**

Run: `grep -n "tension-tracker" agents/novelist.md`
Expected: 0건

**Step 3: Commit**

```bash
git add agents/novelist.md
git commit -m "fix(novelist): replace deprecated tension-tracker ref"
```

---

### Task 9: multi-validator + emotional-arc-manager scripts — 코멘트 수정

**Files:**
- Modify: `scripts/multi-validator.mjs:42`
- Modify: `scripts/emotional-arc-manager.mjs:337`

**Step 1: multi-validator.mjs 수정**

```
Line 42: // Load previous chapter context for tension-tracker
→        // Load previous chapter context for engagement-optimizer
```

**Step 2: emotional-arc-manager.mjs 수정**

```
Line 337: * Load previous chapter context for tension-tracker
→         * Load previous chapter context for engagement-optimizer
```

**Step 3: 검증**

Run: `grep -rn "tension-tracker" scripts/`
Expected: 0건

**Step 4: Commit**

```bash
git add scripts/multi-validator.mjs scripts/emotional-arc-manager.mjs
git commit -m "fix(scripts): update deprecated agent name in comments"
```

---

### Task 10: 레거시 커맨드 번호 — 4개 파일 일괄 수정

**Files:**
- Modify: `commands/13-gen-plot.md:17`
- Modify: `commands/15-write-act.md:18,22,23,24`
- Modify: `commands/16-write-all.md:56,57,78,90,105,106,168`
- Modify: `commands/status.md:98`

**Step 1: 13-gen-plot.md 수정**

```
Line 17: suggest `/01-init` or `/02-world` ~ `/07-hook` commands.
→        suggest `/init`, `/design-world` ~ `/design-hook` commands.
```

**Step 2: 15-write-act.md 수정**

```
Line 18: /09-write {chapter}    → /write {chapter}
Line 22: `/12-revise` (막 전체)  → `/revise` (막 전체)
Line 23: `/13-evaluate` (막 전체) → `/evaluate` (막 전체)
Line 24: `/14-check`             → `/consistency-check`
```

**Step 3: 16-write-all.md 수정**

```
Line 56:  `/11-write-all --resume`   → `/write-all --resume`
Line 57:  `/11-write-all --restart`   → `/write-all --restart`
Line 78:  /09-write {chapter}         → /write {chapter}
Line 90:  /12-revise {chapter}        → /revise {chapter}
Line 105: /12-revise (막 전체)        → /revise (막 전체)
Line 106: /14-check                   → /consistency-check
Line 168: /09-write {chapter}         → /write {chapter}
```

**Step 4: status.md 수정**

```
Line 98: → /09-write 12  또는  /11-write-all --resume
→        → /write 12  또는  /write-all --resume
```

**Step 5: 검증**

Run: `grep -rn "/0[0-9]-\|/1[0-4]-" commands/13-gen-plot.md commands/15-write-act.md commands/16-write-all.md commands/status.md`
Expected: 0건

**Step 6: Commit**

```bash
git add commands/13-gen-plot.md commands/15-write-act.md commands/16-write-all.md commands/status.md
git commit -m "fix(commands): replace legacy command numbers with current skill names"
```

---

### Task 11: 최종 전역 검증

**Step 1: deprecated 에이전트 잔존 확인**

Run: `grep -rn "tension-tracker\|pacing-analyzer\|dialogue-analyzer\|plot-consistency-analyzer" --include="*.md" --include="*.mjs" --include="*.ts" skills/ commands/ agents/ scripts/ src/`
Expected: deprecated 에이전트 자체의 정의 파일(`agents/tension-tracker.md` 등)과 이력 문서(`agents/AGENTS.md`, `agents/engagement-optimizer.md` 내 "Absorbed from" 설명)만 남아있어야 함.

**Step 2: 외부 플러그인 참조 잔존 확인**

Run: `grep -rn "oh-my-claude-sisyphus" commands/ skills/`
Expected: 0건

**Step 3: 레거시 번호 잔존 확인**

Run: `grep -rn "/0[0-9]-\|/1[0-4]-" commands/`
Expected: 파일명 자체(13-gen-plot.md 등)만 남고, 내용 안에는 0건

**Step 4: 최종 push**

```bash
git push origin master
```
