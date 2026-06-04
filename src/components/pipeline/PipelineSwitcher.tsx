"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type Pipeline = { id: string; name: string };

export function PipelineSwitcher({
  pipelines,
  selectedId,
}: {
  pipelines: Pipeline[];
  selectedId: string | null;
}) {
  if (pipelines.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-2 border-b pb-3">
      {pipelines.map((p) => (
        <Link
          key={p.id}
          href={`/pipeline?pipeline=${p.id}`}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer",
            p.id === selectedId
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/70"
          )}
        >
          {p.name}
        </Link>
      ))}
    </div>
  );
}
