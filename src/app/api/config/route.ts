import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { crmSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

const DEFAULT_CONFIG = {
  business: { type: "services", industry: "general", teamSize: "solo", name: "" },
  leadSources: [
    "website",
    "whatsapp",
    "referido",
    "redes_sociales",
    "llamada_fria",
    "email",
    "formulario",
    "facebook_lead",
    "evento",
    "otro",
  ],
  preferences: { language: "es" as "es" | "en" },
};

function readConfig() {
  const row = db
    .select()
    .from(crmSettings)
    .where(eq(crmSettings.key, "business_config"))
    .get();
  if (!row) return DEFAULT_CONFIG;
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(row.value) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function GET() {
  return NextResponse.json(readConfig());
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const current = readConfig();
  const merged = {
    business: { ...current.business, ...(body.business as object) },
    leadSources: Array.isArray(body.leadSources)
      ? body.leadSources
      : current.leadSources,
    preferences: { ...current.preferences, ...(body.preferences as object) },
  };

  db.insert(crmSettings)
    .values({ key: "business_config", value: JSON.stringify(merged) })
    .onConflictDoUpdate({
      target: crmSettings.key,
      set: { value: JSON.stringify(merged) },
    })
    .run();

  return NextResponse.json({ success: true, config: merged });
}
