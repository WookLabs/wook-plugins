# Grok-Only 강화 + write-grok-act 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 성인소설 Grok-only 파이프라인 강화 — adult_writing 스타일 필드, /write-grok-act 스킬 신규, hybrid deprecated

**Architecture:** style-guide.json에 adult_writing 필드를 추가하고 assemble-grok-prompt.mjs가 이를 시스템 프롬프트에 반영. /write-grok-act는 /write-act의 Grok 전용 버전. hybrid 모드는 deprecated로 표시.

**Tech Stack:** JSON Schema, Node.js (ESM), Markdown (SKILL.md)

---

## Task 1: style-guide 스키마에 adult_writing 추가

**Files:**
- Modify: `schemas/style-guide.schema.json:157` (special_instructions 뒤에 추가)
- Modify: `templates/style-guide.template.json:29` (마지막 필드 뒤에 추가)

**Step 1: 스키마에 adult_writing 프로퍼티 추가**

`schemas/style-guide.schema.json`의 `"properties"` 객체 안, `"special_instructions"` 뒤에 추가:

```json
"adult_writing": {
  "type": "object",
  "description": "성인 장면 작성 스타일 설정 (writer_mode: grok 시 활용)",
  "properties": {
    "explicitness": {
      "type": "string",
      "enum": ["low", "medium", "high"],
      "description": "묘사 수위 (low: 암시적, medium: 은유적, high: 직접적)",
      "default": "high"
    },
    "emotional_focus": {
      "type": "boolean",
      "description": "감정 묘사 중심 여부",
      "default": true
    },
    "sensory_detail": {
      "type": "string",
      "enum": ["visual", "tactile", "emotional", "all"],
      "description": "주요 감각 묘사 유형",
      "default": "all"
    },
    "pacing": {
      "type": "string",
      "enum": ["quick", "gradual", "slow-burn"],
      "description": "성인 장면 페이싱",
      "default": "gradual"
    },
    "vocabulary_level": {
      "type": "string",
      "enum": ["crude", "moderate", "literary"],
      "description": "어휘 수준 (crude: 직설적, literary: 문학적)",
      "default": "literary"
    }
  }
}
```

**Step 2: 템플릿에 기본값 추가**

`templates/style-guide.template.json`의 `"special_instructions"` 뒤에 추가:

```json
"adult_writing": {
  "explicitness": "high",
  "emotional_focus": true,
  "sensory_detail": "all",
  "pacing": "gradual",
  "vocabulary_level": "literary"
}
```

**Step 3: 검증**

```bash
node scripts/validate-schemas.mjs
```

Expected: style-guide 스키마 검증 통과

**Step 4: 커밋**

```bash
git add schemas/style-guide.schema.json templates/style-guide.template.json
git commit -m "feat(style-guide): add adult_writing field for Grok mode"
```

---

## Task 2: assemble-grok-prompt.mjs에서 adult_writing 반영

**Files:**
- Modify: `scripts/assemble-grok-prompt.mjs:183` (buildSystemPrompt 함수, special_instructions 처리 뒤)

**Step 1: buildSystemPrompt()에 adult_writing 섹션 추가**

`scripts/assemble-grok-prompt.mjs`의 `buildSystemPrompt()` 함수에서 `// 특별 지시` 블록(line 178-182) 뒤, `// 공통 작문 규칙`(line 185) 앞에 삽입:

```javascript
// 성인 장면 스타일
if (styleGuide.adult_writing) {
  const aw = styleGuide.adult_writing;
  lines.push('');
  lines.push('## 성인 장면 작성 가이드');

  if (aw.explicitness) {
    const explMap = {
      low: '암시적으로 표현하세요. 직접적인 묘사 대신 분위기와 감정으로.',
      medium: '은유적 표현을 사용하세요. 감각적이되 노골적이지 않게.',
      high: '구체적이고 감각적으로 묘사하세요. 신체 반응과 행위를 생생하게.'
    };
    lines.push(`- 수위: ${explMap[aw.explicitness] || aw.explicitness}`);
  }

  if (aw.emotional_focus) {
    lines.push('- 감정 묘사: 신체적 행위만이 아닌, 캐릭터의 심리와 감정 변화를 함께 묘사하세요.');
  }

  if (aw.sensory_detail) {
    const sensMap = {
      visual: '시각적 묘사 중심 (표정, 몸짓, 시선).',
      tactile: '촉각적 묘사 중심 (피부 감촉, 체온, 접촉).',
      emotional: '감정적 묘사 중심 (내면 독백, 감정 파도).',
      all: '시각, 촉각, 청각, 후각 등 모든 감각을 활용한 입체적 묘사.'
    };
    lines.push(`- 감각: ${sensMap[aw.sensory_detail] || aw.sensory_detail}`);
  }

  if (aw.pacing) {
    const paceMap = {
      quick: '빠르게 전개. 짧은 문장, 호흡 가빠지는 리듬.',
      gradual: '점진적 전개. 분위기를 천천히 고조시키며 감정선을 따라가세요.',
      'slow-burn': '느리게 타오르는 전개. 긴장과 기대감을 최대한 끌어올린 뒤 해소.'
    };
    lines.push(`- 페이싱: ${paceMap[aw.pacing] || aw.pacing}`);
  }

  if (aw.vocabulary_level) {
    const vocabMap = {
      crude: '직설적인 어휘를 사용하세요.',
      moderate: '적당한 수준의 성적 어휘를 사용하세요.',
      literary: '문학적이고 우아한 표현을 사용하세요. 저속한 표현은 피하세요.'
    };
    lines.push(`- 어휘: ${vocabMap[aw.vocabulary_level] || aw.vocabulary_level}`);
  }
}
```

**Step 2: 스크립트 도움말 확인**

```bash
node scripts/assemble-grok-prompt.mjs --help
```

Expected: 정상 출력 (새 코드가 help 경로에 영향 없음)

**Step 3: 커밋**

```bash
git add scripts/assemble-grok-prompt.mjs
git commit -m "feat(assemble-grok-prompt): reflect adult_writing style in system prompt"
```

---

## Task 3: /write-grok-act 스킬 생성

**Files:**
- Create: `skills/write-grok-act/SKILL.md`

**Step 1: SKILL.md 작성**

`skills/write-grok-act/SKILL.md` 생성:

```markdown
---
name: write-grok-act
description: Grok API로 막(Act) 단위 일괄 집필
user-invocable: true
---

# /write-grok-act - Grok으로 막 단위 집필

$ARGUMENTS

지정한 막(Act)의 모든 회차를 Grok API로 순차 집필합니다.
`writer_mode` 설정과 무관하게 항상 Grok 파이프라인을 사용합니다.

## Quick Start

```bash
/write-grok-act 1     # 1막 전체를 Grok으로 집필
/write-grok-act 2     # 2막 전체를 Grok으로 집필
```

## Prerequisites

`~/.env` 파일에 API 키 설정:
```
XAI_API_KEY=xai-xxxxxxxxxxxx
```

## 실행 단계

1. **막 정보 로드**
   - `plot/structure.json`에서 해당 막의 회차 범위 확인
   - 예: Act 1 = 1-15화

2. **순차 집필 (Grok)**
   ```
   for chapter in act_chapters:
       /write-grok {chapter}
   ```

   각 회차별:
   - `assemble-grok-prompt.mjs` → 컨텍스트 조립
   - `grok-writer.mjs` → Grok API 호출 → 챕터 저장
   - summarizer → 요약 생성
   - `meta/ralph-state.json` → 상태 업데이트

3. **회차별 품질 검증 (Claude)**
   - critic, beta-reader, genre-validator 병렬 실행
   - 서사 구조, 캐릭터 일관성, 플롯 정합성만 평가
   - 성인 콘텐츠 자체는 평가 대상 아님

4. **막 완료 후 자동 트리거**
   - `/revise` (막 전체) — Claude editor 수행
   - `/evaluate` (막 전체) — Claude critic/beta-reader 수행
   - `/consistency-check` — Claude consistency-verifier 수행

> **Note**: Grok이 집필하고 Claude가 검증/퇴고합니다.
> 성인 콘텐츠 평가 시 서사 구조와 일관성만 검토합니다.

## /write-act과의 차이

| 항목 | /write-act | /write-grok-act |
|------|-----------|----------------|
| 집필 엔진 | writer_mode에 따라 결정 | 항상 Grok |
| writer_mode 필요 | 예 | 아니오 |
| 용도 | 범용 | 성인소설 전용 |

## Error Handling

### API 키 없음
```
[ERROR] XAI_API_KEY를 찾을 수 없습니다.
→ ~/.env 파일에 XAI_API_KEY=xai-xxx 추가
```

### 막 정보 없음
```
[ERROR] plot/structure.json에서 Act {N} 정보를 찾을 수 없습니다.
→ /gen-plot으로 플롯을 먼저 생성하세요
```
```

**Step 2: frontmatter 검증**

```bash
head -5 skills/write-grok-act/SKILL.md
```

Expected: `name: write-grok-act`, `user-invocable: true` 확인

**Step 3: 커밋**

```bash
git add skills/write-grok-act/SKILL.md
git commit -m "feat: add /write-grok-act skill for act-level Grok writing"
```

---

## Task 4: hybrid deprecated 처리 (5개 파일)

**Files:**
- Modify: `skills/14-write/SKILL.md:26` (hybrid 행)
- Modify: `skills/15-write-act/SKILL.md:25` (hybrid 행)
- Modify: `skills/16-write-all/SKILL.md:24` (hybrid 행)
- Modify: `skills/write-grok/SKILL.md:114-121` (Hybrid 모드 키워드 섹션)
- Modify: `skills/03-init/SKILL.md:154` (Hybrid 선택지)

**Step 1: 14-write/SKILL.md**

Line 26의:
```
| `"hybrid"` | 성인 키워드 감지 시 Grok, 그 외 novelist |
```
변경:
```
| `"hybrid"` | ~~(deprecated)~~ 성인 키워드 감지 시 Grok, 그 외 novelist. **성인소설은 `"grok"` 권장** |
```

Line 155의 `## Hybrid 모드: 성인 키워드 자동 감지` 위에 추가:
```
> **Deprecated**: hybrid 모드는 챕터 단위 라우팅만 지원하며 씬 단위 전환이 불가합니다.
> 성인소설은 `writer_mode: "grok"`으로 통일을 권장합니다.
```

**Step 2: 15-write-act/SKILL.md**

Line 25의:
```
   - `writer_mode: "hybrid"` → 성인 키워드 감지 시 Grok
```
변경:
```
   - `writer_mode: "hybrid"` → (deprecated) 성인 키워드 감지 시 Grok. **성인소설은 `"grok"` 권장**
```

**Step 3: 16-write-all/SKILL.md**

Line 24의:
```
- `"hybrid"`: 성인 키워드 감지 시 Grok, 나머지 Claude (키워드: 야한, 19금, ...
```
변경:
```
- `"hybrid"`: (deprecated) 성인 키워드 감지 시 Grok, 나머지 Claude. **성인소설은 `"grok"` 권장**
```

**Step 4: write-grok/SKILL.md**

Line 114의 `## Hybrid 모드 키워드` 섹션 제목 변경:
```
## Hybrid 모드 키워드 (Deprecated)
```

Line 116 앞에 추가:
```
> **Deprecated**: hybrid 모드 대신 `writer_mode: "grok"` 사용을 권장합니다.
```

**Step 5: 03-init/SKILL.md**

Line 154의:
```
| **Hybrid (혼합)** | 성인 키워드 감지 시 Grok, 나머지 Claude |
```
변경:
```
| **Hybrid (혼합, deprecated)** | 성인 키워드 감지 시 Grok, 나머지 Claude. 성인소설은 Grok 권장 |
```

**Step 6: grep으로 검증**

```bash
grep -rn "hybrid" skills/*/SKILL.md | grep -v deprecated | grep -v "Deprecated"
```

Expected: hybrid가 deprecated 표시 없이 나타나는 곳이 없어야 함 (실행 로직의 `"hybrid"` 문자열은 예외)

**Step 7: 커밋**

```bash
git add skills/14-write/SKILL.md skills/15-write-act/SKILL.md skills/16-write-all/SKILL.md skills/write-grok/SKILL.md skills/03-init/SKILL.md
git commit -m "docs: deprecate hybrid writer_mode, recommend grok for adult novels"
```

---

## Task 5: /init에서 Grok 모드 선택 시 adult_writing 안내

**Files:**
- Modify: `skills/03-init/SKILL.md:166` (Grok 모드 선택 후)

**Step 1: adult_writing 설정 안내 추가**

Line 166(`- `"claude"` 선택 시 ...`) 뒤에 추가:

```markdown
**Grok 모드 선택 시** `meta/style-guide.json`에 `adult_writing` 섹션도 함께 설정합니다:

```json
{
  "adult_writing": {
    "explicitness": "high",
    "emotional_focus": true,
    "sensory_detail": "all",
    "pacing": "gradual",
    "vocabulary_level": "literary"
  }
}
```

AskUserQuestion으로 사용자에게 커스터마이징 여부 확인:
- "기본값 사용" — 위 설정 그대로 적용
- "커스터마이징" — 각 항목별 선택
  - 수위: low(암시적) / medium(은유적) / high(직접적)
  - 감각: visual / tactile / emotional / all
  - 페이싱: quick / gradual / slow-burn
  - 어휘: crude(직설) / moderate(적당) / literary(문학적)
```

**Step 2: 커밋**

```bash
git add skills/03-init/SKILL.md
git commit -m "feat(init): add adult_writing setup for Grok mode selection"
```

---

## Task 6: 버전 범프 + 최종 검증

**Files:**
- Modify: `.claude-plugin/plugin.json:3` (version)

**Step 1: 버전 5.3.0 → 5.4.0**

```json
"version": "5.4.0"
```

**Step 2: 전체 검증**

```bash
# 스키마 유효성
node scripts/validate-schemas.mjs

# 스크립트 동작
node scripts/assemble-grok-prompt.mjs --help
node scripts/grok-writer.mjs --help

# frontmatter 검사
head -5 skills/write-grok-act/SKILL.md

# legacy 검사
grep -rn "grok-3" skills/ scripts/ | grep -v "레거시" | grep -v "legacy"
grep -rn "4096" scripts/
```

Expected: 모두 PASS

**Step 3: 최종 커밋 + 푸시**

```bash
git add .claude-plugin/plugin.json
git commit -m "chore: bump version to 5.4.0"
```

부모 리포에서:
```bash
cd C:\work\17_oh-my-plugin
git add plugins/novel-dev/
git commit -m "feat(novel-dev): v5.4.0 — adult_writing style, /write-grok-act, hybrid deprecated"
git push
```
