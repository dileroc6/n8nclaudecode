-- ============================================================================
-- Quien escribe ES un contacto, aunque todavía no esté escrito
-- ----------------------------------------------------------------------------
-- EL BUG, encontrado midiendo por qué el agente armaba el pedido unas veces sí
-- y otras no:
--
--   turno 1  «mándeme 2 cajas»  → crear_pedido → «no tengo a esta persona
--                                                 registrada»
--   turno 2  «sí, confirmo»     → crear_pedido → funciona
--
-- El contacto se crea al GUARDAR el turno, que pasa después de ejecutar la
-- herramienta. Así que en el primer mensaje de alguien nuevo, toda herramienta
-- que necesite un contacto falla. Y la persona no ve un error: ve un agente que
-- le dice que quedó anotado, porque el fallo se lo come la conversación.
--
-- NO ES DE LA TIENDA. `matricular-cliente` tiene el mismo hueco, y es peor ahí:
-- esa herramienta existe precisamente para gente NUEVA. Alguien que escribe
-- «quiero matricularme» en su primer mensaje no se podía matricular.
--
-- La regla es simple: si alguien le está escribiendo al negocio por WhatsApp,
-- es un contacto. Lo unico que faltaba era escribirlo.
--
-- Idempotente.
-- ============================================================================

create or replace function public.tf_contacto_asegurar(
  p_company uuid, p_telefono text, p_nombre text default null)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare
  v_id  uuid;
  v_tel text := public.tf_telefono(p_telefono);
begin
  if p_company is null or v_tel is null or v_tel = '' then
    return null;
  end if;

  select id into v_id from public.contacts
   where company_id = p_company and public.tf_telefono(phone) = v_tel
   limit 1;
  if found then return v_id; end if;

  -- `source = 'whatsapp'` y sin nombre: el nombre lo captura el agente durante
  -- la conversacion y lo guarda al cerrar el turno. Inventarlo aqui seria peor
  -- que dejarlo vacio.
  --
  -- `status` se deja en su default —`prospecto`— y no en «activo»: alguien que
  -- acaba de escribir todavia no compro nada. Marcarlo como cliente inflaria
  -- las cuentas del negocio con gente que solo pregunto.
  insert into public.contacts (company_id, phone, full_name, source)
  values (p_company, p_telefono, nullif(btrim(coalesce(p_nombre, '')), ''), 'whatsapp')
  returning id into v_id;

  return v_id;
exception when unique_violation then
  -- Dos herramientas del mismo turno pueden intentarlo a la vez.
  select id into v_id from public.contacts
   where company_id = p_company and public.tf_telefono(phone) = v_tel
   limit 1;
  return v_id;
end;
$fn$;

comment on function public.tf_contacto_asegurar(uuid, text, text) is
  'Devuelve el contacto de ese telefono, creandolo si no existe. Quien le escribe al negocio por WhatsApp ES un contacto: las herramientas no pueden fallar porque el turno todavia no se haya guardado.';

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_contacto_asegurar(uuid, text, text) to n8n_worker;
  end if;
end
$$;
