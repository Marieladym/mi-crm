# CLAUDE.md — Auto-CRM

> Este es un CRM completo que se personaliza a cada negocio y se conecta con
> Facebook Lead Ads para recibir leads automaticamente.
> Cuando un usuario abre este proyecto con Claude Code, tu trabajo es ayudarle a
> instalarlo, conectarlo con Meta, desplegarlo en Railway, y personalizarlo.

## 🟢 ONBOARDING — Qué hacer cuando alguien abre el proyecto por primera vez

**IMPORTANTE:** Si es la primera vez (no existe `.env.local` ni datos propios),
inicia un onboarding conversacional guiado. Sigue este flujo y NO abrumes con
todo a la vez — un paso a la vez, confirmando antes de seguir:

1. **Da la bienvenida** y pregunta por su negocio para personalizarlo:
   - Nombre del negocio / marca
   - Tipo de negocio e industria
   - Si tiene logo (lo puede subir luego en Personalizar)
   > Con esas respuestas, configúralo nativamente vía la API `/api/config` y
   > `/api/branding`, o dile que puede hacerlo él mismo en la sección
   > **Personalizar** del sistema.

2. **Corre el CRM local:** `npm install` → `npm run init:seed` → `npm run dev`

3. **Pregunta si quiere conectarlo con Facebook Lead Ads.** Si sí, guíalo con
   la **Parte 3 de `GUIA-INSTALACION.md`** paso a paso (Meta App, Webhook,
   token de System User, suscribir páginas). Puedes ejecutar las llamadas a la
   Graph API por él con `curl` (verificar webhook, suscribir páginas, etc.).

4. **Ayúdalo a desplegar en Railway** siguiendo la Parte 2 de la guía
   (recuérdale el **Volume en `/app/data`** para no perder datos).

5. Cuando termine, dile que **todo lo demás se modifica dentro del sistema** en
   **Personalizar** (marca, negocio, pipelines, fuentes) y **Configuración**
   (moneda) — sin tocar código.

> La guía completa está en **`GUIA-INSTALACION.md`**. Léela y úsala como libreto.

## Inicio rapido (resumen)

1. `npm install` — Instalar dependencias
2. `npm run init:seed` — Inicializar base de datos con datos demo
3. `npm run dev` — Iniciar servidor en http://localhost:3000
4. Personalizar desde la web (seccion **Personalizar**) o con `/setup`

## Comandos

```bash
npm run dev          # Servidor de desarrollo (http://localhost:3000)
npm run build        # Build de produccion
npm start            # Servidor de produccion
npm run local        # Build + init + start (despliegue local en un comando)
npm run init         # Inicializar base de datos
npm run init:seed    # Inicializar + datos demo
npm run seed         # Solo datos demo
npm run lint         # ESLint
npm run mcp          # Iniciar servidor MCP (para Claude Desktop/Web)
```

## Comandos interactivos disponibles

| Comando | Que hace |
|---------|----------|
| `/setup` | Personalizar CRM: pipeline, fuentes de leads, industria, idioma, tema |
| `/add-lead` | Agregar un lead conversacionalmente — describe al prospecto y se crea automaticamente |
| `/analyze-pipeline` | Analisis completo del pipeline con recomendaciones accionables |
| `/daily-briefing` | Resumen ejecutivo del dia: follow-ups, deals calientes, prioridades |
| `/import-contacts` | Importar contactos desde un archivo CSV |
| `/customize` | Cambiar configuracion sin reiniciar todo |
| `/connect` | Conectar CRM con Gmail, Calendar, Sheets, WhatsApp via MCP |
| `/digest` | Enviar resumen diario por email (requiere Resend) |

## Arquitectura

**Stack**: Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui · SQLite + Drizzle ORM · @dnd-kit (kanban)

**100% local**: SQLite como base de datos (archivo en `data/crm.db`). No requiere ningun servicio externo.

**Alias**: `@/*` → `./src/*`

### Directorios clave

- `src/app/` — Paginas y API routes (App Router)
- `src/components/` — Componentes React organizados por feature
- `src/db/` — Schema Drizzle, cliente DB, seeder
- `src/lib/` — Utilidades: claude.ts (AI), scoring.ts, constants.ts
- `src/types/` — TypeScript types para entidades CRM
- `.claude/commands/` — Comandos interactivos (los de la tabla arriba)
- `mcp/` — Servidor MCP para integracion con Claude Desktop/Web
- `scripts/` — Scripts de inicializacion y utilidades

### Modelo de datos

- **Contacts**: Leads con temperatura, score, fuente, historial, `formData` (respuestas del Instant Form en JSON)
- **Deals**: Oportunidades con valor (centavos), etapa, probabilidad
- **Activities**: Interacciones (llamada/email/reunion/nota/follow-up)
- **Pipelines**: Múltiples embudos; cada uno con sus etapas (`is_default` marca el principal)
- **Pipeline Stages**: Etapas configurables; pertenecen a un pipeline (`pipeline_id`)
- **CRM Settings**: Config key-value (moneda, branding, enabled_forms, form_pipelines, business_config)

### Funciones clave construidas sobre el CRM base

- **Facebook Lead Ads** (`/api/webhook/facebook`): recibe leads, lee la Graph API,
  crea contacto + deal automaticamente en el pipeline asignado al formulario.
  Detecta el tipo de cada pregunta del formulario y la guarda estructurada.
- **Descubrimiento de formularios** (`/api/forms`): lista en tiempo real todos
  los Instant Forms del portafolio (System User token), sus preguntas, y permite
  habilitarlos y asignarlos a un pipeline. UI en `/forms`.
- **Multiples pipelines**: crear/editar/eliminar pipelines y sus etapas desde
  `/configurar`. El tablero `/pipeline` cambia entre pipelines (client-side).
- **Personalizacion en la web** (`/configurar`): negocio, fuentes de leads,
  pipelines, importar CSV. **Identidad** (nombre + logo) y **moneda** configurables.
- **Deal popup**: en el tablero, abrir un deal lo muestra en un modal (no navega).

### API Routes

| Endpoint | Metodos | Descripcion |
|----------|---------|-------------|
| `/api/contacts` | GET, POST | Listar (con busqueda/filtro) y crear contactos |
| `/api/contacts/[id]` | GET, PUT, DELETE | CRUD individual de contacto |
| `/api/deals` | GET, POST | Listar y crear deals |
| `/api/deals/[id]` | GET, PUT, DELETE | CRUD individual de deal |
| `/api/activities` | GET, POST | Listar y registrar actividades |
| `/api/activities/[id]` | PUT, DELETE | Completar o eliminar actividad |
| `/api/pipeline` | GET, PUT | Pipeline (filtra con `?pipelineId=`); mover deals |
| `/api/pipelines` | GET, POST | Listar y crear pipelines (crea con etapas por defecto) |
| `/api/pipelines/[id]` | PUT, DELETE | Renombrar / eliminar pipeline |
| `/api/stages` | POST | Crear etapa (acepta `pipelineId`) |
| `/api/stages/[id]` | PUT, DELETE | Editar / eliminar etapa |
| `/api/webhook/facebook` | GET, POST | Webhook de Meta: GET verifica, POST recibe leads |
| `/api/forms` | GET, POST | Descubrir Instant Forms + preguntas; habilitar y asignar pipeline |
| `/api/config` | GET, POST | Config del negocio (tipo, industria, fuentes, idioma) |
| `/api/branding` | GET, POST | Nombre y logo del CRM |
| `/api/currency` | GET, POST | Moneda activa |
| `/api/classify` | POST | Clasificar lead (IA o reglas) |
| `/api/followups` | GET | Follow-ups pendientes (vencidos, hoy, proximos) |
| `/api/import` | POST | Importacion masiva de contactos |
| `/api/webhook` | POST | Recibir leads de formularios externos (Typeform, Tally, etc.) |
| `/api/export` | GET | Exportar contactos o deals como CSV (?type=contacts o deals) |
| `/api/digest` | POST | Enviar resumen diario por email (requiere RESEND_API_KEY) |

### Variables de entorno para Facebook (Meta)

- `META_VERIFY_TOKEN` — palabra secreta para verificar el webhook (la inventas tu)
- `META_ACCESS_TOKEN` — token de **Usuario del Sistema** de Business Manager (no expira)

En Railway: configurar como Variables, y montar un **Volume en `/app/data`** para
persistir la base de datos SQLite. Ver `GUIA-INSTALACION.md`.

## Configuracion del negocio

El archivo `crm-config.json` (raiz del proyecto) tiene la configuracion personalizada.
Se genera con `/setup` y se modifica con `/customize`.

El archivo en `public/crm-config.json` es la copia por defecto (template).

## Reglas de codigo

- **Idioma UI**: Espanol por defecto. Soporte bilingue con `const t = { en: {...}, es: {...} }`
- **Max ~300 lineas por componente**. Dividir si crece mas
- **No emojis como iconos** — usar Lucide React (SVG)
- **Valores monetarios**: Centavos (integer). Usar `formatCurrency()` para mostrar
- **Fechas**: `date-fns` para formateo. SQLite almacena como integer timestamps
- **Forms**: react-hook-form + zod
- **Drag & drop**: @dnd-kit (NO react-beautiful-dnd)
- **Estilos**: Tailwind CSS v4 (config via CSS, no tailwind.config.ts)

## Modos de IA

1. **Terminal Mode** (default, sin API key): Toda la IA via tus comandos de Claude Code.
   El usuario describe lo que necesita, tu lees/escribes datos via `curl` a los API routes.

2. **API Mode** (opcional): Si el usuario pone `ANTHROPIC_API_KEY` en `.env.local`,
   la web tiene clasificacion automatica de leads inline.

3. **MCP Mode**: El usuario puede conectar Claude Desktop/Web al CRM via el servidor MCP.
   Config: `npm run mcp` o agregar a `claude_desktop_config.json`.

**Sin API key, el CRM funciona 100%.** La IA es un extra, no un requisito.

## Despliegue

### Local (desarrollo)
```bash
npm run dev
```

### Local (produccion)
```bash
npm run local  # build + init + start en puerto 3000
```

### Docker
```bash
docker compose up -d  # Corre en puerto 3000, datos persisten en ./data/
```

### MCP (Claude Desktop/Web)
Agregar a `~/.claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "auto-crm": {
      "command": "npx",
      "args": ["tsx", "/ruta/al/proyecto/mcp/crm-server.ts"]
    }
  }
}
```

## Variables de entorno

- `ANTHROPIC_API_KEY` — Opcional. Para IA en la interfaz web (clasificacion de leads)
- `RESEND_API_KEY` — Opcional. Para enviar digest diario por email (resend.com, gratis)
- `DIGEST_EMAIL` — Opcional. Email donde recibir el digest
- `DIGEST_FROM` — Opcional. Email remitente del digest (default: onboarding@resend.dev)
