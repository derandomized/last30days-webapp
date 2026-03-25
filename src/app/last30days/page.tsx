"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import documents from "@/data/documents.json";

const sourceIcons: Record<string, string> = {
  reddit: "Reddit",
  x: "X",
  youtube: "YouTube",
  hackernews: "HN",
};

const sourceColors: Record<string, string> = {
  reddit: "text-orange-400",
  x: "text-zinc-300",
  youtube: "text-red-400",
  hackernews: "text-orange-500",
};

function getEndDate(dateRange: string): Date | null {
  // "2026-02-22 to 2026-03-24" → parse the end date
  const m = dateRange.match(/(\d{4}-\d{2}-\d{2})$/);
  return m ? new Date(m[1] + "T00:00:00") : null;
}

function daysAgo(date: Date, now: Date): number {
  const diff = now.getTime() - date.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function formatDaysAgo(n: number): string {
  if (n === 0) return "today";
  if (n === 1) return "1 day ago";
  return `${n} days ago`;
}

export default function Last30DaysPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  // Compute "now" only on the client to avoid hydration mismatch
  useEffect(() => setNow(new Date()), []);

  const sortedDocs = useMemo(() => {
    return [...documents].sort((a, b) => {
      const dateA = getEndDate(a.dateRange);
      const dateB = getEndDate(b.dateRange);
      if (!dateA || !dateB) return 0;
      return dateB.getTime() - dateA.getTime();
    });
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setStatus(null);
    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setStatus("Refreshed — reloading...");
        setTimeout(() => window.location.reload(), 500);
      } else {
        setStatus(`Error: ${data.error}`);
      }
    } catch {
      setStatus("Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold text-zinc-100">Last30Days</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/last30days/new"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New
          </Link>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors disabled:opacity-50"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={refreshing ? "animate-spin" : ""}
            >
              <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m0 0a9 9 0 0 1 9-9m-9 9a9 9 0 0 0 9 9" />
            </svg>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>
      <p className="text-sm text-zinc-500 mb-6">
        Research documents
        {status && <span className="ml-2 text-xs text-blue-400">{status}</span>}
      </p>

      <div className="space-y-2">
        {sortedDocs.map((doc) => {
          const endDate = getEndDate(doc.dateRange);
          const age = endDate && now ? daysAgo(endDate, now) : null;

          return (
            <Link
              key={doc.id}
              href={`/last30days/${doc.id}`}
              className="block border border-zinc-800 rounded-xl p-4 hover:bg-zinc-900/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-zinc-100 mb-1">
                    {doc.title}
                  </h2>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-zinc-500">{doc.dateRange}</span>
                    {age !== null && (
                      <span className="text-xs text-zinc-600">
                        &middot; ran {formatDaysAgo(age)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {Object.entries(doc.sourceCounts).map(([source, count]) => (
                      <span
                        key={source}
                        className={`text-xs ${sourceColors[source] || "text-zinc-400"}`}
                      >
                        {count} {sourceIcons[source] || source}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-sm font-mono text-zinc-600">
                  {doc.items.length}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
