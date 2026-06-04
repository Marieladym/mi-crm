import { db } from "@/db";
import { pipelineStages, deals, contacts, pipelines } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { KanbanBoard } from "@/components/pipeline/KanbanBoard";
import { PipelineSwitcher } from "@/components/pipeline/PipelineSwitcher";
import type { PipelineColumn } from "@/types";

export const dynamic = "force-dynamic";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ pipeline?: string }>;
}) {
  const { pipeline: pipelineParam } = await searchParams;

  const allPipelines = db
    .select()
    .from(pipelines)
    .orderBy(asc(pipelines.createdAt))
    .all();

  // Pipeline seleccionado: el del parámetro, o el por defecto, o el primero
  const selected =
    allPipelines.find((p) => p.id === pipelineParam) ||
    allPipelines.find((p) => p.isDefault) ||
    allPipelines[0];

  const stages = db
    .select()
    .from(pipelineStages)
    .orderBy(asc(pipelineStages.order))
    .all()
    .filter((s) => !selected || s.pipelineId === selected.id);

  const allDeals = db
    .select({
      id: deals.id,
      title: deals.title,
      value: deals.value,
      stageId: deals.stageId,
      contactId: deals.contactId,
      expectedClose: deals.expectedClose,
      probability: deals.probability,
      notes: deals.notes,
      createdAt: deals.createdAt,
      updatedAt: deals.updatedAt,
      contactName: contacts.name,
      contactTemperature: contacts.temperature,
    })
    .from(deals)
    .leftJoin(contacts, eq(deals.contactId, contacts.id))
    .all();

  const columns: PipelineColumn[] = stages.map((stage) => ({
    ...stage,
    deals: allDeals
      .filter((d) => d.stageId === stage.id)
      .map((d) => ({
        id: d.id,
        title: d.title,
        value: d.value,
        stageId: d.stageId,
        contactId: d.contactId,
        expectedClose: d.expectedClose,
        probability: d.probability,
        notes: d.notes,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        contactName: d.contactName,
        contactTemperature: d.contactTemperature,
      })) as PipelineColumn["deals"],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-muted-foreground">
          Arrastra y suelta deals entre etapas
        </p>
      </div>

      <PipelineSwitcher
        pipelines={allPipelines.map((p) => ({ id: p.id, name: p.name }))}
        selectedId={selected?.id ?? null}
      />

      {columns.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Este pipeline no tiene etapas. Agrégalas en Personalizar.
        </p>
      ) : (
        <KanbanBoard initialColumns={columns} />
      )}
    </div>
  );
}
