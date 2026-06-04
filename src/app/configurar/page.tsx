import { StageEditor } from "@/components/config/StageEditor";
import { CsvImport } from "@/components/config/CsvImport";
import { BusinessConfig } from "@/components/config/BusinessConfig";

export const dynamic = "force-dynamic";

export default function ConfigurarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Personalizar</h1>
        <p className="text-muted-foreground">
          Configura tu negocio, las etapas del pipeline, fuentes de leads e
          importa contactos — todo desde aquí.
        </p>
      </div>
      <BusinessConfig />
      <StageEditor />
      <CsvImport />
    </div>
  );
}
