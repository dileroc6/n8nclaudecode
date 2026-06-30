-- ---------------------------------------------------------------------
-- 003_update_kb_from_real_conversations.sql
-- Actualizacion del KB de Savia con info extraida de conversaciones reales
-- del equipo humano (lote analizado 2026-05-13).
--
-- IDEMPOTENTE: borra y reinserta los topicos. Re-ejecutable.
-- ---------------------------------------------------------------------

SET search_path = savia, public;

-- Borrar topicos que vamos a refrescar (no toca otros)
DELETE FROM savia.kb_documentos
WHERE topico IN ('tallaje','materiales','pagos','envios','descuentos','catalogo','contacto','compra_separada','ubicacion');

-- ---------------------------------------------------------------------
-- TALLAJE - talla unica elastica (insight critico de las conversaciones)
-- ---------------------------------------------------------------------
INSERT INTO savia.kb_documentos (topico, titulo, contenido, keywords, activo) VALUES
('tallaje', 'Talla unica elastica',
'Todos los productos Savia son TALLA UNICA con tela altamente elastica. Se adaptan muy bien a cuerpos desde talla S hasta M (e incluso algunas L dependiendo de las medidas). La tela es suave, no aprieta y acompaña el movimiento. Cuando una clienta pida talla específica, decirle: "es talla unica elastica que adapta de S a M (algunas L según medidas), pásame tu cintura y cadera y te confirmo cómo te quedaría". NUNCA prometer talla específica (S, M, L, XL).',
ARRAY['talla','tallas','medida','medidas','tallaje','cuanto mide','que talla','talla unica','elastico','elastica','S','M','L','XL','cintura','cadera'],
TRUE);

-- ---------------------------------------------------------------------
-- MATERIALES - poliester + elastano
-- ---------------------------------------------------------------------
INSERT INTO savia.kb_documentos (topico, titulo, contenido, keywords, activo) VALUES
('materiales', 'Material: poliester + elastano',
'Los productos Savia estan elaborados con una mezcla de POLIESTER + ELASTANO. Características: textura suave, ligera, excelente elasticidad, segunda piel, no transparenta, durable, ideal tanto para entrenar como para usar en el dia a dia. Si una clienta se queja del poliester, responder: "te entiendo, justo elegimos esa mezcla porque da mejor horma y durabilidad. Mas alla del material, lo clave es que es super suave, no acartona y no transparenta nada".',
ARRAY['material','materiales','tela','telas','de que esta hecho','composicion','poliester','elastano','spandex','calidad','grosor','transparente','transparenta'],
TRUE);

-- ---------------------------------------------------------------------
-- PAGOS - MP web + Nequi/transferencia WhatsApp
-- ---------------------------------------------------------------------
INSERT INTO savia.kb_documentos (topico, titulo, contenido, keywords, activo) VALUES
('pagos', 'Metodos de pago disponibles',
'PAGOS DISPONIBLES:
1. Por la web (https://savia-wear.com): MercadoPago - acepta tarjeta credito/debito, PSE, Nequi y otros medios.
2. Por WhatsApp directo: Nequi o transferencia con llave - el equipo coordina los datos despues del pedido.

NO MANEJAMOS: Sistecredito, SumaPay, contraentrega.

Si la clienta pregunta por Sistecredito/SumaPay: "esos no los manejamos pero te puedo ayudar con MercadoPago en la web (tarjeta/PSE/Nequi) o por aqui directo con Nequi o transferencia".',
ARRAY['pago','pagos','como pago','metodo de pago','mercadopago','mercado pago','nequi','transferencia','llave','tarjeta','PSE','credito','debito','contraentrega','sistecredito','sumapay'],
TRUE);

-- ---------------------------------------------------------------------
-- ENVIOS / DESPACHO
-- ---------------------------------------------------------------------
INSERT INTO savia.kb_documentos (topico, titulo, contenido, keywords, activo) VALUES
('envios', 'Envios y despacho',
'Savia Wear es una tienda 100% ONLINE. NO tenemos sede fisica. Despachamos desde BOGOTA a todo el pais. Si preguntan donde estamos ubicados: "somos tienda online, despachamos desde Bogota a todo el pais".',
ARRAY['envio','envios','despacho','donde estan','ubicados','ubicacion','sede','tienda fisica','local','direccion','bogota','ciudad','desde donde'],
TRUE);

-- ---------------------------------------------------------------------
-- DESCUENTOS - codigos vigentes (revisar y actualizar)
-- ---------------------------------------------------------------------
INSERT INTO savia.kb_documentos (topico, titulo, contenido, keywords, activo) VALUES
('descuentos', 'Codigos de descuento',
'CODIGOS VIGENTES (revisar fechas con el equipo regularmente):
- madres20off: 20% en todos los productos (campaña dia de la madre, revisar vigencia)

Si la clienta pide un codigo de descuento y NO hay codigo activo: "ese codigo de la promo anterior ya finalizo, pero pasame lo que te gusto y te ayudo con un beneficio especial". NUNCA inventes codigos.',
ARRAY['descuento','descuentos','codigo','codigos','cupon','promo','promocion','oferta','rebaja','20%','15%','madres20off'],
TRUE);

-- ---------------------------------------------------------------------
-- CATALOGO - links
-- ---------------------------------------------------------------------
INSERT INTO savia.kb_documentos (topico, titulo, contenido, keywords, activo) VALUES
('catalogo', 'Catalogo y donde ver productos',
'CATALOGO OFICIAL en WhatsApp: https://wa.me/c/573127048911 (fotos, precios, todos los modelos)
WEB: https://savia-wear.com (compra directa con MercadoPago)

Cuando una clienta pida catalogo, fotos, precios o modelos disponibles, responder: "claro, mira el catalogo aqui https://wa.me/c/573127048911 - tambien puedes ver todo en savia-wear.com. dime cual te llama y te ayudo". Si despues pregunta por un producto especifico, usar woocommerce_buscar_productos para datos reales.',
ARRAY['catalogo','fotos','imagenes','imajenes','precios','modelos','ver','que tienen','que venden','productos','prendas'],
TRUE);

-- ---------------------------------------------------------------------
-- COMPRA SEPARADA - se vende por piezas tambien
-- ---------------------------------------------------------------------
INSERT INTO savia.kb_documentos (topico, titulo, contenido, keywords, activo) VALUES
('compra_separada', 'Compra de piezas por separado',
'Los productos de los sets (one-piece o top+legging) tambien se venden POR SEPARADO. Es decir, una clienta puede comprar solo el legging o solo el top de un set sin tener que llevar el conjunto. Respuesta tipica: "claro, tambien vendemos cada pieza por separado, dime cual te interesa".',
ARRAY['separado','aparte','solo','suelto','sueltas','sueltos','individual','top solo','legging solo','no quiero el set','sin el top'],
TRUE);

-- ---------------------------------------------------------------------
-- CONTACTO / REDES
-- ---------------------------------------------------------------------
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
