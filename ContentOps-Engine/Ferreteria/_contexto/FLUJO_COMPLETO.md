# Flujo Completo — Ferretería Ya Blog SEO (WF1)

> Documentación técnica del workflow `Ferretería Ya - WF-1 - Blog SEO` en n8n.
> Se actualiza nodo por nodo a medida que se construye el workflow.

---

## Información del Workflow

| Parámetro | Valor |
|-----------|-------|
| Nombre en n8n | `Ferretería Ya - WF-1 - Blog SEO` |
| ID n8n | `u3Yfmb2dQS2oYnWo` ([abrir en editor](https://n8n.srv1398596.hstgr.cloud/workflow/u3Yfmb2dQS2oYnWo)) |
| Base de clonación | `BF - WF1 - Blog SEO` (ID: `IVKelNHLoEaWD92B`) |
| Nodos totales | 33 (post Sprint 1+2 AEO) |
| Estado | ✅ AEO Sprint 1+2 aplicado 2026-05-05 — listo para nuevo test end-to-end |
| Trigger | `0 13 * * *` UTC (8am Colombia, diario — lógica L/M/V en fy-node-003b) |

---

## Diferencias clave respecto a bigotes-felinos WF1

| Aspecto | bigotes-felinos | Ferretería Ya |
|---------|----------------|---------------|
| Notificaciones | Telegram (`BF - Telegram Bot`, `7iBygAb1uGxktnFH`) | Telegram (`Ferre_Telegram`, `[PENDIENTE]`) — WhatsApp es migración futura |
| WordPress | bigotesfelinos.com | ferreteriaya.com.co |
| Categorías WP | 5 felinas | 5 de ferretería/construcción |
| Prompt GPT | Tono "Vet-Friend" / ciencia felina | Tono "Asesor de Bricolaje" / DIY y construcción |
| Imágenes prompt | Gatos fotorrealistas, 85mm, golden hour | Herramientas/proyectos, workshop lighting |
| CTA en artículo | Tienda WooCommerce gatos | Tienda WooCommerce ferreteriaya.com.co |
| Google Sheet | ID: `1dsHuDVuz3XuN9vBGhRuJEN-FZhx5zwZsOj6fvUEaH7s` | ID: `[PENDIENTE]` |
| Credencial WP | `BF - WordPress` (`r90z9yKyuuNlhBLy`) | `Ferre_WordPress` (`tSY0QM8DwewkbOvJ`) |
| Credencial OpenAI | `BF - OpenAI` (`sZscccSGx3nfNyOm`) | `Ferre_Blog_OpenAi` (`5Rvr3r9lUss9Vb5j`) |
| Credencial Sheets | `BF - Google Sheets` (`70heM3IFsNK9Cyak`, `googleSheetsOAuth2Api`) | `Ferre Google Sheets account` (`uonq78tDtE28NMdx`, `googleSheetsOAuth2Api`) |
| Credencial Gemini | `BF - nano banana` (`ysOycTrtxEO3BRcW`) | `Ferre_Blog_NanoBanana` (`RTWfgCqeObrVs9Pk`) |

---

## Nodos del Workflow

| ID | Nodo | Función | Estado |
|----|------|---------|--------|
| fy-node-001 | Schedule Trigger | Dispara diariamente a las 8am Colombia (`0 13 * * *`) — lógica L/M/V en fy-node-003b | ⏳ |
| fy-node-s1 | Leer Estacionales Pendientes | GSheets: filas `estado="Pendiente"` con `fecha_objetivo` para priorización estacional | ⏳ |
| fy-node-s2 | Verificar Estacional Urgente | Code (`runOnceForAllItems`): detecta keyword con `fecha_objetivo` en los próximos 14 días | ⏳ |
| fy-node-s3 | IF Estacional Urgente | IF `$json.found === true` → rama de priorización estacional | ⏳ |
| fy-node-s4 | Activar Estacional en Sheet | HTTP PUT → cambia `estado` a `"Aprobado"` en la keyword estacional | ⏳ |
| fy-node-002 | Leer Keywords Aprobadas | GSheets: filas `estado="Aprobado"` → candidatas para publicar | ⏳ |
| fy-node-003 | Hay keyword | IF: ¿hay al menos una keyword para procesar? | ⏳ |
| fy-node-003b | Tomar Primera Keyword | Code: toma la primera keyword; estacionales publican cualquier día; regulares solo L/M/V (timezone Colombia UTC-5) | ⏳ |
| fy-node-016 | Leer Posts Publicados | GSheets: filas `estado="Publicado"` → índice de posts para check canibalismo y enlaces internos | ⏳ |
| fy-node-017 | Formatear Posts Publicados | Code: check canibalismo Jaccard ≥50% + formatea lista de posts para contexto GPT | ⏳ |
| fy-node-018 | IF Canibalismo | Bifurca: canibalismo detectado vs. OK para continuar | ⏳ |
| fy-node-019 | Marcar Canibalismo en Sheet | GSheets update: `estado="Canibalismo"` + URL del post similar | ⏳ |
| fy-node-004 | Marcar En Proceso | GSheets update: `estado="En proceso"` | ⏳ |
| fy-node-023 | Construir Body GPT | Code: serializa prompt de Ferretería Ya + contexto de posts con `JSON.stringify` | ⏳ |
| fy-node-005 | Generar Articulo GPT-4o | HTTP Request (openAI): llama GPT-4o con `gpt_body_json` pre-serializado | ⏳ |
| fy-node-006 | Parsear JSON articulo | Code AEO: slug, capitalización H2/H3 con interrogación auto, FAQ HTML + FAQPage JSON-LD, respuesta_directa wrapper, key_takeaways blockquote, fuentes_consultadas section, Speakable+mentions JSON-LD, HowTo condicional, scrubAIWatermarks, strip4Byte | ✅ |
| fy-node-006a | Internal Linker | Code AEO (Sprint 2): valida URLs internas inventadas por GPT vs. lista real de posts publicados; permite URLs de tienda; si <2 enlaces internos válidos al blog, inyecta automáticamente | ✅ |
| fy-node-006b | Quality Gate | Code AEO (Sprint 2): 18 checks / 120 pts / threshold 70; HARD GATE de tabla obligatoria; lanza Error si falla → Error Trigger marca Sheet 'Error' + Telegram con breakdown | ✅ |
| fy-node-010 | Llamar nano banana | HTTP Request (`Ferre_Blog_NanoBanana`): genera imagen 16:9 vía Gemini | ⏳ |
| fy-node-011 | Preparar Imagen | Code: convierte base64 → Buffer binario con mime type | ⏳ |
| fy-node-012 | Subir a WP Media | HTTP Request (`Ferre_WordPress`): sube imagen a WordPress Media Library | ⏳ |
| fy-node-015 | Set Alt Text Imagen | HTTP PATCH (`Ferre_WordPress`): asigna alt text (keyword) al media item | ⏳ |
| fy-node-013 | Construir wp_body_final | Code: añade `featured_media` al payload del post | ⏳ |
| fy-node-007 | Publicar en WordPress | HTTP Request (`Ferre_WordPress`): publica post con título, slug, contenido, categoría, featured_media, meta Yoast | ⏳ |
| fy-node-008 | Actualizar Sheet Publicado | GSheets batchUpdate: columna B (`"Publicado"`) + columna H (url_post) | ⏳ |
| fy-node-020 | Notificar Éxito Telegram | Telegram (`Ferre_WhatsApp`): título + URL + keyword | ⏳ |
| fy-node-021a | Tags - Split | Code: divide `tags_list` en items individuales (uno por tag) | ⏳ |
| fy-node-021b | Tags - POST Tag | HTTP Request (`Ferre_WordPress`): POST `/wp-json/wp/v2/tags`, `continueOnFail: true` | ⏳ |
| fy-node-021c | Tags - Collect IDs | Code (`runOnceForAllItems`): agrupa IDs de tags nuevos y existentes por post | ⏳ |
| fy-node-021d | Tags - Asignar | HTTP PATCH (`Ferre_WordPress`): asigna array de tag IDs al post | ⏳ |
| fy-node-014 | Error Trigger | Captura errores no controlados en cualquier nodo | ⏳ |
| fy-node-009 | Marcar Error en Sheet | GSheets update: `estado="Error"` | ⏳ |
| fy-node-022 | Notificar Error Telegram | Telegram: keyword + fase + detalle del error | ⏳ |

---

## Notas Técnicas Heredadas de bigotes-felinos

Estos patrones se replican sin modificación al clonar WF1 — ya están probados en producción:

**Patrón `wp_body_json` / `gpt_body_json`:**
Los Code nodes (fy-node-023 y fy-node-006) serializan payloads con `JSON.stringify`. Evita el límite de 4KB de n8n y la corrupción de JSON con saltos de línea. Los nodos HTTP usan `specifyBody: "json"` + `jsonBody: "={{ $json.gpt_body_json }}"`.

**strip4Byte en fy-node-006:**
GPT genera ocasionalmente caracteres Unicode matemáticos de 4 bytes que rompen MySQL con charset `utf8`. La función `strip4Byte()` sanitiza `body_html`, `title`, `excerpt` y campos Yoast antes de construir el payload.

**Cadena de 4 nodos para Tags:**
Code nodes no retienen credenciales en n8n. La gestión de tags usa: Split (Code) → POST Tag (HTTP Request) → Collect IDs (Code, `runOnceForAllItems`) → Asignar (HTTP Request).

**Una sola keyword por ejecución:**
fy-node-003b toma solo el primer item. Si hay varias keywords Aprobadas, se procesan de a una por día L/M/V.

---

## Log de Cambios

| Fecha | Acción | Estado |
|-------|--------|--------|
| 2026-05-01 | Estructura inicial documentada | ✅ |
| 2026-05-01 | Workflow clonado e importado (ID `u3Yfmb2dQS2oYnWo`, inactivo) | ✅ |
| 2026-05-01 | Credenciales remapeadas (Sheets, OpenAI, WP, Gemini) — solo falta Telegram | ✅ |
| 2026-05-01 | Prompt GPT adaptado a "Asesor de Bricolaje" Colombia | ✅ |
| 2026-05-01 | Categorías WP creadas (IDs 331-335) y aplicadas al `categoriaMap` del Code node | ✅ |
| 2026-05-01 | Decisión: Telegram como canal activo (WhatsApp planeado para el futuro) | ✅ |
| 2026-05-01 | Crear bot Telegram + credencial `Ferre_Telegram` (`qoDPp0fY5sJ8AmbE`) + asignar a 2 nodos | ✅ |
| 2026-05-01 | Test del bot Telegram exitoso (mensaje recibido en chat 1591872862) | ✅ |
| 2026-05-01 | **Test exitoso end-to-end** — primer post publicado: post ID `11011`, ejecución `4274`, 55 segundos | ✅ |
| 2026-05-01 | Patches aplicados: `alwaysOutputData=true` en `Leer Estacionales Pendientes` y `Leer Posts Publicados`; "Bigotes Felinos" → "Ferretería Ya" en `Formatear Posts Publicados`; credencial Gemini cambiada temporalmente a `BF - nano banana` (billing) | ✅ |
| 2026-05-05 | **AEO Sprint 1 aplicado** — `Construir Body GPT` reescrito: respuesta_directa, key_takeaways, fuentes_consultadas (whitelist 8 fuentes ICONTEC/RETIE/NSR-10/SENA/fabricantes/This Old House/Family Handyman/OSHA), howto_steps, entities, mini-historias colombianas, prompt question-first H2/H3, tabla obligatoria. `Parsear JSON articulo` reescrito: scrubAIWatermarks, buildFuentesHtml, buildSpeakableJsonLD+mentions, buildHowToJsonLD, wrappers respuesta-directa+key-takeaways. Activos estáticos en `_aeo/sprint-1/` (llms.txt + equipo-editorial.html) pendientes de subir a WP. | ✅ |
| 2026-05-05 | **AEO Sprint 2 aplicado** — añadidos 2 nodos: `Internal Linker` (fy-node-006a) entre Parsear y Quality Gate; `Quality Gate` (fy-node-006b) entre Internal Linker y nano banana. Quality Gate con 18 checks / 120 pts / threshold 70 + HARD GATE de tabla. Total nodos: 33. | ✅ |
| — | Workflow activado en producción | ⏳ |
