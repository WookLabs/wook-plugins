#!/usr/bin/env python3
"""
Stop Hook for novel-dev Ralph Loop persistence.
Intercepts exit attempts and continues the loop until completion promise detected.
Based on claude-plugins-official/plugins/ralph-loop pattern.
"""

import json
import sys
import os


def read_json_file(path):
    """Read and parse a JSON file."""
    try:
        if not os.path.exists(path):
            return None
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return None


def get_last_assistant_message(transcript_path):
    """Extract the last assistant message from transcript JSONL file."""
    try:
        if not transcript_path or not os.path.exists(transcript_path):
            return ''

        with open(transcript_path, 'r', encoding='utf-8') as f:
            lines = [line.strip() for line in f.readlines() if line.strip()]

        # Search in reverse for last assistant message
        for line in reversed(lines):
            try:
                entry = json.loads(line)
                if entry.get('role') == 'assistant':
                    content = entry.get('content', '')
                    if isinstance(content, str):
                        return content
                    if isinstance(content, list):
                        return ' '.join(
                            part.get('text', '')
                            for part in content
                            if part.get('type') == 'text'
                        )
            except json.JSONDecodeError:
                continue
        return ''
    except IOError:
        return ''


def find_active_ralph_project(directory):
    """Find a novel project with active Ralph loop."""
    novels_dir = os.path.join(directory, 'novels')

    if not os.path.exists(novels_dir):
        return None, None

    try:
        projects = [
            f for f in os.listdir(novels_dir)
            if os.path.exists(os.path.join(novels_dir, f, 'meta', 'project.json'))
        ]

        for proj in projects:
            project_path = os.path.join(novels_dir, proj)
            state_file = os.path.join(project_path, 'meta', 'ralph-state.json')

            state = read_json_file(state_file)
            if state and state.get('ralph_active', False):
                return project_path, state

    except OSError:
        pass

    return None, None


def main():
    try:
        # Read hook input from stdin
        hook_input = json.load(sys.stdin)
    except json.JSONDecodeError:
        hook_input = {}

    directory = hook_input.get('directory', os.getcwd())

    # Find active Ralph project (we only need state, not path)
    _, state = find_active_ralph_project(directory)

    if not state or not state.get('ralph_active', False):
        # No active Ralph loop - allow stop
        print(json.dumps({"decision": "allow"}))
        return

    # Check for completion promise in transcript
    transcript_path = hook_input.get('transcript_path', '')
    assistant_message = get_last_assistant_message(transcript_path)

    # Combine all searchable text
    search_text = json.dumps(hook_input) + assistant_message

    # Check for completion promises
    completion_promise = state.get('completion_promise', '<promise>TASK_COMPLETE</promise>')
    act_promise_pattern = '<promise>ACT_'
    novel_done_promise = '<promise>NOVEL_DONE</promise>'

    if novel_done_promise in search_text:
        # Novel complete - allow stop
        result = {
            "decision": "allow",
            "reason": "Novel completion promise detected. Ralph loop completed successfully."
        }
    elif completion_promise in search_text:
        # Generic completion promise - allow stop
        result = {
            "decision": "allow",
            "reason": "Completion promise detected. Ralph loop completed successfully."
        }
    elif act_promise_pattern in search_text and '_DONE</promise>' in search_text:
        # Act completion promise - allow stop
        result = {
            "decision": "allow",
            "reason": "Act completion promise detected. Ralph loop phase completed."
        }
    else:
        # Block stop - continue Ralph loop
        current_chapter = state.get('current_chapter', 'unknown')
        current_act = state.get('current_act', 1)
        iteration = state.get('iteration', 1)
        max_iterations = state.get('max_iterations', 100)

        result = {
            "decision": "block",
            "reason": f"""[NOVEL RALPH LOOP - Act {current_act} in progress (iteration {iteration}/{max_iterations})]

Ralph loop is active. Current: chapter {current_chapter}.

Continue until completion promise:
- Act done: <promise>ACT_{current_act}_DONE</promise>
- Novel done: <promise>NOVEL_DONE</promise>

To stop: User must explicitly request Ralph Loop deactivation."""
        }

    print(json.dumps(result))


if __name__ == "__main__":
    main()
