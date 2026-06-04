import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pipelines, pipelineStages } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

// GET: listar todos los pipelines
export async function GET() {
  const list = db.select().from(pipelines).orderBy(asc(pipelines.createdAt)).all();
  return NextResponse.json(list);
}

// POST: crear un pipeline nuevo con etapas por defecto
export async function POST(request: NextRequest) {
  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
  }

  const pipeline = db
    .insert(pipelines)
    .values({ name: body.name.trim(), isDefault: false, createdAt: new Date() })
    .returning()
    .get();

  // Etapas por defecto para el nuevo pipeline
  const defaultStages = [
    { name: "Prospecto", order: 1, color: "#64748b", isWon: false, isLost: false },
    { name: "Contactado", order: 2, color: "#2563eb", isWon: false, isLost: false },
    { name: "Propuesta", order: 3, color: "#8b5cf6", isWon: false, isLost: false },
    { name: "Negociacion", order: 4, color: "#ea580c", isWon: false, isLost: false },
    { name: "Cerrado Ganado", order: 5, color: "#16a34a", isWon: true, isLost: false },
    { name: "Cerrado Perdido", order: 6, color: "#dc2626", isWon: false, isLost: true },
  ];
  for (const s of defaultStages) {
    db.insert(pipelineStages).values({ ...s, pipelineId: pipeline.id }).run();
  }

  return NextResponse.json(pipeline, { status: 201 });
}
