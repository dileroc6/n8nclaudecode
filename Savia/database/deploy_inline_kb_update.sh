#!/bin/bash
# =====================================================================
# Savia — Actualizacion KB con info de conversaciones reales (INLINE)
# Patch 003 (idempotente, re-ejecutable)
# =====================================================================
# Como usarlo:
#   1) ssh TU_USUARIO@srv1398596.hstgr.cloud
#   2) Pegar este script completo y dar enter
# =====================================================================
set -euo pipefail

PG_USER="${PG_USER:-leadai_user}"
PG_DB="${PG_DB:-leadai}"

if [ -z "${PG_CONTAINER:-}" ]; then
  PG_CONTAINER=$(docker ps --format '{{.Names}}' | grep -iE 'postgres|^pg-' | head -1 || true)
fi

if [ -z "${PG_CONTAINER:-}" ]; then
  echo "No se encontro container Postgres corriendo."
  docker ps --format 'table {{.Names}}\t{{.Image}}'
  exit 1
fi

echo "------------------------------------------------------"
echo "  Savia - Patch 003 KB update"
echo "  Container: $PG_CONTAINER  |  Usuario: $PG_USER  |  DB: $PG_DB"
echo "------------------------------------------------------"
echo
echo "-> Refrescando 9 topicos del KB (DELETE + INSERT idempotente)..."

docker exec -i "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -v ON_ERROR_STOP=1 <<'SQL'
SET search_path = savia, public;

DELETE FROM savia.kb_documentos
WHERE topico IN ('tallaje','materiales','pagos','envios','descuentos','catalogo','contacto','compra_separada','ubicacion');

INSERT INTO savia.kb_documentos (topico, titulo, contenido, keywords, activo) VALUES
('tallaje', 'Talla unica elastica',
'Todos los productos Savia son TALLA UNICA con tela altamente elastica. Se adaptan muy bien a cuerpos desde talla S hasta M (e incluso algunas L dependiendo de las medidas). La tela es suave, no aprieta y acompaña el movimiento. Cuando una clienta pida talla específica, decirle: "es talla unica elastica que adapta de S a M (algunas L según medidas), pásame tu cintura y cadera y te confirmo cómo te quedaría". NUNCA prometer talla específica (S, M, L, XL).',
ARRAY['talla','tallas','medida','medidas','tallaje','cuanto mide','que talla','talla unica','elastico','elastica','S','M','L','XL','cintura','cadera'],
TRUE);

INSERT INTO savia.kb_documentos (topico, titulo, contenido, keywords, activo) VALUES
('materiales', 'Material: poliester + elastano',
'Los productos Savia estan elaborados con una mezcla de POLIESTER + ELASTANO. Características: textura suave, ligera, excelente elasticidad, segunda piel, no transparenta, durable, ideal tanto para entrenar como para usar en el dia a dia. Si una clienta se queja del poliester, responder: "te entiendo, justo elegimos esa mezcla porque da mejor horma y durabilidad. Mas alla del material, lo clave es que es super suave, no acartona y no transparenta nada".',
ARRAY['material','materiales','tela','telas','de que esta hecho','composicion','poliester','elastano','spandex','calidad','grosor','transparente','transparenta'],
TRUE);

INSERT INTO savia.kb_documentos (topico, titulo, contenido, keywords, activo) VALUES
('pagos', 'Metodos de pago disponibles',
'PAGOS DISPONIBLES:
1. Por la web (https://savia-wear.com): MercadoPago - acepta tarjeta credito/debito, PSE, Nequi y otros medios.
2. Por WhatsApp directo: Nequi o transferencia con llave - el equipo coordina los datos despues del pedido.

NO MANEJAMOS: Sistecredito, SumaPay, contraentrega.

Si la clienta pregunta por Sistecredito/SumaPay: "esos no los manejamos pero te puedo ayudar con MercadoPago en la web (tarjeta/PSE/Nequi) o por aqui directo con Nequi o transferencia".',
ARRAY['pago','pagos','como pago','metodo de pago','mercadopago','mercado pago','nequi','transferencia','llave','tarjeta','PSE','credito','debito','contraentrega','sistecredito','sumapay'],
TRUE);

INSERT INTO savia.kb_documentos (topico, titulo, contenido, keywords, activo) VALUES
('envios', 'Envios y despacho',
'Savia Wear es una tienda 100% ONLINE. NO tenemos sede fisica. Despachamos desde BOGOTA a todo el pais. Si preguntan donde estamos ubicados: "somos tienda online, despachamos desde Bogota a todo el pais".',
ARRAY['envio','envios','despacho','donde estan','ubicados','ubicacion','sede','tienda fisica','local','direccion','bogota','ciudad','desde donde'],
TRUE);

INSERT INTO savia.kb_documentos (topico, titulo, contenido, keywords, activo) VALUES
('descuentos', 'Codigos de descuento',
'CODIGOS VIGENTES (revisar fechas con el equipo regularmente):
- madres20off: 20% en todos los productos (campaña dia de la madre, revisar vigencia)

Si la clienta pide un codigo de descuento y NO hay codigo activo: "ese codigo de la promo anterior ya finalizo, pero pasame lo que te gusto y te ayudo con un beneficio especial". NUNCA inventes codigos.',
ARRAY['descuento','descuentos','codigo','codigos','cupon','promo','promocion','oferta','rebaja','20%','15%','madres20off'],
TRUE);

INSERT INTO savia.kb_documentos (topico, titulo, contenido, keywords, activo) VALUES
('catalogo', 'Catalogo y donde ver productos',
'CATALOGO OFICIAL en WhatsApp: https://wa.me/c/573127048911 (fotos, precios, todos los modelos)
WEB: https://savia-wear.com (compra directa con MercadoPago)

Cuando una clienta pida catalogo, fotos, precios o modelos disponibles, responder: "claro, mira el catalogo aqui https://wa.me/c/573127048911 - tambien puedes ver todo en savia-wear.com. dime cual te llama y te ayudo". Si despues pregunta por un producto especifico, usar woocommerce_buscar_productos para datos reales.',
ARRAY['catalogo','fotos','imagenes','imajenes','precios','modelos','ver','que tienen','que venden','productos','prendas'],
TRUE);

INSERT INTO savia.kb_documentos (topico, titulo, contenido, keywords, activo) VALUES
('compra_separada', 'Compra de piezas por separado',
'Los productos de los sets (one-piece o top+legging) tambien se venden POR SEPARADO. Es decir, una clienta puede comprar solo el legging o solo el top de un set sin tener que llevar el conjunto. Respuesta tipica: "claro, tambien vendemos cada pieza por separado, dime cual te interesa".',
ARRAY['separado','aparte','solo','suelto','sueltas','sueltos','individual','top solo','legging solo','no quiero el set','sin el top'],
TRUE);

INSERT INTO savia.kb_documentos (topico, titulo, contenido, keywords, activo) VALUES
('contacto', 'Canales y redes',
'CANALES OFICIALES:
- Web: https://savia-wear.com
- WhatsApp Business (este canal): unico canal de venta directa
- Instagram: @saviawear
- TikTok: @saviawear
- Catalogo WhatsApp: https://wa.me/c/573127048911',
ARRAY['contacto','redes','instagram','tiktok','telefono','correo','email','web','sitio'],
TRUE);

SELECT topico, titulo, array_length(keywords, 1) AS num_keywords
FROM savia.kb_documentos
WHERE topico IN ('tallaje','materiales','pagos','envios','descuentos','catalogo','contacto','compra_separada')
ORDER BY topico;
SQL

echo
echo "------------------------------------------------------"
echo "  Patch 003 aplicado correctamente."
echo "  Reinsertados 8 topicos: tallaje, materiales, pagos,"
echo "  envios, descuentos, catalogo, compra_separada, contacto"
echo "------------------------------------------------------"
