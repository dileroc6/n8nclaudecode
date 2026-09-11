-- ============================================================================
-- Toque Tienda — buscar como escribe la gente, no como se llama el producto
-- ----------------------------------------------------------------------------
-- EL BUG QUE ESTO ARREGLA, y lo encontró una conversación de prueba, no el
-- código:
--
--   alguien escribió «overol talla XL» y el agente contestó «no tenemos overol
--   talla XL en el catálogo». Sí lo hay: se llama «Overol de trabajo talla XL».
--
-- La búsqueda pedía que lo escrito apareciera TAL CUAL, seguido, dentro del
-- nombre. Y nadie escribe el nombre exacto de un producto:
--
--   «guantes nitrilo»     → 0 resultados   (el nombre dice «guantes de nitrilo»)
--   «overol talla xl»     → 0 resultados   (el nombre mete «de trabajo» en medio)
--   «martillo uña»        → 0 resultados
--
-- Las pruebas de la base nunca lo vieron porque todas buscaban UNA palabra.
-- Escribir dos es lo normal y ahí se caía entero.
--
-- El arreglo: se parte en palabras y se exigen TODAS, en cualquier orden. Las
-- de una sola letra se ignoran —«m» estaría dentro de casi todo y no filtraría
-- nada—, con una excepción: si TODO lo que escribieron es de una letra, se usa
-- tal cual, porque entonces sí es lo único que dijeron.
--
-- Idempotente.
-- ============================================================================

create or replace function public.tf_tool_buscar_catalogo(p_payload jsonb)
returns json
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_company uuid;
  v_texto   text := translate(lower(btrim(coalesce(p_payload->>'que', ''))),
                              'áéíóúàèìòùäëïöüâêîôûñ', 'aeiouaeiouaeiouaeioun');
  v_limite  int  := least(greatest(coalesce((p_payload->>'cuantos')::int, 5), 1), 10);
  v_palabras text[];
  v_primera text;
  v_hay     json;
  v_n       int;
  v_fresca  json;
begin
  select company_id into v_company
  from public.agent_config where whatsapp_instance = p_payload->>'instance';
  if v_company is null then
    return json_build_object('ok', false, 'motivo', 'instancia desconocida');
  end if;

  if v_texto = '' then
    return json_build_object('ok', false,
      'motivo', 'falta que me digas que esta buscando la persona');
  end if;

  -- Se parte por todo lo que no sea letra o número: así «martillo de uña» y
  -- «martillo/uña» llegan igual.
  select array_agg(p) into v_palabras
  from unnest(regexp_split_to_array(v_texto, '[^a-z0-9]+')) p
  where length(p) > 1;

  -- Si no quedó ninguna, es que escribieron solo letras sueltas. Se busca eso.
  if v_palabras is null or array_length(v_palabras, 1) = 0 then
    v_palabras := array[regexp_replace(v_texto, '[^a-z0-9]', '', 'g')];
  end if;
  v_primera := v_palabras[1];

  select count(*)::int into v_n
  from public.productos where company_id = v_company and activo;

  if v_n = 0 then
    -- Que el catálogo esté vacío es una respuesta legítima y distinta de «no
    -- encontré ese producto». El agente tiene que poder decir la verdad.
    return json_build_object('ok', false, 'motivo', 'este negocio todavia no tiene su catalogo cargado');
  end if;

  v_fresca := public.tf_catalogo_frescura(v_company);

  select coalesce(json_agg(t.x order by t.orden), '[]'::json) into v_hay from (
    select json_build_object(
             'nombre', p.nombre,
             'sku', p.sku,
             'precio', p.precio_cop,
             -- Se devuelve tal cual, incluido el nulo: el agente distingue
             -- «quedan 3», «no quedan» y «no lo sé».
             'existencias', p.existencias,
             'variante', p.variante,
             'url', p.url,
             'actualizado', p.actualizado_at,
             -- Las hermanas: lo que permite decir «ese viene en M, L y XL, y
             -- de M no queda». Sin esto el agente ofrece lo que no hay.
             'presentaciones', (
               select coalesce(json_agg(json_build_object(
                        'sku', h.sku, 'variante', h.variante,
                        'precio', h.precio_cop, 'existencias', h.existencias)
                      order by h.nombre), '[]'::json)
               from public.productos h
               where h.company_id = p.company_id and h.activo
                 and h.padre_sku is not null
                 and h.padre_sku = coalesce(p.padre_sku, p.sku)
                 and h.sku <> p.sku
             )
           ) as x,
           -- Lo que empieza por la PRIMERA palabra va arriba: quien escribe
           -- «guantes de nitrilo» espera guantes, no «limpiador para guantes».
           case when p.busqueda like v_primera || '%' then 0
                when p.busqueda like '% ' || v_primera || '%' then 1
                else 2 end as orden
    from public.productos p
    where p.company_id = v_company and p.activo
      -- TODAS las palabras, en cualquier orden. Es la línea que arregla el bug.
      and p.busqueda like all (select '%' || w || '%' from unnest(v_palabras) w)
    order by orden, p.nombre
    limit v_limite
  ) t;

  return json_build_object(
    'ok', true,
    'encontrados', json_array_length(v_hay),
    'productos', v_hay,
    'catalogo_al', (v_fresca->>'visto')::timestamptz,
    -- vivo / fresco / viejo / desconocido. Es lo que decide si el agente dice
    -- «quedan 12» o «según lo último que tengo, quedan 12».
    'frescura', v_fresca,
    'que_decir', case v_fresca->>'estado'
      when 'vivo'   then null
      when 'fresco' then 'Puedes decir las existencias, pero no como una promesa.'
      else 'Este catalogo esta viejo: di cuando es el dato y ofrece confirmar antes de cerrar.'
    end
  );
end;
$fn$;

comment on function public.tf_tool_buscar_catalogo(jsonb) is
  'Busca en el catalogo copiado. Parte lo escrito en palabras y las exige todas en cualquier orden: nadie escribe el nombre exacto de un producto.';
