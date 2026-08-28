-- ============================================================================
-- ToqueFlow — El catálogo de piezas
-- ----------------------------------------------------------------------------
-- El problema que resuelve: hoy `flows` guarda una lista ESCRITA A MANO por
-- cliente. Trece filas, cada una tecleada. Por eso la consola no puede mostrar
-- «todos los productos, cuáles tiene activos»: cada empresa solo tiene lo que
-- alguien se acordó de escribirle, y no hay ninguna lista de lo que existe.
--
-- Con esto, dar de alta un producto deja de ser teclear una fila y pasa a ser
-- marcar una casilla.
--
-- LAS TRES CLASES DE PIEZA, y por qué importa distinguirlas:
--
--   producto        Lo que se VENDE y se factura. Es lo que el cliente ve como
--                   una tarjeta en su panel.
--   herramienta     Algo que el agente hace DENTRO de una conversación. El
--                   cliente no la ve como producto aparte: es de qué está
--                   hecho el agente.
--   automatizacion  Un flujo que corre solo, sin conversación: un cron, un
--                   pago que entra, una campaña que sale.
--
-- Un producto se COMPONE de herramientas y automatizaciones (columna
-- `incluye`). No es un árbol: la misma automatización de recordatorios sirve al
-- agente y también se puede vender suelta. Lo que se factura es el producto;
-- las piezas son de qué está hecho.
--
-- Requisitos: schema.sql y schema-negocio.sql. Idempotente.
-- ============================================================================


-- ── 1. El catálogo ───────────────────────────────────────────────────────────
create table if not exists public.catalogo (
  id          uuid primary key default gen_random_uuid(),

  -- Nombre estable para el código. Es lo que el agente pide cuando llama a una
  -- herramienta, así que no se cambia a la ligera.
  clave       text not null unique,

  tipo        text not null check (tipo in ('producto', 'herramienta', 'automatizacion')),
  nombre      text not null,
  descripcion text,

  -- Cómo se lo explicas a un cliente que pregunta «¿y eso para qué me sirve?».
  -- Distinto de `descripcion`, que es para ustedes.
  beneficio   text,

  -- Honestidad sobre en qué estado está cada pieza. `en_papel` significa que
  -- la idea está pensada pero no hay nada construido: sirve para la venta
  -- («podemos hacerlo»), no para prometer una fecha.
  estado      text not null default 'en_papel'
              check (estado in ('funcionando', 'a_medias', 'en_papel')),

  -- Si el cliente la ve como una tarjeta en su panel. Las herramientas van en
  -- `false`: no son un producto aparte, son parte del agente.
  visible_cliente boolean not null default true,

  -- Para herramientas: el sub-workflow de n8n que la ejecuta. El agente lo
  -- llama por este nombre y no sabe qué hace por dentro — esa ignorancia es lo
  -- que lo mantiene compartible.
  workflow    text,

  -- De qué piezas se compone un producto. Guarda `clave`s de este mismo
  -- catálogo. Por ejemplo, el agente incluye la herramienta de responder.
  incluye     text[] not null default '{}',

  orden       int not null default 100,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.catalogo is
  'Las piezas que ToqueFlow puede ofrecer. Se escribe una vez, no una por cliente.';

create index if not exists catalogo_tipo_idx on public.catalogo (tipo, orden);


-- ── 2. `flows` deja de ser texto suelto ──────────────────────────────────────
-- Se AGREGA la referencia, no se reemplaza nada: las 13 filas que ya existen
-- siguen funcionando igual y se van enganchando al catálogo cuando toque. Una
-- migración que rompe el panel de un cliente que sí paga no vale la pena.
alter table public.flows
  add column if not exists catalogo_id uuid references public.catalogo (id) on delete set null;

create index if not exists flows_catalogo_idx on public.flows (catalogo_id);

comment on column public.flows.catalogo_id is
  'Qué pieza del catálogo es esta fila. Null = fila vieja, escrita a mano antes del catálogo.';


-- ── 3. Lo que hay hoy, dicho sin adornos ─────────────────────────────────────
-- El estado es el real, no el que gustaría. `a_medias` casi siempre significa
-- «existe para un cliente como flujo aparte, falta volverlo pieza».
insert into public.catalogo (clave, tipo, nombre, descripcion, beneficio, estado, visible_cliente, workflow, incluye, orden) values

  -- ── PRODUCTOS ──
  ('agente-atencion', 'producto', 'Agente de Atención',
   'El producto estándar. Un solo workflow para todos los clientes; la diferencia vive en agent_config.',
   'Contesta tu WhatsApp con la información de tu negocio, toma los datos de quien escribe y te pasa la conversación cuando hace falta una persona.',
   'funcionando', true, null, array['responder-conocimiento'], 10),

  ('portal', 'producto', 'Portal',
   'El panel donde el cliente entra y ve lo suyo: contactos, campañas, sandbox y consumo.',
   'Tu propio panel para ver tus contactos, mandar campañas y probar todo antes de que salga a la calle.',
   'funcionando', true, null, '{}', 20),

  ('impresion-pedidos', 'producto', 'Impresión de pedidos',
   'Los pedidos de Rappi salen impresos en el local sin que nadie los transcriba.',
   'Los pedidos llegan impresos al mostrador. Nadie los copia a mano ni se equivoca al hacerlo.',
   'funcionando', true, null, '{}', 30),

  ('kpi-ocupacion', 'producto', 'KPI de ocupación',
   'Tablero de ocupación para hotelería.',
   'Ves cómo va la ocupación sin armar el reporte a mano.',
   'funcionando', true, null, '{}', 40),

  ('retenciones', 'producto', 'Retenciones contables',
   'Ingesta y cálculo de retenciones. Caída hasta que se configure VASSCO_SHARED_SECRET.',
   'Las retenciones se calculan solas a partir de lo que ya tienes registrado.',
   'a_medias', true, null, '{}', 50),

  ('motor-contenido', 'producto', 'Motor de contenido',
   'Genera y publica artículos con IA. Construido para los blogs propios; nunca se vendió.',
   'Tu blog se alimenta solo, con artículos escritos para que te encuentren en Google.',
   'a_medias', true, null, '{}', 60),

  ('facturacion', 'producto', 'Facturación',
   'Emitir facturas y enviarlas por correo. NADIE lo ha pedido todavía: si alguien lo pide, se cotiza como encargo — no se promete como producto hasta que lo pida un segundo cliente.',
   'Facturas emitidas y enviadas solas, sin que nadie las arme una por una.',
   'en_papel', true, null, '{}', 70),

  -- ── HERRAMIENTAS ── (el agente las usa dentro de una conversación)
  ('responder-conocimiento', 'herramienta', 'Responder con conocimiento',
   'La herramienta base. Va siempre incluida en el agente.',
   'Responde con lo que tú cargaste, sin inventarse nada.',
   'funcionando', false, null, '{}', 110),

  ('consultar-saldo', 'herramienta', 'Consultar saldo',
   'Cuántas clases o cupos le quedan a quien escribe. La lógica existe en el sistema viejo de Bejauha; falta traerla como sub-workflow.',
   'Quien escribe pregunta cuántas clases le quedan y el agente se lo dice en el momento.',
   'a_medias', false, 'tool-consultar-saldo', '{}', 120),

  ('estado-pedido', 'herramienta', 'Estado del pedido',
   'Consulta contra Siigo. Ya existe como bot de Telegram; falta exponerlo al agente.',
   'Tus clientes preguntan por su pedido y el agente les responde sin que nadie revise el sistema.',
   'a_medias', false, 'tool-estado-pedido', '{}', 130),

  ('confirmar-pago', 'herramienta', 'Confirmar pago',
   'Verificar si una transferencia entró. Existe para Savia como flujo aparte; sirve a cualquiera que cobre por transferencia.',
   'Cuando alguien dice «ya pagué», el agente lo verifica en vez de hacerlo esperar.',
   'a_medias', false, 'tool-confirmar-pago', '{}', 140),

  ('ver-disponibilidad', 'herramienta', 'Ver disponibilidad',
   'Leer el calendario que el negocio ya usa para ofrecer horas reales.',
   'El agente ofrece horas que de verdad están libres, no las que cree.',
   'en_papel', false, 'tool-ver-disponibilidad', '{}', 150),

  ('agendar-cita', 'herramienta', 'Agendar la cita',
   'Crear la cita en el Google Calendar del negocio. Es el brazo que le falta al agente: hoy ese caso se comporta como escalamiento.',
   'La cita queda agendada dentro de la misma conversación. Nadie tiene que llamar después.',
   'en_papel', false, 'tool-agendar-cita', '{}', 160),

  ('registrar-reclamo', 'herramienta', 'Registrar un reclamo',
   'Dejar el caso escrito con número de seguimiento en vez de solo escalarlo.',
   'Los reclamos quedan registrados con su número, no perdidos en un chat.',
   'en_papel', false, 'tool-registrar-reclamo', '{}', 170),

  -- ── AUTOMATIZACIONES ── (corren solas, sin conversación)
  ('campanas', 'automatizacion', 'Campañas',
   'Segmentar, redactar, programar y medir envíos. Con candado explícito antes de mandar.',
   'Le escribes a mucha gente a la vez, programado, y ves quién respondió.',
   'funcionando', true, 'Toque - Handler Ejecutar Campaña', '{}', 210),

  ('pago-fallido', 'automatizacion', 'Aviso de pago fallido',
   'Cuando un cobro no pasa, el cliente se entera por WhatsApp sin que nadie lo revise.',
   'Si un cobro no pasa, tu cliente se entera solo y tú no pierdes la venta por no darte cuenta.',
   'funcionando', true, 'Toque - Handler Pago Fallido', '{}', 220),

  ('reactivacion', 'automatizacion', 'Reactivación',
   'Escribirle a quien lleva tiempo sin volver. Hecho a mano para Bejauha; como pieza sirve a cualquier negocio recurrente.',
   'A quien lleva tiempo sin volver le llega un mensaje, sin que tengas que acordarte.',
   'a_medias', true, null, '{}', 230),

  ('recordatorio-cita', 'automatizacion', 'Recordatorio de cita',
   'Avisar antes de la cita y pedir confirmación. Depende de que exista la agenda.',
   'Menos gente que no llega: se les recuerda antes y confirman.',
   'en_papel', true, null, '{}', 240),

  ('reporte-semanal', 'automatizacion', 'Reporte semanal',
   'Resumen de la semana al dueño. Existe un flujo; falta volverlo genérico.',
   'Cada lunes sabes cómo te fue la semana, sin armar nada.',
   'a_medias', true, null, '{}', 250),

  ('sandbox', 'producto', 'Simulador de conversaciones',
   'El modo prueba: el flujo real corre igual pero la salida se desvía a test_messages en vez de WhatsApp.',
   'Pruebas el bot con conversaciones de verdad sin arriesgar tu WhatsApp ni molestar a un cliente.',
   'funcionando', true, null, '{}', 25),

  ('agente-admin', 'producto', 'Agente de administración',
   'Bot para el EQUIPO del cliente, no para sus clientes: consultar y operar el negocio por chat. Hoy existe por Telegram para FerreteríaYa.',
   'Tu equipo consulta y opera el negocio desde el chat, sin entrar a ningún sistema.',
   'a_medias', true, null, '{}', 35),

  ('pauta-digital', 'automatizacion', 'Anuncios Google y Meta',
   'Gestión de pauta. Se opera a mano; está aquí porque se le factura a un cliente.',
   'Tu pauta corriendo y revisada, sin que tengas que entrarle a las plataformas.',
   'funcionando', true, null, '{}', 260)

on conflict (clave) do update set
  tipo            = excluded.tipo,
  nombre          = excluded.nombre,
  descripcion     = excluded.descripcion,
  beneficio       = excluded.beneficio,
  estado          = excluded.estado,
  visible_cliente = excluded.visible_cliente,
  workflow        = excluded.workflow,
  incluye         = excluded.incluye,
  orden           = excluded.orden;


-- ── 4. Enganchar las filas que ya existen ────────────────────────────────────
-- Las 13 filas de `flows` se escribieron a mano con nombres libres. Se
-- enganchan por lo que dice su nombre, sin tocar el texto que el cliente ya ve
-- en su panel.
update public.flows f set catalogo_id = c.id
from public.catalogo c
where f.catalogo_id is null and (
      (c.clave = 'impresion-pedidos' and f.name ilike '%impresi%rappi%')
   or (c.clave = 'agente-atencion'   and f.name ilike '%agente%atenci%')
   or (c.clave = 'campanas'          and f.name ilike '%campa%')
   or (c.clave = 'portal'            and f.name ilike '%base de datos%')
   or (c.clave = 'kpi-ocupacion'     and f.name ilike '%ocupaci%')
   or (c.clave = 'pauta-digital'     and f.name ilike '%anuncios%')
   or (c.clave = 'sandbox'           and f.name ilike '%simulador%')
   or (c.clave = 'agente-admin'      and f.name ilike '%agente administraci%')
);


-- ── 5. Permisos y RLS ────────────────────────────────────────────────────────
-- El catálogo NO es secreto: es la lista de lo que ToqueFlow ofrece, y el
-- cliente tiene que poder ver las piezas visibles para entender qué más existe.
-- Lo que sí es privado es QUÉ TIENE CADA EMPRESA, y eso vive en `flows`, que ya
-- tiene su RLS.
alter table public.catalogo enable row level security;

drop policy if exists catalogo_lectura on public.catalogo;
create policy catalogo_lectura on public.catalogo
  for select to authenticated
  using (activo);

drop policy if exists catalogo_admin on public.catalogo;
create policy catalogo_admin on public.catalogo
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

grant select on public.catalogo to authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant select on public.catalogo to n8n_worker;
  end if;
end $$;


-- ── 6. Lo que la consola necesita de un vistazo ──────────────────────────────
-- Una fila por empresa y pieza, con su estado. Es la matriz de la pantalla.
--
-- `security_invoker = on` desde el primer día: en Postgres una vista corre con
-- los permisos de su DUEÑO salvo que se diga lo contrario, y ya nos costó una
-- fuga aprenderlo. Ver ToqueFlow/plataforma/pruebas/aislamiento-rls.cjs.
drop view if exists public.empresa_catalogo;
create view public.empresa_catalogo
with (security_invoker = on) as
select
  co.id           as company_id,
  co.name         as empresa,
  c.id            as catalogo_id,
  c.clave,
  c.tipo,
  c.nombre,
  c.descripcion,
  c.beneficio,
  c.estado        as estado_pieza,
  c.visible_cliente,
  c.orden,
  f.id            as flow_id,
  f.name          as nombre_para_el_cliente,
  -- Tres estados posibles para una empresa: la tiene andando, la tiene
  -- prometida, o no la tiene.
  case
    when f.id is null            then 'no'
    when f.status = 'activo'     then 'activo'
    else                              'prometido'
  end as estado_empresa
from public.companies co
cross join public.catalogo c
left join public.flows f
       on f.company_id = co.id and f.catalogo_id = c.id
where c.activo;

comment on view public.empresa_catalogo is
  'La matriz empresa x pieza. Lo que la consola dibuja: qué existe, qué tiene cada cliente y en qué estado.';

grant select on public.empresa_catalogo to authenticated;
