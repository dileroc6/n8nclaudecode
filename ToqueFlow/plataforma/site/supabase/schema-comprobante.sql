-- ============================================================================
-- El comprobante de la transferencia deja de perderse
-- ----------------------------------------------------------------------------
-- Así paga una pyme colombiana: transfiere y manda el pantallazo. Y hasta hoy
-- el agente descartaba todo mensaje sin texto con el motivo «sin texto (audio,
-- imagen, sticker o estado)». Suena razonable hasta que uno se da cuenta de que
-- ahí adentro iba el comprobante.
--
-- Resultado: la persona mandaba el pantallazo y NO PASABA NADA. Ni el agente se
-- enteraba, ni le llegaba a nadie, ni quedaba escrito. La mitad del cobro que
-- decidimos ofrecer —transferencia y link— estaba rota de entrada.
--
-- LO QUE SE GUARDA ES EL ID DEL MENSAJE, NO LA IMAGEN. Con ese id se le pide a
-- Evolution cuando alguien la quiera ver. Bajarla en cada mensaje costaría
-- tiempo y disco por algo que casi nadie abre — y la conversación de WhatsApp,
-- que es donde el negocio ya la tiene, no se va a ninguna parte.
--
-- Y sigue sin significar que el pago entró: un pantallazo se edita en treinta
-- segundos. Que EXISTA un comprobante es un dato para quien verifica, no una
-- confirmación.
--
-- Idempotente.
-- ============================================================================

alter table public.pedidos
  add column if not exists pago_comprobante_wa_id text;

comment on column public.pedidos.pago_comprobante_wa_id is
  'El id del mensaje de WhatsApp donde mando el pantallazo. Con el se le pide la imagen a Evolution cuando alguien la quiera ver. Que exista NO quiere decir que el pago entro.';


-- La herramienta lo acepta y lo guarda. El resto de `tf_tool_confirmar_pago`
-- no cambia: sigue dejando el pago en «reportado», nunca en «verificado».
do $$
declare
  v_def   text;
  v_nuevo text;
  v_veces int;
  v_ancla text := 'pago_comprobante_url = coalesce(nullif(trim(p_payload->>''comprobante_url''), ''''), pago_comprobante_url),';
begin
  select pg_get_functiondef(oid) into v_def
  from pg_proc where proname = 'tf_tool_confirmar_pago' limit 1;

  if position('pago_comprobante_wa_id' in v_def) > 0 then
    raise notice 'ya guardaba el id del comprobante'; return;
  end if;

  -- Se cuentan las ocurrencias antes de tocar nada: un reemplazo que pega en
  -- dos sitios rompe la funcion para todos los clientes. Ya paso una vez.
  v_veces := (length(v_def) - length(replace(v_def, v_ancla, ''))) / length(v_ancla);
  if v_veces <> 1 then
    raise exception 'el ancla aparece % veces, tiene que aparecer 1', v_veces;
  end if;

  v_nuevo := replace(v_def, v_ancla,
    v_ancla || chr(10) ||
    '         pago_comprobante_wa_id = coalesce(nullif(trim(p_payload->>''comprobante_wa_id''), ''''), pago_comprobante_wa_id),');

  execute v_nuevo;
  raise notice 'confirmar-pago guarda el id del comprobante';
end $$;


-- La bandeja lo muestra: quien verifica necesita saber si hay pantallazo o solo
-- una promesa.
drop view if exists public.pagos_por_verificar;
create view public.pagos_por_verificar
with (security_invoker = on) as
select
  p.id, p.company_id, p.numero, p.total_cop,
  p.pago_metodo, p.pago_referencia, p.pago_dicho,
  p.pago_comprobante_url, p.pago_comprobante_wa_id,
  -- Lo que de verdad se pregunta al mirar la bandeja: ¿mandó soporte o no?
  (p.pago_comprobante_url is not null or p.pago_comprobante_wa_id is not null) as hay_comprobante,
  p.pago_reportado_at,
  c.full_name as persona, c.phone as telefono
from public.pedidos p
left join public.contacts c on c.id = p.contact_id
where p.pago_estado = 'reportado';

comment on view public.pagos_por_verificar is
  'Los pagos que alguien dijo que hizo y nadie ha comprobado. Con link de pago esto deberia estar casi siempre vacio: la pasarela verifica sola.';

grant select on public.pagos_por_verificar to authenticated;
