# Sprint 2 — Question-first + Entidades + Quality Gate (Ferretería Ya)

**Aplicado:** 2026-05-05 (junto con Sprint 1, batch atómico al WF1)
**Workflow afectado:** `Ferretería Ya - WF-1 - Blog SEO` (`u3Yfmb2dQS2oYnWo`)

## Entregables

### Question-first H2/H3
- **Prompt (`Construir Body GPT`):** regla "70% o más de los H2 y H3 deben formularse como PREGUNTAS REALES". Empezar con `¿Por qué...? ¿Cómo...? ¿Qué...? ¿Cuál es...? ¿Cuánto...?`.
- **Parser (`Parsear JSON articulo`):** función `aplicarInterrogacion()` dentro de `capitalizarHeadings()` — auto-añade `¿?` cuando el heading empieza con palabra interrogativa pero no tiene los signos.
- **Quality Gate check #18:** ratio H2 question-first del cuerpo (excluye H2 estructurales: Conclusión, Preguntas frecuentes, Fuentes consultadas) ≥60% → 5 pts; ≥40% → 3 pts; ≥20% → 1 pt.

### Capa de entidades (Knowledge Graph)
- **Prompt:** GPT genera `entities[]` con `{nombre, tipo, wikipedia_url}`. Tipos válidos: `marca`, `norma`, `material`, `herramienta`, `tecnica`, `organizacion`. Solo Wikipedia ES URLs reales — no inventar.
- **Parser:** `buildSpeakableJsonLD(entities)` extiende el `WebPage` schema con `mentions[]` apuntando a Wikipedia → señal Knowledge Graph para Google.

### Quality Gate (18 checks / 120 pts / threshold 70)

Insertado entre `Parsear JSON articulo` y `Llamar nano banana`, después del `Internal Linker`.

| # | Check | Pts | Crítico |
|---|-------|-----|---------|
| 1 | Word count ≥1800 | 10 | |
| 2 | H2 count 4-7 | 10 | |
| 3 | Keyword en primeros 200 chars | 10 | |
| 4 | Density 0.5-2% | 10 | |
| 5 | Internal links ≥2 (excluye CTA tienda) | 5 | |
| 6 | External nofollow ≥1 | 5 | |
| 7 | Yoast SEO title 50-60 chars | 5 | |
| 8 | Yoast meta description 130-145 chars | 5 | |
| 9 | `respuesta_directa` 80-320 chars (primer `<p>`) | 5 | |
| 10 | `key-takeaways` block presente | 5 | |
| 11 | FAQ + JSON-LD FAQPage | 5 | |
| 12 | Frases prohibidas = 0 | 10 | |
| 13 | Mini-historias ≥2 (heurística) | 5 | |
| 14 | Avg sentence <25 palabras | 5 | |
| 15 | Tags ≥5 | 5 | |
| 16 | Fuentes consultadas ≥3 | 5 | |
| 17 | **Tabla / data-box presente** | 10 | **🔴 HARD GATE** |
| 18 | H2 question-first ratio ≥60% (filtra H2 estructurales) | 5 | |

**Comportamiento:**
- Si `!hasTable` (check 17) → `throw new Error()` independiente del score.
- Si `score < 70` → `throw new Error(breakdown)`.
- Error Trigger captura → marca Sheet `Error` + envía Telegram con el breakdown completo.

### Frases prohibidas extendidas (Ferretería)
Heredadas de BF (genéricas) + específicas del nicho ferretería detectadas en posts corporativos colombianos:
- `en el mundo de`, `cuando se trata de`, `es importante señalar`, `cabe destacar`, `en la era digital`, `hoy en día`, `en el dinámico mundo`, `en última instancia`
- **Específicas Ferretería:** `soluciones a la medida`, `soluciones integrales`, `amplio portafolio`, `amplio catálogo`, `calidad garantizada`, `cumplir con las expectativas`

### Internal Linker (también nuevo en este sprint)
- **Antes del Quality Gate.** Strippea URLs internas alucinadas por GPT (no presentes en `Leer Posts Publicados`). Permite URLs de tienda (`/categoria-producto/`, `/producto/`, `/tienda/`).
- Si quedan <2 enlaces internos válidos al blog, inyecta automáticamente buscando coincidencias de keyword del post-objetivo en el body, sin re-enlazar texto que ya está dentro de un `<a>`.

## Cambios en el flujo

```
Parsear JSON articulo
      ↓
Internal Linker        ← (Sprint 2)
      ↓
Quality Gate           ← (Sprint 1 D5 HARD GATE + Sprint 2 18 checks)
      ↓
Llamar nano banana
```

El Quality Gate corre **antes** de la generación de imagen — ahorra ~$0.003 + ~5s por artículo rechazado.

## Lecciones aprendidas heredadas de BF
- Filtro de H2 estructurales en check #18 (excluir Conclusión / Preguntas frecuentes / Fuentes consultadas) para no penalizar H2 no-pregunta legítimos.
- `scrubAIWatermarks()` aplicado en parser **antes** de añadir bloque de Fuentes consultadas — los em-dashes en el bloque de fuentes son intencionales como separador visual y no deben ser scrubbed.
- `buildFuentesHtml` aplica `stripInvisibles` (que elimina `\p{Cf}` Unicode invisibles) sobre cada nombre/url/descripcion antes de generar el HTML.
