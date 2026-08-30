-- ============================================================================
-- ToqueFlow — Los paquetes: el nivel que faltaba entre el producto y las piezas
-- ----------------------------------------------------------------------------
-- Diego lo vio, y es una decisión comercial antes que técnica:
--
--   «Eso de matricular cliente y recargar y todo lo de paquetes deberíamos
--    unirlos y llamarlos Paquete Recargas, y otro que sea Paquete Tienda, y de
--    esa misma manera venderlo.»
--
-- El catálogo tenía 22 piezas sueltas, y vender piezas sueltas significa que
-- cada venta es una cotización a medida — que es el problema de las 45–90
-- horas por cliente, en versión comercial. Con paquetes hay tres precios en
-- vez de infinitas combinaciones.
--
-- Y es como lo entiende un negocio: nadie quiere «ver-disponibilidad», quiere
-- «que agende».
--
-- LOS TRES NIVELES
-- ----------------
--   PRODUCTO      lo que se contrata.        Toque Atiende
--   PAQUETE       lo que se le suma.         Agenda · Recargas · Tienda
--   PIEZA         lo que el agente llama.    ver-disponibilidad, agendar-cita…
--
-- El catálogo CONSERVA las piezas sueltas: son las que el agente ejecuta, y
-- así un cliente que solo quiere recordatorios lo puede tener. El paquete es
-- una capa de venta encima, no un reemplazo. Es el mismo lego, un nivel más
-- arriba.
--
-- Cómo se resuelve: `agent_config.herramientas` puede traer la clave de una
-- PIEZA o la de un PAQUETE. El contexto expande los paquetes a sus piezas. Así
-- un paquete que mañana gane una herramienta se la da a todos los que ya lo
-- tienen, sin tocar a nadie.
--
-- Idempotente.
-- ============================================================================


-- ── 1. `paquete` es un tipo más ──────────────────────────────────────────────
alter table public.catalogo drop constraint if exists catalogo_tipo_check;
alter table public.catalogo add constraint catalogo_tipo_check
  check (tipo = any (array['producto', 'paquete', 'herramienta', 'automatizacion']));

-- Qué piezas lleva dentro. Distinto de `incluye` (lo que un PRODUCTO trae
-- siempre) y de `puede_llevar` (lo que se le puede sumar): esto es la lista de
-- lo que hay dentro de la caja que se vende.
alter table public.catalogo
  add column if not exists contiene text[] not null default '{}';

comment on column public.catalogo.contiene is
  'Las piezas que van dentro de un paquete. Es lo que se expande cuando una empresa contrata el paquete: el agente sigue llamando piezas sueltas, el paquete solo agrupa para vender.';

-- Cuánto cuesta al mes, en pesos. Se guarda en el catálogo y no en una hoja
-- aparte porque el precio es parte de lo que se vende, y tenerlo en dos sitios
-- es cómo se termina cotizando distinto a dos clientes el mismo día.
alter table public.catalogo
  add column if not exists precio_cop int;

comment on column public.catalogo.precio_cop is
  'Precio de lista al mes, en pesos. Nulo = no se vende suelto o el precio se acuerda.';


-- ── 2. Los tres paquetes ─────────────────────────────────────────────────────
insert into public.catalogo
  (clave, nombre, tipo, descripcion, beneficio, contiene, vendible, liberado, activo, visible_cliente, orden, estado)
values

  ('paquete-agenda', 'Toque Agenda', 'paquete',
   'El agente consulta las horas libres y agenda la cita dentro de la misma conversacion, sin sacar a nadie de WhatsApp. Incluye el recordatorio antes de la cita.',
   'La conversacion termina con la cita puesta, no con un «escribenos para agendar» — que es donde se cae la mitad.',
   array['ver-disponibilidad', 'agendar-cita', 'recordatorio-cita'],
   true, true, true, true, 30, 'a_medias'),

  ('paquete-recargas', 'Toque Recargas', 'paquete',
   'Para quien vende por paquetes, clases, sesiones o bonos: el agente sabe cuanto le queda a cada quien, lo descuenta cuando usa, y recibe las solicitudes de recarga. Matricular y recargar SIEMPRE los confirma una persona.',
   'El negocio deja de llevar el saldo en una hoja de calculo, y nadie se queda sin saber cuantas clases le quedan.',
   array['matricular-cliente', 'registrar-consumo', 'recargar-saldo'],
   true, false, true, true, 31, 'en_papel'),

  ('paquete-tienda', 'Toque Tienda', 'paquete',
   'Conecta el agente con la tienda en linea del negocio: estado del pedido, confirmacion de pago y disponibilidad de producto, respondidos con datos de verdad y no de memoria.',
   'Deja de contestar «dejame reviso» veinte veces al dia por el mismo pedido.',
   array['estado-pedido', 'confirmar-pago'],
   true, false, true, true, 32, 'en_papel')

on conflict (clave) do update set
  nombre = excluded.nombre, tipo = excluded.tipo,
  descripcion = excluded.descripcion, beneficio = excluded.beneficio,
  contiene = excluded.contiene, vendible = excluded.vendible,
  activo = excluded.activo, visible_cliente = excluded.visible_cliente,
  orden = excluded.orden, estado = excluded.estado;

-- `liberado` NO se pisa al reaplicar: lo decide si la pieza ya se puede vender,
-- y eso cambia cuando se termina de construir, no cuando se corre este archivo.


-- ── 3. Toque Atiende ahora se le suman PAQUETES, no piezas sueltas ───────────
-- Las piezas siguen existiendo y el agente las sigue llamando. Lo que cambia es
-- qué se le ofrece a un cliente cuando se le vende.
update public.catalogo
   set puede_llevar = array['paquete-agenda', 'paquete-recargas', 'paquete-tienda', 'reactivacion', 'registrar-reclamo']
 where clave = 'agente-atencion';


-- ── 4. El contexto expande los paquetes ──────────────────────────────────────
-- `agent_config.herramientas` puede traer la clave de una pieza o la de un
-- paquete. Aquí se resuelven las dos, y se quitan los duplicados: un cliente
-- puede tener el paquete y además una pieza suelta que ya venía de antes.
--
-- Que la expansión ocurra AQUÍ y no al contratar es lo que hace que un paquete
-- que mañana gane una herramienta se la dé a todos los que ya lo tienen.
create or replace function public.tf_piezas_del_agente(p_claves text[])
returns text[]
language sql
stable
as $fn$
  select coalesce(array_agg(distinct x), '{}')
  from (
    -- las que se pusieron sueltas
    select unnest(coalesce(p_claves, '{}')) as x
    union
    -- y las que vienen dentro de un paquete
    select unnest(c.contiene)
    from public.catalogo c
    where c.clave = any(coalesce(p_claves, '{}'))
      and c.tipo = 'paquete' and c.activo
  ) t
  where x is not null and x <> '';
$fn$;

comment on function public.tf_piezas_del_agente(text[]) is
  'Convierte lo que se le contrato a un agente —piezas sueltas y paquetes— en la lista plana de piezas que puede llamar. La expansion pasa aqui y no al contratar: asi un paquete que gane una herramienta se la da a quien ya lo tenia.';

grant execute on function public.tf_piezas_del_agente(text[]) to authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_piezas_del_agente(text[]) to n8n_worker;
  end if;
end $$;
