"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DealForm } from "./DealForm";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Stage = {
  id: string;
  name: string;
  color: string;
  order: number;
  isWon: boolean;
  isLost: boolean;
};

type Deal = {
  id: string;
  title: string;
  value: number;
  stageId: string;
  contactId: string;
  probability: number;
  expectedClose: number | Date | null;
  notes: string | null;
};

interface DealManagerProps {
  deal: Deal;
  stages: Stage[];
}

// Probabilidad sugerida automáticamente según la etapa
function autoProbability(stage: Stage, stages: Stage[]): number {
  if (stage.isWon) return 100;
  if (stage.isLost) return 0;
  const openStages = stages.filter((s) => !s.isWon && !s.isLost);
  const idx = openStages.findIndex((s) => s.id === stage.id);
  if (idx === -1 || openStages.length === 0) return 50;
  // Reparte la probabilidad a lo largo de las etapas abiertas: 20%, 40%, 60%...
  return Math.round(((idx + 1) / (openStages.length + 1)) * 100);
}

export function DealManager({ deal, stages }: DealManagerProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [showEdit, setShowEdit] = useState(false);

  const currentStage = stages.find((s) => s.id === deal.stageId);

  // Cambia la etapa con un clic: actualiza estado, probabilidad y registra nota
  const changeStage = async (stage: Stage) => {
    if (busy || stage.id === deal.stageId) return;
    setBusy(true);
    try {
      const prob = autoProbability(stage, stages);
      const res = await fetch(`/api/deals/${deal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: stage.id, probability: prob }),
      });
      if (!res.ok) throw new Error();

      // Registrar actividad automática del cambio de etapa
      const desc =
        `Movido a "${stage.name}"` +
        (note.trim() ? ` — ${note.trim()}` : "");
      await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: stage.isWon ? "note" : stage.isLost ? "note" : "follow_up",
          description: desc,
          contactId: deal.contactId,
          dealId: deal.id,
        }),
      });

      toast.success(`Deal movido a "${stage.name}" (${prob}%)`);
      setNote("");
      router.refresh();
    } catch {
      toast.error("Error al cambiar la etapa");
    } finally {
      setBusy(false);
    }
  };

  // Agrega una nota suelta (sin cambiar etapa)
  const addNote = async () => {
    if (!note.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "note",
          description: note.trim(),
          contactId: deal.contactId,
          dealId: deal.id,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Nota agregada");
      setNote("");
      router.refresh();
    } catch {
      toast.error("Error al agregar la nota");
    } finally {
      setBusy(false);
    }
  };

  const deleteDeal = async () => {
    if (!confirm("¿Eliminar este deal? No se puede deshacer.")) return;
    try {
      const res = await fetch(`/api/deals/${deal.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Deal eliminado");
      router.push("/deals");
    } catch {
      toast.error("Error al eliminar");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Gestionar deal</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)} className="cursor-pointer">
            <Pencil className="h-4 w-4 mr-1" /> Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={deleteDeal}
            className="cursor-pointer text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cambio rápido de etapa */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Mover a etapa (un clic)
          </p>
          <div className="flex flex-wrap gap-2">
            {stages.map((stage) => {
              const isCurrent = stage.id === deal.stageId;
              return (
                <button
                  key={stage.id}
                  onClick={() => changeStage(stage)}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all cursor-pointer disabled:opacity-50 hover:shadow-sm"
                  style={{
                    borderColor: stage.color,
                    backgroundColor: isCurrent ? stage.color : "transparent",
                    color: isCurrent ? "white" : stage.color,
                  }}
                >
                  {isCurrent && <Check className="h-3.5 w-3.5" />}
                  {stage.name}
                </button>
              );
            })}
          </div>
          {currentStage && (
            <p className="text-xs text-muted-foreground mt-2">
              Etapa actual: <strong>{currentStage.name}</strong> · Probabilidad{" "}
              {deal.probability}%
            </p>
          )}
        </div>

        {/* Nota de qué pasó */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            ¿Qué pasó con este cliente?
          </p>
          <Textarea
            placeholder="Ej: Habló con el cliente, pidió descuento del 10%..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1">
            La nota se guarda al mover de etapa, o pulsa &quot;Agregar nota&quot;.
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={addNote}
            disabled={busy || !note.trim()}
            className="cursor-pointer mt-2"
          >
            <Plus className="h-4 w-4 mr-1" /> Agregar nota
          </Button>
        </div>
      </CardContent>

      <DealForm
        open={showEdit}
        onClose={() => {
          setShowEdit(false);
          router.refresh();
        }}
        initialData={{
          id: deal.id,
          title: deal.title,
          value: deal.value,
          stageId: deal.stageId,
          contactId: deal.contactId,
          probability: deal.probability,
          expectedClose: deal.expectedClose
            ? new Date(deal.expectedClose).toISOString().split("T")[0]
            : "",
          notes: deal.notes || "",
        }}
      />
    </Card>
  );
}
