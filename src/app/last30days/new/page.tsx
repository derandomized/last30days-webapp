"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Depth = "default" | "quick" | "deep";

export default function NewRunPage() {
  const searchParams = useSearchParams();
  const [topic, setTopic] = useState("");
  const [days, setDays] = useState(30);

  // Pre-fill topic from query param (e.g., from "Go Deeper" links)
  useEffect(() => {
    const t = searchParams.get("topic");
    if (t) setTopic(t);
  }, [searchParams]);
  const [depth, setDepth] = useState<Depth>("default");
  const [xHandle, setXHandle] = useState("");
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [done, setDone] = useState(false);
  const outputRef = useRef<HTMLPreElement>(null);

  const handleRun = async () => {
    if (!topic.trim() || running) return;

    setRunning(true);
    setOutput("");
    setDone(false);

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          days: days !== 30 ? days : undefined,
          depth: depth !== "default" ? depth : undefined,
          xHandle: xHandle.trim() || undefined,
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        setOutput("Failed to start stream");
        setRunning(false);
        return;
      }

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              setDone(true);
              setRunning(false);
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              setOutput((prev) => prev + parsed);
              // Auto-scroll
              if (outputRef.current) {
                outputRef.current.scrollTop = outputRef.current.scrollHeight;
              }
            } catch {
              // skip malformed lines
            }
          }
        }
      }
    } catch (err) {
      setOutput((prev) => prev + "\nError: Failed to connect");
      setRunning(false);
    }
  };

  const handleRefreshAndBack = async () => {
    await fetch("/api/refresh", { method: "POST" });
    window.location.href = "/last30days";
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <Link
        href="/last30days"
        className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 mb-6"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      <h1 className="text-xl font-bold text-zinc-100 mb-6">New Research Run</h1>

      {/* Form */}
      <div className="space-y-4 mb-6">
        {/* Topic */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Topic
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRun()}
            placeholder='e.g. "NVDA stock", "best AI tools", "React vs Svelte"'
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 text-sm"
            disabled={running}
            autoFocus
          />
        </div>

        {/* Days + Depth row */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Days back
            </label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 30))}
              min={1}
              max={90}
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-zinc-500 text-sm"
              disabled={running}
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Depth
            </label>
            <div className="flex gap-1.5">
              {(["quick", "default", "deep"] as Depth[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDepth(d)}
                  disabled={running}
                  className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    depth === d
                      ? "bg-zinc-100 text-black"
                      : "bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {d === "default" ? "Normal" : d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* X Handle */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            X Handle <span className="text-zinc-600">(optional)</span>
          </label>
          <input
            type="text"
            value={xHandle}
            onChange={(e) => setXHandle(e.target.value)}
            placeholder="@handle — search this account's posts directly"
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 text-sm"
            disabled={running}
          />
        </div>

        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={running || !topic.trim()}
          className="w-full py-3 rounded-lg font-medium text-sm transition-colors bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {running ? "Running..." : "Run Research"}
        </button>
      </div>

      {/* Output */}
      {output && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-400">Output</span>
            {done && (
              <button
                onClick={handleRefreshAndBack}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors"
              >
                Refresh &amp; View Results
              </button>
            )}
          </div>
          <pre
            ref={outputRef}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-400 font-mono overflow-auto max-h-96 whitespace-pre-wrap"
          >
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
