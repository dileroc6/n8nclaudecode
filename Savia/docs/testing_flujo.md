# Flujo de testing — WF-01 Savia Bot Ventas

> Guía de prueba manual desde WhatsApp del usuario hacia el número del bot.
> Cada bloque cubre una funcionalidad. Ejecutar en orden, simulando ser una clienta nueva.

---

## Setup previo

- [ ] WF-01 (`JkW5xEbusWOJKI1R`) activo en n8n
- [ ] Evolution instance `savia` conectada (escanear QR)
- [ ] KB cargado con `database/003_update_kb_from_real_conversations.sql` (8 tópicos)
- [ ] Catálogo WC poblado (correr WF-S1 al menos una vez)
- [ ] Variables de entorno OK en docker-compose
- [ ] Reiniciar PG / borrar contactos de prueba antes de cada ciclo de testing (idempotencia):
  ```sql
  DELETE FROM savia.clientes WHERE telefono = 'TU_TELEFONO_TEST';
  DELETE FROM savia.mensajes_logs WHERE telefono = 'TU_TELEFONO_TEST';
  DELETE FROM savia.contactos_dia WHERE telefono = 'TU_TELEFONO_TEST';
  ```

---

## 1. Saludo inicial + aviso de habeas data

| # | Tu mensaje | Esperado |
|---|---|---|
| 1.1 | `hola` | "Hola! bienvenida a Savia 🌿 cuéntame qué buscas. al continuar la conversación aceptas el tratamiento de tus datos: https://savia-wear.com/politica-privacidad" |

✅ Validar:
- Saludo exacto
- Aviso de privacidad SOLO en este primer mensaje
- Una sola pregunta abierta al final

---

## 2. No resaludar

| # | Tu mensaje | Esperado |
|---|---|---|
| 2.1 | `tienen leggings?` | Respuesta sobre leggings **SIN** "Hola" ni "Bienvenida" |
| 2.2 | `cuánto cuestan?` | Respuesta directa **SIN** saludo |

✅ Validar: a partir del 2º mensaje, NUNCA repite saludo ni link de privacidad.

---

## 3. Catálogo

| # | Tu mensaje | Esperado (palabras clave) |
|---|---|---|
| 3.1 | `tienen catálogo?` | `https://wa.me/c/573127048911` + invitación a decir cuál te llama |
| 3.2 | `enviame fotos` | mismo link del catálogo |
| 3.3 | `precios` | mismo link + web `savia-wear.com` |

✅ Validar: link aparece tal cual, sin Markdown.

---

## 4. Producto (búsqueda con tool real)

| # | Tu mensaje | Esperado |
|---|---|---|
| 4.1 | `tienen leggings?` | Devuelve un producto real de WC (Leggings Terra o Natura) con **precio real** |
| 4.2 | `me gusta el legging Terra` | Detalles del producto **SIN inventar** (solo lo que viene del tool) |
| 4.3 | `cuánto cuesta?` | Precio del **mismo** producto (no busca otro) |

✅ Validar:
- Precio coincide con WC
- NO inventa "transpirable", "premium", etc. si no vienen del tool
- Mantiene el contexto del producto

---

## 5. Tallas

| # | Tu mensaje | Esperado |
|---|---|---|
| 5.1 | `qué tallas manejan?` | "talla única elástica que adapta de S a M (algunas L según medidas), pásame tu cintura y cadera y te confirmo" |
| 5.2 | `solo tienen S?` | Misma respuesta: talla única elástica |
| 5.3 | `cintura 70 cadera 95` | Confirma que es talla S-M, debería quedarte bien |

✅ Validar: NUNCA dice "S, M, L, XL" como tallas disponibles. Siempre talla única + pide medidas.

---

## 6. Material

| # | Tu mensaje | Esperado |
|---|---|---|
| 6.1 | `de qué material son?` | "poliéster + elastano" con detalles (suave, no transparenta, segunda piel) |
| 6.2 | `no me gusta el poliéster` | Frase de manejo de objeción: "te entiendo, justo elegimos esa mezcla porque..." |

✅ Validar: NO inventa "algodón orgánico", "bambú", "lycra" u otros materiales.

---

## 7. Colores (data NO existe en WC)

| # | Tu mensaje | Esperado |
|---|---|---|
| 7.1 | `qué colores tienen?` | "los colores los puedes ver con foto en el catálogo: https://wa.me/c/573127048911 — dime cuál te gusta" |
| 7.2 | `tienen rosa?` | Mismo redirect al catálogo + escala a admin |
| 7.3 | `del legging Terra qué colores hay?` | Mismo redirect al catálogo |

❌ **NO DEBE PASAR** (bug histórico): bot dice "viene en verde y negro" inventado.

✅ Validar: escalar_a_admin se ejecuta y llega notificación al admin.

---

## 8. Métodos de pago

| # | Tu mensaje | Esperado |
|---|---|---|
| 8.1 | `puedo pagar con Nequi?` | Sí, explica MP web + Nequi/transferencia por WA |
| 8.2 | `manejan transferencia?` | Sí, con llave por WhatsApp directo |
| 8.3 | `tienen Sistecrédito?` | No, redirige a MP/Nequi/transferencia |
| 8.4 | `aceptan contraentrega?` | No, redirige a MP/Nequi/transferencia |
| 8.5 | `manejan llave?` | Sí, transferencia con llave por WhatsApp |

✅ Validar: NUNCA dice que aceptan Sistecrédito ni contraentrega.

---

## 9. Códigos de descuento

| # | Tu mensaje | Esperado |
|---|---|---|
| 9.1 | `quiero mi 20%` | Devuelve `madres20off` (si está en KB) |
| 9.2 | `tienen descuento?` | Mismo código + cómo aplicarlo |
| 9.3 | `cuál es el código actual?` | Mismo código vigente |

Si el código está vencido en el KB:
| 9.4 | `quiero mi 15%` | "ese código ya finalizó, pásame lo que te gustó y te ayudo con un beneficio especial" |

---

## 10. Ubicación y despacho

| # | Tu mensaje | Esperado |
|---|---|---|
| 10.1 | `dónde están ubicados?` | "somos tienda online, despachamos desde Bogotá a todo el país" |
| 10.2 | `tienen tienda física?` | No, solo online |
| 10.3 | `desde qué ciudad despachan?` | Bogotá |

---

## 11. Compra separada

| # | Tu mensaje | Esperado |
|---|---|---|
| 11.1 | `puedo comprar solo el legging?` | "claro, también vendemos cada pieza por separado, dime cuál te interesa" |
| 11.2 | `puedo comprar solo el top?` | Mismo: sí, por separado |

---

## 12. Flow de cierre — pago con MercadoPago

| # | Tu mensaje | Esperado |
|---|---|---|
| 12.1 | `me llevo el legging Terra` | Confirma producto, pregunta método de pago |
| 12.2 | `por MercadoPago` | Pide datos (nombre, confirma talla) |
| 12.3 | `me llamo Ana Pérez` | Llama `crear_pedido_woo` con datos + talla='unica' |
| 12.4 | (espera respuesta) | Devuelve **link de pago** real de MercadoPago |

✅ Validar:
- Tabla `savia.pedidos` tiene un row nuevo con `estado='link_generado'`
- El link funciona y abre el checkout MP

---

## 13. Flow de cierre — pago con Nequi/transferencia

| # | Tu mensaje | Esperado |
|---|---|---|
| 13.1 | `me llevo el legging Terra` | Confirma + pregunta método |
| 13.2 | `por Nequi` | Pide nombre, confirma producto |
| 13.3 | `me llamo María López` | Llama `escalar_a_admin` con motivo='pago_directo' |
| 13.4 | (espera respuesta) | "listo, ya pasé tu pedido al equipo para coordinar el pago por Nequi/transferencia, en un momentico te escriben" |

✅ Validar:
- Admin (`SAVIA_ADMIN_PHONES`) recibe WhatsApp con resumen del pedido
- No se crea pedido en WC (porque MP no aplica)

---

## 14. Webhook WC — confirmación de pago (WF-02)

Después de pagar el link de MP (sandbox):

✅ Validar:
- WF-02 (`qOwllAj32Pwo5l5g`) ejecuta correctamente
- `savia.pedidos.estado` pasa de `link_generado` → `pago_confirmado`
- Cliente recibe mensaje de confirmación por WhatsApp

---

## 15. Alerta tarifa premium (WF-03)

Con `SAVIA_TARIFA_PREMIUM_THRESHOLD=3` en staging:
1. Crear 4 contactos distintos en el mismo día
2. Al 4º contacto único debe disparar WF-03
3. Admin recibe alerta

✅ Validar:
- `savia.metricas_dia.tarifa_premium_activada_ts` se setea (idempotencia)
- Una sola alerta por día, no por mensaje

---

## 16. Casos edge

| # | Tu mensaje | Esperado |
|---|---|---|
| 16.1 | `eres bonita` o coqueteo | "esto es el canal de ventas de Savia, si te interesa algo del catálogo cuéntame" (corto) |
| 16.2 | `me das tu número?` | Mismo cierre profesional |
| 16.3 | `cuál es el sentido de la vida?` | Redirige a ventas |
| 16.4 | Mensaje vacío o solo emoji | El bot pide aclarar qué busca |
| 16.5 | Mensaje muy largo / off-topic | Bot reconduce a ventas |

---

## 17. Tono colombiano (no argentino)

Validar que en NINGÚN mensaje el bot use:
- ❌ podés, preferís, querés, sabés, tenés, pasame, decime, mirá
- ❌ ¿vos qué buscás?

Debe usar:
- ✅ puedes, prefieres, quieres, sabes, tienes, pásala, dime, mira
- ✅ "¿qué buscas?" o "¿qué tal te llama?"

---

## 18. No usar Markdown

Validar que NUNCA aparezca en respuestas del bot:
- `![alt](url)` para imágenes
- `**negritas**` o `*negritas*`
- `# Header`
- Listas con `*` o `-`

Si comparte imágenes, debe ser URL plana: `te paso la foto: https://savia-wear.com/...`

---

## Checklist final post-testing

- [ ] Todos los flows 1-16 pasan
- [ ] Tono 100% colombiano (no argentino)
- [ ] Cero Markdown en respuestas
- [ ] Cero invenciones de colores/materiales/tallas
- [ ] Logs en `mensajes_logs` correctos (in/out, intent)
- [ ] Pedidos generados con `woo_order_id` válido
- [ ] Webhook WC actualiza estado
- [ ] Alerta tarifa premium dispara una sola vez por día
