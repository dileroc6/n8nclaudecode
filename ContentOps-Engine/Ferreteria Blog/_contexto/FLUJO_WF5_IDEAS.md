# Flujo Completo — Ferretería Ya Generador de Ideas (WF5)

> Documentación técnica del workflow `Ferretería Ya - WF-2 - Generador de Ideas` en n8n. Workflow productor de **keywords** que alimentan el WF1 Blog SEO.

---

## Información del Workflow

| Parámetro | Valor |
|-----------|-------|
| Nombre en n8n | `Ferretería Ya - WF-2 - Generador de Ideas` |
| ID n8n | `7X45f7qscFTW3W5o` ([abrir editor](https://n8n.srv1398596.hstgr.cloud/workflow/7X45f7qscFTW3W5o)) |
| Base de clonación | `BF - WF5 - Generador de Ideas` (ID: `yRbv29Y6FiQHn1Qg`) |
| Nodos totales | 14 |
| Estado | Inactivo (recién creado) |
| Triggers | Manual + Schedule quincenal (`0 13 1,15 * *` = 1 y 15 de cada mes 8am Colombia) |

---

## Diferencias clave respecto a BF WF5

| Aspecto | bigotes-felinos WF5 | Ferretería Ya WF5 |
|---------|--------------------|--------------------|
| Triggers | Solo Manual | Manual + Schedule quincenal |
| Ramas | Blog + Entretenimiento (inserta en 2 hojas) | Solo Blog (inserta solo en hoja `Blog`) |
| Nodos | 16 | 14 (eliminados: `Leer Redes Sociales`, `IF Ent Ideas`, `Append Ent Ideas`) |
| Tono GPT | Editor sobre gatos hispanohablantes | "Asesor de Bricolaje" Colombia, DIY/ferretería |
| GSC URL | `bigotesfelinos.com` | `ferreteriaya.com.co` |
| SerpAPI query | `gatos Colombia cuidados salud alimentacion` | `como instalar arreglar casa bogota` |
| Sheet target | BF Sheet (`1dsHuD...EaH7s`) | Ferretería Sheet (`1HDLc1H...HWM`) |
| Nichos generados | Salud / Alimentación / Comportamiento / Razas / Cuidados | Herramientas / Materiales / Plomería / Electricidad / Jardín |
| Notificaciones | `BF - Telegram Bot` | `Ferre_Telegram` (`qoDPp0fY5sJ8AmbE`) |
| Volumen | 15 blog ideas + 5 entretenimiento por run | 15 blog ideas por run |

---

## Nodos del Workflow

| ID | Nodo | Función | Credencial / Detalle |
|----|------|---------|---------------------|
| fy5-001 | Manual Trigger | Disparo manual on-demand cuando el equipo quiere nuevas ideas | — |
| fy5-cron | Schedule Trigger Quincenal | Cron `0 13 1,15 * *` (1 y 15 de cada mes 8am Colombia) | — |
| fy5-002 | Preparar Fechas GSC | Calcula rango fechas últimos 90 días para query GSC | Code |
| fy5-003 | GSC Query | Consulta Google Search Console: queries con ≥3 impresiones | `BF - Google OAuth` (`XWbfIBmitmx1uByl`) — ⚠️ requiere `ferreteriaya.com.co` verificado en GSC con `feruroc@gmail.com` |
| fy5-004 | SerpAPI | PAA + autocomplete + related_searches Google Colombia | `Ferre_SerpApi` (`IHe5FCEzs9GC5BlE`) |
| fy5-005 | Leer Blog Sheet | Lee columna A del Sheet `Blog` para deduplicar | `Ferre Google Sheets account` (`uonq78tDtE28NMdx`) |
| fy5-007 | Construir Prompt GPT | Arma system + user prompt con contexto GSC + SerpAPI + Sheet existente | Code (runOnceForAllItems) |
| fy5-008 | GPT-4o Generar Ideas | HTTP POST a OpenAI Chat Completions | `Ferre_Blog_OpenAi` (`5Rvr3r9lUss9Vb5j`) |
| fy5-009 | Parsear y Filtrar Ideas | Parsea JSON + filtro Jaccard ≥50% para descartar duplicados | Code |
| fy5-010 | IF Blog Ideas | Continúa solo si hay >0 ideas nuevas | — |
| fy5-011 | Append Blog Ideas | POST a Google Sheets API: agrega filas al Sheet `Blog` con `estado=Pendiente` | `Ferre Google Sheets account` |
| fy5-014 | Telegram Notificar | Envía resumen al chat: cuántas ideas se agregaron y cuántas se descartaron | `Ferre_Telegram` |
| fy5-015 | Error Trigger | Captura errores no controlados | — |
| fy5-016 | Telegram Error | Notifica errores | `Ferre_Telegram` |

---

## Output esperado

Por cada ejecución exitosa:
- Se agregan **N nuevas filas** al Sheet `Blog` con `estado=Pendiente` (~10-15 filas, depende de cuántas pasen el filtro Jaccard)
- Cada fila tiene: `keyword, Pendiente, prioridad, nicho, país, audiencia, intencion` (cols A-G poblados; H-M vacías)
- Telegram recibe: `💡 Ideas generadas — Ferretería Ya ✅ \n 📝 Blog: N nuevas (M descartadas por similitud)`
- El equipo revisa las ideas en el Sheet y cambia a `Aprobado` las que quiere publicar — esas las consume el WF1

---

## Flujo

```
[Manual Trigger] o [Schedule Trigger Quincenal]
          ↓
Preparar Fechas GSC (Code) — startDate hace 90 días, endDate ayer
          ↓
GSC Query — queries reales del sitio últimos 90 días, ≥3 impresiones
          ↓
SerpAPI — PAA + related searches Google Colombia para "como instalar arreglar casa bogota"
          ↓
Leer Blog Sheet — todas las keywords existentes (para deduplicar)
          ↓
Construir Prompt GPT — system "Asesor de Bricolaje" + user con GSC + PAA + Related + existentes
          ↓
GPT-4o Generar Ideas — pide 15 ideas en JSON estricto
          ↓
Parsear y Filtrar Ideas — Jaccard ≥50% descarta duplicados, formatea filas para Sheet
          ├──→ IF Blog Ideas (count > 0?) → Append Blog Ideas (insert al Sheet)
          └──→ Telegram Notificar (resumen)

[Error Trigger] → Telegram Error
```

---

## Pre-requisitos para que funcione

| Item | Estado |
|------|--------|
| `ferreteriaya.com.co` verificado en Google Search Console | ⚠️ Pendiente verificar — ver `https://search.google.com/search-console` |
| Cuenta GSC: `feruroc@gmail.com` debe tener acceso al sitio en GSC | ⚠️ Pendiente verificar |
| Credencial `BF - Google OAuth` (`XWbfIBmitmx1uByl`) válida | ✅ Activa (la misma cuenta que BF) |
| Sheet `Blog` con header en fila 1 | ✅ Listo |
| Validación de columna B en Sheet | 🟡 Pendiente (hace los `Pendiente` ingresados confiables) |

> **Si `ferreteriaya.com.co` NO está verificado en GSC:** el nodo `GSC Query` devuelve 403 y el workflow falla. Solución temporal: deshabilitar el nodo `GSC Query` (clic derecho → Disable). El Code node `Construir Prompt GPT` lo maneja con fallback `(Sin datos de GSC)`.

---

## Patches aplicados durante el clonado

1. **Eliminados 3 nodos** de la rama Entretenimiento (`Leer Redes Sociales`, `IF Ent Ideas`, `Append Ent Ideas`)
2. **Agregado `Schedule Trigger Quincenal`** (cron `0 13 1,15 * *`) además del Manual Trigger original
3. **Reescrito `Construir Prompt GPT`** completamente: tono "Asesor de Bricolaje", nichos ferretería, sin Entretenimiento
4. **Reescrito `Parsear y Filtrar Ideas`** sin lógica de entretenimiento
5. **GSC URL** apuntada a `ferreteriaya.com.co`
6. **SerpAPI query** cambiada a `como instalar arreglar casa bogota`
7. **Sheet ID** actualizado en `Leer Blog Sheet` y `Append Blog Ideas`
8. **Credenciales remapeadas**: Google Sheets, OpenAI, SerpAPI, Telegram
9. **Mensajes Telegram** adaptados a tono Ferretería Ya
