#!/bin/bash
# Checks timeline consistency
# Usage: timeline-check.sh

set -euo pipefail

PROJECT_ROOT="${CLAUDE_PROJECT_ROOT:-.}"
TIMELINE_FILE="$PROJECT_ROOT/plot/timeline.json"

if [ ! -f "$TIMELINE_FILE" ]; then
    echo "No timeline.json found"
    exit 0
fi

# SECURITY: Pass file path as environment variable
TIMELINE_FILE="$TIMELINE_FILE" python3 <<'PYEOF'
import json
import os
import sys
from datetime import datetime

file_path = os.environ['TIMELINE_FILE']

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
except (json.JSONDecodeError, IOError) as e:
    print(f'ERROR: Failed to read timeline - {e}')
    sys.exit(1)

timeline = data.get('timeline', [])
errors = []

prev_date = None
for i, event in enumerate(timeline):
    date_str = event.get('date', '')
    if date_str:
        try:
            current_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            if prev_date and current_date < prev_date:
                errors.append(f'Event {i}: {date_str} is before previous event')
            prev_date = current_date
        except (ValueError, TypeError) as e:
            errors.append(f'Event {i}: Invalid date format - {e}')

if errors:
    print('Timeline issues:')
    for e in errors:
        print(f'  - {e}')
    sys.exit(1)
else:
    print(f'Timeline OK: {len(timeline)} events in chronological order')
PYEOF
