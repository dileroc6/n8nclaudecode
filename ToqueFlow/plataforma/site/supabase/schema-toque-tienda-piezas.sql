-- ============================================================================
-- ToqueFlow — Toque Tienda no alcanza para los clientes que tiene que reemplazar
-- ----------------------------------------------------------------------------
-- Al ir a migrar Savia y FerreteriaYa al estandar (fila 26) aparecio que sus
-- agentes viejos NO se apoyan en un documento de conocimiento, como Zoe o
-- LuxeSmile, sino en CONSULTAS EN VIVO a su catalogo:
--
--   FerreteriaYa   BuscarEnSiigo, BuscarEnWeb, BuscarProductos
--   Savia          woocommerce_buscar_productos, crear_pedido_woo
--
-- Y Toque Tienda, tal como esta definido, lleva `estado-pedido` y
-- `confirmar-pago`. Ninguna de las dos es «buscar en el catalogo» ni «crear un
-- pedido», que es justo lo que estos dos agentes hacen todo el dia.
--
-- O sea: el paquete que existe para reemplazarlos no cubre lo que hacen. Se
-- deja escrito en el catalogo para que la proxima persona que mire Toque Tienda
-- vea las cuatro piezas y no dos.
-- ============================================================================

insert into public.catalogo (clave, nombre, tipo, descripcion, beneficio, estado, liberado, visible_cliente, vendible, workflow, orden)
values
  ('buscar-catalogo', 'Buscar en el catálogo', 'herramienta',
   'El agente busca un producto en el catalogo del negocio —WooCommerce, Siigo o el que use— y responde con el precio y si hay existencias. Es lo que hacen todo el dia los agentes de Savia y FerreteriaYa.',
   'Preguntan por un producto y el agente responde con el precio de verdad, no con uno de memoria.',
   'a_medias', false, false, false, 'tool-buscar-catalogo', 131),

  ('crear-pedido', 'Crear el pedido', 'herramienta',
   'Dejar el pedido creado en la tienda del negocio con lo que la persona pidio. Existe para Savia contra WooCommerce. Como matricular y recargar, esto COMPROMETE al negocio: la confirmacion final la da una persona.',
   'El pedido queda armado sin que nadie lo transcriba.',
   'a_medias', false, false, false, 'tool-crear-pedido', 132)
on conflict (clave) do update set
  nombre = excluded.nombre, descripcion = excluded.descripcion, beneficio = excluded.beneficio,
  estado = excluded.estado, workflow = excluded.workflow, orden = excluded.orden;

update public.catalogo set requiere = 'agente-atencion'
where clave in ('buscar-catalogo', 'crear-pedido');

-- Las cuatro piezas que de verdad hacen falta para reemplazar a Savia y
-- FerreteriaYa. Antes eran dos, y con dos no se podia migrar a nadie.
update public.catalogo set
  contiene = array['buscar-catalogo', 'estado-pedido', 'confirmar-pago', 'crear-pedido'],
  descripcion = 'Conecta el agente con la tienda del negocio: buscar un producto y decir su precio y existencias, dejar un pedido armado, consultar en que va y confirmar un pago. La conexion con cada plataforma (WooCommerce, Siigo, Shopify) se construye una sola vez: el primer cliente de esa plataforma la paga, los siguientes no.'
where clave = 'paquete-tienda';
