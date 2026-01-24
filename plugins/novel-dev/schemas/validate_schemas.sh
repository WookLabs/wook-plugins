#!/bin/bash

# Schema Validation Test Script
# Tests all JSON schemas for valid JSON syntax

SCHEMA_DIR="$(dirname "$0")"
ERRORS=0
TOTAL=0

echo "=== JSON Schema Validation ==="
echo ""

for schema in "$SCHEMA_DIR"/*.schema.json; do
    TOTAL=$((TOTAL + 1))
    filename=$(basename "$schema")
    
    if python3 -c "import json; json.load(open('$schema'))" 2>/dev/null; then
        echo "✓ $filename"
    else
        echo "✗ $filename - INVALID JSON"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "=== Summary ==="
echo "Total schemas: $TOTAL"
echo "Valid: $((TOTAL - ERRORS))"
echo "Errors: $ERRORS"

if [ $ERRORS -eq 0 ]; then
    echo ""
    echo "✓ All schemas are valid!"
    exit 0
else
    echo ""
    echo "✗ Some schemas have errors"
    exit 1
fi
