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
    r'sub-arc_\d{3}\.json$': 'sub-arc.schema.json',
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
    # Must match world.schema.json required fields
    required = ['era', 'location']
    for field in required:
        if field not in data:
            return False, f"Missing required field: {field}"

    # location must be an object if present
    if 'location' in data and not isinstance(data.get('location'), dict):
        return False, "location must be an object"

    return True, "Valid"


def validate_plot_structure(data):
    """Validate plot/main-arc JSON structure."""
    # Must match plot.schema.json required fields
    required = ['total_acts', 'acts']
    for field in required:
        if field not in data:
            return False, f"Missing required field: {field}"

    if not isinstance(data.get('total_acts'), int):
        return False, "total_acts must be an integer"

    if not isinstance(data.get('acts'), list):
        return False, "acts must be an array"

    if len(data.get('acts', [])) == 0:
        return False, "acts array must have at least one act"

    return True, "Valid"


def validate_foreshadowing_structure(data):
    """Validate foreshadowing JSON structure."""
    # Must match foreshadowing.schema.json required fields
    if 'foreshadowing' not in data:
        return False, "Missing required field: foreshadowing"

    if not isinstance(data.get('foreshadowing'), list):
        return False, "foreshadowing must be an array"

    # Validate each foreshadowing item
    for i, item in enumerate(data.get('foreshadowing', [])):
        required_item_fields = ['id', 'content', 'importance', 'plant_chapter', 'payoff_chapter', 'status']
        for field in required_item_fields:
            if field not in item:
                return False, f"Foreshadowing item {i}: Missing required field: {field}"

        # Validate ID pattern
        fore_id = item.get('id', '')
        if not re.match(r'^fore_[a-z0-9_]+$', fore_id):
            return False, f"Invalid foreshadowing ID format: {fore_id}. Must match 'fore_[a-z0-9_]+'"

        # Validate importance enum
        valid_importance = ['A', 'B', 'C']
        importance = item.get('importance', '')
        if importance not in valid_importance:
            return False, f"Invalid importance: {importance}. Must be one of: {', '.join(valid_importance)}"

        # Validate status enum
        valid_status = ['not_planted', 'planted', 'hinting', 'paid_off']
        status = item.get('status', '')
        if status not in valid_status:
            return False, f"Invalid status: {status}. Must be one of: {', '.join(valid_status)}"

    return True, "Valid"


def validate_sub_arc_structure(data):
    """Validate sub-arc JSON structure."""
    required = ['id', 'title', 'chapters']
    for field in required:
        if field not in data:
            return False, f"Missing required field: {field}"

    # Validate ID pattern
    sub_id = data.get('id', '')
    if not re.match(r'^sub_\d{3}$', sub_id):
        return False, f"Invalid sub-arc ID format: {sub_id}. Must match 'sub_XXX' (3 digits)"

    if not isinstance(data.get('chapters'), list):
        return False, "chapters must be an array"

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
            'foreshadowing.schema.json': validate_foreshadowing_structure,
            'sub-arc.schema.json': validate_sub_arc_structure,
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
        print(json.dumps({"decision": "approve"}))
        return

    file_path = tool_input.get('file_path', '')
    content = tool_input.get('content', '')

    # Skip non-JSON files
    if not file_path.endswith('.json'):
        print(json.dumps({"decision": "approve"}))
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

    print(json.dumps({"decision": "approve"}))


if __name__ == "__main__":
    main()
