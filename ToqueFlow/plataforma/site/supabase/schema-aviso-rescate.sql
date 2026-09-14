-- ============================================================================
-- ToqueFlow — El aviso diario de Toque Rescata
-- ----------------------------------------------------------------------------
-- Las tres pérdidas ya se detectan y la campaña se arma con un clic. Pero para
-- todo eso el negocio tiene que **entrar al portal a mirar**, y un negocio con
-- pacientes en la sala no entra al portal a mirar.
--
-- Una funcionalidad que hay que acordarse de ir a consultar no es un servicio:
-- es una pantalla. Esto es lo que la convierte en servicio — le llega solo.
--
-- LO QUE NO HACE, Y ES LO MISMO DE SIEMPRE
--
-- No envía campañas. Avisa a las PERSONAS DEL NEGOCIO —por correo, a quienes
-- tienen cuenta— de lo que hay para recuperar. El mensaje a los pacientes lo
-- sigue mandando una persona, después de leerlo. Detectar es barato y no se
-- equivoca; escribirle a cuarenta pacientes porque un cálculo vio un día flojo
-- es como se gana un baneo.
--
-- TRES COSAS QUE DECIDEN SI ESTO SIRVE O SE FILTRA
--
-- 1. Llega por la MAÑANA del negocio, no a las 3 a.m. de un servidor en Ohio.
--    Un aviso de «mañana tienes 6 huecos» que llega cuando ya cerraron no sirve
--    de nada. Se mira la zona horaria de cada empresa.
--
-- 2. No se repite si no cambió nada. Un correo diario que dice siempre lo mismo
--    se aprende a ignorar en una semana, y entonces el día que diga algo
--    importante tampoco se lee. Se guarda una huella de los números y solo se
--    vuelve a escribir si cambiaron — o si pasaron 7 días, para que un problema
--    parado tampoco desaparezca en silencio.
--
-- 3. Si no hay nada que recuperar, no escribe. El silencio es una respuesta.
--
-- Idempotente.
-- ============================================================================

create or replace function public.tf_run_aviso_rescate()
returns int
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare
  r          record;
  v_p        json;
  v_huecos   int;
  v_ofrecer  int;
  v_plant    int;
  v_prop     int;
  v_huella   text;
  v_antes    jsonb;
  v_correos  text[];
  v_hora     int;
  n          int := 0;
begin
  for r in
    -- Quien contrató el pin y lo tiene encendido. Se mira por el catálogo y no
    -- por `flows.kind`: las empresas viejas guardan ahí el TIPO, no la clave, y
    -- buscar por nombre las dejaría fuera sin que nadie se enterara.
    select distinct c.id, c.name, c.metadata
    from public.companies c
    join public.flows f     on f.company_id = c.id
    join public.catalogo cat on cat.id = f.catalogo_id
    where cat.clave = 'paquete-rescata'
      and f.status = 'activo'
      and c.status = 'active'
  loop
    -- ── ¿Es de mañana allá? ───────────────────────────────────────────────
    -- El cron corre cada hora; cada empresa entra solo en la suya.
    v_hora := extract(hour from timezone(public.tf_zona(r.id), now()))::int;
    if v_hora <> 8 then
      continue;
    end if;

    v_p := public.tf_rescate_pendiente(r.id, 3);
    if v_p is null or (v_p->>'ok')::boolean is not true then
      continue;
    end if;

    v_huecos  := coalesce((v_p->'huecos'->>'horas')::int, 0);
    v_ofrecer := coalesce((v_p->'huecos'->>'a_quien_ofrecer')::int, 0);
    v_plant   := coalesce((v_p->'plantones'->>'cuantos')::int, 0);
    v_prop    := coalesce((v_p->'propuestas'->>'cuantos')::int, 0);

    -- ── ¿Hay algo que hacer? ──────────────────────────────────────────────
    -- Huecos sin nadie a quien ofrecérselos no es una tarea, es un dato triste.
    if not ((v_huecos > 0 and v_ofrecer > 0) or v_plant > 0 or v_prop > 0) then
      continue;
    end if;

    -- ── ¿Ya lo dije, y sigue siendo lo mismo? ─────────────────────────────
    v_huella := v_huecos || '/' || v_ofrecer || '/' || v_plant || '/' || v_prop;
    v_antes  := r.metadata->'rescate_aviso';

    if v_antes is not null
       and v_antes->>'huella' = v_huella
       and (v_antes->>'cuando')::timestamptz > now() - interval '7 days' then
      continue;
    end if;

    -- ── A quién ───────────────────────────────────────────────────────────
    -- A las personas del NEGOCIO, nunca a un paciente. Por eso sale de
    -- `profiles` y no de `contacts`.
    select array_agg(p.email) into v_correos
    from public.profiles p
    where p.company_id = r.id and p.status = 'active'
      and nullif(btrim(coalesce(p.email, '')), '') is not null;

    if v_correos is null or array_length(v_correos, 1) = 0 then
      continue;   -- sin a quién escribirle no hay aviso
    end if;

    insert into public.n8n_events (company_id, event, payload)
    values (r.id, 'aviso_rescate', jsonb_build_object(
      'company_id', r.id,
      'empresa',    r.name,
      'para',       to_jsonb(v_correos),
      'huecos',     jsonb_build_object('horas', v_huecos, 'a_quien_ofrecer', v_ofrecer),
      'plantones',  v_plant,
      'propuestas', v_prop,
      'enlace',     'https://toqueflow.com/agenda.html',
      -- Un aviso que no dice qué hacer con lo que dice es ruido.
      'resumen',    public.tf_rescate_resumen(v_huecos, v_ofrecer, v_plant, v_prop),
      'test', false
    ));

    update public.companies
       set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
             'rescate_aviso', jsonb_build_object('huella', v_huella, 'cuando', now()))
     where id = r.id;

    n := n + 1;
  end loop;

  return n;
end;
$fn$;

comment on function public.tf_run_aviso_rescate() is
  'El aviso diario de Toque Rescata. Sale por la manana del NEGOCIO, no se repite si no cambio nada, y si no hay nada que recuperar no escribe. Avisa a las personas de la empresa; el mensaje a los pacientes lo sigue mandando una persona.';


-- ── Lo que dice el aviso ────────────────────────────────────────────────────
-- En una función aparte para que el texto se pueda leer y probar sin montar una
-- empresa entera y esperar a que sean las 8 de la mañana allá.
create or replace function public.tf_rescate_resumen(
  p_huecos int, p_ofrecer int, p_plantones int, p_propuestas int
)
returns text
language sql
immutable
as $fn$
  select array_to_string(array_remove(array[
    case when p_huecos > 0 and p_ofrecer > 0 then
      p_huecos || (case when p_huecos = 1 then ' hora libre' else ' horas libres' end) ||
      ' en los próximos días, y ' || p_ofrecer ||
      (case when p_ofrecer = 1 then ' persona sin cita a quien ofrecérsela'
            else ' personas sin cita a quienes ofrecérselas' end)
    end,
    case when p_plantones > 0 then
      p_plantones || (case when p_plantones = 1
        then ' persona que faltó a su cita y no ha vuelto a agendar'
        else ' personas que faltaron a su cita y no han vuelto a agendar' end)
    end,
    case when p_propuestas > 0 then
      p_propuestas || (case when p_propuestas = 1
        then ' propuesta sin respuesta' else ' propuestas sin respuesta' end)
    end
  ], null), E'\n');
$fn$;


grant execute on function public.tf_rescate_resumen(int, int, int, int) to authenticated;
-- `tf_run_aviso_rescate` NO se concede a nadie. Encola eventos que disparan
-- correos: la corre el cron, que va como dueño de la base. Es el mismo agujero
-- que tenia `tf_run_due_campaigns`, por donde un desconocido podia disparar
-- envios reales de WhatsApp.
revoke execute on function public.tf_run_aviso_rescate()                  from public, anon, authenticated;
revoke execute on function public.tf_rescate_resumen(int, int, int, int)  from public, anon;


-- ── El cron ─────────────────────────────────────────────────────────────────
-- Cada hora, porque cada empresa tiene su propia mañana. La función decide
-- quién entra: sin eso, una clínica en Madrid recibiría el aviso de madrugada.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('tf-aviso-rescate')
      where exists (select 1 from cron.job where jobname = 'tf-aviso-rescate');
    perform cron.schedule('tf-aviso-rescate', '5 * * * *',
      'select public.tf_run_aviso_rescate()');
  end if;
end $$;
