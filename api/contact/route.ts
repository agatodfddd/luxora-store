import { NextResponse } from "next/server";
import { readMessages, writeMessages, ContactMessage } from "@/lib/messages";

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<ContactMessage>;
  if (!body.name || !body.email || !body.message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const items = readMessages();
  const msg: ContactMessage = {
    id: `m_${Math.random().toString(16).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
    name: body.name,
    email: body.email,
    subject: body.subject ?? "",
    message: body.message,
    status: "new",
  };
  items.unshift(msg);
  writeMessages(items);
  return NextResponse.json({ ok: true, message: msg });
}
