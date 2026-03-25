#!/usr/bin/env python3
"""Parse Last30Days raw markdown files into JSON for the webapp."""

import json
import os
import re
import sys
from pathlib import Path

RAW_DIR = os.path.expanduser("~/Documents/Last30Days")
REPORTS_DIR = os.path.expanduser("~/Documents/Last30Days/reports")
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_PATH = os.path.join(SCRIPT_DIR, "..", "src", "data", "documents.json")


def parse_document(filepath):
    content = Path(filepath).read_text(encoding="utf-8")
    lines = content.split("\n")
    filename = os.path.basename(filepath)
    doc_id = filename.replace(".md", "")

    # Header
    title_m = re.search(r"^## Research Results:\s*(.+)$", content, re.MULTILINE)
    title = title_m.group(1).strip() if title_m else doc_id

    date_m = re.search(r"\*\*Date Range:\*\*\s*(.+)$", content, re.MULTILINE)
    date_range = date_m.group(1).strip() if date_m else ""

    mode_m = re.search(r"\*\*Mode:\*\*\s*(.+)$", content, re.MULTILINE)
    mode = mode_m.group(1).strip() if mode_m else None

    items = []
    current_section = None
    i = 0

    while i < len(lines):
        line = lines[i]

        if line.startswith("### Reddit Threads"):
            current_section = "reddit"
            i += 1
            continue
        if line.startswith("### X Posts"):
            current_section = "x"
            i += 1
            continue
        if line.startswith("### YouTube Videos"):
            current_section = "youtube"
            i += 1
            continue
        if line.startswith("### Hacker News"):
            current_section = "hackernews"
            i += 1
            continue
        if line.startswith("---"):
            current_section = None
            i += 1
            continue

        if current_section and line.startswith("**"):
            result = parse_item(lines, i, current_section)
            if result:
                items.append(result["item"])
                i = result["next_index"]
                continue

        i += 1

    # Count sources
    source_counts = {}
    for item in items:
        t = item["type"]
        source_counts[t] = source_counts.get(t, 0) + 1

    # Sort by score descending
    items.sort(key=lambda x: x["score"], reverse=True)

    return {
        "id": doc_id,
        "title": title,
        "dateRange": date_range,
        "filename": filename,
        "mode": mode,
        "items": items,
        "sourceCounts": source_counts,
    }


def parse_item(lines, start, item_type):
    if item_type == "reddit":
        return parse_reddit(lines, start)
    if item_type == "x":
        return parse_x(lines, start)
    if item_type == "youtube":
        return parse_youtube(lines, start)
    if item_type == "hackernews":
        return parse_hn(lines, start)
    return None


def _collect_body(lines, start):
    """Collect lines after a header until the next item/section."""
    i = start + 1
    body_lines = []
    while i < len(lines):
        line = lines[i]
        if line.startswith("**") or line.startswith("###") or line.startswith("---"):
            break
        body_lines.append(line.strip())
        i += 1
    return body_lines, i


def parse_reddit(lines, start):
    header = lines[start]
    m = re.match(r"\*\*(\w+)\*\*\s*\(score:(\d+)\)\s*r/(\S+)\s*\(([^)]+)\)", header)
    if not m:
        return None
    item_id, score, subreddit, date = m.group(1), int(m.group(2)), m.group(3), m.group(4)

    body, next_i = _collect_body(lines, start)
    url = ""
    text_lines = []
    for line in body:
        if line.startswith("https://www.reddit.com"):
            url = line
        elif line and line != "**" and not line.startswith("*Reddit:"):
            text_lines.append(line)

    title_line = next((l for l in text_lines if l and not l.startswith("*")), "")
    summary = next((l.strip("*") for l in text_lines if l.startswith("*") and l.endswith("*")), "")

    return {
        "item": {
            "type": "reddit",
            "id": item_id,
            "score": score,
            "author": f"r/{subreddit}",
            "date": date,
            "title": title_line,
            "text": summary,
            "url": url,
            "metadata": {"subreddit": subreddit, "redditScore": score},
        },
        "next_index": next_i,
    }


def parse_x(lines, start):
    header = lines[start]
    m = re.match(r"\*\*(\w+)\*\*\s*\(score:(\d+)\)\s*@(\S+)\s*\(([^)]+)\)\s*(?:\[([^\]]*)\])?", header)
    if not m:
        return None
    item_id, score, handle, date = m.group(1), int(m.group(2)), m.group(3), m.group(4)
    engagement = m.group(5) or ""

    likes = 0
    retweets = 0
    likes_m = re.search(r"(\d+)likes", engagement)
    rt_m = re.search(r"(\d+)rt", engagement)
    if likes_m:
        likes = int(likes_m.group(1))
    if rt_m:
        retweets = int(rt_m.group(1))

    body, next_i = _collect_body(lines, start)
    url = ""
    text_lines = []
    for line in body:
        if line.startswith("https://x.com"):
            url = line
        elif line and line != "**":
            text_lines.append(line)

    return {
        "item": {
            "type": "x",
            "id": item_id,
            "score": score,
            "author": f"@{handle}",
            "date": date,
            "title": "",
            "text": " ".join(text_lines).strip(),
            "url": url,
            "metadata": {"likes": likes, "retweets": retweets},
        },
        "next_index": next_i,
    }


def parse_youtube(lines, start):
    header = lines[start]
    m = re.match(
        r"\*\*([A-Za-z0-9_-]+)\*\*\s*\(score:(\d+)\)\s*(.+?)\s*\((\d{4}-\d{2}-\d{2})\)\s*\[([^\]]*)\]",
        header,
    )
    if not m:
        return None
    video_id, score, channel, date, stats = m.group(1), int(m.group(2)), m.group(3), m.group(4), m.group(5)

    views = 0
    likes = 0
    views_m = re.search(r"([\d,]+)\s*views", stats)
    likes_m = re.search(r"([\d,]+)\s*likes", stats)
    if views_m:
        views = int(views_m.group(1).replace(",", ""))
    if likes_m:
        likes = int(likes_m.group(1).replace(",", ""))

    body, next_i = _collect_body(lines, start)
    title = ""
    url = ""
    transcript = ""
    for line in body:
        if line.startswith("https://www.youtube.com"):
            url = line
        elif line.startswith("Transcript:"):
            transcript = line[len("Transcript: "):]
        elif line.startswith("*YouTube:"):
            pass  # summary line, skip
        elif line and not title:
            title = line

    return {
        "item": {
            "type": "youtube",
            "id": video_id,
            "score": score,
            "author": channel,
            "date": date,
            "title": title,
            "text": title,
            "url": url,
            "metadata": {
                "channel": channel,
                "videoId": video_id,
                "views": views,
                "likes": likes,
                "thumbnailUrl": f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg",
                **({"transcript": transcript} if transcript else {}),
            },
        },
        "next_index": next_i,
    }


def parse_hn(lines, start):
    header = lines[start]
    m = re.match(r"\*\*(\w+)\*\*\s*\(score:(\d+)\)\s*hn/(\S+)\s*\(([^)]+)\)\s*\[([^\]]*)\]", header)
    if not m:
        return None
    item_id, score, hn_user, date, stats = m.group(1), int(m.group(2)), m.group(3), m.group(4), m.group(5)

    points = 0
    comments = 0
    pts_m = re.search(r"([\d,]+)pts", stats)
    cmt_m = re.search(r"([\d,]+)cmt", stats)
    if pts_m:
        points = int(pts_m.group(1).replace(",", ""))
    if cmt_m:
        comments = int(cmt_m.group(1).replace(",", ""))

    body, next_i = _collect_body(lines, start)
    title = ""
    url = ""
    insights = []
    for line in body:
        if line.startswith("https://news.ycombinator.com"):
            url = line
        elif line.startswith("*HN story about"):
            pass
        elif line.startswith("- "):
            insights.append(line[2:])
        elif line == "Insights:":
            pass
        elif line and not title:
            title = line

    return {
        "item": {
            "type": "hackernews",
            "id": item_id,
            "score": score,
            "author": f"hn/{hn_user}",
            "date": date,
            "title": title,
            "text": title,
            "url": url,
            "metadata": {
                "points": points,
                "comments": comments,
                "hnUser": hn_user,
                **({"insights": insights} if insights else {}),
            },
        },
        "next_index": next_i,
    }


def main():
    if not os.path.isdir(RAW_DIR):
        print(f"Source directory not found: {RAW_DIR}")
        sys.exit(1)

    # Parse raw files
    raw_files = sorted(Path(RAW_DIR).glob("*.md"))
    print(f"Found {len(raw_files)} markdown files in {RAW_DIR}")

    documents = []
    for fp in raw_files:
        print(f"Parsing: {fp.name}")
        doc = parse_document(str(fp))
        counts = ", ".join(f"{v} {k}" for k, v in doc["sourceCounts"].items())
        print(f"  → {doc['title']}: {len(doc['items'])} items ({counts})")
        documents.append(doc)

    # Match reports
    reports_dir = Path(REPORTS_DIR)
    if reports_dir.is_dir():
        report_files = {f.name: f for f in reports_dir.glob("*.md")}
        matched = 0
        for doc in documents:
            if doc["filename"] in report_files:
                report_content = report_files[doc["filename"]].read_text(encoding="utf-8")
                doc["report"] = report_content
                matched += 1
        print(f"\nMatched {matched} full reports from {REPORTS_DIR}")
    else:
        print(f"\nNo reports directory found at {REPORTS_DIR}")

    # Match cached summaries
    summaries_dir = Path(os.path.join(SCRIPT_DIR, "..", "src", "data", "summaries"))
    if summaries_dir.is_dir():
        summary_matched = 0
        for doc in documents:
            summary_path = summaries_dir / f"{doc['id']}.md"
            if summary_path.is_file():
                doc["summary"] = summary_path.read_text(encoding="utf-8")
                summary_matched += 1
        if summary_matched:
            print(f"Matched {summary_matched} cached summaries from {summaries_dir}")

    # Sort by title
    documents.sort(key=lambda d: d["title"])

    # Write output
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(documents, f, indent=2, ensure_ascii=False)

    print(f"\nWritten {len(documents)} documents to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
