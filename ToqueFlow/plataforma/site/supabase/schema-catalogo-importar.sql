-- ============================================================================
-- ToqueFlow — El negocio carga su propio catálogo
-- ----------------------------------------------------------------------------
-- `public.productos` existe desde que existe Toque Tienda, y `buscar-catalogo`
-- lee de ahí. Pero la tabla solo tenía política de LECTURA: el cliente podía
-- ver su catálogo y **no había forma de meterlo**. Ningún archivo del portal
-- escribía en ella; solo las pruebas.
--
-- O sea que el pin se vende y no se puede estrenar sin que alguien entre a la
-- base. Es la misma enfermedad de la agenda (fila 167) y de las recargas.
--
-- El tablero pide un SINCRONIZADOR con la tienda del cliente (fila 157) y lo
-- trata como decisión pendiente —WooCommerce o Siigo—. Esto no lo reemplaza:
-- cubre el camino barato que nadie cubría, cargar el catálogo a mano, que es lo
-- que permite estrenar el pin mientras se decide el conector.
--
-- LA DECISIÓN QUE MÁS IMPORTA
--
-- **Lo que no viene en el archivo NO se borra.** Un negocio que exporte solo
-- «las novedades del mes» y lo suba borraría su catálogo entero. Apagar un
-- producto es un acto aparte y explícito.
--
-- Idempotente.
-- ============================================================================

create or replace function public.tf_productos_importar(
  p_company uuid,
  p_filas   jsonb
)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare
  v_fila      jsonb;
  v_sku       text;
  v_nombre    text;
  v_precio    numeric;
  v_exist     int;
  v_nuevos    int := 0;
  v_actual    int := 0;
  v_malos     jsonb := '[]'::jsonb;
  v_n         int := 0;
  v_ya        boolean;
begin
  if not public.tf_es_mia(p_company) then
    return json_build_object('ok', false, 'motivo', 'no es tuya');
  end if;
  if p_filas is null or jsonb_typeof(p_filas) <> 'array' then
    return json_build_object('ok', false, 'motivo', 'no llegó ninguna lista de productos');
  end if;

  -- Un tope, para que un archivo enorme no deje la pantalla colgada sin decir
  -- nada. Si alguien tiene más, es señal de que necesita el conector.
  if jsonb_array_length(p_filas) > 2000 then
    return json_build_object('ok', false,
      'motivo', 'son más de 2.000 productos: eso ya pide una conexión con tu tienda, no un archivo');
  end if;

  for v_fila in select * from jsonb_array_elements(p_filas) loop
    v_n := v_n + 1;
    v_sku    := nullif(btrim(coalesce(v_fila->>'sku', '')), '');
    v_nombre := nullif(btrim(coalesce(v_fila->>'nombre', '')), '');

    -- El SKU es la identidad: sin él no se puede saber si es nuevo o el mismo
    -- de siempre con otro precio, y reimportar duplicaría el catálogo entero.
    if v_sku is null then
      v_malos := v_malos || jsonb_build_object('fila', v_n, 'motivo', 'le falta el código (sku)');
      continue;
    end if;
    if v_nombre is null then
      v_malos := v_malos || jsonb_build_object('fila', v_n, 'sku', v_sku, 'motivo', 'le falta el nombre');
      continue;
    end if;

    -- Un precio que no se entiende NO se guarda como cero: el agente lo diría
    -- en voz alta y el negocio regalaría el producto.
    begin
      v_precio := nullif(btrim(coalesce(v_fila->>'precio', '')), '')::numeric;
    exception when others then
      v_malos := v_malos || jsonb_build_object('fila', v_n, 'sku', v_sku,
        'motivo', 'el precio «' || (v_fila->>'precio') || '» no es un número');
      continue;
    end;
    if v_precio is not null and v_precio < 0 then
      v_malos := v_malos || jsonb_build_object('fila', v_n, 'sku', v_sku, 'motivo', 'el precio es negativo');
      continue;
    end if;

    begin
      v_exist := nullif(btrim(coalesce(v_fila->>'existencias', '')), '')::int;
    exception when others then
      v_malos := v_malos || jsonb_build_object('fila', v_n, 'sku', v_sku,
        'motivo', 'las existencias «' || (v_fila->>'existencias') || '» no son un número');
      continue;
    end;

    select exists (select 1 from public.productos where company_id = p_company and sku = v_sku)
      into v_ya;

    insert into public.productos
      (company_id, sku, nombre, descripcion, categoria, precio_cop, existencias, url, origen, actualizado_at)
    values
      (p_company, v_sku, v_nombre,
       nullif(btrim(coalesce(v_fila->>'descripcion', '')), ''),
       nullif(btrim(coalesce(v_fila->>'categoria', '')), ''),
       v_precio, v_exist,
       nullif(btrim(coalesce(v_fila->>'url', '')), ''),
       'archivo', now())
    on conflict (company_id, sku) do update set
      nombre       = excluded.nombre,
      -- Lo que el archivo no trae NO se borra de lo que ya había: una columna
      -- que falta en la exportación no es una orden de vaciar el campo.
      descripcion  = coalesce(excluded.descripcion, public.productos.descripcion),
      categoria    = coalesce(excluded.categoria,   public.productos.categoria),
      precio_cop   = coalesce(excluded.precio_cop,  public.productos.precio_cop),
      existencias  = coalesce(excluded.existencias, public.productos.existencias),
      url          = coalesce(excluded.url,         public.productos.url),
      origen       = 'archivo',
      actualizado_at = now();

    if v_ya then v_actual := v_actual + 1; else v_nuevos := v_nuevos + 1; end if;
  end loop;

  return json_build_object(
    'ok', true,
    'nuevos', v_nuevos, 'actualizados', v_actual,
    'rechazados', jsonb_array_length(v_malos),
    'detalle', v_malos,
    -- Se dice explícitamente, porque es la pregunta que se hace todo el que
    -- sube un archivo parcial y la respuesta tranquiliza.
    'nota', 'Lo que no venía en el archivo se quedó como estaba: nada se borró.');
end;
$fn$;

comment on function public.tf_productos_importar(uuid, jsonb) is
  'Carga o actualiza el catalogo desde un archivo. Identifica por SKU, asi que reimportar no duplica. LO QUE NO VIENE EN EL ARCHIVO NO SE BORRA: un negocio que suba solo las novedades del mes vaciaria su catalogo entero.';


-- ── Encender y apagar un producto, que es un acto aparte ────────────────────
create or replace function public.tf_producto_activo(p_producto uuid, p_activo boolean)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare v_dueno uuid;
begin
  select company_id into v_dueno from public.productos where id = p_producto;
  if v_dueno is null then
    return json_build_object('ok', false, 'motivo', 'ese producto no existe');
  end if;
  if not public.tf_es_mia(v_dueno) then
    return json_build_object('ok', false, 'motivo', 'ese producto no es tuyo');
  end if;

  -- Se apaga, no se borra. Un producto que vuelve en temporada se vuelve a
  -- encender sin recargar el archivo, y los pedidos viejos siguen apuntando a
  -- algo que existe.
  update public.productos set activo = coalesce(p_activo, true), actualizado_at = now()
   where id = p_producto;
  return json_build_object('ok', true, 'activo', coalesce(p_activo, true));
end;
$fn$;


-- ── Tocar el precio o las existencias de uno solo ───────────────────────────
-- Es lo que más cambia y no merece rearmar un archivo entero.
create or replace function public.tf_producto_ajustar(
  p_producto uuid, p_precio numeric, p_existencias int
)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare v_dueno uuid;
begin
  select company_id into v_dueno from public.productos where id = p_producto;
  if v_dueno is null then
    return json_build_object('ok', false, 'motivo', 'ese producto no existe');
  end if;
  if not public.tf_es_mia(v_dueno) then
    return json_build_object('ok', false, 'motivo', 'ese producto no es tuyo');
  end if;
  if p_precio is not null and p_precio < 0 then
    return json_build_object('ok', false, 'motivo', 'el precio no puede ser negativo');
  end if;

  update public.productos set
    precio_cop  = coalesce(p_precio, precio_cop),
    existencias = coalesce(p_existencias, existencias),
    actualizado_at = now()
  where id = p_producto;
  return json_build_object('ok', true);
end;
$fn$;


grant execute on function public.tf_productos_importar(uuid, jsonb)            to authenticated;
grant execute on function public.tf_producto_activo(uuid, boolean)             to authenticated;
grant execute on function public.tf_producto_ajustar(uuid, numeric, int)       to authenticated;
revoke execute on function public.tf_productos_importar(uuid, jsonb)           from public, anon;
revoke execute on function public.tf_producto_activo(uuid, boolean)            from public, anon;
revoke execute on function public.tf_producto_ajustar(uuid, numeric, int)      from public, anon;


-- El upsert necesita que (company_id, sku) sea único. Si no lo fuera, reimportar
-- duplicaria el catalogo en vez de actualizarlo.
create unique index if not exists productos_company_sku_idx
  on public.productos (company_id, sku);
