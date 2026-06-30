# Pendientes — Luxe Smile

> Tracker de revisión y mejoras del proyecto.
> Última actualización: 2026-05-19 (jornada de hardening WF-01 + test E2E exitoso).
> Generado a partir del review de arquitectura post-refactor del prompt WF-01.

---

## 🎉 Hito alcanzado: flujo E2E funcionando (2026-05-19)

Probado de punta a punta vía `dev-router`:
```
✅ Captación (saludo suave + pregunta de interés)
✅ Calificación (paquete completo + explicación del proceso)
✅ Deflección de precio
✅ Lead envía fotos → reenvío al grupo Revisión de Casos
✅ Médico responde "0127 VIABLE: ..." → parseo correcto
✅ Cotización formateada con IA → enviada al lead ($6000 + elección de mes)
✅ Confirmación al grupo
```

### Fixes aplicados hoy a WF-01 (post-review)
| Fix | Detalle |
|---|---|
| Structured output | `conversationalAgent` → `toolsAgent` + Structured Output Parser (`autoFix`) + modelo conectado al parser. El conversational ignoraba el formato JSON. |
| Parser robusto | Maneja objeto / JSON-string / texto plano + fallback bilingüe. Sin overrides hardcoded. |
| Bug de amnesia | El IF "¿Lead existe?" mandaba leads existentes a la rama "nuevo" (expresión booleana mal evaluada). Cambiado a check type-safe. Sin esto el bot no cargaba historial y repetía. |
| UX saludo | El saludo inicial ahora saluda + pregunta interés (no tira el paquete de una). |
| WA Router grupos | Mensajes de los grupos de Luxe (médico/admin) se rutean a LUXE sin necesitar prefijo. Antes el router los descartaba → el médico "no recibía respuesta". |
| `onError` safety net | El AI Agent ya no tumba el workflow ni alerta al admin si algo falla. |

---

## ✅ Lo que está bien (no tocar)

- **WA Router pattern multi-cliente** ([WF `IxpEmIZCHPPp4sC7`](https://n8n.srv1398596.hstgr.cloud/workflow/IxpEmIZCHPPp4sC7)) — limpio, escalable, una instancia Evolution sirve a N clientes vía prefijo.
- **Modelo de datos dividido** (local = estado conversacional, CRM Cima Labs = negocio) — bien justificado, schema slim aplicado.
- **Refactor prompt IA-driven** (post 2026-05-19) — sin scripts hardcoded, IA decide intención/fase/respuesta.
- **Single source of truth del prompt** en `parameters.options.systemMessage` del AI Agent node.
- **Cuestionario a Cima Labs estructurado por prioridad** (P1/P2/P3) con diagrama de flujo.
- **Fix env var `EVOLUTION_INSTANCE_LUXE=dev-router`** sin tocar workflows — patrón replicable cuando se conecte el QR oficial.

---

## 🔴 Críticos (afectan confiabilidad/escalabilidad)

| # | Estado | Item | Por qué importa | Fix |
|---|---|---|---|---|
| C1 | ✅ Hecho 2026-05-19 | **Detección de idioma por regex** | Violaba el principio "IA para entender/decidir". Mixed messages como `Hi quiero saber más` caían mal por keyword matching. | Regex eliminado. La IA detecta el idioma en captacion y devuelve `language: 'en'|'es'` en el JSON. Code node solo persiste. **Bonus**: limpieza completa del Parser (eliminados `Force proceso_explicado`, `Force sendImage`, y reemplazos hardcoded de emojis). |
| C2 | ✅ Resuelto 2026-05-19 | **AI Agent usa OpenAI (era discrepancia con docs)** | Las docs hablaban de Claude/Anthropic pero el modelo en producción es GPT. | Decisión del proyecto: **mantener OpenAI (GPT)**. Docs actualizados: `CLAUDE_MODEL` → `OPENAI_MODEL`, `ANTHROPIC_API_KEY` → `OPENAI_API_KEY`, credenciales y status reflejan la decisión. |
| C3 | ✅ Hecho 2026-05-19 | **No idempotencia en webhook entrante** | Evolution reintenta webhooks por timeout/network. Sin chequeo de `message.id`, el lead recibe respuestas duplicadas. | Tabla `luxe_smile.mensajes_procesados` creada (PK `message_id`). 3 nodos nuevos en WF-01: `Verificar duplicado` (Postgres INSERT ON CONFLICT RETURNING) → `¿Mensaje nuevo?` (IF) → fork TRUE/FALSE a flujo normal o `Detener — mensaje duplicado`. |
| C4 | ✅ Falso positivo 2026-05-19 | **Suposición errónea sobre `WHATSAPP_GROUP_CASOS`** | Mi review original asumió que la env var no estaba seteada. | Verificado contra el contenedor: `WHATSAPP_GROUP_CASOS=120363409047825899@g.us` y `WHATSAPP_GROUP_PAGOS=120363411157984355@g.us` ya están definidas. El bot SÍ reenvía las fotos al grupo correcto. **No requiere acción.** |

---

## ⏸️ Diferidos (bloqueados por inputs externos)

| # | Item | Bloqueado por | Notas |
|---|---|---|---|
| D1 | **WF-07 Admin refactor IA-driven** | Respuesta de Cima Labs (agenda) | Hallazgo del review: WF-07 usa comandos rígidos por keyword (`STATUS`, `BLOQUEAR mayo`) en vez de lenguaje natural como dice el spec. Además: faltan intents (`CANCELAR_CITA`, `BLOQUEAR_RANGO`), falta generación de disculpa con IA, y tiene un **bug de schema** (INSERT usa columna `descripcion` inexistente en `agenda_bloques`). Está `active: false`. Se difiere porque sus acciones de agenda dependen de cómo el CRM maneje disponibilidad. |
| D2 | **WF-03 Cotización/cierre** | Info del cliente | El lead elige mes → Wait 90s → depósito $500. Necesita los detalles de negocio que el cliente debe enviar. También: definir el handoff WF-01→WF-03 (estado `cotizacion_enviada` no está en el prompt de WF-01). |
| D3 | **WF-04/05 Pagos** | Credenciales PayPal | Client ID + Secret pendientes del cliente. |
| D4 | **WF-06 Datos/Agenda + integración CRM (Fase 2-4)** | Respuesta de Cima Labs | Todo el plan de integración CRM ([crm-integration-plan.md](crm-integration-plan.md)) espera el cuestionario. |

---

## 🟡 Importantes — todas resueltas 2026-05-19 (excepto I6)

| # | Estado | Item | Resolución |
|---|---|---|---|
| I1 | ✅ Hecho | CLAUDE.md estado list desactualizado | Diagrama de máquina de estados en sec 6 actualizado con `proceso_explicado`, `fotos_solicitadas`, `otro`, `descartado`, `reprogramar_pendiente` + nota de estados bot-internos. |
| I2 | ✅ Hecho | No retry/fallback en AI Agent | `retryOnFail: true, maxTries: 3, waitBetweenTries: 2000` en el AI Agent de WF-01 (resiliencia ante errores transitorios de OpenAI). |
| I3 | ✅ Hecho | Historial crece sin límite | Code node `Preparar contexto para agente` ahora hace `.slice(-20)` — solo los últimos 20 turnos al modelo. |
| I4 | ✅ Hecho | Observabilidad de decisiones IA | Columna `intent VARCHAR(40)` en `luxe_smile.mensajes`. WF-01 guarda el `intent` de la IA en cada mensaje del bot. Tokens/latencia descartados (n8n no los expone confiablemente). |
| I5 | ✅ Ya cubierto | Guard de `sendImage` | El Parser robusto ya hace `sendImage = parsed.sendImage === true && newState === 'fotos_solicitadas'`. El guard compuesto ya existe — no requería redundancia. |
| I6 | ⏳ Fase 6 | Columnas DEPRECATED en `luxe_smile.leads` | Se dropean en Fase 6 (limpieza) de la integración CRM, cuando confirmemos que ningún workflow las lee. |

---

## 🟢 Nice-to-haves (cuando haya tiempo)

| # | Item | Por qué | Fix propuesto |
|---|---|---|---|
| N1 | **`.md` del prompt y prompt en n8n: sync manual** | Si alguien edita uno y no el otro, divergen. | Largo plazo: script bash en `.claude/` que extraiga `parameters.options.systemMessage` del WF-01 vía MCP y escriba al `.md`. Para correr antes de cada commit. |
| N2 | **WF-01 tiene 37 nodos** | Algunos sub-flujos (envío imagen al grupo) son 6+ nodos. Visualmente denso. | Refactor: extraer envío de fotos al grupo como sub-workflow reutilizable (Execute Workflow node). Postergar hasta tener stabilidad. |
| N3 | **Multi-cliente colision en dev-router** | Foto sin prefijo defaultea a SAVIA (por router code). Si Diego testea Luxe enviando una foto sin caption "LUXE", se va a Savia. | Documentar el prefijo `LUXE` como requisito de testing en `docs/testing.md` (no existe aún). |
| N4 | **Falta validación del output JSON del AI Agent** | Si la IA devuelve JSON malformado (raro pero pasa), el Parser node falla feo. | Wrap el Parser en try/catch + fallback "Sorry, I had a small hiccup. Could you repeat?". |
| N5 | **No hay test suite conversacional** | Cada cambio de prompt requiere test manual via WhatsApp. Lento, no reproducible. | Crear `tests/test-conversaciones.md` con conversaciones de referencia (input → output esperado). Validable con un workflow que dispara cada uno y compara. |
| N6 | **Hardcoded URL del CRM Cima Labs en cada nodo HTTP** | Cuando arranque Fase 2 (integración WF-02→07 con CRM) va a estar en ~15 nodos. | Cuando Cima Labs responda y desbloquemos Fase 2: re-evaluar si vale la pena un sub-workflow "CRM API" que centralice todas las llamadas. |
| N7 | **Prompt ejemplo de deflección en inglés solamente** | El bot lo traduce ok, pero más robusto si el prompt da ejemplos en ambos idiomas. | Agregar línea en el prompt: español equivalente "Nuestros especialistas necesitan ver tu sonrisa primero — así la cotización refleja TU caso específico, no un estimado genérico." |

---

## Resumen ejecutivo (actualizado 2026-05-19)

**🟢 Críticos: cerrados en bloque (C1, C2, C3, C4).** Quedó pendiente solo el test E2E post-cambios para confirmar que todo el pipeline funciona junto.

**Próximo sprint (1-2 horas):**
- Test conversacional E2E (LUXE Hi + flujo completo hasta envío de fotos al grupo) — usuario
- I1 (sync estado list en CLAUDE.md sec 6) — 5 min
- I5 (guard adicional en IF sendImage) — 10 min (defensivo, ya hay guard en el Parser)

**Antes de Fase 2 (integración CRM Cima Labs):**
- I2 (retry/fallback AI Agent) — 30 min
- I3 (truncar historial conversacional) — 20 min

**Antes de go-live:**
- I4 (observabilidad: intent + tokens + latencia) — 1 hora
- Respuesta del cuestionario Cima Labs (bloqueante de Fase 2)
- QR oficial de Luxe Smile escaneado (cambiar `EVOLUTION_INSTANCE_LUXE=dev-router` → `luxe-smile`)

**Después de go-live:**
- N1-N7 — calidad de vida y refactorings visuales

---

## Cómo decidir qué hacer primero

```
¿El proyecto puede arrancar producción HOY con esto? → Falta solo test E2E (Críticos cerrados)
¿El proyecto puede escalar a 50 leads/día sin caerse? → + I2, I3, I5
¿El equipo puede mantener este código sin Claude Code? → + I1, I4, N1, N5
```
