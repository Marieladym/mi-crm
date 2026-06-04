"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check, Plus, Pencil, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/constants";
import { toast } from "sonner";
import Link from "next/link";

type Stage = { id: string; name: string; color: string; order: number; isWon: boolean; isLost: boolean; pipelineId: string | null };
type Deal = { id: string; title: string; value: number; stageId: string; contactId: string; probability: number; notes: string | null };
type Activity = { id: string; type: string; description: string; createdAt: number | string };

function autoProbability(stage: Stage, stages: Stage[]): number {
  if (stage.isWon) return 100;
  if (stage.isLost) return 0;
  const open = stages.filter((s) => !s.isWon && !s.isLost);
  const idx = open.findIndex((s) => s.id === stage.id);
  if (idx === -1 || open.length === 0) return 50;
  return Math.round(((idx + 1) / (open.length + 1)) * 100);
}

export function DealModal({
  dealId,
  open,
  onClose,
}: {
  dealId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [contactName, setContactName] = useState("");
  const [note, setNote] = useState("");
  const [editingValue, setEditingValue] = useState(false);
  const [valueInput, setValueInput] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!dealId) return;
    const d = await fetch(`/api/deals/${dealId}`).then((r) => r.json());
    setDeal(d);
    setValueInput((d.value / 100).toString());
    const all = await fetch("/api/pipeline").then((r) => r.json());
    const st: Stage[] = all.map((s: Stage & { deals?: unknown }) => ({ id: s.id, name: s.name, color: s.color, order: s.order, isWon: s.isWon, isLost: s.isLost, pipelineId: s.pipelineId }));
    setStages(st);
    const stage = st.find((s) => s.id === d.stageId);
    if (stage?.pipelineId) {
      setStages(st.filter((s) => s.pipelineId === stage.pipelineId));
    }
    const c = await fetch(`/api/contacts/${d.contactId}`).then((r) => r.json());
    setContactName(c.name || "");
    setActivities(c.activities?.filter((a: Activity & { dealId?: string }) => true) || []);
  }, [dealId]);

  useEffect(() => {
    if (open && dealId) load();
  }, [open, dealId, load]);

  const refresh = () => {
    load();
    router.refresh();
  };

  const changeStage = async (stage: Stage) => {
    if (!deal || busy || stage.id === deal.stageId) return;
    setBusy(true);
    try {
      const prob = autoProbability(stage, stages);
      await fetch(`/api/deals/${deal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: stage.id, probability: prob }),
      });
      await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "follow_up",
          description: `Movido a "${stage.name}"` + (note.trim() ? ` — ${note.trim()}` : ""),
          contactId: deal.contactId,
          dealId: deal.id,
        }),
      });
      toast.success(`Movido a "${stage.name}" (${prob}%)`);
      setNote("");
      refresh();
    } catch {
      toast.error("Error al cambiar etapa");
    } finally {
      setBusy(false);
    }
  };

  const saveValue = async () => {
    if (!deal) return;
    const cents = Math.round(parseFloat(valueInput || "0") * 100);
    await fetch(`/api/deals/${deal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: cents }),
    });
    setEditingValue(false);
    toast.success("Valor actualizado");
    refresh();
  };

  const addNote = async () => {
    if (!deal || !note.trim()) return;
    await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "note", description: note.trim(), contactId: deal.contactId, dealId: deal.id }),
    });
    setNote("");
    toast.success("Nota agregada");
    refresh();
  };

  const current = deal ? stages.find((s) => s.id === deal.stageId) : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6">
            {deal?.title || "Cargando..."}
            {deal && (
              <Link href={`/deals/${deal.id}`} className="text-muted-foreground hover:text-primary" title="Abrir página completa">
                <ExternalLink className="h-4 w-4" />
              </Link>
            )}
          </DialogTitle>
        </DialogHeader>

        {!deal ? (
          <p className="text-sm text-muted-foreground py-6">Cargando deal...</p>
        ) : (
          <div className="space-y-4">
            {/* Contacto + Valor */}
            <div className="flex items-center justify-between">
              <Link href={`/contacts/${deal.contactId}`} className="text-sm text-primary hover:underline">
                {contactName}
              </Link>
              {editingValue ? (
                <div className="flex items-center gap-1">
                  <Input type="number" step="0.01" value={valueInput} autoFocus onChange={(e) => setValueInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveValue()} className="h-8 w-28" />
                  <button onClick={saveValue} className="text-sm text-primary cursor-pointer">Guardar</button>
                </div>
              ) : (
                <button onClick={() => setEditingValue(true)} className="group flex items-center gap-1.5 cursor-pointer" title="Editar valor">
                  <span className="text-lg font-bold text-primary">{formatCurrency(deal.value)}</span>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </button>
              )}
            </div>

            {/* Etapas */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Mover a etapa (un clic)</p>
              <div className="flex flex-wrap gap-2">
                {stages.map((stage) => {
                  const isCur = stage.id === deal.stageId;
                  return (
                    <button key={stage.id} onClick={() => changeStage(stage)} disabled={busy} className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium cursor-pointer disabled:opacity-50" style={{ borderColor: stage.color, backgroundColor: isCur ? stage.color : "transparent", color: isCur ? "white" : stage.color }}>
                      {isCur && <Check className="h-3.5 w-3.5" />}
                      {stage.name}
                    </button>
                  );
                })}
              </div>
              {current && <p className="text-xs text-muted-foreground mt-2">Etapa: <strong>{current.name}</strong> · {deal.probability}%</p>}
            </div>

            {/* Nota */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">¿Qué pasó con este cliente?</p>
              <Textarea placeholder="Ej: Habló con el cliente, pidió descuento..." value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="resize-none" />
              <Button size="sm" variant="secondary" onClick={addNote} disabled={!note.trim()} className="cursor-pointer mt-2">
                <Plus className="h-4 w-4 mr-1" /> Agregar nota
              </Button>
            </div>

            {/* Actividades */}
            {activities.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Historial</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {activities.slice(0, 8).map((a) => (
                    <div key={a.id} className="flex items-start gap-2 text-sm">
                      <Badge variant="secondary" className="text-xs shrink-0">{a.type}</Badge>
                      <span className="break-words">{a.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
