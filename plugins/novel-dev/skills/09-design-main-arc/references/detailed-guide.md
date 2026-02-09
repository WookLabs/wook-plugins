# Design Main Arc Skill - Detailed Guide

## Overview

This skill provides comprehensive functionality for the design-main-arc operation in the novel development workflow.

## When to Use

Use this skill when you need to perform design-main-arc operations on your novel project.

## Prerequisites

Check the SKILL.md file in the parent directory for specific prerequisites and workflow details.

## Execution Process

### Phase 1: Context Loading
Loads necessary project files and validates prerequisites.

### Phase 2: Agent Execution  
Calls specialized agents to perform the required operations.

### Phase 3: Output Generation
Creates or updates relevant project files.

## Integration

This skill integrates with other novel-dev skills. See SKILL.md for detailed workflow integration.

## Best Practices

1. Run skills in the recommended workflow order
2. Review generated output before proceeding
3. Use idempotency features for iterative refinement
4. Preserve manual edits in designated sections

## Troubleshooting

### Common Issues

**Missing Prerequisites**: Ensure all required files exist before running
**File Conflicts**: Use idempotency system to preserve manual edits
**Output Quality**: Review and refine using iterative runs

## Advanced Features

See SKILL.md in parent directory for advanced usage patterns and options.

## Quality Checklist

- [ ] Prerequisites validated
- [ ] Output generated successfully
- [ ] Files saved to correct locations
- [ ] Ready for next workflow step

For complete documentation, see the SKILL.md file in: skills/design-main-arc/
