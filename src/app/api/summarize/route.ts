import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SUMMARIES_DIR = path.resolve(process.cwd(), "src", "data", "summaries");

function getDocuments() {
  const jsonPath = path.resolve(process.cwd(), "src", "data", "documents.json");
  return JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
}

function buildSourceContext(doc: Record<string, unknown>): string {
  const items = doc.items as Array<Record<string, unknown>>;
  const lines: string[] = [];

  lines.push(`# Research: ${doc.title}`);
  lines.push(`Date Range: ${doc.dateRange}`);
  lines.push(`Total items: ${items.length}`);
  lines.push("");

  for (const item of items) {
    const meta = item.metadata as Record<string, unknown>;
    const type = (item.type as string).toUpperCase();
    const score = item.score;

    if (item.type === "youtube") {
      lines.push(`[${type}] (score:${score}) "${item.title}" by ${meta.channel} — ${(meta.views as number || 0).toLocaleString()} views, ${(meta.likes as number || 0).toLocaleString()} likes`);
      if (meta.transcript) lines.push(`  Transcript excerpt: ${(meta.transcript as string).slice(0, 300)}`);
      lines.push(`  URL: ${item.url}`);
    } else if (item.type === "x") {
      lines.push(`[${type}] (score:${score}) ${item.author} — ${(meta.likes as number || 0)} likes, ${(meta.retweets as number || 0)} RTs`);
      lines.push(`  ${(item.text as string).slice(0, 200)}`);
      lines.push(`  URL: ${item.url}`);
    } else if (item.type === "reddit") {
      lines.push(`[${type}] (score:${score}) ${meta.subreddit ? `r/${meta.subreddit}` : item.author}`);
      if (item.title) lines.push(`  Title: ${item.title}`);
      if (item.text) lines.push(`  ${(item.text as string).slice(0, 200)}`);
      lines.push(`  URL: ${item.url}`);
    } else if (item.type === "hackernews") {
      lines.push(`[HN] (score:${score}) "${item.title}" — ${meta.points || 0} points, ${meta.comments || 0} comments`);
      const insights = meta.insights as string[] | undefined;
      if (insights?.length) {
        lines.push(`  Top insights: ${insights.slice(0, 2).join("; ")}`);
      }
      lines.push(`  URL: ${item.url}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  const { documentId } = (await req.json()) as { documentId: string };

  const documents = getDocuments();
  const doc = documents.find((d: Record<string, unknown>) => d.id === documentId);

  if (!doc) {
    return NextResponse.json({ ok: false, error: "Document not found" }, { status: 404 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "ANTHROPIC_API_KEY not set" }, { status: 500 });
  }

  const client = new Anthropic({ apiKey });
  const sourceContext = buildSourceContext(doc);

  const systemPrompt = `You are a senior research analyst producing an executive brief from social media and web research data. Your audience is an investor/researcher who wants actionable insights, not noise.

Rules:
- Ground every takeaway in specific sources from the data (cite @handles, r/subreddits, YouTube channels, HN)
- Include the source URL as a markdown link when referencing a specific post/video
- Distinguish signal from noise — many X posts are spam/bots, flag this but focus on genuine high-engagement content
- Be concise and direct — no filler
- Use the exact format specified below`;

  const userPrompt = `Analyze this research data and produce an executive brief:

${sourceContext}

---

Produce your analysis in this EXACT markdown format:

## Executive Summary
[2-3 sentences: what is the overall narrative? What's the dominant sentiment? What's driving discussion?]

## Key Takeaways
1. **[Takeaway title]** — [1-2 sentences with evidence]. [Source: [name](url)]
2. **[Takeaway title]** — [1-2 sentences]. [Source: [name](url)]
3. **[Takeaway title]** — [1-2 sentences]. [Source: [name](url)]
[Up to 5 takeaways, ordered by importance]

## What To Watch
- [Forward-looking point 1]
- [Forward-looking point 2]
- [Forward-looking point 3]

## Go Deeper
- [Specific follow-up research question that would be valuable]
- [Another angle worth investigating]
- [A comparison or deeper dive suggestion]`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullText = "";
      try {
        const response = await client.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        });

        for await (const event of response) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            const text = event.delta.text;
            fullText += text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(text)}\n\n`));
          }
        }

        // Cache the summary
        fs.mkdirSync(SUMMARIES_DIR, { recursive: true });
        fs.writeFileSync(path.join(SUMMARIES_DIR, `${documentId}.md`), fullText, "utf-8");

        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(`\n\nError: ${msg}`)}\n\n`));
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
