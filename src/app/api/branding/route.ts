import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { crmSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

function read(key: string): string {
  const row = db.select().from(crmSettings).where(eq(crmSettings.key, key)).get();
  return row?.value || "";
}

export async function GET() {
  return NextResponse.json({
    name: read("crm_name") || "Auto-CRM",
    logo: read("crm_logo") || "",
  });
}

export async function POST(request: NextRequest) {
  let body: { name?: string; logo?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const set = (key: string, value: string) => {
    db.insert(crmSettings)
      .values({ key, value })
      .onConflictDoUpdate({ target: crmSettings.key, set: { value } })
      .run();
  };

  if (typeof body.name === "string") set("crm_name", body.name.slice(0, 60));
  if (typeof body.logo === "string") {
    // Limitar tamaño del logo (~500KB en base64)
    if (body.logo.length > 700_000) {
      return NextResponse.json(
        { error: "El logo es muy grande (máximo ~500KB)" },
        { status: 400 }
      );
    }
    set("crm_logo", body.logo);
  }

  return NextResponse.json({ success: true });
}
