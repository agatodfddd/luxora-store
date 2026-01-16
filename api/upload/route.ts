import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import path from "node:path";
import fs from "node:fs/promises";

export const runtime = "nodejs";

function requireAdmin() {
  return cookies().get("luxora_admin")?.value === "1";
}

export async function POST(req: Request) {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  // @ts-expect-error - file is Blob in runtime
  const blob: Blob = file;
  const buf = Buffer.from(await blob.arrayBuffer());

  const ext = (blob.type?.split("/")[1] || "png").replace(/[^a-z0-9]/gi, "").slice(0, 8) || "png";
  const name = `lux_${Date.now()}_${Math.random().toString(16).slice(2, 8)}.${ext}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, name), buf);

  return NextResponse.json({ url: `/uploads/${name}` });
}
