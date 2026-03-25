#!/usr/bin/env python3
"""Run last30days research with both --emit=compact and --emit=md in parallel."""

import os
import subprocess
import sys
from pathlib import Path

SKILL_SEARCH_DIRS = [
    os.environ.get("CLAUDE_PLUGIN_ROOT", ""),
    os.environ.get("GEMINI_EXTENSION_DIR", ""),
    os.path.expanduser("~/.claude/plugins/marketplaces/last30days-skill"),
    os.path.expanduser("~/.claude/plugins/cache/last30days-skill/last30days/2.9.5"),
    os.path.expanduser("~/.gemini/extensions/last30days-skill"),
    os.path.expanduser("~/.claude/skills/last30days"),
    os.path.expanduser("~/.agents/skills/last30days"),
    os.path.expanduser("~/.codex/skills/last30days"),
]

RAW_DIR = os.path.expanduser("~/Documents/Last30Days")
REPORTS_DIR = os.path.expanduser("~/Documents/Last30Days/reports")


def find_skill_root():
    for d in SKILL_SEARCH_DIRS:
        if d and os.path.isfile(os.path.join(d, "scripts", "last30days.py")):
            return d
    return None


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/run-last30days.py <topic> [--quick|--deep] [--days=N] [--x-handle=X]")
        print('Example: python3 scripts/run-last30days.py "NVDA stock" --quick')
        sys.exit(1)

    skill_root = find_skill_root()
    if not skill_root:
        print("ERROR: Could not find last30days skill (scripts/last30days.py)")
        print("Searched:", SKILL_SEARCH_DIRS)
        sys.exit(1)

    script_path = os.path.join(skill_root, "scripts", "last30days.py")
    print(f"Using skill at: {skill_root}")

    # Separate topic from flags
    topic_parts = []
    extra_flags = []
    for arg in sys.argv[1:]:
        if arg.startswith("--"):
            extra_flags.append(arg)
        else:
            topic_parts.append(arg)

    topic = " ".join(topic_parts)
    if not topic:
        print("ERROR: No topic provided")
        sys.exit(1)

    # Ensure output dirs exist
    os.makedirs(RAW_DIR, exist_ok=True)
    os.makedirs(REPORTS_DIR, exist_ok=True)

    # Build commands
    base_args = ["python3", script_path, topic] + extra_flags + ["--no-native-web"]

    compact_cmd = base_args + ["--emit=compact", f"--save-dir={RAW_DIR}"]
    md_cmd = base_args + ["--emit=md", f"--save-dir={REPORTS_DIR}"]

    print(f"\nResearching: {topic}")
    print(f"Extra flags: {extra_flags or '(none)'}")
    print(f"Raw output → {RAW_DIR}/")
    print(f"Report output → {REPORTS_DIR}/")
    print()

    # Run both in parallel
    p_compact = subprocess.Popen(compact_cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    p_md = subprocess.Popen(md_cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)

    # Wait for both and stream output
    print("=== Compact (raw sources) ===")
    out_compact, _ = p_compact.communicate()
    print(out_compact.decode("utf-8", errors="replace"))

    print("=== Full Report (md) ===")
    out_md, _ = p_md.communicate()
    print(out_md.decode("utf-8", errors="replace"))

    # Report results
    rc_compact = p_compact.returncode
    rc_md = p_md.returncode

    print("=== Results ===")
    print(f"Compact: {'OK' if rc_compact == 0 else f'FAILED (exit {rc_compact})'}")
    print(f"Report:  {'OK' if rc_md == 0 else f'FAILED (exit {rc_md})'}")

    # List output files
    for label, d in [("Raw", RAW_DIR), ("Reports", REPORTS_DIR)]:
        files = sorted(Path(d).glob("*.md"))
        if files:
            latest = max(files, key=lambda f: f.stat().st_mtime)
            print(f"{label}: {latest}")

    sys.exit(max(rc_compact, rc_md))


if __name__ == "__main__":
    main()
