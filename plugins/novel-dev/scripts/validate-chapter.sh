#!/bin/bash
# Validates chapter JSON structure
# Usage: validate-chapter.sh <chapter_number>

set -euo pipefail

CHAPTER_NUM="$1"

# SECURITY: Validate input is numeric only
if ! [[ "$CHAPTER_NUM" =~ ^[0-9]+$ ]]; then
    echo "ERROR: Chapter number must be a positive integer"
    exit 1
fi

PROJECT_ROOT="${CLAUDE_PROJECT_ROOT:-.}"
CHAPTER_FILE="$PROJECT_ROOT/chapters/chapter_$(printf '%03d' "$CHAPTER_NUM").json"

if [ ! -f "$CHAPTER_FILE" ]; then
    echo "ERROR: Chapter file not found: $CHAPTER_FILE"
    exit 1
fi

# SECURITY: Pass file path as environment variable, not string interpolation
CHAPTER_FILE="$CHAPTER_FILE" python3 <<'PYEOF'
import json
import sys
import os

file_path = os.environ['CHAPTER_FILE']
try:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
except json.JSONDecodeError as e:
    print(f'ERROR: Invalid JSON - {e}')
    sys.exit(1)
except Exception as e:
    print(f'ERROR: {e}')
    sys.exit(1)

required = ['chapter_number', 'scenes']
missing = [f for f in required if f not in data]
if missing:
    print(f'Missing required fields: {missing}')
    sys.exit(1)

if not isinstance(data.get('scenes', []), list):
    print('ERROR: scenes must be a list')
    sys.exit(1)

print(f'Chapter {data["chapter_number"]} valid: {len(data["scenes"])} scenes')
PYEOF
