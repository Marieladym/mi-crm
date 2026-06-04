"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kanban, Plus, Trash2, ArrowUp, ArrowDown, Trophy, X } from "lucide-react";
import { toast } from "sonner";

type Stage = {
  id: string;
  name: string;
  color: string;
  order: number;
  isWon: boolean;
  isLost: boolean;
  pipelineId: string | null;
};
type Pipeline = { id: string; name: string; isDefault: boolean };

export function StageEditor() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [allStages, setAllStages] = useState<Stage[]>([]);
  const [newName, setNewName] = useState("");
  const [newPipeline, setNewPipeline] = useState("");
  const [busy, setBusy] = useState(false);

  const loadPipelines = useCallback(async () => {
    const list = await fetch("/api/pipelines").then((r) => r.json());
    setPipelines(list);
    setSelected((prev) => prev || list.find((p: Pipeline) => p.isDefault)?.id || list[0]?.id || null);
  }, []);

  const loadStages = useCallback(async () => {
    const d = await fetch("/api/pipeline").then((r) => r.json());
    const stages = Array.isArray(d) ? d : d.stages || [];
    setAllStages(stages);
  }, []);

  useEffect(() => {
    loadPipelines();
    loadStages();
  }, [loadPipelines, loadStages]);

  const stages = allStages.filter((s) => s.pipelineId === selected);

  const addPipeline = async () => {
    if (!newPipeline.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPipeline.trim() }),
      });
      const p = await res.json();
      if (!res.ok) throw new Error();
      setNewPipeline("");
      await loadPipelines();
      await loadStages();
      setSelected(p.id);
      toast.success("Pipeline creado");
    } catch {
      toast.error("Error al crear el pipeline");
    } finally {
      setBusy(false);
    }
  };

  const deletePipeline = async (id: string) => {
    if (!confirm("¿Eliminar este pipeline y sus etapas?")) return;
    const res = await fetch(`/api/pipelines/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "No se pudo eliminar");
      return;
    }
    setSelected(null);
    await loadPipelines();
    await loadStages();
    toast.success("Pipeline eliminado");
  };

  const renamePipeline = async (id: string, name: string) => {
    setPipelines((p) => p.map((x) => (x.id === id ? { ...x, name } : x)));
    await fetch(`/api/pipelines/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
  };

  const addStage = async () => {
    if (!newName.trim() || !selected) return;
    setBusy(true);
    try {
      const res = await fetch("/api/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), pipelineId: selected }),
      });
      if (!res.ok) throw new Error();
      setNewName("");
      await loadStages();
      toast.success("Etapa agregada");
    } catch {
      toast.error("Error al agregar la etapa");
    } finally {
      setBusy(false);
    }
  };

  const updateStage = async (id: string, patch: Partial<Stage>) => {
    setAllStages((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    await fetch(`/api/stages/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  };

  const deleteStage = async (id: string) => {
    if (!confirm("¿Eliminar esta etapa?")) return;
    const res = await fetch(`/api/stages/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "No se pudo eliminar");
      return;
    }
    await loadStages();
    toast.success("Etapa eliminada");
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= stages.length) return;
    const a = stages[index];
    const b = stages[target];
    await Promise.all([
      updateStage(a.id, { order: b.order }),
      updateStage(b.id, { order: a.order }),
    ]);
    await loadStages();
  };

  const currentPipeline = pipelines.find((p) => p.id === selected);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Kanban className="h-4 w-4" />
          Pipelines y etapas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selector de pipelines */}
        <div className="flex flex-wrap gap-2 items-center">
          {pipelines.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium cursor-pointer transition-colors ${
                p.id === selected ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Crear pipeline */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Nuevo pipeline (ej: Campaña verano)"
            value={newPipeline}
            onChange={(e) => setNewPipeline(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPipeline()}
            className="h-9"
          />
          <Button onClick={addPipeline} disabled={busy || !newPipeline.trim()} variant="secondary" className="cursor-pointer shrink-0">
            <Plus className="h-4 w-4 mr-1" /> Pipeline
          </Button>
        </div>

        {/* Nombre + eliminar del pipeline seleccionado */}
        {currentPipeline && (
          <div className="flex items-center gap-2 pt-1 border-t">
            <span className="text-xs text-muted-foreground shrink-0">Nombre:</span>
            <Input
              value={currentPipeline.name}
              onChange={(e) => setPipelines((p) => p.map((x) => (x.id === currentPipeline.id ? { ...x, name: e.target.value } : x)))}
              onBlur={(e) => renamePipeline(currentPipeline.id, e.target.value)}
              className="h-8 flex-1"
            />
            {!currentPipeline.isDefault && (
              <button onClick={() => deletePipeline(currentPipeline.id)} className="p-1.5 rounded cursor-pointer text-destructive hover:bg-destructive/10" title="Eliminar pipeline">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Etapas del pipeline seleccionado */}
        <div className="space-y-2">
          {stages.map((stage, i) => (
            <div key={stage.id} className="flex items-center gap-2 p-2 rounded-lg border">
              <input type="color" value={stage.color} onChange={(e) => updateStage(stage.id, { color: e.target.value })} className="h-7 w-7 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0" title="Color" />
              <Input
                value={stage.name}
                onChange={(e) => setAllStages((p) => p.map((s) => (s.id === stage.id ? { ...s, name: e.target.value } : s)))}
                onBlur={(e) => updateStage(stage.id, { name: e.target.value })}
                className="h-8 flex-1"
              />
              <button onClick={() => updateStage(stage.id, { isWon: !stage.isWon, isLost: false })} className={`p-1.5 rounded cursor-pointer ${stage.isWon ? "bg-green-100 text-green-700" : "text-muted-foreground hover:bg-muted"}`} title="Etapa ganada">
                <Trophy className="h-4 w-4" />
              </button>
              <button onClick={() => updateStage(stage.id, { isLost: !stage.isLost, isWon: false })} className={`p-1.5 rounded cursor-pointer ${stage.isLost ? "bg-red-100 text-red-700" : "text-muted-foreground hover:bg-muted"}`} title="Etapa perdida">
                <X className="h-4 w-4" />
              </button>
              <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 rounded cursor-pointer hover:bg-muted disabled:opacity-30" title="Subir"><ArrowUp className="h-4 w-4" /></button>
              <button onClick={() => move(i, 1)} disabled={i === stages.length - 1} className="p-1 rounded cursor-pointer hover:bg-muted disabled:opacity-30" title="Bajar"><ArrowDown className="h-4 w-4" /></button>
              <button onClick={() => deleteStage(stage.id)} className="p-1 rounded cursor-pointer text-destructive hover:bg-destructive/10" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}

          <div className="flex items-center gap-2 pt-2 border-t">
            <Input placeholder="Nueva etapa" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addStage()} className="h-9" />
            <Button onClick={addStage} disabled={busy || !newName.trim()} className="cursor-pointer shrink-0">
              <Plus className="h-4 w-4 mr-1" /> Etapa
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          🏆 = etapa ganada · ✕ = etapa perdida · flechas para reordenar. Crea
          varios pipelines y asígnalos a tus formularios en la sección
          Formularios.
        </p>
      </CardContent>
    </Card>
  );
}
