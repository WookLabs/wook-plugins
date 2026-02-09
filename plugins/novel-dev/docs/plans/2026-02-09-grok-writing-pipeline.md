# Grok 기반 성인소설 집필 파이프라인 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `/write`, `/write-act`, `/write-all` 전체 집필 워크플로우에서 Grok API를 통한 성인소설 집필이 seamless하게 동작하도록 구현

**Architecture:** Claude가 오케스트레이터로서 컨텍스트를 조립하고, `grok-writer.mjs`로 Grok API를 호출하여 원고를 생성한 뒤, 사후 처리(요약, 상태 업데이트, 품질 검증)를 Claude가 수행하는 구조. `project.json`의 `writer_mode: "grok"` 설정으로 프로젝트 전체에 Grok 모드를 적용.

**Tech Stack:** Node.js (ESM), xAI Grok API, Claude Code Plugin SKILL.md 명세

---

## Task 1: `grok-writer.mjs` 스크립트 강화

**Files:**
- Modify: `scripts/grok-writer.mjs`

**현재 문제:**
- `--prompt` CLI 인자만 지원 → 대용량 프롬프트 시 shell 문자열 한계
- `max_tokens` 기본값 4096 → 5000자 이상 챕터 불가
- 스트리밍 미지원 → 긴 생성 시 응답 없는 것처럼 보임

**Step 1: `--prompt-file` 플래그 추가**

`grok-writer.mjs`의 `parseArgs` 함수에 추가:

```javascript
} else if (arg === '--prompt-file' && args[i + 1]) {
  const filePath = args[++i];
  result.prompt = fs.readFileSync(filePath, 'utf-8');
}
```

**Step 2: `--system-file` 플래그 추가**

같은 패턴으로:

```javascript
} else if (arg === '--system-file' && args[i + 1]) {
  const filePath = args[++i];
  result.system = fs.readFileSync(filePath, 'utf-8');
}
```

**Step 3: 기본 max_tokens 8192로 증가**

```javascript
const result = {
  prompt: null,
  system: null,
  model: 'grok-4-1-fast-reasoning',
  maxTokens: 8192,  // was 4096
  output: null,
  temperature: 0.8
};
```

동일하게 `callGrokAPI` 기본값도 변경:
```javascript
maxTokens = 8192,
```

**Step 4: 도움말 텍스트 업데이트**

help 출력에 `--prompt-file`, `--system-file` 추가, max-tokens 기본값 8192로 표기.

**Step 5: 헤더 주석 업데이트**

파일 상단 주석에 새 옵션 반영.

**Step 6: 테스트**

Run: `node scripts/grok-writer.mjs --help`
Expected: 새 옵션(`--prompt-file`, `--system-file`)과 기본값(8192) 표시

**Step 7: Commit**

```bash
git add scripts/grok-writer.mjs
git commit -m "feat(grok-writer): add --prompt-file, --system-file flags and increase default max_tokens to 8192"
```

---

## Task 2: 컨텍스트 조립 스크립트 `assemble-grok-prompt.mjs` 생성

**Files:**
- Create: `scripts/assemble-grok-prompt.mjs`

**목적:** 프로젝트 파일을 읽어 Grok API용 프롬프트(system + user)를 조립하여 JSON으로 출력. Claude가 이 스크립트를 호출하면 컨텍스트 조립이 자동으로 처리됨.

**Step 1: 스크립트 작성**

```javascript
#!/usr/bin/env node
/**
 * Grok 프롬프트 어셈블러
 *
 * 프로젝트 파일에서 컨텍스트를 읽어 Grok API용 프롬프트를 조립합니다.
 *
 * Usage:
 *   node scripts/assemble-grok-prompt.mjs --chapter N --project PATH
 *
 * Output (stdout):
 *   JSON { system, prompt, outputPath }
 */

import fs from 'fs';
import path from 'path';

function parseArgs(args) {
  const result = { chapter: null, project: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--chapter' && args[i + 1]) result.chapter = parseInt(args[++i], 10);
    else if (args[i] === '--project' && args[i + 1]) result.project = args[++i];
  }
  return result;
}

function padChapter(n) {
  return String(n).padStart(3, '0');
}

function tryReadJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch { return null; }
}

function tryReadText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch { return null; }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.chapter || !args.project) {
    console.error('Usage: node assemble-grok-prompt.mjs --chapter N --project PATH');
    process.exit(1);
  }

  const ch = args.chapter;
  const proj = args.project;
  const pad = padChapter(ch);

  // 1. Style Guide → system prompt
  const styleGuide = tryReadJSON(path.join(proj, 'meta', 'style-guide.json'));

  // 2. Chapter Plot
  const chapterPlot = tryReadJSON(path.join(proj, 'chapters', `chapter_${pad}.json`));

  // 3. Previous summaries (up to 3)
  const summaries = [];
  for (let i = 1; i <= 3; i++) {
    const prevCh = ch - i;
    if (prevCh < 1) break;
    const summary = tryReadText(path.join(proj, 'context', 'summaries', `chapter_${padChapter(prevCh)}_summary.md`));
    if (summary) summaries.push({ chapter: prevCh, summary });
  }

  // 4. Characters (appearing in this chapter)
  const appearingIds = chapterPlot?.meta?.characters || chapterPlot?.characters || [];
  const characters = [];
  for (const charId of appearingIds) {
    const charData = tryReadJSON(path.join(proj, 'characters', `${charId}.json`));
    if (charData) characters.push(charData);
  }

  // 5. World/Location
  const world = tryReadJSON(path.join(proj, 'world', 'world.json'));

  // 6. Foreshadowing (active)
  const foreshadowing = tryReadJSON(path.join(proj, 'plot', 'foreshadowing.json'));
  const activeForeshadowing = foreshadowing?.items?.filter(f =>
    f.plant_chapter <= ch && (!f.payoff_chapter || f.payoff_chapter >= ch) && f.status !== 'paid_off'
  ) || [];

  // 7. Previous chapter text (last chapter only, for continuity)
  const prevChapterText = ch > 1
    ? tryReadText(path.join(proj, 'chapters', `chapter_${padChapter(ch - 1)}.md`))
    : null;

  // Build system prompt
  const systemParts = ['당신은 한국어 성인 소설 전문 작가입니다.'];

  if (styleGuide) {
    if (styleGuide.narrative_voice) systemParts.push(`서술 시점: ${styleGuide.narrative_voice}`);
    if (styleGuide.tense) systemParts.push(`시제: ${styleGuide.tense}`);
    if (styleGuide.tone) systemParts.push(`톤: ${Array.isArray(styleGuide.tone) ? styleGuide.tone.join(', ') : styleGuide.tone}`);
    if (styleGuide.dialogue_style) systemParts.push(`대화체: ${styleGuide.dialogue_style}`);
    if (styleGuide.taboo_words) systemParts.push(`금지어: ${styleGuide.taboo_words.join(', ')}`);
    if (styleGuide.description_density) systemParts.push(`묘사 밀도: ${styleGuide.description_density}`);
  }

  systemParts.push('');
  systemParts.push('작성 규칙:');
  systemParts.push('- 감각적이고 몰입감 있는 장면을 작성합니다');
  systemParts.push('- 대화, 행동 묘사, 감정 표현, 신체 묘사를 자연스럽게 섞어서 씁니다');
  systemParts.push('- "보여주기(Show)" 기법을 사용하고, "말하기(Tell)"는 최소화합니다');
  systemParts.push('- 성인 장면은 구체적이고 감각적으로 묘사하되, 문학적 품격을 유지합니다');
  systemParts.push('- 캐릭터의 성격과 말투를 일관되게 유지합니다');

  const systemPrompt = systemParts.join('\n');

  // Build user prompt
  const promptParts = [];

  promptParts.push(`# ${ch}화 집필\n`);

  // Plot
  if (chapterPlot) {
    promptParts.push('## 이번 회차 플롯');
    promptParts.push(JSON.stringify(chapterPlot, null, 2));
    promptParts.push('');
  }

  // Previous summaries
  if (summaries.length > 0) {
    promptParts.push('## 이전 회차 요약');
    for (const s of summaries.reverse()) {
      promptParts.push(`### ${s.chapter}화 요약`);
      promptParts.push(s.summary);
      promptParts.push('');
    }
  }

  // Characters
  if (characters.length > 0) {
    promptParts.push('## 등장 캐릭터');
    for (const c of characters) {
      promptParts.push(`### ${c.name || c.id}`);
      if (c.personality) promptParts.push(`성격: ${c.personality}`);
      if (c.speech_pattern) promptParts.push(`말투: ${c.speech_pattern}`);
      if (c.appearance) promptParts.push(`외모: ${c.appearance}`);
      if (c.role) promptParts.push(`역할: ${c.role}`);
      promptParts.push('');
    }
  }

  // World (condensed)
  if (world) {
    promptParts.push('## 세계관 요약');
    if (world.setting) promptParts.push(`배경: ${world.setting}`);
    if (world.era) promptParts.push(`시대: ${world.era}`);
    if (world.rules) promptParts.push(`규칙: ${JSON.stringify(world.rules)}`);
    promptParts.push('');
  }

  // Active foreshadowing
  if (activeForeshadowing.length > 0) {
    promptParts.push('## 활성 복선');
    for (const f of activeForeshadowing) {
      const payoffNote = f.payoff_chapter === ch ? ' [이번 화에서 회수!]' : '';
      promptParts.push(`- ${f.description || f.id}${payoffNote}`);
    }
    promptParts.push('');
  }

  // Previous chapter ending (last 500 chars for continuity)
  if (prevChapterText) {
    const ending = prevChapterText.slice(-1500);
    promptParts.push('## 직전 회차 마지막 장면');
    promptParts.push(ending);
    promptParts.push('');
  }

  // Writing instructions
  promptParts.push('## 작성 지시');
  promptParts.push('위 플롯에 따라 이번 회차 본문을 작성해주세요.');
  promptParts.push('- 목표 분량: 5000~8000자');
  promptParts.push('- 장면 전환 시 "***" 구분선 사용');
  promptParts.push('- 마지막은 다음 화가 궁금해지는 훅으로 마무리');
  promptParts.push('- 본문만 출력 (제목, 메타데이터 불필요)');

  const userPrompt = promptParts.join('\n');

  // Output path
  const outputPath = path.join(proj, 'chapters', `chapter_${pad}.md`);

  // Output as JSON
  const output = {
    system: systemPrompt,
    prompt: userPrompt,
    outputPath: outputPath,
    chapter: ch,
    contextStats: {
      hasStyleGuide: !!styleGuide,
      hasPlot: !!chapterPlot,
      summaryCount: summaries.length,
      characterCount: characters.length,
      hasWorld: !!world,
      activeForeshadowingCount: activeForeshadowing.length,
      hasPrevChapter: !!prevChapterText,
      estimatedPromptLength: userPrompt.length
    }
  };

  console.log(JSON.stringify(output, null, 2));
}

main();
```

**Step 2: 테스트 (dry run)**

Run: `node scripts/assemble-grok-prompt.mjs --help`
Expected: Usage 메시지 출력

**Step 3: Commit**

```bash
git add scripts/assemble-grok-prompt.mjs
git commit -m "feat: add assemble-grok-prompt.mjs for automated context assembly"
```

---

## Task 3: `project.json` 템플릿에 `writer_mode` 필드 추가

**Files:**
- Modify: `templates/project.template.json`
- Modify: `schemas/project.schema.json`

**Step 1: 프로젝트 템플릿에 writer_mode 추가**

`templates/project.template.json`에 추가:

```json
{
  "writer_mode": "claude",
  "grok_config": {
    "model": "grok-4-1-fast-reasoning",
    "temperature": 0.85,
    "max_tokens": 8192
  }
}
```

`writer_mode` 값: `"claude"` (기본) | `"grok"` (전체 Grok) | `"hybrid"` (성인 장면만 Grok)

**Step 2: 스키마에 writer_mode 추가**

`schemas/project.schema.json`의 properties에:

```json
"writer_mode": {
  "type": "string",
  "enum": ["claude", "grok", "hybrid"],
  "default": "claude",
  "description": "집필 모드: claude(기본), grok(전체 Grok), hybrid(성인 장면만 Grok)"
},
"grok_config": {
  "type": "object",
  "properties": {
    "model": { "type": "string", "default": "grok-4-1-fast-reasoning" },
    "temperature": { "type": "number", "default": 0.85 },
    "max_tokens": { "type": "integer", "default": 8192 }
  }
}
```

**Step 3: Commit**

```bash
git add templates/project.template.json schemas/project.schema.json
git commit -m "feat: add writer_mode and grok_config to project schema"
```

---

## Task 4: `/write` (14-write) SKILL.md 전면 재작성

**Files:**
- Modify: `skills/14-write/SKILL.md`
- Modify: `skills/14-write/references/detailed-guide.md`

이 태스크가 핵심입니다. Claude가 `/write` 실행 시 따르는 명세를 재작성합니다.

**Step 1: SKILL.md 재작성**

```markdown
---
name: 14-write
description: 특정 회차 챕터 집필
user-invocable: true
---

# /write - 소설 챕터 작성

현재 진행 중인 챕터를 작성합니다.

## Quick Start
```bash
/write           # 다음 챕터 작성
/write 5         # 5화 작성
/write 5-10      # 5~10화 연속 작성
/write 5 --grok  # Grok API로 강제 작성
```

## Writer Mode 결정

`meta/project.json`의 `writer_mode` 필드를 확인합니다:

| writer_mode | 동작 |
|-------------|------|
| `"grok"` | 모든 회차를 Grok API로 작성 |
| `"hybrid"` | 성인 키워드 감지 시 Grok, 그 외 novelist |
| `"claude"` | 모든 회차를 novelist 에이전트로 작성 |

`--grok` 플래그 사용 시 writer_mode 무시하고 Grok으로 작성합니다.

## 실행 흐름

### Phase 1: 준비

1. `meta/ralph-state.json` 읽어 현재 챕터 번호 확인 (인자 없으면)
2. `meta/project.json` 읽어 `writer_mode` 확인
3. `chapters/chapter_XXX.json` (플롯 파일) 존재 확인

### Phase 2: Grok 경로 (writer_mode = "grok" 또는 --grok)

다음 단계를 **순서대로** 수행합니다:

**2-1. 컨텍스트 조립**

```bash
node novel-dev/scripts/assemble-grok-prompt.mjs \
  --chapter {N} \
  --project {소설 프로젝트 경로}
```

stdout으로 JSON이 출력됩니다:
```json
{
  "system": "시스템 프롬프트",
  "prompt": "유저 프롬프트 (컨텍스트 포함)",
  "outputPath": "chapters/chapter_005.md",
  "contextStats": { ... }
}
```

**2-2. 프롬프트 파일 저장**

조립된 JSON에서 `system`과 `prompt`를 각각 임시 파일로 저장:
- `/tmp/grok_system_{N}.txt` ← system 내용
- `/tmp/grok_prompt_{N}.txt` ← prompt 내용

**2-3. Grok API 호출**

```bash
node novel-dev/scripts/grok-writer.mjs \
  --system-file /tmp/grok_system_{N}.txt \
  --prompt-file /tmp/grok_prompt_{N}.txt \
  --model "{project.grok_config.model}" \
  --max-tokens {project.grok_config.max_tokens} \
  --temperature {project.grok_config.temperature} \
  --output {outputPath}
```

**2-4. 결과 확인**

생성된 `chapters/chapter_XXX.md` 파일을 읽어 내용과 분량을 확인합니다.
분량이 3000자 미만이면 사용자에게 재생성 여부를 묻습니다.

### Phase 3: Claude 경로 (writer_mode = "claude")

기존 방식대로 novelist 에이전트 호출:

```
Task(subagent_type="novel-dev:novelist", model="opus", prompt="...")
```

### Phase 4: 사후 처리 (Grok/Claude 공통)

**4-1. 요약 생성**

생성된 챕터를 읽고 summarizer를 호출합니다:

```
Task(subagent_type="novel-dev:summarizer", model="haiku", prompt="
다음 챕터를 200-300자로 요약해주세요.
주요 사건, 캐릭터 감정 변화, 복선 진행을 포함하세요.

{chapter_content}
")
```

결과를 `context/summaries/chapter_XXX_summary.md`에 저장합니다.

**4-2. 상태 업데이트**

`meta/ralph-state.json` 업데이트:
- `current_chapter`: N + 1
- `completed_chapters`에 N 추가
- `last_checkpoint`: 현재 시각

**4-3. 품질 검토 (선택)**

사용자가 요청하면 또는 `/write-all` 루프 내에서:

```
Task(subagent_type="novel-dev:critic", model="sonnet", prompt="
Chapter {N} 평가:
{chapter_content}

플롯: {plot}
")
```

> **주의**: Grok이 생성한 성인 콘텐츠를 Claude가 평가할 때, 성인 장면 자체가 아닌
> 서사 구조, 캐릭터 일관성, 플롯 정합성만 평가합니다.

## 성인 키워드 자동 감지 (hybrid 모드)

Korean: 야한, 19금, 베드신, 관능, 정사, 밀애, 섹시, 에로, R-18, NC-17, 수위
English: nsfw, explicit, adult, erotic, intimate scene, love scene, 18+

검색 대상: 플롯 파일, 씬 설명, 캐릭터 상호작용 태그

## Documentation

**Detailed Guide**: See `references/detailed-guide.md`
**Usage Examples**: See `examples/example-usage.md`
```

**Step 2: detailed-guide.md의 Grok 섹션 업데이트**

- `grok-3` → `grok-4-1-fast-reasoning` 기본 모델 변경
- `max-tokens 4096` → `8192` 변경
- `assemble-grok-prompt.mjs` 사용법 추가
- `--prompt-file` / `--system-file` 사용법 추가

**Step 3: Commit**

```bash
git add skills/14-write/SKILL.md skills/14-write/references/detailed-guide.md
git commit -m "feat(write): rewrite SKILL.md with Grok-first adult writing pipeline"
```

---

## Task 5: `/write-grok` SKILL.md를 `/write --grok`의 래퍼로 재작성

**Files:**
- Modify: `skills/write-grok/SKILL.md`
- Modify: `skills/write-grok/references/detailed-guide.md`

**Step 1: SKILL.md 재작성**

```markdown
---
name: write-grok
description: xAI Grok API를 사용한 소설 생성
user-invocable: true
---

# /write-grok - Grok API로 챕터 집필

xAI Grok API를 사용하여 소설 챕터를 생성합니다.
프로젝트 컨텍스트(문체, 캐릭터, 플롯, 이전 요약)를 자동으로 조립합니다.

## Prerequisites

`~/.env` 파일에 API 키 설정:
```
XAI_API_KEY=xai-xxxxxxxxxxxx
```

## Usage

```bash
/write-grok 5          # 5화를 Grok으로 생성 (컨텍스트 자동 조립)
/write-grok "프롬프트"  # 직접 프롬프트로 생성 (레거시 모드)
```

## 실행 흐름

### 챕터 번호 지정 시 (권장)

`/write --grok`과 동일한 파이프라인을 실행합니다:

1. `assemble-grok-prompt.mjs`로 컨텍스트 조립
2. `grok-writer.mjs`로 Grok API 호출
3. 챕터 파일 저장
4. 요약 생성 (summarizer)
5. 상태 업데이트 (ralph-state.json)

### 직접 프롬프트 시 (레거시)

```bash
node novel-dev/scripts/grok-writer.mjs \
  --prompt "{사용자 프롬프트}" \
  --model "grok-4-1-fast-reasoning" \
  --max-tokens 8192 \
  --temperature 0.85
```

컨텍스트 자동 조립 없이 직접 프롬프트만 전달됩니다.
결과는 stdout으로 출력되며 사후 처리 없음.

## Grok 모델

| 모델 | 설명 |
|------|------|
| grok-3 | 기본 모델, 균형잡힌 성능 |
| grok-4-1-fast | 최신 모델, 빠른 응답 |
| grok-4-1-fast-reasoning | 추론 강화 모델 (기본값) |

## 프로젝트 전체 Grok 모드

성인소설 프로젝트에서 매번 `--grok`을 붙이지 않으려면:

`meta/project.json`에 설정:
```json
{
  "writer_mode": "grok",
  "grok_config": {
    "model": "grok-4-1-fast-reasoning",
    "temperature": 0.85,
    "max_tokens": 8192
  }
}
```

이후 `/write 5`만으로 자동으로 Grok이 사용됩니다.
```

**Step 2: detailed-guide.md 업데이트**

- 컨텍스트 조립 프로세스 상세 설명
- `assemble-grok-prompt.mjs` 출력 예시
- 비용 추정 업데이트 (8192 토큰 기준)

**Step 3: Commit**

```bash
git add skills/write-grok/
git commit -m "feat(write-grok): rewrite as context-aware chapter writing skill"
```

---

## Task 6: `/write-all` (16-write-all) Grok 모드 지원

**Files:**
- Modify: `skills/16-write-all/SKILL.md`
- Modify: `skills/16-write-all/references/detailed-guide.md`

**Step 1: SKILL.md 실행 흐름에 Grok 분기 추가**

`## 실행 흐름 (v2)` 섹션의 루프에서:

```
for act in acts:
    for chapter in act.chapters:
        # writer_mode에 따라 분기
        if writer_mode == "grok":
            # 컨텍스트 조립 → Grok API → 파일 저장
            assemble_context(chapter)
            grok_write(chapter)
        else:
            /write {chapter}

        # 사후 처리 (공통)
        generate_summary(chapter)
        update_state(chapter)

        # Multi-Validator 품질 게이트 (Claude가 수행)
        results = parallel_validate(critic, beta-reader, genre-validator)
        ...
```

**Step 2: Phase 0 비용 경고에 Grok 비용 추가**

```
> Grok 모드 비용 안내:
> 회차당: ~$0.10-0.20 (Grok API) + 검증 에이전트(sonnet)
> 총 예상: N × ~$0.15
```

**Step 3: detailed-guide.md에 Grok 모드 섹션 추가**

- Grok 모드에서의 Ralph Loop 동작 설명
- 품질 게이트는 Claude가 수행 (Grok 출력물을 Claude가 평가)
- Circuit Breaker 동작은 동일

**Step 4: Commit**

```bash
git add skills/16-write-all/
git commit -m "feat(write-all): add Grok mode support in Ralph Loop"
```

---

## Task 7: `/write-act` (15-write-act) Grok 모드 지원

**Files:**
- Modify: `skills/15-write-act/SKILL.md`

**Step 1: SKILL.md 업데이트**

순차 집필 루프에서 `/write` 호출이 writer_mode를 반영함을 명시:

```markdown
## 실행 단계

1. **막 정보 로드**
   - `plot/structure.json`에서 해당 막의 회차 범위 확인
   - `meta/project.json`에서 `writer_mode` 확인

2. **순차 집필**
   ```
   for chapter in act_chapters:
       /write {chapter}  # writer_mode에 따라 Grok 또는 Claude
   ```

3. **막 완료 후 자동 트리거**
   - `/revise` (막 전체) — Claude editor가 수행
   - `/evaluate` (막 전체) — Claude critic/beta-reader가 수행
   - `/consistency-check` — Claude consistency-verifier가 수행
```

**Step 2: Commit**

```bash
git add skills/15-write-act/SKILL.md
git commit -m "feat(write-act): document Grok mode support via /write"
```

---

## Task 8: `/init` (03-init) 스킬에서 writer_mode 선택 UI 추가

**Files:**
- Modify: `skills/03-init/SKILL.md`

**Step 1: 프로젝트 초기화 시 writer_mode 질문 추가**

`/init` 실행 흐름에 단계 추가:

```markdown
### Step N: 집필 모드 선택

AskUserQuestion으로 집필 모드를 선택받습니다:

- **Grok (성인소설)** — 모든 회차를 xAI Grok API로 집필
- **Claude (일반)** — 모든 회차를 Claude novelist로 집필
- **Hybrid (혼합)** — 성인 장면만 Grok, 나머지 Claude

선택에 따라 `meta/project.json`의 `writer_mode`와 `grok_config`를 설정합니다.

Grok 모드 선택 시 `~/.env`에 `XAI_API_KEY` 존재 여부를 확인합니다:
```bash
node novel-dev/scripts/grok-writer.mjs --help 2>&1 | head -1
```
API 키가 없으면 설정 방법을 안내합니다.
```

**Step 2: Commit**

```bash
git add skills/03-init/SKILL.md
git commit -m "feat(init): add writer_mode selection during project initialization"
```

---

## Task 9: 검증 및 배포

**Step 1: 전체 파일 정합성 확인**

```bash
# 새 스크립트 실행 가능 확인
node scripts/grok-writer.mjs --help
node scripts/assemble-grok-prompt.mjs 2>&1 | head -1

# SKILL.md에서 grok-3 레거시 참조 잔존 확인
grep -r "grok-3" skills/ --include="*.md"
# 예상: grok-3는 모델 목록 테이블에만 존재해야 함

# max-tokens 4096 레거시 참조 확인
grep -r "4096" skills/ scripts/ --include="*.md" --include="*.mjs"
# 예상: 0건 (모두 8192로 교체)

# assemble-grok-prompt 참조 확인
grep -r "assemble-grok-prompt" skills/ --include="*.md"
# 예상: 14-write, write-grok에서 참조
```

**Step 2: 버전 업데이트**

`.claude-plugin/plugin.json` 버전: `5.2.0` → `5.3.0`

**Step 3: Commit & Push**

```bash
git add -A
git commit -m "chore: version 5.3.0 - Grok writing pipeline"
git push
```

---

## 변경 요약

| 파일 | 변경 |
|------|------|
| `scripts/grok-writer.mjs` | `--prompt-file`, `--system-file` 추가, max_tokens 8192 |
| `scripts/assemble-grok-prompt.mjs` | **신규** - 프로젝트 컨텍스트 자동 조립 |
| `templates/project.template.json` | `writer_mode`, `grok_config` 추가 |
| `schemas/project.schema.json` | `writer_mode`, `grok_config` 스키마 추가 |
| `skills/14-write/SKILL.md` | Grok-first 파이프라인, Phase 2 Grok 경로 |
| `skills/14-write/references/detailed-guide.md` | Grok 섹션 업데이트 |
| `skills/write-grok/SKILL.md` | 컨텍스트 인식 챕터 집필로 재작성 |
| `skills/write-grok/references/detailed-guide.md` | 프로세스 업데이트 |
| `skills/16-write-all/SKILL.md` | Grok 모드 Ralph Loop 지원 |
| `skills/16-write-all/references/detailed-guide.md` | Grok 모드 섹션 추가 |
| `skills/15-write-act/SKILL.md` | Grok 모드 명시 |
| `skills/03-init/SKILL.md` | writer_mode 선택 UI |
| `.claude-plugin/plugin.json` | 5.2.0 → 5.3.0 |
