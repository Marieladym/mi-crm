import { db } from "@/db";
import { pipelines } from "@/db/schema";
import { asc } from "drizzle-orm";
import { PipelineExplorer } from "@/components/pipeline/PipelineExplorer";

export const dynamic = "force-dynamic";

export default function PipelinePage() {
  const allPipelines = db
    .select()
    .from(pipelines)
    .orderBy(asc(pipelines.createdAt))
    .all();

  const defaultId =
    allPipelines.find((p) => p.isDefault)?.id || allPipelines[0]?.id || null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-muted-foreground">
          Arrastra y suelta deals entre etapas
        </p>
      </div>

      <PipelineExplorer
        pipelines={allPipelines.map((p) => ({ id: p.id, name: p.name }))}
        defaultId={defaultId}
      />
    </div>
  );
}
