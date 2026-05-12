# Sprint 1 — Cimientos AEO (Ferretería Ya)

**Aplicado:** 2026-05-05
**Workflow afectado:** `Ferretería Ya - WF-1 - Blog SEO` (`u3Yfmb2dQS2oYnWo`)

## Entregables

### D1 — Activos estáticos (este folder)
- **`llms.txt`** → desplegar como `https://ferreteriaya.com.co/llms.txt` vía Hostinger File Manager o WP File Manager. Es el discovery file para LLMs (ChatGPT, Perplexity, Gemini).
- **`equipo-editorial.html`** → crear página WP con slug `equipo-editorial`, título "Equipo Editorial". Pegar este HTML en modo HTML del editor. Tras publicar, configurar Yoast meta (title 50-60 chars, metadesc 130-145 chars) — opcional.

### D2 — Bloque `<section class="fuentes-consultadas">` por artículo
- **Whitelist aprobada (8 fuentes):** ICONTEC, RETIE, NSR-10, SENA, fichas de fabricantes (Corona, Argos, Pintuco, Sika, Bosch, DeWalt, Stanley, Truper, Black+Decker, Makita), This Old House, Family Handyman, OSHA.
- **Cambio en WF1 prompt (`Construir Body GPT`):** GPT debe devolver `fuentes_consultadas[]` con 3-5 items `{nombre, url, descripcion}`, restringidos a la whitelist.
- **Cambio en WF1 parser (`Parsear JSON articulo`):** función `buildFuentesHtml()` construye `<section class="fuentes-consultadas">` al final del body. Cada `<a>` lleva `rel="nofollow noopener" target="_blank"`.
- **Validación en `Quality Gate`:** check #16 valida que haya ≥3 fuentes (5 pts). Si <3, no falla pero penaliza.

### D3-D4 — Schemas Speakable + HowTo + WebPage mentions
- **`buildSpeakableJsonLD(entities)`** en parser: emite JSON-LD `WebPage` con `speakable.cssSelector = ['.respuesta-directa', '.key-takeaways']`. Si vienen `entities[]` con Wikipedia URLs, añade `mentions[]` con `sameAs` (Knowledge Graph signal).
- **`buildHowToJsonLD(steps, name)`** en parser: solo si la keyword es procedural y GPT devuelve ≥4 `howto_steps[]`.
- **Wrappers:**
  - `respuesta_directa` → `<p class="respuesta-directa">` (primer párrafo, AI Search optimization).
  - `key_takeaways[]` → `<blockquote class="key-takeaways">` antes del primer H2.

### D5 — Tabla obligatoria + HARD GATE
- **Prompt:** "TABLA OBLIGATORIA INNEGOCIABLE — cada artículo debe incluir mínimo 1 `<table>` o `<dl>`". Ejemplos por tipo de keyword (comparativa, numérica, calibres, lista).
- **HARD GATE en `Quality Gate`:** si no hay `<table>` ni `<dl>`, lanza `throw new Error()` independiente del score. Esto evita gastar costo de imagen + publicar basura.

## Cambios estructurales en WF1

Antes:
```
Parsear JSON articulo → Llamar nano banana
```

Después:
```
Parsear JSON articulo → Internal Linker → Quality Gate → Llamar nano banana
```

(`Internal Linker` y `Quality Gate` también incluyen lógica de Sprint 2 — ver `_aeo/sprint-2/README.md`.)

## Archivos en este folder

- `llms.txt` — pegar en raíz del dominio
- `equipo-editorial.html` — pegar como página WP
- `README.md` — este documento
