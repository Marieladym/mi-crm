"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const dealSchema = z.object({
  title: z.string().min(1, "El titulo es requerido"),
  value: z.string(),
  contactId: z.string().min(1, "El contacto es requerido"),
  stageId: z.string(),
  probability: z.string(),
  expectedClose: z.string(),
  notes: z.string(),
});

type DealFormData = z.infer<typeof dealSchema>;

interface DealInitialData {
  id: string;
  title: string;
  value: number; // en centavos
  stageId: string;
  contactId: string;
  probability: number;
  expectedClose: string;
  notes: string;
}

interface DealFormProps {
  open: boolean;
  onClose: () => void;
  initialData?: DealInitialData;
  presetContactId?: string;
  presetTitle?: string;
}

export function DealForm({ open, onClose, initialData, presetContactId, presetTitle }: DealFormProps) {
  const router = useRouter();
  const [contactsList, setContacts] = useState<Array<{ id: string; name: string }>>([]);
  const [stagesList, setStages] = useState<Array<{ id: string; name: string }>>([]);
  const isEdit = Boolean(initialData?.id);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: "",
      value: "",
      contactId: "",
      stageId: "",
      probability: "50",
      expectedClose: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      fetch("/api/contacts").then((r) => r.json()).then(setContacts);
      fetch("/api/pipeline").then((r) => r.json()).then(setStages);
      if (initialData) {
        reset({
          title: initialData.title,
          value: (initialData.value / 100).toString(),
          contactId: initialData.contactId,
          stageId: initialData.stageId,
          probability: initialData.probability.toString(),
          expectedClose: initialData.expectedClose,
          notes: initialData.notes,
        });
      } else if (presetContactId) {
        reset({
          title: presetTitle || "",
          value: "",
          contactId: presetContactId,
          stageId: "",
          probability: "50",
          expectedClose: "",
          notes: "",
        });
      }
    }
  }, [open, initialData, reset]);

  const onSubmit = async (data: DealFormData) => {
    try {
      const payload = {
        ...data,
        value: Math.round(parseFloat(data.value || "0") * 100),
        probability: parseInt(data.probability || "0"),
      };
      const res = await fetch(
        isEdit ? `/api/deals/${initialData!.id}` : "/api/deals",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Error al guardar deal");

      toast.success(isEdit ? "Deal actualizado" : "Deal creado exitosamente");
      if (!isEdit) reset();
      onClose();
      router.refresh();
    } catch {
      toast.error("Error al guardar el deal");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Deal" : "Nuevo Deal"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deal-title">Titulo *</Label>
            <Input id="deal-title" {...register("title")} placeholder="Ej: Servicio Premium - Empresa X" />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="deal-value">Valor (MXN)</Label>
              <Input
                id="deal-value"
                type="number"
                step="0.01"
                {...register("value")}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Probabilidad (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                {...register("probability")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Contacto *</Label>
            <Select
              value={watch("contactId")}
              onValueChange={(v) => v && setValue("contactId", v)}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder="Seleccionar contacto" />
              </SelectTrigger>
              <SelectContent>
                {contactsList.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.contactId && (
              <p className="text-xs text-destructive">{errors.contactId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Etapa</Label>
              <Select
                value={watch("stageId")}
                onValueChange={(v) => v && setValue("stageId", v)}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Primera etapa" />
                </SelectTrigger>
                <SelectContent>
                  {stagesList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cierre estimado</Label>
              <Input type="date" {...register("expectedClose")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal-notes">Notas</Label>
            <Textarea id="deal-notes" {...register("notes")} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
              {isSubmitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear Deal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
