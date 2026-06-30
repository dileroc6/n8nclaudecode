# Radar de riesgos — Savia Sales Agent

Documento vivo. Cada riesgo tiene: descripción, impacto (Alto/Medio/Bajo), probabilidad y mitigación. Revisar antes de cada deploy.

## Riesgos del producto (UX cliente)

### R-01 — Agente inventa datos de tallas/materiales · Impacto: Alto
- **Detalle**: WooCommerce de Savia no tiene cargados materiales ni guía de tallas en el sitio público. Si el agente "completa" la información, se generan devoluciones y NPS bajo.
- **Mitigación**: tabla `savia.fichas_producto` curada manualmente al inicio. Tool `kb_consultar` para FAQ. Regla en system prompt: "si no lo tienes documentado, escala". Validar cobertura de KB antes de go-live con 20 conversaciones simuladas.

### R-02 — Overselling entre cotización y pago · Impacto: Alto
- **Detalle**: stock=1, dos clientas chatean al tiempo, ambas reciben link, una paga y la otra después.
- **Mitigación**: re-validar stock dentro del tool `wompi_generar_payment_link` justo antes de crear el link. Aceptamos el riesgo residual de race entre dos links generados en <100ms (poco probable en Sprint 1 con tráfico <100/día).

### R-03 — Cliente paga y no se entera (webhook perdido) · Impacto: Alto
- **Detalle**: Wompi reintenta webhooks pero si n8n estuvo caído >24h, el pago queda en `link_generado` indefinidamente.
- **Mitigación**: cron horario que consulta Wompi por `wompi_payment_link_id` de pedidos `link_generado` con `created_at < now() - 30min` (Sprint 1.5).

### R-04 — Ventana 24h Meta · Impacto: Medio
- **Detalle**: si la clienta no responde en 24h y queremos hacerle follow-up de carrito, Cloud API exige template aprobado.
- **Mitigación**: Sprint 2 — registrar 3 templates Meta: `recordatorio_link_1h`, `oferta_link_24h`, `ultimo_aviso_72h`.

### R-05 — Quejas escaladas sin SLA · Impacto: Medio
- **Detalle**: `escalar_a_admin` notifica al admin vía Evolution, pero no hay garantía de tiempo de respuesta.
- **Mitigación**: Sprint 2 — cron que re-pinguea al admin si `mensajes_logs.intent = 'escalamiento'` lleva >2h sin respuesta humana.

## Riesgos técnicos

### R-06 — Wompi down · Impacto: Alto
- **Detalle**: si la API de Wompi falla, no se puede cerrar venta.
- **Mitigación**: el tool responde al agente `{ error: "wompi_unavailable" }` y la agente comunica al cliente "tuvimos un problema, te pasamos el link en un momento". n8n encola en `savia.pedidos` con estado especial `link_pendiente_wompi` y reintenta.

### R-07 — WooCommerce lento (5s+ por request) · Impacto: Medio
- **Detalle**: si Woo se demora, la latencia del bot sube y la conversión cae.
- **Mitigación**: timeout 5s + fallback a `savia.fichas_producto`. Sincronización nightly (Sprint 1.5) mantiene el cache fresco.

### R-08 — PostgreSQL alcanzado por carga · Impacto: Bajo
- **Detalle**: el schema `savia` comparte instancia con otros clientes. Mensajes_logs crece.
- **Mitigación**: partición mensual de `mensajes_logs` desde Sprint 2. Por ahora, el volumen esperado (<10k filas/mes) es trivial.

### R-09 — Verificación HMAC mal implementada · Impacto: Alto
- **Detalle**: si el cálculo del checksum es incorrecto, o se ignora, alguien puede falsificar webhooks Wompi y marcar pedidos como pagados.
- **Mitigación**: test unitario del Code node con payload real de Wompi de pre-producción antes de go-live. NUNCA hacer fallback a "aceptar sin verificar".

### R-10 — Token Meta expira sin aviso · Impacto: Alto
- **Detalle**: tokens System User no expiran, pero los tokens temporales de prueba sí.
- **Mitigación**: usar System User Token (no temporal) desde el día 1. Cron diario que verifica con `GET /me` y alerta admin si hay error.

## Riesgos legales / compliance

### R-11 — Ley 1581 (habeas data) Colombia · Impacto: Alto
- **Detalle**: tratamos datos personales (teléfono, nombre, email) sin aviso explícito = multa SIC.
- **Mitigación**: aviso de habeas data en el primer mensaje a cliente nuevo. Política de privacidad publicada en savia-wear.com. `clientes.habeas_data_at` registra la aceptación implícita por continuar conversación.

### R-12 — PCI DSS · Impacto: Bajo
- **Detalle**: no procesamos tarjetas directamente — Wompi lo hace.
- **Mitigación**: ya está mitigado por diseño. NUNCA pedir número de tarjeta al cliente.

### R-13 — Almacenamiento de comprobantes (no aplica Sprint 1) · Impacto: N/A
- **Detalle**: si se reactiva flujo transferencia, comprobantes contienen datos bancarios.
- **Mitigación**: queda fuera de Sprint 1 por decisión.

## Riesgos de negocio

### R-14 — Tono del agente off-brand · Impacto: Alto
- **Detalle**: una agente que suene robótica o agresiva daña la marca.
- **Mitigación**: cliente revisa system prompt antes de deploy. 10 conversaciones simuladas en staging. Iteración mensual basada en lecturas de `mensajes_logs`.

### R-15 — Pedidos abandonados acumulan datos sin valor · Impacto: Bajo
- **Detalle**: leads que reciben link y no pagan generan ruido en métricas.
- **Mitigación**: cron que marca `expirado` con `expira_at < now()`. Reportes de conversión solo cuentan pedidos no expirados.

### R-16 — Conflicto Sprint 1 vs Sprint 2 (templates Meta) · Impacto: Medio
- **Detalle**: aprobar templates Meta toma 2-3 días. Si Sprint 2 los necesita, hay que enviarlos a aprobación antes.
- **Mitigación**: enviar drafts de los 3 templates de carrito a Meta al inicio de Sprint 1, paralelizando.

## Riesgos operacionales

### R-17 — Cliente cambia productos en Woo sin avisar · Impacto: Medio
- **Detalle**: descontinúan una línea y el agente sigue recomendando.
- **Mitigación**: tool `woocommerce_buscar_productos` filtra `stock_status=instock`. Pero si el producto sigue publicado con stock=0 se filtra solo. La sincronización nightly del cache también marca productos descontinuados.

### R-18 — Admin no escanea QR de Evolution después de un cierre de sesión · Impacto: Medio
- **Detalle**: si la instancia `savia-admin` se desconecta, las alertas de tarifa premium no llegan.
- **Mitigación**: cron horario que pingea `/instance/connectionState/savia-admin` y avisa por canal alternativo (Telegram del developer) si está disconnected.

---

## Resumen ejecutivo

**Top-3 riesgos a vigilar en go-live:**
1. **R-09** — Verificación HMAC de Wompi (financiero).
2. **R-01** — Alucinación de tallas/materiales (devoluciones).
3. **R-11** — Habeas data sin aviso (regulatorio).

Los demás se gestionan en operación normal.
