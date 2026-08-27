-- ============================================================================
-- ToqueFlow — Esquema del AGENTE DE ATENCIÓN (el producto estándar)
-- ----------------------------------------------------------------------------
-- La idea de fondo: la diferencia entre un cliente y otro vive en UNA FILA de
-- base de datos, no en un workflow distinto de n8n. Cliente nuevo = fila nueva.
--
-- Sostiene las seis capacidades del producto:
--   responder y sugerir · agendar · capturar · recordar · enrutar · registrar
-- Ver ToqueFlow/estrategia/producto-estandar.md
--
-- Requisitos: correr PRIMERO schema.sql y schema-negocio.sql. Idempotente.
-- ============================================================================


-- ── 0. Marcar la hora del último cambio ──────────────────────────────────────
-- `tf_touch_updated_at` toca la columna `updated_at`, y estas dos tablas usan
-- `actualizado_at`. Apuntarlas a esa función las dejaba con un trigger que
-- revienta en el primer UPDATE: «record "new" has no field "updated_at"».
-- Nadie lo notó porque hasta ahora solo se habían hecho INSERT.
create or replace function public.tf_touch_actualizado_at()
returns trigger language plpgsql as $touch$
begin
  new.actualizado_at := now();
  return new;
end;
$touch$;

-- ── 1. agent_config — el comportamiento del agente, por empresa ──────────────
-- Todo en jsonb a propósito: la forma va a cambiar mientras aprendemos con los
-- primeros clientes, y no queremos una migración por cada campo nuevo.
create table if not exists public.agent_config (
  company_id   uuid primary key references public.companies (id) on delete cascade,
  activo       boolean not null default false,

  -- { negocio, tono, saludo, despedida, horario_humano }
  identidad    jsonb not null default '{}',

  -- { disparador, campos: [{clave, etiqueta, obligatorio, tipo}] }
  captura      jsonb not null default '{}',

  -- { reglas: [{si, accion, destino}] }
  -- accion: notificar_humano | enviar_link | responder_y_cerrar
  enrutamiento jsonb not null default '{"reglas":[]}',

  -- { nunca: [...], escalar_si: [...] }  — los límites duros del agente
  limites      jsonb not null default '{}',

  -- LA AGENDA TIENE TRES MODOS. Elegir mal es la fuente #1 de dolor:
  --
  --   "google"  (por defecto) — la verdad vive en el Google Calendar QUE EL
  --             NEGOCIO YA USA. El agente lee disponibilidad de ahí y escribe
  --             ahí. Evita el problema de las dos agendas: que el bot ofrezca
  --             las 3 PM mientras la recepcionista ya puso a alguien a las 3.
  --             Requiere conectar la cuenta una vez (OAuth, 2 minutos).
  --
  --   "propia"  — solo para negocios SIN calendario digital. La verdad vive en
  --             `appointments` y el negocio adopta el portal como su agenda.
  --             Ojo: implica cambiarle el proceso al cliente. Cuesta más
  --             vender y más sostener.
  --
  --   "ninguna" — el agente NO agenda: captura la solicitud y la enruta a un
  --             humano, o manda un link de reservas. Legítima y la más barata
  --             de operar, pero cada paso extra pierde gente: el valor del
  --             agente está en cerrar la cita DENTRO de la conversación.
  --
  -- ¿Y SI EL CLIENTE USA CALENDLY? Calendly no es un calendario, es una página
  -- de reservas: debajo siempre hay un Google o un Outlook del que lee. Si es
  -- Google —lo más común— se usa modo "google" contra ESE calendario y listo:
  -- Calendly deja de ofrecer el horario solo, porque mira el mismo calendario.
  -- No hay que integrar nada con Calendly. Mandar su link es modo "ninguna".
  --
  -- { modo, calendar_id, zona_horaria,
  --   franjas: [{dias,desde,hasta}],
  --   servicios: [{nombre,duracion_min,cupos_simultaneos}],
  --   anticipacion_min_horas, bloqueos: [{desde,hasta,motivo}] }
  --
  -- Con modo "google", `franjas` sigue valiendo: acota EN QUÉ HORARIO puede
  -- ofrecer el agente, aunque el calendario esté libre a las 11 de la noche.
  agenda       jsonb not null default '{"modo":"ninguna"}',

  -- { confirmacion_al_agendar, recordatorio_horas_antes, pedir_confirmacion,
  --   avisar_negocio_si_no_confirma }
  recordatorios jsonb not null default '{}',

  actualizado_por uuid references public.profiles (id) on delete set null,
  actualizado_at  timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

drop trigger if exists agent_config_touch on public.agent_config;
create trigger agent_config_touch before update on public.agent_config
  for each row execute function public.tf_touch_actualizado_at();


-- ── 2. agent_knowledge — de dónde saca las respuestas ────────────────────────
-- DECISIÓN DE DISEÑO: sin embeddings ni búsqueda vectorial.
-- El conocimiento de un spa o una clínica —servicios, precios, horarios,
-- políticas— son unos pocos KB: caben completos en el prompt. Meter búsqueda
-- vectorial aquí sería sobreingeniería, costaría más y respondería peor,
-- porque el modelo ve todo el contexto de una en vez de fragmentos sueltos.
--
-- LÍMITE: si el contenido de una empresa supera ~40 KB (un catálogo grande,
-- por ejemplo), esto deja de servir y hace falta otro enfoque. Ese caso está
-- FUERA del producto estándar y se cotiza aparte.
create table if not exists public.agent_knowledge (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies (id) on delete cascade,

  tipo         text not null check (tipo in ('web','pdf','manual')),
  origen       text,                          -- la URL o el nombre del archivo
  titulo       text not null,
  contenido    text not null,                 -- texto ya limpio, listo para el prompt

  activo       boolean not null default true, -- se puede apagar sin borrar
  orden        int not null default 0,        -- en qué orden entra al prompt

  -- Para saber si la fuente cambió sin volver a bajarla entera
  hash_origen  text,
  bytes        int generated always as (length(contenido)) stored,

  actualizado_por uuid references public.profiles (id) on delete set null,
  actualizado_at  timestamptz not null default now(),
  created_at      timestamptz not null default now()
);
create index if not exists agent_knowledge_company_idx
  on public.agent_knowledge (company_id, activo, orden);

drop trigger if exists agent_knowledge_touch on public.agent_knowledge;
create trigger agent_knowledge_touch before update on public.agent_knowledge
  for each row execute function public.tf_touch_actualizado_at();

-- Vista: el conocimiento de una empresa, ya concatenado y listo para el prompt.
-- n8n lee de aquí en vez de armar la concatenación por su cuenta.
-- Se eliminan antes de recrear, y en este orden. Los archivos que siguen en la
-- cadena —schema-agente-uso.sql y schema-agente-runtime.sql— le AGREGAN
-- columnas a esta vista, y `create or replace view` no sabe quitar columnas:
-- volver a correr este archivo solo fallaba con «cannot drop columns from
-- view». Los tres se corren en orden y quedan reconstruidos.
drop view if exists public.agent_runtime;
drop view if exists public.agent_knowledge_prompt;
create view public.agent_knowledge_prompt as
select
  company_id,
  string_agg('## ' || titulo || E'\n' || contenido, E'\n\n' order by orden, created_at) as texto,
  sum(bytes)  as bytes_total,
  count(*)    as fuentes,
  max(actualizado_at) as actualizado_at
from public.agent_knowledge
where activo
group by company_id;


-- ── 3. appointments — las citas que agenda el agente ─────────────────────────
create table if not exists public.appointments (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  contact_id  uuid references public.contacts (id) on delete set null,

  servicio    text,
  inicio      timestamptz not null,
  fin         timestamptz not null,

  estado      text not null default 'confirmada'
              check (estado in ('propuesta','confirmada','cancelada','asistio','no_asistio')),

  -- Recordatorios: para no mandar dos veces el mismo
  recordatorio_enviado_at timestamptz,
  confirmada_por_cliente  boolean,

  origen      text default 'agente',          -- agente | manual | importado
  notas       text,

  -- Con agenda en modo "google", la VERDAD vive en Google Calendar y esta fila
  -- es un espejo: sirve para el panel del cliente, las métricas y el cron de
  -- recordatorios, pero no manda. Si hay conflicto, gana el calendario.
  gcal_event_id text,
  metadata    jsonb not null default '{}',

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (fin > inicio)
);
create index if not exists appointments_company_inicio_idx
  on public.appointments (company_id, inicio);
create index if not exists appointments_contact_idx
  on public.appointments (contact_id, inicio desc);
-- Para el cron de recordatorios: encontrar rápido lo que hay que avisar
create index if not exists appointments_recordatorio_idx
  on public.appointments (inicio)
  where estado = 'confirmada' and recordatorio_enviado_at is null;

drop trigger if exists appointments_touch on public.appointments;
create trigger appointments_touch before update on public.appointments
  for each row execute function public.tf_touch_updated_at();


-- ── 4. RLS — mismo patrón que el resto de la plataforma ──────────────────────
alter table public.agent_config    enable row level security;
alter table public.agent_knowledge enable row level security;
alter table public.appointments    enable row level security;

-- agent_config: el cliente VE su configuración pero no la edita a mano.
-- La edita desde la consola, que pasa por la Edge Function con validación.
drop policy if exists agent_config_select on public.agent_config;
create policy agent_config_select on public.agent_config
  for select using (public.is_super_admin() or company_id = public.my_company_id());

drop policy if exists agent_config_admin on public.agent_config;
create policy agent_config_admin on public.agent_config
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- agent_knowledge: aquí SÍ escribe el cliente.
-- Es la pieza que evita que cada cambio de precio les cueste una hora a ustedes.
drop policy if exists agent_knowledge_select on public.agent_knowledge;
create policy agent_knowledge_select on public.agent_knowledge
  for select using (public.is_super_admin() or company_id = public.my_company_id());

drop policy if exists agent_knowledge_member_insert on public.agent_knowledge;
create policy agent_knowledge_member_insert on public.agent_knowledge
  for insert with check (company_id = public.my_company_id());

drop policy if exists agent_knowledge_member_update on public.agent_knowledge;
create policy agent_knowledge_member_update on public.agent_knowledge
  for update using (company_id = public.my_company_id())
           with check (company_id = public.my_company_id());

drop policy if exists agent_knowledge_member_delete on public.agent_knowledge;
create policy agent_knowledge_member_delete on public.agent_knowledge
  for delete using (company_id = public.my_company_id());

drop policy if exists agent_knowledge_admin on public.agent_knowledge;
create policy agent_knowledge_admin on public.agent_knowledge
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- appointments: el cliente ve y corrige las suyas.
drop policy if exists appointments_select on public.appointments;
create policy appointments_select on public.appointments
  for select using (public.is_super_admin() or company_id = public.my_company_id());

drop policy if exists appointments_member_write on public.appointments;
create policy appointments_member_write on public.appointments
  for all using (company_id = public.my_company_id())
          with check (company_id = public.my_company_id());

drop policy if exists appointments_admin on public.appointments;
create policy appointments_admin on public.appointments
  for all using (public.is_super_admin()) with check (public.is_super_admin());


-- ── 5. Permisos del rol n8n_worker — mínimos privilegios ─────────────────────
-- n8n LEE la configuración y el conocimiento; ESCRIBE citas y marca
-- recordatorios. Nunca borra, y nunca toca agent_config.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant select                 on public.agent_config           to n8n_worker;
    grant select                 on public.agent_knowledge        to n8n_worker;
    grant select                 on public.agent_knowledge_prompt to n8n_worker;
    grant select, insert, update on public.appointments           to n8n_worker;
  end if;
end $$;


-- ── 6. Disponibilidad: por qué no hay tabla de horarios ──────────────────────
-- Las franjas, la duración por servicio y los cupos viven en agent_config.agenda,
-- no en una tabla aparte. Son CONFIGURACIÓN, no datos: cambian cuando el negocio
-- cambia su horario, no con cada cita. Una tabla de slots pregenerados habría
-- que mantenerla y limpiarla.
--
-- CON MODO "google" (el recomendado): la disponibilidad se consulta contra el
-- Google Calendar del negocio. `appointments` es un espejo para el panel, las
-- métricas y los recordatorios; si hay conflicto, gana el calendario.
--
-- CON MODO "propia": se cuentan las citas que se cruzan con el rango:
--
--   select count(*) from appointments
--   where company_id = $1 and estado in (propuesta,confirmada)
--     and tstzrange(inicio, fin) && tstzrange($2, $3);
--
-- Si ese número es menor que cupos_simultaneos del servicio, hay lugar.
--
-- LÍMITE DEL PRODUCTO ESTÁNDAR, en los dos modos: cupos, no personas. Asignar
-- «la terapeuta María en la sede norte» es el módulo de agenda avanzada,
-- cotizado aparte. Fue exactamente donde se dispararon las horas en Zoe.
