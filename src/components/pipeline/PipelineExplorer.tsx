"use client";

import { useEffect, useState, useCallback } from "react";
import { KanbanBoard } from "./KanbanBoard";
import { cn } from "@/lib/utils";
import type { PipelineColumn } from "@/types";

type Pipeline = { id: string; name: string };

export function PipelineExplorer({
  pipelines,
  defaultId,
}: {
  pipelines: Pipeline[];
  defaultId: string | null;
}) {
  const [selected, setSelected] = useState<string | null>(defaultId);
  const [columns, setColumns] = useState<PipelineColumn[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const loadCounts = useCallback(async () => {
    // Trae todas las etapas con deals para contar por pipeline
    const all = await fetch("/api/pipeline").then((r) => r.json());
    const map: Record<string, number> = {};
    for (const stage of all) {
      const pid = stage.pipelineId;
      if (pid) map[pid] = (map[pid] || 0) + (stage.deals?.length || 0);
    }
    setCounts(map);
  }, []);

  const loadColumns = useCallback(async (pipelineId: string | null) => {
    setLoading(true);
    const url = pipelineId
      ? `/api/pipeline?pipelineId=${pipelineId}`
      : "/api/pipeline";
    const data = await fetch(url).then((r) => r.json());
    setColumns(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    loadColumns(selected);
  }, [selected, loadColumns]);

  return (
    <div className="space-y-4">
      {pipelines.length > 1 && (
        <div className="flex flex-wrap gap-2 border-b pb-3">
          {pipelines.map((p) => {
            const active = p.id === selected;
            const count = counts[p.id] || 0;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                )}
              >
                {p.name}
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-full px-1.5 min-w-5 h-5 text-xs",
                    active ? "bg-primary-foreground/20" : "bg-background",
                    count > 0 && !active ? "text-foreground font-semibold" : ""
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {loading || columns === null ? (
        <p className="text-sm text-muted-foreground">Cargando pipeline...</p>
      ) : columns.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Este pipeline no tiene etapas. Agrégalas en Personalizar.
        </p>
      ) : (
        <KanbanBoard key={selected ?? "all"} initialColumns={columns} />
      )}
    </div>
  );
}
