-- ============================================================================
-- ToqueFlow — Una sola respuesta a «¿cómo cobra este negocio?»
-- ----------------------------------------------------------------------------
-- Había dos sitios que lo contestaban, y el segundo lo creé yo el 22-sep sin
-- saber que existía el primero:
--
--   `tienda_cobro`        qué métodos tiene prendidos (link / transferencia /
--                         efectivo) y los datos de la cuenta. La configura la
--                         CONSOLA de ToqueFlow.
--   `private.tf_pasarela` con qué pasarela cobra y con qué llaves, más un link
--                         de pago fijo si lo tiene. La configura EL CLIENTE
--                         desde su portal.
--
-- Se pisan en «link»: los dos pueden decir que el negocio cobra con un link, y
-- solo uno de los dos tiene el link de verdad.
--
-- CÓMO SE RESUELVE, Y POR QUÉ ASÍ
--
-- `tf_cobro_de` sigue siendo la única función que contesta —eso no cambia— pero
-- ahora mira las dos, y se reparten el trabajo así:
--
--   QUÉ se puede ofrecer   lo decide `tienda_cobro` **si tiene fila**. Esa fila
--                          solo existe si alguien la guardó en la consola, así
--                          que un `false` ahí es una decisión tomada, no un
--                          valor por defecto — y **un apagado explícito manda**.
--                          Encender la transferencia porque «quedaron datos de
--                          cuenta» es como el agente manda a consignar a una
--                          cuenta que el negocio dejó de usar.
--
--   Si NO hay fila         —el caso de todo cliente nuevo, porque nadie entró a
--                          la consola a configurarle nada— manda lo que el
--                          cliente dejó listo en su portal. Sin esto, un cliente
--                          configura su pasarela y su agente no se entera.
--
--   CON QUÉ se cobra       lo del cliente manda siempre. Su cuenta y su link los
--                          escribió él, y los conoce mejor que nosotros.
--
-- Las dos configuraciones no son redundantes: una dice QUÉ se puede ofrecer y
-- la otra CON QUÉ se cobra. Lo que estaba mal era que la segunda no llegara al
-- agente.
--
-- LO QUE EL AGENTE NO PUEDE HACER
--
-- Inventarse una cuenta. Sin configurar, `configurado:false` y la instrucción
-- es decir «te confirmo cómo puedes pagar» y escalar. Un agente que se saca una
-- cuenta de la manga hace que alguien consigne a un número equivocado.
--
-- Idempotente.
-- ============================================================================

create or replace function public.tf_cobro_de(p_company uuid)
returns json
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_c       public.tienda_cobro%rowtype;
  v_pas     record;
  v_link    text;
  v_datos   text;
  v_m       text[] := '{}';
begin
  select * into v_c from public.tienda_cobro where company_id = p_company;

  -- Lo que el CLIENTE configuró en su portal. Sus DATOS mandan sobre los de la
  -- consola; qué se puede ofrecer lo decide la consola si ya opinó.
  select p.proveedor, p.llaves into v_pas
  from private.tf_pasarela p where p.company_id = p_company;

  if found then
    v_link  := nullif(btrim(coalesce(v_pas.llaves->>'link_pago', '')), '');
    -- La pasarela «transferencia» guarda lo que el negocio le dicta a quien va
    -- a pagar. Es lo mismo que `datos_cuenta`, escrito por su dueño.
    if v_pas.proveedor = 'transferencia' then
      v_datos := nullif(btrim(coalesce(v_pas.llaves->>'instrucciones', '')), '');
    end if;
  end if;

  v_datos := coalesce(v_datos, v_c.datos_cuenta);

  -- ── Qué se puede ofrecer ──────────────────────────────────────────────────
  --
  -- UN APAGADO EXPLICITO MANDA. Si hay fila en `tienda_cobro`, sus interruptores
  -- son decisiones tomadas y se respetan — aunque queden datos de cuenta de
  -- antes. Encenderla porque «hay datos» es como el agente ofrece transferencia
  -- a una cuenta que el negocio dejo de usar, y esa plata no la encuentra nadie.
  --
  -- Si NO hay fila —el caso de todo cliente nuevo, porque nadie ha entrado a la
  -- consola a configurarle nada— entonces manda lo que el cliente dejo listo en
  -- su portal. Si no, un cliente que configura su pasarela se queda con un
  -- agente que no se entera.
  if v_c.company_id is not null then
    if v_c.link          then v_m := v_m || 'link'::text; end if;
    if v_c.transferencia then v_m := v_m || 'transferencia'::text; end if;
    if v_c.efectivo      then v_m := v_m || 'efectivo'::text; end if;
  else
    if v_link  is not null then v_m := v_m || 'link'::text; end if;
    if v_datos is not null then v_m := v_m || 'transferencia'::text; end if;
  end if;

  if array_length(v_m, 1) is null then
    return json_build_object(
      'configurado', false,
      'metodos', '[]'::json,
      'que_decir', 'Este negocio todavia no tiene configurada la forma de cobro. NO inventes una cuenta ni un link: dile que le confirmas como puede pagar y escala.');
  end if;

  return json_build_object(
    'configurado', true,
    'metodos', to_json(v_m),
    -- Solo se manda lo que se va a usar: no hay razon para que los datos de la
    -- cuenta anden circulando en cada turno cuando la transferencia esta
    -- apagada.
    'datos_cuenta', case when 'transferencia' = any(v_m) then v_datos else null end,
    'link_pago',    case when 'link' = any(v_m) then v_link else null end,
    'que_decir', case
      when array_length(v_m, 1) = 1 and v_m[1] = 'transferencia'
        then 'Solo recibe transferencia. Dicta los datos de la cuenta TAL CUAL vienen, sin resumir ni reordenar. NO ofrezcas link de pago: no existe.'
      when array_length(v_m, 1) = 1 and v_m[1] = 'link'
        then 'Solo cobra con link de pago. Pasa el link TAL CUAL viene. NO ofrezcas transferencia ni des datos de cuenta.'
      when array_length(v_m, 1) = 1 and v_m[1] = 'efectivo'
        then 'Solo recibe efectivo, contra entrega. NO ofrezcas link ni transferencia.'
      else 'Ofrece las formas que estan prendidas y deja que la persona escoja. Si escoge transferencia, dicta los datos TAL CUAL; si escoge link, pasa el link TAL CUAL.'
    end
  );
end;
$fn$;

comment on function public.tf_cobro_de(uuid) is
  'UNA sola respuesta a como cobra este negocio. Mira lo que prendio la consola (`tienda_cobro`) y lo que configuro el CLIENTE en su portal (`private.tf_pasarela`), y lo del cliente manda: conoce su propia cuenta mejor que nosotros. Sin configurar devuelve configurado:false para que el agente no se invente una cuenta.';
