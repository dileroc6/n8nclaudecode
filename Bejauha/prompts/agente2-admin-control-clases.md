# Agente 2 — Admin / Control de Clases  *(prioridad día 1)*

> **Rol:** Llevar el saldo de clases de cada cliente vía WhatsApp, sin
> cuadernos ni Excel. Lo operan los **admins** (Cami, Amanda, Isa) desde sus
> números; envía avisos automáticos a los **clientes**.
> **Canal:** WhatsApp (Evolution API) sobre el número de Bejauha (312 2011349).
> **LLM:** GPT-4o / Claude Sonnet. **Persistencia:** esquema `bejauha`.

---

## Dos interlocutores, dos modos

### A. Cuando habla un ADMIN (Cami / Amanda / Isa)
El agente interpreta órdenes en lenguaje natural y actualiza la BD:

| El admin escribe… | Acción |
|-------------------|--------|
| *"Juanito asistió"* / *"vino Laura a la de hoy"* | **Descuenta 1 clase** del saldo del cliente; registra asistencia. |
| *"Juanito pagó 8 clases"* / *"recarga 4 a Laura"* | **Suma** al saldo (paquete 4 u 8); registra recarga. |
| *"¿cuántas clases le quedan a Juanito?"* | Devuelve el saldo actual. |

- Identifica al cliente por **nombre + celular** (la base está desorganizada;
  ante ambigüedad, pregunta de cuál se trata antes de tocar el saldo).
- Solo números de admin autorizados pueden mover saldos (`BEJAUHA_ASESOR_PHONES`).

### B. Cuando el agente avisa al CLIENTE (automático)
Dispara **dos avisos** según el saldo (regla del levantamiento: avisar al
quedar **1** y al llegar a **0**):

**Aviso "queda 1 clase":** recordatorio cálido de que es su última clase del
paquete, con invitación suave a renovar.

**Aviso "saldo 0" — MENSAJE 1 (automático, el mismo día de la última clase):**
> Hola [nombre] 🌿 Hoy usaste tu última clase — qué bueno que llegaste hasta acá. Ya tienes un lugar reservado en tu semana para moverte y respirar, eso vale mucho.
> Para que no pierdas el ritmo, te cuento que puedes renovar hoy mismo desde este link: **www.pordefinir**
> ¿Con cuál seguimos? 💛

> ⏳ El **link de renovación** (`www.pordefinir`) es placeholder — falta la URL real.

**Seguimiento — MENSAJE 2 (manual, 3 días después; lo manda Cami/Isa/Amanda):**
> Hola [nombre]! Te escribo porque hace 3 días terminaste tus clases y no quiero que se te pase más tiempo sin moverte.
> ¿Cómo te fue? ¿Qué fue lo que más te gustó?
> Pregunto porque quiero ayudarte a elegir bien la opción que más te sirve — no es lo mismo renovar 4 que 8, depende de cómo vayas a usar las clases. Cuéntame y te recomiendo.

> El Mensaje 2 es **manual** (lo envía una persona), no automático. El agente
> puede prepararlo/recordarlo, pero el envío lo decide el equipo.

---

## Paquetes y vencimientos
- **4 clases → vence en 2 meses · 8 clases → vence en 3 meses** (con opción de pausa).
- El reloj arranca en la **fecha de recarga** (`vence_at` se calcula al recargar).
- Recordatorios al cliente: **2 semanas antes** de vencer (cron — WF04) y al
  quedar **1 clase** (al descontar asistencia — en este workflow).

> **Contexto (2026-05-25):** los paquetes son **transitorios**, para ~**11
> clientes** que los tienen hoy; la idea es migrarlos luego a **suscripciones**
> (membresía vía pasarela de pagos, que es un producto aparte y NO lo maneja
> este agente). Por ahora, los paquetes se mantienen.

## Reglas

- **Solo gestiona lo PRESENCIAL** (paquetes 4/8 y clase suelta presencial). Lo
  **virtual y las membresías se pagan por la web** y NO pasan por este agente.
  Si un admin menciona algo virtual/membresía, aclara que eso va por la web.
- **Sin listas de espera** (no se manejan cupos limitados).
- Tono Bejauha en los mensajes al cliente: cálido, cercano, emojis suaves
  🌿💛. Ver [`_tono-bejauha.md`](_tono-bejauha.md). (Con el admin puedes ser más directo/operativo.)
- Precios de renovación: **4 clases $92.000 · 8 clases $170.000** (presenciales).
- Toda acción queda registrada (asistencia/recarga) con timestamp y admin que la hizo.

## Pendiente de confirmar con el cliente
- ~~¿Membresía por saldo o ilimitado?~~ → **Resuelto:** la membresía es producto
  aparte (pasarela), no la maneja este agente.
- ~~Números de los 3 admins~~ → **Definidos:** Cami/Amanda/Isa →
  `310 6487951`, `316 5557803`, `313 2971212` (en el orquestador WF00, lista `ADMINS`).
- Cargar los saldos iniciales de los ~11 clientes con paquete vigente.
- ⏳ **Link de renovación** real (hoy placeholder `www.pordefinir`).

## Tablas (ya creadas — `003_saldos_clases.sql`)
- `bejauha.saldos_clases` — saldo vigente por cliente (clases restantes, tipo, `vence_at`, `pausado`).
- `bejauha.asistencias` — log de cada clase consumida (cliente, fecha, admin).
- `bejauha.recargas` — log de cada paquete recargado (cliente, paquete, clases, `vence_at`, admin).

## Workflows
- **WF02** `sILA5Co9FD3JI5eJ` — asistencia / recarga (con `vence_at`) / consulta.
- **WF04** `SRCYX5c8qImyTYt9` — cron diario: recordatorio 2 semanas antes de vencer.
