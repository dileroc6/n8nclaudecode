-- ============================================================================
-- ToqueFlow — Qué pantalla abre cada cosa que se contrata
-- ----------------------------------------------------------------------------
-- El panel del cliente muestra una card por cada cosa contratada, y si esa
-- cosa tiene pantalla propia, la card trae un «Abrir». Cuál pantalla es se
-- decidía A MANO en cada seed de cliente: `seed-ferreteriaya.cjs` escribe
-- 'rappi-bogota.html', `seed-smgrandhotel.cjs` escribe la suya, y el alta nueva
-- no escribe ninguna.
--
-- Resultado: un cliente dado de alta por la consola se queda con cards que no
-- abren nada, aunque la herramienta exista. Y cada pantalla nueva obliga a
-- acordarse de tocar un archivo que no tiene nada que ver.
--
-- La pieza del catálogo es la que sabe qué es; que sepa también con qué se
-- abre. Una sola definición.
--
-- Idempotente.
-- ============================================================================

alter table public.catalogo add column if not exists tool_url text;

comment on column public.catalogo.tool_url is
  'La pantalla del portal que abre esta pieza, si tiene una. Lo lee el alta para que la card del panel traiga su boton «Abrir». Antes vivia escrito a mano en cada seed de cliente.';

-- Lo que ya existe y tiene pantalla.
update public.catalogo set tool_url = 'agenda.html'      where clave = 'paquete-agenda'   and tool_url is distinct from 'agenda.html';
update public.catalogo set tool_url = 'campanas.html'    where clave = 'campanas'         and tool_url is distinct from 'campanas.html';
update public.catalogo set tool_url = 'modo-prueba.html' where clave = 'sandbox'          and tool_url is distinct from 'modo-prueba.html';
-- `portal` se queda sin pantalla a proposito: el portal ES el panel, no algo
-- que el panel abra. Y los contactos se ven desde ahi.
update public.catalogo set tool_url = 'pedidos.html'     where clave = 'paquete-tienda'   and tool_url is distinct from 'pedidos.html';

-- Y los flows que ya estan creados y se quedaron sin boton.
update public.flows f
   set tool_url = c.tool_url
  from public.catalogo c
 where f.catalogo_id = c.id
   and c.tool_url is not null
   and f.tool_url is null;
