# El Agente de Atención, genérico

`agente-atencion-generico.json` — **un solo workflow para todos los clientes.**

La idea de fondo: la diferencia entre un cliente y otro vive en una fila de
`agent_config`, no en un workflow distinto de n8n. Cliente nuevo = fila nueva.
Esa es toda la razón por la que el producto estándar puede bajar de 45–90 horas
de implementación a 11–14.

## Qué hace, en orden

| Nodo | Qué resuelve |
|---|---|
| Entrada WhatsApp | Un webhook para todos. La empresa NO va en la URL |
| Extraer mensaje | Descarta lo que no merece atención y **anota por qué** |
| Contexto del inquilino | `tf_agente_contexto` — una consulta, siete respuestas |
| ¿Hay agente activo? | Línea sin configurar, o un humano ya metido: se calla |
| Armar el prompt | Bloque estable arriba (cacheado), lo que cambia abajo |
| Claude responde | Herramienta forzada: la respuesta llega estructurada o no llega |
| Guardar el turno | `tf_agente_registrar` — contacto, conversación y consumo, una transacción |
| ¿Es modo prueba? | Sandbox: mismo flujo real, la salida se desvía a `test_messages` |
| Enviar / Escalar | Evolution, y aviso al humano cuando hace falta |

## Antes de importarlo

1. **Credencial de Postgres.** Los dos nodos traen `"id": "REEMPLAZAR"`.
   Apuntarlos a la credencial de Supabase con el rol `n8n_worker` —nunca
   `service_role`.
2. **Variables de entorno en n8n:**
   `ANTHROPIC_API_KEY`, `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`,
   `TOQUE_GRUPO_FALLBACK` (a dónde va un aviso si el agente no dio destino), y
   opcionalmente `TOQUE_MODELO_AGENTE` para cambiar de modelo sin tocar el flujo.
3. **Apuntar Evolution al webhook** `.../webhook/toque-agente`.
4. **Dar de alta al cliente:** una fila en `agent_config` con su
   `whatsapp_instance`, y `activo = false` hasta que el sandbox se vea bien.

## Las dos cosas que no hay que romper

**El bloque cacheable es un match de prefijo byte a byte.** Si en el nodo
"Armar el prompt" se cuela la fecha, el nombre de quien escribe o cualquier cosa
que cambie entre mensajes, el caché deja de servir y la factura se multiplica.
Sin error, sin aviso: solo la cuenta más alta a fin de mes. Por eso el nombre del
contacto va en el mensaje y no en el sistema.

**El `company_id` no se acepta del payload.** Se deriva de la instancia de
WhatsApp, adentro de la base, tanto al leer como al escribir. Aunque el workflow
tuviera un bug, no puede escribirle a otra empresa.

## Lo que todavía no hace

Agendar. El agente ya sabe **decir** que alguien quiere una cita
(`accion: "agendar"`), pero no la crea: falta el brazo contra Google Calendar.
Hasta entonces ese caso se comporta como un escalamiento.
