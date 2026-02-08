# Docs & References Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** README.md의 deprecated 에이전트 표, 구형 설치 방법, 레거시 커맨드 번호 등 문서 잔존 버그 수정

**Architecture:** 파일별 직접 수정. 코드 변경 없음 (문서만 수정).

**Tech Stack:** Markdown

---

### Task 1: README.md — deprecated 에이전트 표 정리

**Files:**
- Modify: `README.md:146-163`

**Step 1: 검증 에이전트 표에서 deprecated 4개 제거/교체**

README.md 라인 146-163의 "검증 에이전트" 및 "병렬 분석 에이전트" 표를 수정:

**Before (라인 146-163):**
```markdown
### 검증 에이전트
| 에이전트 | 모델 | 역할 |
|---------|------|------|
| beta-reader | sonnet | 독자 관점 몰입도 분석 |
| genre-validator | sonnet | 장르별 필수 요소 검증 |
| tension-tracker | sonnet | 감정 곡선 추적 |
| chapter-verifier | sonnet | 병렬 검증 오케스트레이터 |
| consistency-verifier | sonnet | 일관성 검증 (캐릭터, 타임라인, 설정) |
| engagement-optimizer | sonnet | 몰입도 최적화 제안 |

### 병렬 분석 에이전트 (신규)
| 에이전트 | 모델 | 역할 |
|---------|------|------|
| plot-consistency-analyzer | sonnet | 플롯 구멍, 타임라인 오류 탐지 |
| character-voice-analyzer | sonnet | 말투 일관성, OOC 탐지 |
| prose-quality-analyzer | sonnet | Show vs Tell, 문장력 분석 |
| pacing-analyzer | sonnet | 텐션 곡선, 페이싱 분석 |
| dialogue-analyzer | sonnet | 대화 자연스러움, 서브텍스트 |
```

**After:**
```markdown
### 검증 에이전트
| 에이전트 | 모델 | 역할 |
|---------|------|------|
| beta-reader | sonnet | 독자 관점 몰입도 분석 |
| genre-validator | sonnet | 장르별 필수 요소 검증 |
| chapter-verifier | sonnet | 병렬 검증 오케스트레이터 |
| consistency-verifier | sonnet | 일관성 검증 (캐릭터, 타임라인, 설정, 플롯) |
| engagement-optimizer | sonnet | 몰입도 최적화, 텐션 곡선, 페이싱 분석 |

### 분석 에이전트
| 에이전트 | 모델 | 역할 |
|---------|------|------|
| character-voice-analyzer | sonnet | 말투 일관성, OOC 탐지, 대화 분석 |
| prose-quality-analyzer | sonnet | Show vs Tell, 문장력 분석 |
```

변경 요약:
- `tension-tracker` 제거 (→ engagement-optimizer에 통합됨)
- `plot-consistency-analyzer` 제거 (→ consistency-verifier에 통합됨)
- `pacing-analyzer` 제거 (→ engagement-optimizer에 통합됨)
- `dialogue-analyzer` 제거 (→ character-voice-analyzer에 통합됨)
- "신규" 라벨 제거
- 에이전트 수 카운트 갱신 (라인 15 & 133)

**Step 2: 에이전트 수 카운트 갱신**

- 라인 15: `18개 전문 에이전트` → 실제 수에 맞게 (핵심 7 + 검증 5 + 분석 2 = 14개)
- 라인 133: `## 에이전트 (18개)` → `## 에이전트 (14개)`

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs(README): remove deprecated agents from table, update counts"
```

---

### Task 2: README.md — 구형 설치 방법 제거

**Files:**
- Modify: `README.md:55-61`

**Step 1: 방법 3 섹션 삭제**

**Before (라인 55-61):**
```markdown
### 방법 3: oh-my-claude-sisyphus에서 설치

oh-my-claude-sisyphus가 설치되어 있다면:
```
/oh-my-claude-sisyphus:install-novel-dev
```
```

**After:** 해당 6줄 전체 삭제

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs(README): remove unsupported oh-my-claude-sisyphus install method"
```

---

### Task 3: .planning/codebase/INTEGRATIONS.md — 구형 설치 참조 제거

**Files:**
- Modify: `.planning/codebase/INTEGRATIONS.md:81`

**Step 1: 라인 81 삭제**

**Before:**
```
3. Via oh-my-claude-sisyphus: `/oh-my-claude-sisyphus:install-novel-dev`
```

**After:** 해당 라인 삭제

**Step 2: Commit**

```bash
git add .planning/codebase/INTEGRATIONS.md
git commit -m "docs(.planning): remove deprecated oh-my-claude-sisyphus install reference"
```

---

### Task 4: skills/gen-plot/SKILL.md — 레거시 커맨드 번호 수정

**Files:**
- Modify: `skills/gen-plot/SKILL.md:17`

**Step 1: 레거시 번호를 현행 스킬명으로 교체**

**Before (라인 17):**
```
If any file is missing, report error and suggest `/01-init` or `/02-world` ~ `/07-hook` commands.
```

**After:**
```
If any file is missing, report error and suggest `/init` or `/design-world` ~ `/design-hook` commands.
```

**Step 2: Commit**

```bash
git add skills/gen-plot/SKILL.md
git commit -m "fix(gen-plot): replace legacy command numbers with current skill names"
```

---

### Task 5: skills/design-style/SKILL.md — 파일 경로 참조 수정

**Files:**
- Modify: `skills/design-style/SKILL.md:44`

**Step 1: 경로 참조 교체**

**Before:**
```
See `commands/04-design-style.md` for full workflow.
```

**After:**
```
See `skills/design-style/references/detailed-guide.md` for full workflow.
```

단, `skills/design-style/references/detailed-guide.md`가 없으면 해당 라인 삭제.

**Step 2: Commit**

```bash
git add skills/design-style/SKILL.md
git commit -m "fix(design-style): update file path reference"
```

---

### Task 6: 최종 검증 + push

**Step 1: grep 검증**

```bash
# README에 deprecated 에이전트 없는지
grep -n "tension-tracker\|pacing-analyzer\|dialogue-analyzer\|plot-consistency-analyzer" README.md

# 레거시 커맨드 번호 잔존 확인
grep -rn "/0[0-9]-\|/1[0-9]-\|/2[0-9]-" skills/

# oh-my-claude-sisyphus 실행 가능 참조 확인 (크레딧 제외)
grep -rn "oh-my-claude-sisyphus:" README.md .planning/
```

Expected: 모두 0건

**Step 2: Push**

```bash
cd C:\work\17_oh-my-plugin
git add -A plugins/novel-dev/
git commit -m "docs(novel-dev): clean up deprecated refs in docs"
git push origin master
```
