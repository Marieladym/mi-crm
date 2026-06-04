# 🚀 Guía de Instalación — Auto-CRM

> Esta guía te lleva de cero a tener tu CRM **en vivo en internet** recibiendo
> leads de Facebook automáticamente. Si abriste este proyecto con Claude Code,
> pídele que te acompañe: **"guíame paso a paso para instalar el CRM"**.

---

## 📋 Resumen de lo que vas a lograr

```
1. Correr el CRM en tu computadora        (5 min)
2. Subirlo a Railway para que esté 24/7   (10 min)
3. Conectar Facebook Lead Ads (Meta API)  (20 min)
4. Personalizar tu marca y negocio        (5 min)
```

---

## PARTE 1 — Correr el CRM localmente

```bash
npm install        # Instalar dependencias
npm run init:seed  # Crear la base de datos con datos de ejemplo
npm run dev        # Iniciar en http://localhost:3000
```

Abre **http://localhost:3000** y ya tienes el CRM funcionando. Explora:
- **Dashboard** — resumen del día
- **Pipeline** — tablero de ventas (arrastra deals)
- **Contactos** — tus leads
- **Personalizar** — configura todo (ver Parte 4)

> 💡 El CRM funciona 100% sin ninguna API key. Facebook y la IA son extras.

---

## PARTE 2 — Desplegar en Railway (para que esté siempre en vivo)

Facebook necesita una URL pública con HTTPS, así que hay que subir el CRM a
internet. **Railway** es gratis para empezar y mantiene tus datos.

### 2.1 — Sube el proyecto a TU GitHub
```bash
git init
git add .
git commit -m "Mi CRM"
# Crea un repo nuevo en github.com y luego:
git remote add origin https://github.com/TU-USUARIO/mi-crm.git
git push -u origin main
```

### 2.2 — Crea el proyecto en Railway
1. Entra a **https://railway.app** → **Login with GitHub**
2. **New Project** → **Deploy from GitHub repo** → elige tu repo
3. Railway detecta el `Dockerfile` y construye solo

### 2.3 — ⚠️ Agrega un Volume (MUY IMPORTANTE para no perder datos)
El CRM usa SQLite (un archivo). Sin un volumen, **los datos se borran en cada
reinicio**. Para evitarlo:
1. En tu servicio → **Settings** → **Volumes** → **New Volume**
2. **Mount path:** `/app/data`
3. Guardar

### 2.4 — Genera tu dominio público
1. **Settings** → **Networking** → **Generate Domain**
2. Te da algo como `https://mi-crm-production.up.railway.app`

> Esa URL es tu CRM en vivo. Guárdala, la usarás en la Parte 3.

---

## PARTE 3 — Conectar Facebook Lead Ads (Meta API)

> Objetivo: que cuando alguien llene tu Instant Form en Facebook/Instagram, el
> lead entre **solo** a tu CRM en ~5 segundos y se cree el contacto + deal.

### 3.1 — Inventa tu Verify Token
Elige una palabra secreta, por ejemplo `miclave2024`. La usarás 2 veces.

En Railway → **Variables** → agrega:
```
META_VERIFY_TOKEN=miclave2024
```

### 3.2 — Crea la App en Meta for Developers
1. Entra a **https://developers.facebook.com** → **Mis Apps** → **Crear app**
2. Caso de uso: **"Captar y administrar clientes potenciales de anuncios con la API de marketing"**
3. Nombre: el que quieras · vincula tu **Business Manager**

### 3.3 — Configura el Webhook
1. Panel izquierdo → **Webhooks** (o Caso de uso → Personalizar → Webhooks)
2. En **"Seleccionar producto"** elige **Página** (¡NO "User"!)
3. Rellena:
   - **URL de devolución:** `https://TU-DOMINIO.up.railway.app/api/webhook/facebook`
   - **Token de verificación:** `miclave2024` (el mismo de Railway)
4. **Verificar y guardar**
5. En la lista de campos, suscríbete a **`leadgen`**

### 3.4 — Genera el Token que NO expira (System User)
> Los tokens normales mueren en 1 hora. Usa un **Usuario del Sistema** para que
> nunca se caiga.

1. **https://business.facebook.com/settings** → **Usuarios** → **Usuarios del sistema**
2. **Agregar** → nombre `CRM Token` → rol **Administrador**
3. **Agregar activos** → pestaña **Páginas** → marca tus páginas → **Control total**
4. **Generar nuevo token** → elige tu app → marca los permisos:
   `leads_retrieval`, `pages_show_list`, `pages_read_engagement`, `pages_manage_metadata`
5. **Copia el token** (empieza con `EAA...`)

En Railway → **Variables** → agrega:
```
META_ACCESS_TOKEN=EAA...el-token-largo
```

### 3.5 — Suscribe tus páginas al webhook
En el **Explorador de la API Graph** (Herramientas), con el token de tu página,
ejecuta un **POST** a:
```
POST /{PAGE_ID}/subscribed_apps    con  subscribed_fields = leadgen
```
Debe responder `{ "success": true }`.

> 💡 Si abriste el proyecto con Claude Code, pídele: **"suscribe mis páginas de
> Facebook al webhook"** y lo hace por ti con la API.

### 3.6 — Prueba
1. **https://developers.facebook.com/tools/lead-ads-testing**
2. Selecciona tu página y formulario → **Crear lead**
3. Abre `https://TU-DOMINIO.up.railway.app/contacts` → debe aparecer el lead ✅

### 3.7 — Para recibir leads REALES (producción)
Mientras la app esté en modo desarrollo, solo entran leads de prueba. Para leads
reales de clientes necesitas:
- **Verificación del Negocio** (Business Verification) en el Centro de seguridad
- **App Review** de `leads_retrieval` y `pages_manage_metadata`

Esto lo revisa Meta (1-7 días). Mientras tanto puedes probar todo con tus
propias páginas.

---

## PARTE 4 — Personaliza tu marca y negocio

Todo se configura **desde el sistema** (no necesitas tocar código). Ve a la
sección **Personalizar** en el menú:

| Sección | Qué configuras |
|---|---|
| **Identidad del CRM** | Nombre y logo de tu CRM |
| **Mi negocio** | Tipo, industria, tamaño de equipo, idioma |
| **Fuentes de leads** | De dónde vienen tus prospectos |
| **Pipelines y etapas** | Crea varios pipelines, edita etapas, colores |
| **Importar contactos** | Sube un CSV |

Y en **Configuración** → la **moneda** que usas.

### Múltiples formularios → múltiples pipelines
Si corres varias campañas a la vez:
1. En **Personalizar** crea un pipeline por campaña (ej: "Seguros", "Ahorro")
2. En **Formularios**, habilita cada Instant Form y elige a qué pipeline van sus leads
3. Cada lead cae automáticamente en el pipeline correcto

---

## ✅ Checklist final

- [ ] CRM corriendo (local o Railway)
- [ ] Railway con Volume en `/app/data`
- [ ] `META_VERIFY_TOKEN` y `META_ACCESS_TOKEN` en Railway
- [ ] Webhook verificado + campo `leadgen` suscrito
- [ ] Páginas suscritas (`success: true`)
- [ ] Lead de prueba aparece en el CRM
- [ ] Marca, negocio y moneda configurados en Personalizar

---

## 🆘 ¿Algo falla?
Abre el proyecto con Claude Code y describe el problema. Claude puede:
- Verificar tu webhook y tokens con la API de Meta
- Suscribir tus páginas
- Diagnosticar por qué un lead no entró
- Ajustar la configuración

Solo dile: **"ayúdame a conectar mi CRM con Facebook"**.
