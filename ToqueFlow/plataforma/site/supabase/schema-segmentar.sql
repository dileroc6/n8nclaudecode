-- ============================================================================
-- ToqueFlow — Una sola definición de «a quién le llega esta campaña»
-- ----------------------------------------------------------------------------
-- La regla vivía en DOS sitios: un nodo de código en n8n y la pantalla de
-- campañas. Dos implementaciones de lo mismo se separan solas, y cuando se
-- separan el negocio ve «40 destinatarios» en la vista previa y salen 35 — sin
-- que nadie pueda explicar por qué.
--
-- Es lo mismo que pasó con la agenda: una sola definición de «libre» para el
-- agente y para el portal, porque tener dos es como se termina ofreciendo una
-- hora que ya estaba ocupada.
--
-- LO QUE SE AGREGA, Y PARA QUÉ
--
-- Hasta hoy solo se podía segmentar por tres cosas: estado, temperatura y qué
-- compró. Con eso no se puede armar «recibió un presupuesto hace más de una
-- semana y no ha contestado» — que es un servicio entero que se puede vender.
--
--   campos          por los campos propios del negocio: el presupuesto, la
--                   talla, el tratamiento. Los define el cliente, así que la
--                   segmentación crece sin que nadie toque código
--   sin_campo       los que NO tienen ese dato: «nunca nos dijo qué le interesa»
--   creado          por antigüedad del contacto
--   ultimo_contacto por cuánto lleva sin hablar con el negocio
--   campo_fecha     por una fecha guardada en un campo propio — esto es lo
--                   que hace posible «el presupuesto lleva 7 días sin respuesta»
--   sin_cita_futura los que no tienen cita agendada. Es la mitad de «llenar
--                   los huecos de mañana»
--   no_asistio      los que dejaron plantado al negocio. Con ventana, porque
--                   escribirle a quien faltó hace dos años no es seguimiento
--
-- LO QUE NO SE NEGOCIA
--
--   · Sin filtros no entra NADIE. Una campaña con el filtro vacío que le
--     escribe a toda la base es como se gana un baneo de WhatsApp.
--   · Las bajas se excluyen SIEMPRE, sin importar el filtro. Escribirle a quien
--     pidió no recibir es ilegal, y hoy el envío no las consultaba.
--   · Sin teléfono no se puede escribir, así que no cuenta como destinatario.
--
-- Idempotente.
-- ============================================================================

create or replace function public.tf_campana_destinatarios(
  p_company  uuid,
  p_filtros  jsonb,
  p_cantidad int default null
)
returns table (
  id         uuid,
  full_name  text,
  phone      text,
  status     text,
  lead_stage text
)
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_f        jsonb := coalesce(p_filtros, '{}'::jsonb);
  v_campos   jsonb := coalesce(v_f->'campos', '{}'::jsonb);
  v_hay      boolean;
begin
  -- De quién es la empresa que me piden. La función es SECURITY DEFINER, así
  -- que sin esto un cliente autenticado pasaba el id de otra empresa y recibía
  -- su lista de contactos con nombre y teléfono. El company_id se comprueba,
  -- nunca se acepta.
  if not public.tf_es_mia(p_company) then
    return;
  end if;

  -- ¿Hay al menos un filtro? Sin esto, una campaña mal guardada le escribe a
  -- la base entera. Se comprueba antes de mirar nada.
  v_hay :=
       jsonb_array_length(coalesce(v_f->'status', '[]'::jsonb))       > 0
    or jsonb_array_length(coalesce(v_f->'lead_stage', '[]'::jsonb))   > 0
    or jsonb_array_length(coalesce(v_f->'service_type', '[]'::jsonb)) > 0
    or v_campos <> '{}'::jsonb
    or jsonb_array_length(coalesce(v_f->'sin_campo', '[]'::jsonb))    > 0
    or v_f ? 'creado'
    or v_f ? 'ultimo_contacto'
    or v_f ? 'campo_fecha'
    or coalesce((v_f->>'sin_cita_futura')::boolean, false)
    or (v_f ? 'no_asistio' and v_f->'no_asistio' <> 'false'::jsonb);

  if not v_hay then
    return;   -- nadie, a propósito
  end if;

  return query
  select c.id, c.full_name, c.phone, c.status, c.lead_stage
  from public.contacts c
  where c.company_id = p_company
    and nullif(btrim(coalesce(c.phone, '')), '') is not null

    -- ── Lo de siempre ──────────────────────────────────────────────────────
    and (jsonb_array_length(coalesce(v_f->'status', '[]'::jsonb)) = 0
         or lower(coalesce(c.status, '')) in (
              select lower(x) from jsonb_array_elements_text(v_f->'status') x))
    and (jsonb_array_length(coalesce(v_f->'lead_stage', '[]'::jsonb)) = 0
         or lower(coalesce(c.lead_stage, '')) in (
              select lower(x) from jsonb_array_elements_text(v_f->'lead_stage') x))
    and (jsonb_array_length(coalesce(v_f->'service_type', '[]'::jsonb)) = 0
         or lower(coalesce(c.service_type, '')) in (
              select lower(x) from jsonb_array_elements_text(v_f->'service_type') x))

    -- ── Los campos propios del negocio ─────────────────────────────────────
    -- Cada clave del filtro tiene que casar. Se compara sin distinguir
    -- mayúsculas porque lo que guarda el agente y lo que escribe una persona
    -- en el portal no siempre coinciden en eso.
    and (v_campos = '{}'::jsonb or not exists (
          select 1 from jsonb_each(v_campos) f(clave, valores)
          where lower(coalesce(c.metadata->>f.clave, '')) not in (
            select lower(x) from jsonb_array_elements_text(f.valores) x)))

    -- Los que NO tienen ese dato.
    and not exists (
          select 1 from jsonb_array_elements_text(coalesce(v_f->'sin_campo', '[]'::jsonb)) k
          where nullif(btrim(coalesce(c.metadata->>k, '')), '') is not null)

    -- ── Fechas ─────────────────────────────────────────────────────────────
    and (not (v_f ? 'creado') or (
          (not (v_f->'creado' ? 'hace_mas_de_dias')
             or c.created_at <= now() - make_interval(days => (v_f->'creado'->>'hace_mas_de_dias')::int))
      and (not (v_f->'creado' ? 'hace_menos_de_dias')
             or c.created_at >= now() - make_interval(days => (v_f->'creado'->>'hace_menos_de_dias')::int))))

    and (not (v_f ? 'ultimo_contacto') or (
          -- Sin fecha de último contacto cuenta como «hace mucho»: nunca ha
          -- hablado con el negocio, que es justo a quien se quiere reactivar.
          (not (v_f->'ultimo_contacto' ? 'hace_mas_de_dias')
             or c.last_contact_at is null
             or c.last_contact_at <= now() - make_interval(days => (v_f->'ultimo_contacto'->>'hace_mas_de_dias')::int))
      and (not (v_f->'ultimo_contacto' ? 'hace_menos_de_dias')
             or (c.last_contact_at is not null
                 and c.last_contact_at >= now() - make_interval(days => (v_f->'ultimo_contacto'->>'hace_menos_de_dias')::int)))))

    -- Una fecha guardada en un campo propio. Lo que hace posible «el
    -- presupuesto lleva más de 7 días sin respuesta».
    and (not (v_f ? 'campo_fecha') or (
          public.tf_fecha_de(c.metadata->>(v_f->'campo_fecha'->>'clave')) is not null
      and (not (v_f->'campo_fecha' ? 'hace_mas_de_dias')
             or public.tf_fecha_de(c.metadata->>(v_f->'campo_fecha'->>'clave'))
                <= now() - make_interval(days => (v_f->'campo_fecha'->>'hace_mas_de_dias')::int))
      and (not (v_f->'campo_fecha' ? 'hace_menos_de_dias')
             or public.tf_fecha_de(c.metadata->>(v_f->'campo_fecha'->>'clave'))
                >= now() - make_interval(days => (v_f->'campo_fecha'->>'hace_menos_de_dias')::int))))

    -- ── Agenda ─────────────────────────────────────────────────────────────
    and (not coalesce((v_f->>'sin_cita_futura')::boolean, false) or not exists (
          select 1 from public.appointments a
          where a.contact_id = c.id and a.estado <> 'cancelada' and a.inicio > now()))

    -- Los que dejaron plantado al negocio. Acepta `true` —cualquiera, alguna
    -- vez— o `{ hace_menos_de_dias: N }`. Casi siempre se quiere lo segundo:
    -- escribirle a quien falto hace dos anos no es un seguimiento.
    and (not (v_f ? 'no_asistio') or v_f->'no_asistio' = 'false'::jsonb or exists (
          select 1 from public.appointments a
          where a.contact_id = c.id and a.estado = 'no_asistio'
            and (jsonb_typeof(v_f->'no_asistio') <> 'object'
                 or not (v_f->'no_asistio' ? 'hace_menos_de_dias')
                 or a.inicio >= now() - make_interval(
                      days => (v_f->'no_asistio'->>'hace_menos_de_dias')::int))))

    -- ── Las bajas, siempre ─────────────────────────────────────────────────
    -- Fuera del filtro a propósito: no es una opción que se pueda desmarcar.
    -- Escribirle a quien pidió no recibir no es un error de segmentación, es
    -- un problema legal — y hasta hoy el envío no las consultaba.
    and not exists (
          select 1 from public.outreach_optouts o
          where o.company_id = p_company
            and (public.tf_telefono(o.phone) = public.tf_telefono(c.phone)
                 or (o.email is not null and lower(o.email) = lower(coalesce(c.email, '#')))))

  order by c.last_contact_at asc nulls first, c.created_at asc
  limit case when p_cantidad is not null and p_cantidad > 0 then p_cantidad else null end;
end;
$fn$;

comment on function public.tf_campana_destinatarios(uuid, jsonb, int) is
  'A quien le llega una campana. UNA sola definicion para el portal y para el envio: tenerla en dos sitios es como la vista previa dice 40 y salen 35. Las bajas se excluyen siempre, y sin filtros no entra nadie.';


-- Una fecha guardada en un campo propio puede venir como la escribió una
-- persona. Se intenta leer y, si no se puede, es nulo — nunca revienta la
-- consulta entera por un dato mal escrito de un solo contacto.
create or replace function public.tf_fecha_de(p_texto text)
returns timestamptz
language plpgsql
immutable
as $fn$
begin
  if nullif(btrim(coalesce(p_texto, '')), '') is null then return null; end if;
  begin
    return p_texto::timestamptz;
  exception when others then
    return null;
  end;
end;
$fn$;

grant execute on function public.tf_fecha_de(text) to authenticated;
grant execute on function public.tf_campana_destinatarios(uuid, jsonb, int) to authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_fecha_de(text) to n8n_worker;
    grant execute on function public.tf_campana_destinatarios(uuid, jsonb, int) to n8n_worker;
  end if;
end $$;
revoke execute on function public.tf_campana_destinatarios(uuid, jsonb, int) from public, anon;
revoke execute on function public.tf_fecha_de(text) from public, anon;
