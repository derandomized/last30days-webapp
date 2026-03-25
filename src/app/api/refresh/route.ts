import { execSync } from "child_process";
import { NextResponse } from "next/server";
import path from "path";

export async function POST() {
  try {
    const scriptPath = path.resolve(process.cwd(), "..", "scripts", "parse-last30days.py");
    const output = execSync(`python3 "${scriptPath}"`, {
      timeout: 30000,
      encoding: "utf-8",
    });
    return NextResponse.json({ ok: true, output });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
