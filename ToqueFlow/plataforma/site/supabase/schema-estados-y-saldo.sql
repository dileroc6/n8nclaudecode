-- ============================================================================
-- ToqueFlow — «Próximamente» y «desactivado» no son lo mismo
-- ----------------------------------------------------------------------------
-- Dos correcciones que salieron de mirar la consola con ojos de cliente.
--
-- 1. UN PRODUCTO APAGADO NO ES UN PRODUCTO QUE VIENE. Hoy todo lo que no está
--    activo dice «próximamente» en el panel del cliente. Pero son dos cosas
--    distintas y decirle lo mismo a las dos es mentirle a una:
--
--      próximamente  lo contrató y todavía no se ha encendido nunca
--      desactivado   estuvo andando y se apagó
--
--    A quien se le apagó algo, decirle «próximamente» es tomarle el pelo.
--
-- 2. «CONSULTAR SALDO» ESTABA ESCRITA PARA BEJAUHA. Hablaba de clases, y no
--    todos los negocios venden clases. La capacidad real es más general: saber
--    cuánto le queda a alguien de lo que compró — clases, sesiones, cupos,
--    créditos, bonos.
--
--    Y al generalizarla se ve que estaba sola: consultar el saldo sin poder
--    descontarlo ni recargarlo es media herramienta. El agente admin viejo de
--    Bejauha ya hace las tres cosas; aquí quedan declaradas como la familia
--    que son.
--
-- Idempotente.
-- ============================================================================


-- ── 1. El tercer estado ──────────────────────────────────────────────────────
-- `flows.status` es texto libre, así que no hay que migrar nada: se empieza a
-- usar el valor nuevo y las filas viejas siguen valiendo.
comment on column public.flows.status is
  'activo | proximamente (contratado, nunca encendido) | desactivado (estuvo andando y se apago). Es lo que ve el cliente en su panel, asi que decirle "proximamente" a algo que se le apago seria tomarle el pelo.';

drop view if exists public.empresa_catalogo;
create view public.empresa_catalogo
with (security_invoker = on) as
select
  co.id    as company_id,
  co.name  as empresa,
  ca.id    as catalogo_id,
  ca.clave, ca.tipo, ca.nombre, ca.descripcion, ca.beneficio,
  ca.estado as estado_pieza,
  ca.visible_cliente, ca.vendible, ca.orden,
  coalesce(f.veces, 0)          as veces,
  coalesce(f.ids, '{}'::uuid[]) as flow_ids,
  f.nombres                     as nombres_para_el_cliente,
  -- Ojo: un `count(*)` sin `group by` dentro de un `lateral` SIEMPRE devuelve
  -- una fila con cero, nunca null.
  case
    when coalesce(f.veces, 0) = 0 then 'no'
    when f.alguno_activo          then 'activo'
    when f.alguno_desactivado     then 'desactivado'
    else                               'proximamente'
  end as estado_empresa
from public.companies co
cross join public.catalogo ca
left join lateral (
  select count(*)::int                              as veces,
         array_agg(fl.id)                           as ids,
         array_agg(fl.name order by fl.name)        as nombres,
         bool_or(fl.status = 'activo')              as alguno_activo,
         bool_or(fl.status = 'desactivado')         as alguno_desactivado
  from public.flows fl
  where fl.company_id = co.id and fl.catalogo_id = ca.id
) f on true
where ca.activo;

grant select on public.empresa_catalogo to authenticated;

-- El resumen cuenta igual: todo lo que no está activo es «pendiente de
-- encender», sin importar por cuál de las dos razones.
drop view if exists public.empresa_resumen;
create view public.empresa_resumen
with (security_invoker = on) as
select
  co.id as company_id, co.name as empresa, co.slug, co.status, co.created_at,
  (select count(*)::int from public.profiles p where p.company_id = co.id) as usuarios,
  (select count(distinct f.catalogo_id)::int
     from public.flows f join public.catalogo c2 on c2.id = f.catalogo_id
    where f.company_id = co.id and c2.vendible and f.status = 'activo')    as productos_activos,
  (select count(distinct f.catalogo_id)::int
     from public.flows f join public.catalogo c2 on c2.id = f.catalogo_id
    where f.company_id = co.id and c2.vendible and f.status <> 'activo')   as productos_proximamente,
  (select coalesce(sum(u.cost_usd), 0)::numeric(12,4) from public.ai_usage u where u.company_id = co.id) as ia_usd,
  (select coalesce(sum(u.cost_usd), 0)::numeric(12,4) from public.ai_usage u
    where u.company_id = co.id and u.created_at >= date_trunc('month', now()))                          as ia_usd_mes
from public.companies co;

grant select on public.empresa_resumen to authenticated;


-- ── 2. La familia del saldo ──────────────────────────────────────────────────
-- Consultar sin poder descontar ni recargar es media herramienta.
update public.catalogo set
  nombre      = 'Consultar saldo',
  descripcion = 'Cuando alguien pregunta cuánto le queda de lo que compró —clases, sesiones, cupos, créditos— el agente lo consulta en su ficha y se lo dice en el momento, con la fecha de renovación. Sirve a cualquier negocio que venda por paquetes o abonos, no solo a los que dan clases.',
  beneficio   = 'Consulta cuánto te queda de tu paquete y cuándo se renueva.'
where clave = 'consultar-saldo';

insert into public.catalogo (clave, tipo, nombre, descripcion, beneficio, estado, liberado, visible_cliente, vendible, workflow, orden) values
  ('registrar-consumo', 'herramienta', 'Descontar del saldo',
   'Registrar que alguien usó una de sus unidades: asistió a la clase, tomó la sesión, redimió el bono. Sin esto el saldo que consulta el agente se queda desactualizado y termina diciendo un número que no es. Hoy lo hace el agente de administración de Bejauha por otro camino.',
   'Cada vez que alguien usa una de sus clases queda descontada sola.',
   'a_medias', false, false, false, 'tool-registrar-consumo', 125),

  ('recargar-saldo', 'herramienta', 'Recargar el saldo',
   'Sumarle unidades a alguien cuando compra otro paquete. Va de la mano con las dos anteriores: consultar, descontar y recargar son la misma capacidad partida en tres. Requiere confirmación de una persona por diseño: un agente que recarga solo es un agente que regala.',
   'Cuando compra otro paquete, sus clases se suman sin que nadie las anote.',
   'en_papel', false, false, false, 'tool-recargar-saldo', 126),

  ('registrar-cliente', 'herramienta', 'Registrar a quien escribe',
   'Crear la ficha de alguien que todavía no está en la base, con los datos que dio en la conversación. El agente ya guarda lo que captura, pero esto lo vuelve explícito: sirve cuando el negocio quiere que quede registrado aunque no compre.',
   'Quien te escribe queda en tu base aunque no compre ese día.',
   'en_papel', false, false, false, 'tool-registrar-cliente', 127)
on conflict (clave) do update set
  nombre = excluded.nombre, descripcion = excluded.descripcion, beneficio = excluded.beneficio,
  estado = excluded.estado, liberado = excluded.liberado, workflow = excluded.workflow, orden = excluded.orden;

-- La familia entera cuelga del agente.
update public.catalogo set puede_llevar = array[
  'consultar-saldo', 'registrar-consumo', 'recargar-saldo', 'registrar-cliente',
  'estado-pedido', 'confirmar-pago',
  'ver-disponibilidad', 'agendar-cita', 'registrar-reclamo',
  'recordatorio-cita', 'reactivacion'
] where clave = 'agente-atencion';
