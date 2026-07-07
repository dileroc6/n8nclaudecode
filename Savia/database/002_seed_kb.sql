-- =====================================================================
-- Savia — KB inicial (placeholder)
-- Validar y completar con el cliente antes de go-live.
-- =====================================================================

SET search_path TO savia, public;

INSERT INTO savia.kb_documentos (topico, titulo, contenido, keywords) VALUES
('envios',
 'Tiempos y cobertura de envío',
 'Realizamos envíos a todo Colombia. Las entregas en Bogotá demoran entre 1 y 2 días hábiles, y el resto del país entre 3 y 5 días hábiles. El costo de envío se calcula al final del proceso de pago. [VALIDAR CON CLIENTE]',
 ARRAY['envio','envios','demora','cuanto tarda','llegada','dias','despacho']),

('cambios',
 'Política de cambios por talla',
 'Si la talla no te queda, puedes solicitar un cambio dentro de los 10 días calendario siguientes a la entrega. La prenda debe estar sin uso, con etiqueta y en su empaque original. El cambio cubre una sola vez por compra y el costo de envío del cambio corre por cuenta del cliente. [VALIDAR CON CLIENTE]',
 ARRAY['cambio','cambios','talla','no me queda','grande','pequeña','cambiar']),

('devoluciones',
 'Política de devoluciones',
 'Aceptamos devoluciones por defectos de fabricación dentro de los 10 días calendario siguientes a la entrega. Para devoluciones por cambio de opinión consulta nuestra política de cambios. [VALIDAR CON CLIENTE]',
 ARRAY['devolucion','devolver','reembolso','plata','defecto','dañado']),

('tallaje',
 'Cómo elegir mi talla',
 'Cada producto cuenta con su guía de tallas en la ficha. Como regla general: si estás entre dos tallas, recomendamos la mayor para leggings con cintura alta y la menor para tops ajustados. Si tienes dudas, cuéntanos tu medida de cintura y cadera y te recomendamos. [VALIDAR CON CLIENTE]',
 ARRAY['talla','tallas','medida','cintura','cadera','xs','s','m','l','xl']),

('materiales',
 'Materiales y cuidados',
 'Nuestros tejidos son de alta compresión y secado rápido, libres de costuras irritantes. Lavar en agua fría, no usar blanqueador y secar a la sombra para preservar la elasticidad. [COMPLETAR COMPOSICIÓN POR LÍNEA]',
 ARRAY['material','tela','algodon','poliester','licra','lavado','cuidado']),

('contacto',
 'Canales de contacto',
 'Estamos disponibles por WhatsApp, Instagram @saviawear y TikTok @saviawear. Nuestro horario de atención humana es de lunes a viernes de 9:00 am a 6:00 pm (hora Colombia). [VALIDAR CON CLIENTE]',
 ARRAY['horario','atencion','contacto','telefono','redes','instagram','tiktok'])

ON CONFLICT DO NOTHING;
