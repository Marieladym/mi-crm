"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Briefcase, Tag, Plus, X } from "lucide-react";
import { toast } from "sonner";

const BUSINESS_TYPES = [
  { v: "services", l: "Servicios" },
  { v: "retail", l: "Retail / Tienda" },
  { v: "saas", l: "SaaS / Software" },
  { v: "agency", l: "Agencia" },
  { v: "ecommerce", l: "E-commerce" },
  { v: "consulting", l: "Consultoría" },
  { v: "realestate", l: "Inmobiliaria" },
  { v: "health", l: "Salud" },
  { v: "education", l: "Educación" },
  { v: "finance", l: "Finanzas / Seguros" },
  { v: "other", l: "Otro" },
];

const TEAM_SIZES = [
  { v: "solo", l: "Solo yo" },
  { v: "small", l: "2-5 personas" },
  { v: "medium", l: "6-20 personas" },
  { v: "large", l: "20+ personas" },
];

type Config = {
  business: { type: string; industry: string; teamSize: string; name: string };
  leadSources: string[];
  preferences: { language: "es" | "en" };
};

export function BusinessConfig() {
  const [config, setConfig] = useState<Config | null>(null);
  const [newSource, setNewSource] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => {});
  }, []);

  const save = async (patch: Partial<Config>) => {
    if (!config) return;
    const next = { ...config, ...patch };
    setConfig(next);
    setSaving(true);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error();
      toast.success("Configuración guardada");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (!config) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Cargando configuración...
        </CardContent>
      </Card>
    );
  }

  const setBiz = (patch: Partial<Config["business"]>) =>
    save({ business: { ...config.business, ...patch } });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Mi negocio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre del negocio</label>
            <Input
              value={config.business.name}
              placeholder="Ej: Marketing VL"
              onChange={(e) =>
                setConfig({ ...config, business: { ...config.business, name: e.target.value } })
              }
              onBlur={(e) => setBiz({ name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de negocio</label>
            <div className="flex flex-wrap gap-2">
              {BUSINESS_TYPES.map((t) => (
                <button
                  key={t.v}
                  onClick={() => setBiz({ type: t.v })}
                  className={`rounded-full border px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                    config.business.type === t.v ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted"
                  }`}
                >
                  {t.l}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Industria / sector</label>
            <Input
              value={config.business.industry}
              placeholder="Ej: seguros, tecnología, bienes raíces..."
              onChange={(e) =>
                setConfig({ ...config, business: { ...config.business, industry: e.target.value } })
              }
              onBlur={(e) => setBiz({ industry: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tamaño del equipo</label>
            <div className="flex flex-wrap gap-2">
              {TEAM_SIZES.map((t) => (
                <button
                  key={t.v}
                  onClick={() => setBiz({ teamSize: t.v })}
                  className={`rounded-full border px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                    config.business.teamSize === t.v ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted"
                  }`}
                >
                  {t.l}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Idioma</label>
            <div className="flex gap-2">
              {(["es", "en"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => save({ preferences: { language: lang } })}
                  className={`rounded-full border px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                    config.preferences.language === lang ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted"
                  }`}
                >
                  {lang === "es" ? "Español" : "English"}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Fuentes de leads
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            De dónde vienen tus prospectos. Aparecen al crear o editar un contacto.
          </p>
          <div className="flex flex-wrap gap-2">
            {config.leadSources.map((src) => (
              <span
                key={src}
                className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1.5 text-sm"
              >
                {src.replace(/_/g, " ")}
                <button
                  onClick={() => save({ leadSources: config.leadSources.filter((s) => s !== src) })}
                  className="cursor-pointer text-muted-foreground hover:text-destructive"
                  title="Eliminar"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Input
              placeholder="Nueva fuente (ej: tiktok, google_ads)"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newSource.trim()) {
                  const slug = newSource.trim().toLowerCase().replace(/\s+/g, "_");
                  if (!config.leadSources.includes(slug)) {
                    save({ leadSources: [...config.leadSources, slug] });
                  }
                  setNewSource("");
                }
              }}
              className="h-9"
            />
            <Button
              disabled={saving || !newSource.trim()}
              onClick={() => {
                const slug = newSource.trim().toLowerCase().replace(/\s+/g, "_");
                if (!config.leadSources.includes(slug)) {
                  save({ leadSources: [...config.leadSources, slug] });
                }
                setNewSource("");
              }}
              className="cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4 mr-1" /> Agregar
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
