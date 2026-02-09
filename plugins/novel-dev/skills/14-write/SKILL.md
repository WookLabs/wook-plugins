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
```

## Key Features

### Intelligent Context Loading
- 120K token budget system
- Priority-based context assembly
- Adaptive loading based on chapter position

### Adult Content Auto-Detection
Automatically switches to xAI Grok API when keywords detected:
- Korean: 야한, 19금, 베드신, 관능, etc.
- English: nsfw, explicit, adult, intimate scene, etc.

Manual override: `/write 5 --grok`

### Quality Assurance
- novelist agent for creative writing
- editor agent for quality review
- Automatic state tracking

## Process Flow
1. Load chapter plot from `chapters/chapter_XXX.json`
2. Detect adult content keywords
3. Assemble context within budget (style guide, previous summaries, characters)
4. Generate chapter (Grok API or novelist agent)
5. Quality review with editor
6. Save chapter and update state

## Documentation

**Detailed Guide**: See `references/detailed-guide.md`
- Context budget allocation
- Grok API integration details
- Korean literary techniques
- Style guide system
- Error handling

**Usage Examples**: See `examples/example-usage.md`
- Basic writing workflows
- Adult content scenarios
- Advanced options (--focus, --style)
- Integration with other commands
