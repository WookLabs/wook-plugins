#!/bin/bash
# Session initialization script (called by SessionStart hook)
# Displays project status if novel project detected

set -euo pipefail

PROJECT_ROOT="${CLAUDE_PROJECT_ROOT:-.}"
PROJECT_FILE="$PROJECT_ROOT/meta/project.json"

if [ -f "$PROJECT_FILE" ]; then
    # SECURITY: Pass file path as environment variable
    PROJECT_FILE="$PROJECT_FILE" python3 <<'PYEOF'
import json
import os
import sys

file_path = os.environ['PROJECT_FILE']

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
except (json.JSONDecodeError, IOError) as e:
    print(f'Failed to load project: {e}')
    sys.exit(0)

title = data.get('title', 'Untitled')
status = data.get('status', 'unknown')
target = data.get('target_chapters', '?')

print(f'Novel Project: {title}')
print(f'Status: {status}')
print(f'Target: {target} chapters')
PYEOF
fi
