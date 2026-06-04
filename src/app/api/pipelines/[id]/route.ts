import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pipelines, pipelineStages, deals } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

// PUT: renombrar pipeline
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const existing = db.select().from(pipelines).where(eq(pipelines.id, id)).get();
  if (!existing) {
    return NextResponse.json({ error: "Pipeline no encontrado" }, { status: 404 });
  }

  const result = db
    .update(pipelines)
    .set({ name: (body.name || existing.name).trim() })
    .where(eq(pipelines.id, id))
    .returning()
    .get();

  return NextResponse.json(result);
}

// DELETE: eliminar pipeline (no el principal, y solo si no tiene deals)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = db.select().from(pipelines).where(eq(pipelines.id, id)).get();
  if (!existing) {
    return NextResponse.json({ error: "Pipeline no encontrado" }, { status: 404 });
  }
  if (existing.isDefault) {
    return NextResponse.json(
      { error: "No se puede eliminar el pipeline principal" },
      { status: 400 }
    );
  }

  // Verificar que no haya deals en las etapas de este pipeline
  const stages = db
    .select()
    .from(pipelineStages)
    .where(eq(pipelineStages.pipelineId, id))
    .all();
  const stageIds = stages.map((s) => s.id);
  if (stageIds.length > 0) {
    const dealsHere = db
      .select()
      .from(deals)
      .where(inArray(deals.stageId, stageIds))
      .all();
    if (dealsHere.length > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar: hay ${dealsHere.length} deal(s) en este pipeline.`,
        },
        { status: 400 }
      );
    }
  }

  db.delete(pipelineStages).where(eq(pipelineStages.pipelineId, id)).run();
  db.delete(pipelines).where(eq(pipelines.id, id)).run();
  return NextResponse.json({ success: true });
}
