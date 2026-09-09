-- ============================================================================
-- ToqueFlow — Placas base y pines: la estructura, decidida
-- ----------------------------------------------------------------------------
-- Cerrando la conversación del 5 al 8 de septiembre. Diego venía dando vueltas
-- a la misma duda —«¿por qué Toque Atiende es producto y Toque Agenda paquete
-- si se llaman igual?»— y la respuesta que la resolvió no fue de nombres:
--
--   EL CHAT ES LA LÍNEA DIVISORIA.
--   Lo que necesita una conversación para existir → PIN. Cuelga de una placa.
--   Lo que funciona sin conversación             → PLACA BASE. Se vende sola.
--
-- Aplicando esa regla al catálogo aparecieron DOS placas base que ya existían
-- y estaban mal clasificadas:
--
--   la impresión de Rappi   funciona sin chat, 9.301 impresiones desde junio,
--                           y NO TENÍA NOMBRE. Sin nombre no se puede vender
--                           ni referir. Ahora es «Toque Imprime».
--
--   las campañas            no necesitan al agente para nada: son contactos y
--                           envíos. Estaban como automatización colgando del
--                           aire. Ahora son «Toque Escribe», placa base.
--
-- LO QUE SE DECIDIÓ, Y NO SE VUELVE A DISCUTIR HASTA LOS 5 CLIENTES
-- -----------------------------------------------------------------
--   · Al cliente se le habla de TOQUES, cada uno con su línea «Requiere».
--     «Placa» y «pin» son vocabulario interno; «producto» y «paquete» son lo
--     que el sistema usa para saber si algo se expande en piezas.
--   · Un pin no cobra implementación. Solo suma mensualidad. La única
--     excepción es Toque Tienda cuando toca construir la conexión con una
--     plataforma nueva, y se escribe como línea aparte, explicada.
--   · Precio único de pin: $250.000/mes. No han vendido ninguno todavía;
--     diferenciar precios hoy sería adivinar. Se parte cuando haya datos.
--   · No se abre placa base nueva hasta tener 5 clientes en Toque Atiende.
--
-- ⚠ EL NOMBRE DE `campanas` ES EL MÁS FÁCIL DE CAMBIAR DE TODO ESTE ARCHIVO.
--   «Toque Escribe» se eligió por ser la palabra de todos los días —un negocio
--   dice «le escribo a mis clientes»— sobre «Toque Convoca», que dice mejor
--   para qué sirve pero suena a otra cosa. Si se cambia, es una línea.
--
-- Idempotente.
-- ============================================================================


-- ── 1. La dependencia, dicha en el dato ──────────────────────────────────────
-- Hasta ahora que Toque Agenda necesitara a Toque Atiende vivía en la cabeza de
-- quien vendía y en `puede_llevar` del producto, que es la relación mirada
-- desde el otro lado. Ponerla aquí es lo que permite que una pantalla la
-- respete sin cruzar arreglos: si tiene `requiere`, es un pin; si no, es placa.
alter table public.catalogo
  add column if not exists requiere text references public.catalogo (clave);

comment on column public.catalogo.requiere is
  'La clave de la placa base que esta pieza necesita para existir. Nulo = es placa base y se vende sola. Es el candado: ninguna pantalla debe dejar encender algo cuyo `requiere` no este encendido.';


-- ── 2. La implementación, aparte de la mensualidad ───────────────────────────
-- Dos números, no uno. Que un pin tenga este campo en nulo NO es un descuido:
-- es la regla escrita en el dato. Un pin que empiece a cobrar implementación
-- deja de leerse como añadido en la propuesta, y ahí se pierde la estructura.
alter table public.catalogo
  add column if not exists implementacion_cop int;

comment on column public.catalogo.implementacion_cop is
  'Lo que se cobra por unica vez al darlo de alta. Los pines lo tienen en nulo a proposito: solo suman mensualidad. Excepcion documentada: Toque Tienda, cuando hay que construir la conexion con una plataforma nueva.';


-- ── 3. Toque Imprime — la placa base que llevaba meses sin nombre ────────────
update public.catalogo set
  nombre      = 'Toque Imprime',
  descripcion = 'Los pedidos que entran por las plataformas de domicilio salen impresos en el local, sin que nadie los transcriba. Funciona sin agente y sin WhatsApp: es una placa base aparte.',
  beneficio   = 'Los pedidos llegan impresos al mostrador. Nadie los copia a mano ni se equivoca al hacerlo.',
  requiere    = null,
  parametros  = array['Qué impresora y de qué sede', 'Qué plataforma de pedidos']
where clave = 'impresion-pedidos';


-- ── 4. Toque Escribe — la tercera placa, que ya estaba construida ────────────
-- Pasa de `automatizacion` a `producto` porque pasa el test: le sirve a alguien
-- que no tiene Toque Atiende. Que estuviera como automatización hacía que no se
-- pudiera ofrecer a nadie que no llevara ya el agente.
--
-- Cómo se vende, y esto importa tanto como el nombre: NO va de frente. Es la
-- respuesta para el prospecto que dice que el agente es mucho para él —queda
-- adentro, con sus datos en la plataforma, y sube a Toque Atiende cuando le
-- duela contestar. De frente compite con el producto principal.
update public.catalogo set
  nombre      = 'Toque Escribe',
  tipo        = 'producto',
  descripcion = 'La base de contactos del negocio y sus campañas, sin agente de por medio: ver, filtrar, importar y crear campos propios, y mandarle a un segmento el mensaje que quiera, programado y medido. No necesita el chat.',
  beneficio   = 'Le escribes a mucha gente a la vez, programado, y ves quién te respondió.',
  requiere    = null,
  vendible    = true,
  liberado    = true,
  orden       = 40
where clave = 'campanas';


-- ── 5. Toque Atiende — la placa principal, con sus dos números ───────────────
-- Precio fijo por decisión del 28-ago (fila 13 del tablero): no se mueve para
-- los primeros tres clientes.
update public.catalogo set
  precio_cop         = 600000,
  implementacion_cop = 1200000,
  requiere           = null
where clave = 'agente-atencion';


-- ── 6. Los pines: precio único y la dependencia ──────────────────────────────
-- $250.000 los tres. La razón de que sean iguales no es pereza: no se ha
-- vendido ni un pin todavía, así que cualquier diferencia de precio hoy sería
-- inventada. Un solo número que Ferney no tiene que calcular vale más que una
-- optimización adivinada. Se parte cuando haya con qué.
update public.catalogo set
  precio_cop         = 250000,
  implementacion_cop = null,
  requiere           = 'agente-atencion'
where clave in ('paquete-agenda', 'paquete-recargas', 'paquete-tienda');

-- La excepción, y va escrita para que nadie la descubra tarde: la conexión con
-- una plataforma de tienda se construye UNA VEZ POR PLATAFORMA, no por cliente.
-- El primer WooCommerce paga que se construya; el segundo la encuentra hecha.
-- Es la diferencia entre producto y consultoría, y cambia cómo se cobra.
update public.catalogo set
  implementacion_cop = 800000,
  descripcion = 'Conecta el agente con la tienda en linea del negocio: estado del pedido y confirmacion de pago, respondidos con datos de verdad y no de memoria. La conexion con cada plataforma (WooCommerce, Shopify) se construye una sola vez: el primer cliente de esa plataforma paga la conexion, los siguientes no.'
where clave = 'paquete-tienda';

-- Las dos piezas sueltas que se le pueden sumar al agente sin estar en ningún
-- paquete. También son pines: necesitan la conversación.
update public.catalogo set requiere = 'agente-atencion'
where clave in ('reactivacion', 'registrar-reclamo');

-- Y las piezas de adentro: no se venden, pero también dependen del chat. Que
-- lo digan en el dato evita que alguna pantalla las ofrezca por su cuenta.
update public.catalogo set requiere = 'agente-atencion'
where tipo = 'herramienta'
  and clave <> 'responder-conocimiento'
  and requiere is null;


-- ── 6b. El simulador cuelga del agente. El portal no ────────────────────────
-- Corrección del 8-sep, a una pregunta de Diego: «¿el portal y el simulador
-- son parte de Toque Escribe?». Van separados, y la regla los separa sola:
--
--   EL PORTAL      lo usa todo cliente, tenga el agente o no: ahí carga su
--                  conocimiento, ve sus contactos y mira su consumo. Es la
--                  plataforma. No es de nadie y no se cotiza.
--
--   EL SIMULADOR   simula CONVERSACIONES. Sin agente no hay nada que simular.
--                  Estaba como placa base y no lo es: necesita el chat, así
--                  que es un pin. Sigue sin cotizarse —va con el agente, no se
--                  vende aparte— pero ahora cuelga de donde tiene que colgar.
--
-- Consecuencia buena: en la consola el simulador aparece indentado bajo Toque
-- Atiende, y a una empresa que no tenga el agente le dice que no hace nada.
-- Antes salía suelto, como si fuera un producto que se sostiene solo.
update public.catalogo set requiere = 'agente-atencion'
where clave = 'sandbox';

update public.catalogo set requiere = null
where clave = 'portal';


-- ── 6c. Toque Imprime: precio por sede ───────────────────────────────────────
-- Se le pone precio aunque hoy nadie lo pague: FerreteríaYa lo tiene dentro del
-- trato de referidos. Ponerle número es lo que convierte ese trato en una
-- conversación concreta —«esto vale $600.000 al mes por tus dos sedes»— en vez
-- de un regalo del que nadie sabe el tamaño.
--
-- Es más barato que Toque Atiende a propósito: no consume IA por mensaje, no
-- arriesga un WhatsApp y no se puede banear. Operarlo cuesta casi nada, y un
-- precio que no refleje eso suena inflado.
--
-- POR SEDE, las dos cifras: cada impresora y cada cuenta de plataforma es una
-- instalación aparte. Una empresa con dos locales paga dos.
update public.catalogo set
  precio_cop         = 300000,
  implementacion_cop = 500000,
  parametros = array['Qué impresora y de qué sede', 'Qué plataforma de pedidos',
                     'Cuántas sedes: las dos cifras son POR SEDE']
where clave = 'impresion-pedidos';


-- ── 6d. Toque Mide — la cuarta placa liberada, que tampoco tenía nombre ─────
-- Se le pasó al primer barrido: «KPI de ocupación» está liberado, funcionando
-- y facturándose a SM Grand desde hace meses. Si es placa base se llama Toque
-- algo — esa era la regla y esta fila la estaba incumpliendo en silencio.
--
-- El nombre es un verbo y el producto es más ancho que la hotelería: hoy mide
-- ocupación, mañana puede medir otra cosa sin cambiar de nombre. La
-- descripción sí dice lo que mide HOY, que es donde va la honestidad.
update public.catalogo set
  nombre      = 'Toque Mide',
  descripcion = 'El tablero de indicadores del negocio, actualizado solo. Hoy mide ocupación hotelera; la forma sirve para otros indicadores sin cambiarle el nombre. Funciona sin agente y sin WhatsApp: es una placa base aparte.',
  beneficio   = 'Ves cómo va tu ocupación sin armar el reporte a mano.',
  requiere    = null
where clave = 'kpi-ocupacion';

-- Y las que NO están liberadas se quedan con su nombre descriptivo a
-- propósito. Un nombre de la familia es para vender, y algo que no se puede
-- vender no necesita uno todavía: bautizarlas ahora infla la familia y hace
-- parecer que se ofrecen. Se bautizan el día que se liberen.
--   Agente de administración · Retenciones contables · Motor de contenido ·
--   Facturación


-- ── 7. Lo que se le puede sumar a cada placa ─────────────────────────────────
-- Toque Atiende ya lo tenía. Las otras dos placas nacen sin pines, y decirlo
-- explícitamente es mejor que dejarlo en nulo: «todavía no tiene» es una
-- respuesta, «no sé» no lo es.
update public.catalogo set puede_llevar = '{}'
where clave in ('impresion-pedidos', 'campanas') and puede_llevar is null;


-- ── 8. La vista que lee la consola ───────────────────────────────────────────
-- Se rehace para que traiga la dependencia ya resuelta —el nombre de la placa,
-- no solo su clave— y los dos precios. La pantalla no debería tener que cruzar
-- claves a mano para saber si algo se puede encender.
drop view if exists public.catalogo_detalle;
create view public.catalogo_detalle
with (security_invoker = on) as
select
  c.*,
  -- Placa o pin, resuelto aquí y no en la pantalla: es la misma pregunta que
  -- hace la consola, el alta y la propuesta, y tenerla en tres sitios es como
  -- se termina con tres respuestas distintas.
  --
  -- Ojo con la segunda condición, que se me fue en la primera versión: sin
  -- ella, `es_placa` daba verdadero para TODA fila sin `requiere` —las
  -- automatizaciones, el portal, el simulador— y la consola contaba 15 placas
  -- base donde hay 10 productos. Una placa base es un PRODUCTO que no cuelga
  -- de nadie; no cualquier cosa que no cuelgue.
  (c.requiere is null and c.tipo = 'producto')             as es_placa,
  (select r.nombre from public.catalogo r
    where r.clave = c.requiere)                            as requiere_nombre,
  (select count(distinct f.company_id)::int from public.flows f
    where f.catalogo_id = c.id and f.status = 'activo')    as clientes_encendido,
  (select count(distinct f.company_id)::int from public.flows f
    where f.catalogo_id = c.id and f.status <> 'activo')   as clientes_sin_encender,
  (select coalesce(json_agg(json_build_object(
            'clave', x.clave, 'nombre', x.nombre, 'tipo', x.tipo,
            'estado', x.estado, 'liberado', x.liberado,
            'que_hace', coalesce(x.beneficio, x.descripcion)
          ) order by x.tipo, x.orden), '[]'::json)
     from public.catalogo x where x.clave = any(c.incluye) and x.activo)      as lleva_siempre,
  (select coalesce(json_agg(json_build_object(
            'clave', x.clave, 'nombre', x.nombre, 'tipo', x.tipo,
            'estado', x.estado, 'liberado', x.liberado, 'precio_cop', x.precio_cop,
            'que_hace', coalesce(x.beneficio, x.descripcion)
          ) order by x.tipo, x.orden), '[]'::json)
     from public.catalogo x where x.clave = any(c.puede_llevar) and x.activo) as puede_sumar,
  -- Lo que hay DENTRO de un pin. Sirve para que quien vende pueda decir qué
  -- va a poder hacer el agente, sin nombrar las piezas en la propuesta.
  (select coalesce(json_agg(json_build_object(
            'clave', x.clave, 'nombre', x.nombre, 'tipo', x.tipo,
            'estado', x.estado, 'liberado', x.liberado,
            'que_hace', coalesce(x.beneficio, x.descripcion)
          ) order by x.orden), '[]'::json)
     from public.catalogo x where x.clave = any(c.contiene) and x.activo)     as contiene_piezas
from public.catalogo c
where c.activo;

comment on view public.catalogo_detalle is
  'Cada pieza del catalogo con su dependencia resuelta (es_placa, requiere_nombre), sus dos precios, de que se compone y cuantos clientes la tienen.';

grant select on public.catalogo_detalle to authenticated;


-- ── 9. El candado, en la base y no solo en la pantalla ───────────────────────
-- Una regla que solo vive en el frontend es una regla que se salta el primero
-- que llame a la API directo, o el primer script de alta. Esta función es la
-- que responde «¿esta empresa puede encender esto?», y la usan la consola y el
-- alta por igual.
create or replace function public.tf_puede_encender(
  p_company uuid,
  p_clave   text
)
returns json
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_c        public.catalogo%rowtype;
  v_requiere public.catalogo%rowtype;
begin
  select * into v_c from public.catalogo where clave = p_clave and activo;
  if not found then
    return json_build_object('puede', false, 'motivo', 'esa pieza no existe');
  end if;

  if not v_c.liberado then
    -- No es un error: es la verdad. Ofrecer lo que no esta construido es como
    -- se prometen fechas que no se cumplen.
    return json_build_object('puede', false, 'motivo', 'todavia en construccion',
                             'estado', v_c.estado);
  end if;

  if v_c.requiere is null then
    return json_build_object('puede', true);
  end if;

  select * into v_requiere from public.catalogo where clave = v_c.requiere;

  if exists (
    select 1 from public.flows f
    join public.catalogo r on r.id = f.catalogo_id
    where f.company_id = p_company and r.clave = v_c.requiere and f.status = 'activo'
  ) then
    return json_build_object('puede', true);
  end if;

  return json_build_object('puede', false,
    'motivo', 'requiere ' || coalesce(v_requiere.nombre, v_c.requiere),
    'requiere', v_c.requiere);
end;
$fn$;

-- ── 10. La matriz, con el candado ya resuelto ───────────────────────────────
-- `empresa_catalogo` es lo que dibuja la consola. Se rehace para que traiga,
-- por cada celda, si esa empresa PUEDE encender esa pieza — y si no, por qué.
-- Calcularlo en la pantalla obligaría a cruzar la matriz consigo misma en el
-- navegador, y esa es justo la clase de lógica que se olvida de actualizar
-- cuando alguien agrega un pin nuevo.
drop view if exists public.empresa_catalogo;
create view public.empresa_catalogo
with (security_invoker = on) as
select
  co.id    as company_id,
  co.name  as empresa,
  ca.id    as catalogo_id,
  ca.clave,
  ca.tipo,
  ca.nombre,
  ca.descripcion,
  ca.beneficio,
  ca.estado   as estado_pieza,
  ca.visible_cliente,
  ca.vendible,
  ca.liberado,
  ca.orden,
  ca.precio_cop,
  ca.implementacion_cop,
  ca.requiere,
  -- Mismo criterio que en `catalogo_detalle`, y por la misma razón: placa base
  -- es un producto que no cuelga de nadie.
  (ca.requiere is null and ca.tipo = 'producto')       as es_placa,
  (select r.nombre from public.catalogo r
    where r.clave = ca.requiere)                       as requiere_nombre,
  -- El candado. Verdadero cuando la pieza no necesita placa, o cuando la placa
  -- que necesita ya está ACTIVA en esta empresa. Tenerla contratada y apagada
  -- no basta: un pin encendido sobre una placa apagada no hace nada, y
  -- mostrarlo como encendido sería mentirle a quien mira la consola.
  (ca.requiere is null or exists (
     select 1 from public.flows fr
     join public.catalogo cr on cr.id = fr.catalogo_id
     where fr.company_id = co.id and cr.clave = ca.requiere and fr.status = 'activo'
   ))                                                  as placa_lista,
  coalesce(f.veces, 0)          as veces,
  coalesce(f.ids, '{}'::uuid[]) as flow_ids,
  f.nombres                     as nombres_para_el_cliente,
  case
    when coalesce(f.veces, 0) = 0 then 'no'
    when f.alguno_activo          then 'activo'
    else                               'proximamente'
  end as estado_empresa
from public.companies co
cross join public.catalogo ca
left join lateral (
  select count(*)::int                        as veces,
         array_agg(fl.id)                     as ids,
         array_agg(fl.name order by fl.name)   as nombres,
         bool_or(fl.status = 'activo')         as alguno_activo
  from public.flows fl
  where fl.company_id = co.id and fl.catalogo_id = ca.id
) f on true
where ca.activo;

comment on view public.empresa_catalogo is
  'La matriz empresa x pieza, con la jerarquia resuelta: es_placa, requiere_nombre y placa_lista (si esta empresa ya puede encender esa pieza). estado_empresa usa las mismas palabras que ve el cliente.';

grant select on public.empresa_catalogo to authenticated;


comment on function public.tf_puede_encender(uuid, text) is
  'Responde si una empresa puede encender una pieza: que este liberada y que su placa base este activa. La usan la consola y el alta — tener la regla en un solo sitio es lo que evita que el alta acepte lo que la consola rechaza.';

revoke all on function public.tf_puede_encender(uuid, text) from public, anon;
grant execute on function public.tf_puede_encender(uuid, text) to authenticated;
