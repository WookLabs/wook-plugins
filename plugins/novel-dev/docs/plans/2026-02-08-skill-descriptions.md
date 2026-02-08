# 스킬 Description 한 줄 정리 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 44개 스킬의 description을 깔끔한 한국어 한 줄로 통일하여 CLI 목록 가독성 향상

**Architecture:** 각 `skills/*/SKILL.md`의 YAML frontmatter `description:` 필드를 수정. 본문은 변경하지 않음. YAML 없는 3개 파일은 frontmatter 추가.

**Tech Stack:** Markdown YAML frontmatter 편집

---

## 변경 방침

### description 형식

```yaml
description: |
  한 줄 한국어 설명.
  <example>트리거 예시 1</example>
  <example>트리거 예시 2</example>
```

- 첫 줄: 한국어 한 문장, 마침표로 끝남
- "Triggers when user wants to..." 패턴 전부 제거
- 기존 `<example>` 태그는 유지 (트리거 매칭용)
- 다중 라인 설명 → 한 줄로 압축

### Task 1: 영어 → 한국어 변환 (26개)

각 파일에서 `description:` 필드의 첫 줄만 교체. `<example>` 줄은 유지.

| 스킬 | 현재 (영어) | 변경 후 (한국어) |
|------|-------------|-----------------|
| analyze-engagement | Triggers when user wants to analyze chapter engagement and reader retention risk. | 회차별 독자 몰입도를 분석하고 이탈 위험을 평가합니다. |
| blueprint-gen | Triggers when user wants to generate BLUEPRINT.md project blueprint from initial idea. | 초기 아이디어에서 BLUEPRINT.md 작품 기획서를 생성합니다. |
| blueprint-review | Triggers when user wants to review and improve BLUEPRINT.md project blueprint. | BLUEPRINT.md 기획서를 검토하고 개선점을 제안합니다. |
| check-retention | Triggers when user wants to predict reader retention rates between chapters. | 회차 간 독자 이탈률을 예측하고 분석합니다. |
| consistency-check | Triggers when user wants to check consistency across all chapters. | 전체 회차의 설정 일관성을 검사합니다. |
| design-character | Triggers when user wants to design novel characters. | 주요 캐릭터 프로필을 설계합니다. |
| design-foreshadow | Triggers when user wants to design foreshadowing elements. | 복선 요소(심기·회수 시점)를 설계합니다. |
| design-hook | Triggers when user wants to design mystery hooks and cliffhangers. | 훅과 떡밥(미스터리·클리프행어)을 설계합니다. |
| design-main-arc | Triggers when user wants to design main plot arc. | 메인 플롯 아크를 설계합니다. |
| design-relationship | Triggers when user wants to design character relationships. | 캐릭터 간 관계를 설계합니다. |
| design-style | Triggers when user wants to design writing style for the novel. | 작품 문체를 설계합니다. |
| design-sub-arc | Triggers when user wants to design subplot arcs. | 서브플롯 아크를 설계합니다. |
| design-timeline | Triggers when user wants to design story timeline. | 작품 내 타임라인을 설계합니다. |
| design-world | Triggers when user wants to design world setting for novel. | 세계관을 설계합니다. |
| evaluate | Triggers when user wants to evaluate chapter or act quality. | 회차/막 품질을 평가합니다. |
| gen-plot | Triggers when user wants to generate plot files for all chapters. | 회차별 상세 플롯을 생성합니다. |
| init | Triggers when user wants to initialize a new novel project from BLUEPRINT.md. | BLUEPRINT.md에서 소설 프로젝트를 초기화합니다. |
| revise | Triggers when user wants to revise manuscript. | 원고를 퇴고합니다. |
| stats | Triggers when user wants to see project statistics. | 프로젝트 통계를 표시합니다. |
| status | Triggers when user wants to check workflow progress. | 워크플로우 진행 상태를 확인합니다. |
| timeline | Triggers when user wants to visualize in-story timeline. | 작품 내 시간 흐름을 시각화합니다. |
| validate-genre | Triggers when user wants to validate chapter genre compliance and commercial elements. | 회차의 장르 적합성과 상업성 요소를 검증합니다. |
| write | Triggers when user wants to write a specific novel chapter. | 소설 회차를 집필합니다. |
| write-act | Triggers when user wants to write an entire act. | 막 단위로 순차 집필합니다. |
| write-all | Triggers when user wants to write all chapters from start to finish using Ralph Loop. | Ralph Loop으로 전체를 자동 집필합니다. |
| write-grok | Triggers when user wants to use xAI Grok API for novel generation (bypassing Claude restrictions). | xAI Grok API로 소설을 생성합니다. |

**파일 목록:** `skills/{analyze-engagement,blueprint-gen,blueprint-review,check-retention,consistency-check,design-character,design-foreshadow,design-hook,design-main-arc,design-relationship,design-style,design-sub-arc,design-timeline,design-world,evaluate,gen-plot,init,revise,stats,status,timeline,validate-genre,write,write-act,write-all,write-grok}/SKILL.md`

**편집 방법:** 각 파일에서 `description: |` 아래 영어 첫 줄만 한국어로 교체. 나머지(example 태그, 본문) 유지.

### Task 2: 다중 라인 한국어 → 한 줄 압축 (15개)

이미 한국어지만 첫 줄이 2줄 이상인 것들 → 한 줄로 압축.

| 스킬 | 현재 | 변경 후 |
|------|------|---------|
| adversarial-review | 챕터를 적대적 관점에서 검증합니다. 작성자의 주장을 의심하고 독립 검증합니다. | 챕터를 적대적 관점에서 독립 검증합니다. |
| ai-slop-detector | AI스러운 문장 패턴을 감지하고 재작성을 제안합니다. | (유지 — 이미 한 줄) |
| analyze | 범용 소설 분석 스킬. 캐릭터, 플롯, 세계관, 문체, 페이싱 등 다양한 요소를 체계적으로 분석합니다. | 캐릭터·플롯·세계관·문체 등을 체계적으로 분석합니다. |
| brainstorm | 소설 아이디어를 소크라틱 대화로 체계적으로 정제합니다.\n한 번에 하나씩 질문하며 아이디어의 깊이를 파헤칩니다. | 소크라틱 대화로 소설 아이디어를 정제합니다. |
| deep-evaluate | 8축 심층 평가로 챕터/원고 품질을 다각도로 분석합니다.\nLongStoryEval 연구(600권 분석)의 8개 기준을 적용합니다. | 8축 심층 평가로 원고 품질을 다각도로 분석합니다. |
| emotion-arc | 작품의 감정 곡선을 분석하고 6가지 기본 아크와 비교합니다. | (유지 — 이미 한 줄) |
| help | novel-dev 플러그인 사용법과 전체 워크플로우를 보여줍니다. | novel-dev 플러그인 사용법과 워크플로우를 안내합니다. |
| multi-draft | 같은 장면을 여러 접근법으로 작성하고 비교합니다. | (유지 — 이미 한 줄) |
| quickstart | (이미 한 줄 형식) | (유지) |
| resume | 중단된 집필 세션을 자동 감지하고 이어서 작업합니다. | (유지 — 이미 한 줄) |
| review | 설계 결과물 검토 스킬. 캐릭터, 플롯, 세계관 등 설계 완료 후 다각도 검토 및 승인/거부 판정. | 설계 결과물을 다각도로 검토하고 승인/거부를 판정합니다. |
| style-library | 스타일 예시 문장(exemplar) 라이브러리 관리 스킬. Few-shot 스타일 학습을 위한 예시 문장을 추가, 검색, 관리합니다. | Few-shot 스타일 학습용 예시 문장을 관리합니다. |
| swarm | 여러 에이전트가 병렬로 소설 작업을 수행합니다. | (유지 — 이미 한 줄) |
| wisdom | 소설 집필 과정에서 발견한 스타일 패턴, 캐릭터 음성, 복선 추적, 용어 등을\n자동으로 축적하고 다음 챕터 집필에 주입합니다. | 스타일·음성·복선·용어 학습 데이터를 축적하고 집필에 주입합니다. |
| write-scene | 장면 단위로 챕터를 집필합니다. 각 장면에 스타일 예시를 주입하고, 품질 검증 후 수술적 수정을 거쳐 조합합니다. | 장면 단위로 챕터를 집필합니다. |

**편집 방법:** description의 첫 줄(들)을 단일 한국어 문장으로 교체. example 태그 유지.

### Task 3: YAML frontmatter 없는 파일 (3개)

revise-pipeline, verify-chapter, verify-design — 현재 markdown 헤더 형식. YAML frontmatter 추가.

**revise-pipeline/SKILL.md** — 파일 최상단에 추가:
```yaml
---
name: revise-pipeline
description: |
  퇴고 파이프라인 (critic → editor → proofreader 순차 실행).
  <example>퇴고 파이프라인</example>
  <example>전문 퇴고</example>
---
```
기존 `# revise-pipeline` 줄과 설명 줄 제거 (중복 방지). `## Triggers` 섹션도 제거 (frontmatter로 이동).

**verify-chapter/SKILL.md** — 파일 최상단에 추가:
```yaml
---
name: verify-chapter
description: |
  3개 검증기로 챕터를 병렬 검증합니다.
  <example>챕터 검증</example>
  <example>품질 검사</example>
---
```
기존 `# verify-chapter` 줄과 영문 설명 줄 제거. `## Triggers` 섹션도 제거.

**verify-design/SKILL.md** — 파일 최상단에 추가:
```yaml
---
name: verify-design
description: |
  설계 검증 파이프라인 (consistency-verifier → genre-validator 순차 실행).
  <example>설계 검증</example>
  <example>설정 검사</example>
---
```
기존 `# verify-design` 줄과 설명 줄 제거. `## Triggers` 섹션도 제거.

### Task 4: 검증

```bash
# 모든 스킬에서 description 첫 줄만 추출해서 확인
for d in skills/*/; do
  name=$(basename "$d")
  desc=$(sed -n '/^description:/,/^[^ ]/{ /description:/d; /^[^ ]/d; /example/d; /^$/d; p; }' "$d/SKILL.md" | head -1 | sed 's/^ *//')
  printf "%-25s %s\n" "$name" "$desc"
done
```

확인 기준:
- [ ] 44개 스킬 전부 한국어 한 줄 설명
- [ ] "Triggers when" 패턴 0건
- [ ] 모든 파일에 YAML frontmatter 존재
- [ ] example 태그 유지 확인
- [ ] 기존 본문 변경 없음

### Task 5: 커밋

```bash
git add plugins/novel-dev/skills/
git commit -m "style(novel-dev): unify skill descriptions to single-line Korean"
```

## 변경하지 않는 것

- 스킬 본문 (instructions, protocol, steps 등)
- `<example>` 태그 내용
- commands/*.md 파일 (이미 한국어 한 줄 description)
- quickstart (이미 한 줄 형식)
