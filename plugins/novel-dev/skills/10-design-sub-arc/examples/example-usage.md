# Design Sub Arc Skill - Usage Examples

## Basic Usage

```bash
/design-sub-arc
```

**Expected Output**:
```
Executing design-sub-arc...
✓ Context loaded
✓ Processing completed
✓ Files generated/updated

Next step: [see workflow]
```

## Common Scenarios

### Scenario 1: First-Time Use

Run after completing prerequisite steps.

```bash
/design-sub-arc
```

Creates initial output files.

### Scenario 2: Iterative Refinement

Re-run to refine existing output.

```bash
/design-sub-arc
```

Preserves manual edits while updating auto-generated content.

### Scenario 3: Specific Target

Target specific elements when supported.

```bash
/design-sub-arc [arguments]
```

## Integration Examples

See SKILL.md for complete workflow integration examples.

## Error Handling

### Missing Prerequisites

```
ERROR: Required files missing
Run prerequisite skills first
```

### File Conflicts

```
WARNING: Manual edits detected
Preserving user modifications...
```

## Best Practices

1. Follow recommended workflow order
2. Review output after execution  
3. Use manual edit sections for custom content
4. Re-run for iterative improvement

For detailed examples, see the SKILL.md file in: skills/design-sub-arc/
