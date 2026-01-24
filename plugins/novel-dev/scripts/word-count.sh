#!/bin/bash
# Counts words in chapters
# Usage: word-count.sh [chapter_number|all]

set -euo pipefail

PROJECT_ROOT="${CLAUDE_PROJECT_ROOT:-.}"

count_words() {
    local file="$1"
    if [ -f "$file" ]; then
        # Korean: avg 2.5 chars per word
        chars=$(wc -m < "$file" | tr -d ' ')
        words=$((chars / 3))
        echo "$words"
    else
        echo "0"
    fi
}

if [ "${1:-all}" = "all" ]; then
    total=0
    for f in "$PROJECT_ROOT"/chapters/chapter_*.md; do
        if [ -f "$f" ]; then
            words=$(count_words "$f")
            total=$((total + words))
            basename=$(basename "$f")
            echo "$basename: ~$words words"
        fi
    done
    echo "---"
    echo "Total: ~$total words"
else
    # SECURITY: Validate input is numeric only
    if ! [[ "$1" =~ ^[0-9]+$ ]]; then
        echo "ERROR: Chapter number must be a positive integer"
        exit 1
    fi
    chapter_file="$PROJECT_ROOT/chapters/chapter_$(printf '%03d' "$1").md"
    if [ ! -f "$chapter_file" ]; then
        echo "ERROR: Chapter file not found: $chapter_file"
        exit 1
    fi
    words=$(count_words "$chapter_file")
    echo "Chapter $1: ~$words words"
fi
