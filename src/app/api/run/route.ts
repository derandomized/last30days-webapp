import { spawn } from "child_process";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { topic, days, depth, xHandle } = body as {
    topic?: string;
    days?: number;
    depth?: string;
    xHandle?: string;
  };

  if (!topic || !topic.trim()) {
    return NextResponse.json({ ok: false, error: "Topic is required" }, { status: 400 });
  }

  const scriptPath = path.resolve(process.cwd(), "..", "scripts", "run-last30days.py");

  const args = ["python3", scriptPath, topic.trim()];
  if (depth === "quick") args.push("--quick");
  if (depth === "deep") args.push("--deep");
  if (days && days > 0) args.push(`--days=${days}`);
  if (xHandle && xHandle.trim()) args.push(`--x-handle=${xHandle.trim().replace(/^@/, "")}`);

  // Stream output via SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const proc = spawn(args[0], args.slice(1), {
        env: { ...process.env, PYTHONUNBUFFERED: "1" },
      });

      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      proc.stdout.on("data", (chunk: Buffer) => send(chunk.toString()));
      proc.stderr.on("data", (chunk: Buffer) => send(chunk.toString()));

      proc.on("close", (code) => {
        send(`\n[exit code: ${code}]`);
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      });

      proc.on("error", (err) => {
        send(`Error: ${err.message}`);
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      });
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
