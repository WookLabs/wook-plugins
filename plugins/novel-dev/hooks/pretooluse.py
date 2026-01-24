#!/usr/bin/env python3
"""
PreToolUse Hook for novel-dev schema validation.
Validates JSON files against schemas before writing.
"""

import json
import sys
import os
import re


SCHEMA_PATTERNS = {
    r'chapter_\d+\.json$': 'chapter.schema.json',
    r'project\.json$': 'project.schema.json',
    r'characters/.*\.json$': 'character.schema.json',
    r'world\.json$': 'world.schema.json',
    r'main-arc\.json$': 'plot.schema.json',
    r'ralph-state\.json$': 'ralph-state.schema.json',
    r'foreshadowing\.json$': 'foreshadowing.schema.json',
    r'hooks\.json$': 'hooks.schema.json',
    r'sub-arc.*\.json$': 'sub-arc.schema.json',
}


def validate_chapter_structure(data):
    """Validate chapter JSON structure."""
    required = ['chapter_number', 'scenes']
    for field in required:
        if field not in data:
            return False, f"Missing required field: {field}"

    if not isinstance(data.get('chapter_number'), int):
        return False, "chapter_number must be an integer"

    if not isinstance(data.get('scenes'), list):
        return False, "scenes must be an array"

    if len(data.get('scenes', [])) == 0:
        return False, "scenes array must have at least one scene"

    return True, "Valid"


def validate_character_structure(data):
    """Validate character JSON structure."""
    required = ['id', 'name', 'role']
    for field in required:
        if field not in data:
            return False, f"Missing required field: {field}"

    # Validate ID pattern
    char_id = data.get('id', '')
    if not re.match(r'^char_[a-z0-9_]+$', char_id):
        return False, f"Invalid character ID format: {char_id}. Must match 'char_[a-z0-9_]+'"

    # Validate role enum
    valid_roles = ['protagonist', 'deuteragonist', 'antagonist', 'supporting', 'minor', 'cameo']
    role = data.get('role', '')
    if role not in valid_roles:
        return False, f"Invalid role: {role}. Must be one of: {', '.join(valid_roles)}"

    return True, "Valid"


def validate_project_structure(data):
    """Validate project JSON structure."""
    required = ['id', 'title', 'genre']
    for field in required:
        if field not in data:
            return False, f"Missing required field: {field}"

    return True, "Valid"


def validate_world_structure(data):
    """Validate world JSON structure."""
    required = ['id', 'name']
    for field in required:
        if field not in data:
            return False, f"Missing required field: {field}"

    return True, "Valid"


def validate_plot_structure(data):
    """Validate plot/main-arc JSON structure."""
    required = ['id', 'title', 'acts']
    for field in required:
        if field not in data:
            return False, f"Missing required field: {field}"

    if not isinstance(data.get('acts'), list):
        return False, "acts must be an array"

    return True, "Valid"


def validate_json_structure(content, schema_name):
    """Basic structure validation without jsonschema dependency."""
    try:
        data = json.loads(content)

        validators = {
            'chapter.schema.json': validate_chapter_structure,
            'character.schema.json': validate_character_structure,
            'project.schema.json': validate_project_structure,
            'world.schema.json': validate_world_structure,
            'plot.schema.json': validate_plot_structure,
        }

        validator = validators.get(schema_name)
        if validator:
            return validator(data)

        # Default: just check it's valid JSON
        return True, "Valid JSON"

    except json.JSONDecodeError as e:
        return False, f"Invalid JSON: {e}"


def main():
    try:
        hook_input = json.load(sys.stdin)
    except json.JSONDecodeError:
        hook_input = {}

    tool_name = hook_input.get('tool_name', hook_input.get('toolName', ''))
    tool_input = hook_input.get('tool_input', hook_input.get('toolInput', {}))

    # Only validate Write tool for JSON files
    if tool_name != 'Write':
        print(json.dumps({"decision": "allow"}))
        return

    file_path = tool_input.get('file_path', '')
    content = tool_input.get('content', '')

    # Skip non-JSON files
    if not file_path.endswith('.json'):
        print(json.dumps({"decision": "allow"}))
        return

    # Normalize path separators for matching
    normalized_path = file_path.replace('\\', '/')

    # Check if it's a JSON file we should validate
    for pattern, schema in SCHEMA_PATTERNS.items():
        if re.search(pattern, normalized_path):
            is_valid, message = validate_json_structure(content, schema)
            if not is_valid:
                result = {
                    "decision": "block",
                    "reason": f"Schema validation failed for {os.path.basename(file_path)}: {message}"
                }
                print(json.dumps(result))
                return
            break

    print(json.dumps({"decision": "allow"}))


if __name__ == "__main__":
    main()
