"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Markdown from "react-markdown";
import documents from "@/data/documents.json";
import TweetCard from "@/components/TweetCard";
import YouTubeCard from "@/components/YouTubeCard";
import RedditCard from "@/components/RedditCard";
import HNCard from "@/components/HNCard";

type FilterType = "all" | "reddit" | "x" | "youtube" | "hackernews" | "summary";

const filters: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "reddit", label: "Reddit" },
  { key: "x", label: "X" },
  { key: "youtube", label: "YouTube" },
  { key: "hackernews", label: "HN" },
];

export default function DocumentDetailPage() {
  const params = useParams();
  const [filter, setFilter] = useState<FilterType>("all");
  const [summary, setSummary] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  const doc = documents.find((d) => d.id === params.id) as
    | (typeof documents[number] & { summary?: string })
    | undefined;

  // Load cached summary on mount — check API (reads from disk) for freshest data
  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/summary?id=${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.summary) setSummary(data.summary);
      })
      .catch(() => {});
  }, [params.id]);

  if (!doc) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-zinc-400">Document not found.</p>
        <Link href="/last30days" className="text-blue-400 text-sm hover:underline mt-2 inline-block">
          Back to list
        </Link>
      </div>
    );
  }

  const filteredItems = filter === "all" || filter === "summary"
    ? doc.items
    : doc.items.filter((item) => item.type === filter);

  const availableTypes = new Set(doc.items.map((item) => item.type));
  const visibleFilters = filters.filter(
    (f) => f.key === "all" || availableTypes.has(f.key)
  );

  const generateSummary = async () => {
    setGenerating(true);
    setSummary("");

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        for (const line of text.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              fullText += JSON.parse(data);
              setSummary(fullText);
              if (summaryRef.current) {
                summaryRef.current.scrollTop = summaryRef.current.scrollHeight;
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      setSummary("Error generating summary. Is ANTHROPIC_API_KEY set?");
    } finally {
      setGenerating(false);
    }
  };

  // Extract "Go Deeper" items from summary for actionable links
  const goDeeper: string[] = [];
  if (summary) {
    const goSection = summary.split("## Go Deeper")[1];
    if (goSection) {
      const lines = goSection.split("\n").filter((l) => l.trim().startsWith("- "));
      for (const line of lines) {
        goDeeper.push(line.replace(/^-\s*/, "").trim());
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/last30days"
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 mb-3"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <h1 className="text-xl font-bold text-zinc-100">{doc.title}</h1>
        <p className="text-sm text-zinc-500 mt-1">{doc.dateRange}</p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {/* Summary pill first */}
        <button
          onClick={() => setFilter("summary")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
            filter === "summary"
              ? "bg-purple-500 text-white"
              : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
          }`}
        >
          Summary
        </button>

        {visibleFilters.map((f) => {
          const count = f.key === "all" ? doc.items.length : doc.items.filter((item) => item.type === f.key).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                filter === f.key
                  ? "bg-zinc-100 text-black"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
              }`}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Summary view */}
      {filter === "summary" && (
        <div className="mb-6">
          {!summary && !generating && (
            <div className="text-center py-12">
              <p className="text-zinc-400 mb-4">Generate an AI-powered executive summary of this research.</p>
              <button
                onClick={generateSummary}
                className="px-5 py-2.5 rounded-lg font-medium text-sm bg-purple-600 text-white hover:bg-purple-500 transition-colors"
              >
                Generate Summary
              </button>
            </div>
          )}

          {(summary || generating) && (
            <div ref={summaryRef}>
              {generating && (
                <div className="flex items-center gap-2 mb-4 text-xs text-purple-400">
                  <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  Analyzing sources...
                </div>
              )}

              <div className="prose prose-invert prose-sm max-w-none prose-headings:text-zinc-100 prose-p:text-zinc-300 prose-a:text-blue-400 prose-a:underline prose-strong:text-zinc-200 prose-li:text-zinc-300 prose-code:text-zinc-300 prose-code:bg-zinc-800 prose-code:px-1 prose-code:rounded">
                <Markdown
                  components={{
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {summary || ""}
                </Markdown>
              </div>

              {/* Go Deeper actions */}
              {!generating && goDeeper.length > 0 && (
                <div className="mt-6 pt-4 border-t border-zinc-800">
                  <p className="text-xs font-medium text-zinc-500 mb-3">Quick follow-ups:</p>
                  <div className="flex flex-wrap gap-2">
                    {goDeeper.map((q, i) => (
                      <Link
                        key={i}
                        href={`/last30days/new?topic=${encodeURIComponent(q)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        {q.length > 60 ? q.slice(0, 60) + "..." : q}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Regenerate button */}
              {!generating && summary && (
                <div className="mt-4">
                  <button
                    onClick={generateSummary}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Regenerate summary
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Source cards view */}
      {filter !== "summary" && (
        <div className="space-y-3">
          {filteredItems.map((item, idx) => {
            if (item.type === "x") {
              return (
                <TweetCard
                  key={`${item.type}-${item.id}-${idx}`}
                  author={item.author}
                  date={item.date}
                  text={item.text}
                  url={item.url}
                  score={item.score}
                  likes={item.metadata.likes || 0}
                  retweets={item.metadata.retweets || 0}
                />
              );
            }
            if (item.type === "youtube") {
              return (
                <YouTubeCard
                  key={`${item.type}-${item.id}-${idx}`}
                  title={item.title}
                  channel={item.metadata.channel || item.author}
                  date={item.date}
                  url={item.url}
                  score={item.score}
                  views={item.metadata.views || 0}
                  likes={item.metadata.likes || 0}
                  thumbnailUrl={item.metadata.thumbnailUrl || ""}
                />
              );
            }
            if (item.type === "reddit") {
              return (
                <RedditCard
                  key={`${item.type}-${item.id}-${idx}`}
                  author={item.author}
                  date={item.date}
                  title={item.title}
                  text={item.text}
                  url={item.url}
                  score={item.score}
                  subreddit={item.metadata.subreddit}
                />
              );
            }
            if (item.type === "hackernews") {
              return (
                <HNCard
                  key={`${item.type}-${item.id}-${idx}`}
                  author={item.author}
                  date={item.date}
                  title={item.title}
                  text={item.text}
                  url={item.url}
                  score={item.score}
                  points={item.metadata.points}
                  comments={item.metadata.comments}
                  insights={item.metadata.insights}
                />
              );
            }
            return null;
          })}
        </div>
      )}

      {filter !== "summary" && filteredItems.length === 0 && (
        <p className="text-center text-zinc-500 py-12">No items for this filter.</p>
      )}
    </div>
  );
}
