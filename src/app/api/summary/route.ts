import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SUMMARIES_DIR = path.resolve(process.cwd(), "src", "data", "summaries");

export async function GET(req: NextRequest) {
  const docId = req.nextUrl.searchParams.get("id");
  if (!docId) {
    return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
  }

  const filePath = path.join(SUMMARIES_DIR, `${docId}.md`);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    return NextResponse.json({ ok: true, summary: content });
  }

  return NextResponse.json({ ok: true, summary: null });
}
