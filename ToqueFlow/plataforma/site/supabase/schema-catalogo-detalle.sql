-- ============================================================================
-- ToqueFlow — El catálogo cuenta qué hace cada producto
-- ----------------------------------------------------------------------------
-- Hasta ahora el catálogo servía para saber QUIÉN tiene qué. Faltaba lo otro:
-- qué hace cada pieza, qué se le puede configurar, de qué está compuesta y si
-- ya está liberada o sigue en construcción.
--
-- Eso no es documentación: es lo que hace falta para vender sin prometer de más
-- y para configurar sin adivinar. Hoy vive en la cabeza de Diego y en varios
-- markdown sueltos.
--
-- Idempotente.
-- ============================================================================


-- ── 1. Lo que se le puede tocar a cada pieza ─────────────────────────────────
alter table public.catalogo
  add column if not exists parametros text[] not null default '{}';

comment on column public.catalogo.parametros is
  'Qué se le puede configurar a esta pieza por cliente. Vacío = no se parametriza, se enciende y ya.';

-- `liberado` no es lo mismo que `estado`. Una pieza puede estar «funcionando»
-- para un cliente concreto y no estar lista para venderse a cualquiera.
alter table public.catalogo
  add column if not exists liberado boolean not null default false;

comment on column public.catalogo.liberado is
  'Si se puede vender a un cliente nuevo tal cual está. Distinto de `estado`: algo puede funcionar para un cliente y no estar listo para cualquiera.';


-- ── 2. Qué hace cada pieza, dicho de verdad ──────────────────────────────────
update public.catalogo set parametros = '{}', liberado = false;

-- Toque Atiende: el único que de verdad se parametriza hoy.
update public.catalogo set
  liberado = true,
  incluye = array['responder-conocimiento'],
  parametros = array[
    'El tono: cómo habla, qué palabras sí y cuáles no',
    'Qué datos capturar de quien escribe, con su clave',
    'Cuándo dejar de responder y pasar a una persona',
    'Lo que nunca debe hacer',
    'El conocimiento: precios, horarios, servicios y preguntas frecuentes',
    'La instancia de WhatsApp',
    'Si la agenda es Google Calendar, propia o ninguna'
  ]
where clave = 'agente-atencion';

update public.catalogo set liberado = true,
  parametros = array['Los usuarios y sus permisos', 'Las sedes']
where clave = 'portal';

update public.catalogo set liberado = true
where clave = 'sandbox';

update public.catalogo set liberado = true,
  parametros = array['Qué impresora y de qué sede', 'Qué plataforma de pedidos']
where clave = 'impresion-pedidos';

update public.catalogo set liberado = true,
  parametros = array['Qué se considera ocupación', 'Cada cuánto se actualiza']
where clave = 'kpi-ocupacion';

update public.catalogo set liberado = false,
  parametros = array['Qué puede consultar el equipo', 'Por qué canal: Telegram o WhatsApp']
where clave = 'agente-admin';

update public.catalogo set liberado = false,
  parametros = array['Las reglas de retención', 'De dónde salen los documentos']
where clave = 'retenciones';

update public.catalogo set liberado = false,
  parametros = array['Los temas y las palabras clave', 'Dónde se publica', 'Cada cuánto']
where clave = 'motor-contenido';

update public.catalogo set liberado = false
where clave = 'facturacion';

-- Herramientas: todas se activan por cliente, ninguna se parametriza todavía.
update public.catalogo set liberado = true  where clave = 'responder-conocimiento';
update public.catalogo set liberado = false where tipo = 'herramienta' and clave <> 'responder-conocimiento';

-- Automatizaciones.
update public.catalogo set liberado = true,
  parametros = array['A quién se le manda: el segmento', 'El mensaje', 'Cuándo sale', 'De a cuántos por lote']
where clave = 'campanas';

update public.catalogo set liberado = true,
  parametros = array['Qué se le escribe a quien no pudo pagar']
where clave = 'pago-fallido';

update public.catalogo set liberado = false,
  parametros = array['Cuánto tiempo sin volver cuenta como inactivo', 'El mensaje']
where clave = 'reactivacion';

update public.catalogo set liberado = false,
  parametros = array['Cuántas horas antes se avisa', 'Si se pide confirmación', 'Qué se le dice']
where clave = 'recordatorio-cita';

update public.catalogo set liberado = false,
  parametros = array['Qué va en el reporte', 'A quién le llega', 'Qué día']
where clave = 'reporte-semanal';

update public.catalogo set liberado = true
where clave = 'pauta-digital';


-- ── 3. De qué se compone un producto ─────────────────────────────────────────
-- Toque Atiende puede llevar herramientas y automatizaciones encendidas. No es
-- un árbol: la misma automatización de recordatorios sirve al agente y también
-- se puede vender suelta. Por eso `incluye` guarda lo que va SIEMPRE, y lo
-- opcional se marca aparte.
alter table public.catalogo
  add column if not exists puede_llevar text[] not null default '{}';

comment on column public.catalogo.puede_llevar is
  'Piezas OPCIONALES que este producto puede activar. `incluye` es lo que va siempre; esto es lo que se le puede sumar.';

update public.catalogo set puede_llevar = array[
  'consultar-saldo', 'estado-pedido', 'confirmar-pago',
  'ver-disponibilidad', 'agendar-cita', 'registrar-reclamo',
  'recordatorio-cita', 'reactivacion'
] where clave = 'agente-atencion';


-- ── 4. La vista que lee la pantalla de productos ─────────────────────────────
-- Cada pieza con su detalle y cuántos clientes la tienen. Es lo que hace falta
-- para responder «¿qué le puedo vender a este?» sin abrir cuatro pestañas.
drop view if exists public.catalogo_detalle;
create view public.catalogo_detalle
with (security_invoker = on) as
select
  c.*,
  (select count(distinct f.company_id)::int
     from public.flows f
    where f.catalogo_id = c.id and f.status = 'activo')      as clientes_encendido,
  (select count(distinct f.company_id)::int
     from public.flows f
    where f.catalogo_id = c.id and f.status <> 'activo')     as clientes_sin_encender,
  -- Los nombres de las piezas que lleva, ya resueltos: la pantalla no debería
  -- tener que cruzar claves a mano.
  (select coalesce(array_agg(x.nombre order by x.orden), '{}')
     from public.catalogo x where x.clave = any(c.incluye))   as incluye_nombres,
  (select coalesce(array_agg(x.nombre order by x.orden), '{}')
     from public.catalogo x where x.clave = any(c.puede_llevar)) as puede_llevar_nombres
from public.catalogo c
where c.activo;

comment on view public.catalogo_detalle is
  'Cada pieza con lo que hace, lo que se le configura, de que se compone y cuantos clientes la tienen.';

grant select on public.catalogo_detalle to authenticated;
