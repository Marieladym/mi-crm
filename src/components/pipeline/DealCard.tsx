"use client";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency } from "@/lib/constants";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Maximize2 } from "lucide-react";
import type { Temperature } from "@/types";

interface DealCardProps {
  id: string;
  title: string;
  value: number;
  contactName: string | null;
  contactTemperature: string | null;
  probability: number;
  onOpen?: (id: string) => void;
}

export function DealCard({
  id,
  title,
  value,
  contactName,
  contactTemperature,
  probability,
  onOpen,
}: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-tight">{title}</p>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onOpen?.(id);
            }}
            className="shrink-0 p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            title="Abrir deal"
          >
            <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-primary">
            {formatCurrency(value)}
          </span>
          {contactTemperature && (
            <StatusBadge
              temperature={contactTemperature as Temperature}
              size="sm"
            />
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{contactName || "Sin contacto"}</span>
          <span>{probability}%</span>
        </div>
      </div>
    </Card>
  );
}
