# Brief para la IA de la plataforma (repo Websites)

> Copiar este archivo + `arquitectura-toque.md` + `diagramas-mvp.md` al repo Websites, y pasar el texto de abajo como prompt inicial.

---

**Contexto — Toque.** Este repo (Websites) es la **plataforma Toque**: nuestro producto multi-cliente de automatizaciones. Frontend **HTML** hospedado en **Hostinger**, base de datos y backend en **Supabase**. Existe un segundo sistema, en **n8n** (VPS Hostinger, junto a Evolution API y una Postgres compartida), que es el **motor de integración**: WhatsApp vía Evolution, IA/LLM, crons y envíos. Los dos sistemas se desarrollan en repos separados y se coordinan por un contrato. Revisa `docs/arquitectura-toque.md` (diagramas lógico e infraestructura) y `docs/diagramas-mvp.md` (flujos del primer cliente).

**Las 3 reglas de arquitectura:**
1. **La plataforma (Supabase) es dueña de los datos** — única fuente de verdad. n8n NO guarda estado de negocio.
2. **n8n es un worker sin estado** — la plataforma lo dispara por eventos/webhooks; n8n lee y escribe datos vía Supabase y reporta resultados de vuelta.
3. **El contrato es Supabase** — su API REST + Auth + **Database Webhooks / Edge Functions**. Nada de bases compartidas ni lógica duplicada en dos lados.

**Convención de trabajo (dev):** este repo trabaja SOLO la plataforma (Supabase, edge functions, frontend, dashboards, pagos, config). Los flujos de WhatsApp/IA/envíos se trabajan en el otro repo (n8n). El punto de encuentro es el contrato de Supabase. No implementar lógica de mensajería aquí ni datos de negocio en n8n.

**Esto es el ESTÁNDAR de Toque para TODOS los clientes que lleguen, no solo Bejauha.** Bejauha es el piloto que sienta el patrón. Por eso todo debe ser **multi-tenant y reutilizable desde el diseño** (mismo esquema base, mismos webhooks, mismo motor n8n parametrizado por tenant) — no a la medida de un solo cliente. Sumar un cliente nuevo debe ser configurarlo, no reconstruir.

**Primer cliente — Bejauha (estudio de yoga):**
- **Tipos de servicio:** `Karma` (sin pago / antiguos → a reactivar), `Beja` (suscripción normal), `Uja` (premium, domingos permanentes), `Paquete N` (ej. PAQUETE 4). **Solo los paquetes descuentan clases**, tienen fecha de renovación y pueden quedar en estado **Deudor** (deudor solo aplica a paquetes).
- **Estados:** activo, no activo, prospecto, deudor, embajador.
- **Flujos que ejecuta n8n** (la plataforma los alimenta y configura):
  - Gestión de clases de paquetes: asistencia (−1), recarga (+N), consulta.
  - Reactivación / outbound: campaña **parametrizable** (el cliente define filtros + texto del mensaje + cantidad + frecuencia), envío en **lotes de 5** (anti-baneo), marca seguimiento.
  - Inbound: bot que resuelve dudas de los planes y **transfiere a un humano** cuando hay interés real.
  - Recordatorio de última clase (paquete con 1 clase restante) → cliente + admin.
  - Tracking de deudor (solo paquetes).

**Tu tarea, en dos partes:**
1. **Inventario:** dime qué hay ya construido en este repo — esquema de Supabase (tablas y columnas), cómo modelas los tenants/clientes, auth y RLS, y si ya existen edge functions o webhooks.
2. **Propuesta de contrato para n8n:**
   - **Esquema multi-tenant** con `tenant_id` en todas las tablas de negocio + **RLS** por tenant.
   - **Database Webhooks / Edge Functions** que disparen a n8n en eventos, con payload que incluya el tenant. Mínimo: `ejecutar_campana` (filtros, mensaje, cantidad, frecuencia) y `pago_fallido`.
   - Un **rol / service key** para que n8n lea y escriba (contactos por segmento, estado/seguimiento, saldos de clases, log de mensajes).
   - Prioriza cubrir a Bejauha con este contrato.

**Entregable que necesito de vuelta (para conectar n8n):**
1. URL del proyecto Supabase + cómo autentica n8n (service role key o rol dedicado).
2. El esquema final: tablas, columnas y cómo se identifica el tenant.
3. Los eventos/webhooks que la plataforma emitirá hacia n8n (nombre + payload de cada uno).
4. Qué tablas/endpoints puede leer y escribir n8n.
