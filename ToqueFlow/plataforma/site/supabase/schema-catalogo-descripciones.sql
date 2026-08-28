-- ============================================================================
-- ToqueFlow — El «qué hace» dicho como se lo explicarías a alguien
-- ----------------------------------------------------------------------------
-- Las descripciones estaban escritas para mí: cortas, técnicas y con nombres de
-- tablas adentro. Quien las lee es alguien decidiendo qué venderle a un cliente
-- o cómo configurarlo, no alguien depurando.
--
-- Se reescriben diciendo qué pasa de verdad cuando esa pieza está encendida, y
-- también qué NO hace — que suele ser lo que más falta saber antes de prometer.
--
-- Idempotente.
-- ============================================================================

update public.catalogo set descripcion =
'Contesta el WhatsApp del negocio con la información que el propio cliente cargó: precios, horarios, servicios y las preguntas de siempre. Mientras conversa va tomando los datos de quien escribe —nombre, qué le interesa, por dónde llegó— y los deja guardados. Cuando la pregunta se sale de lo que sabe, o cuando alguien quiere comprar, agendar o está molesto, no improvisa: avisa a una persona del equipo. Nunca inventa un precio ni promete algo que no esté escrito.'
where clave = 'agente-atencion';

update public.catalogo set descripcion =
'El sitio donde el cliente entra con su usuario y ve lo suyo: su base de contactos, sus campañas, cuánto ha consumido y el estado de cada cosa que tiene contratada. Cada empresa ve solo sus datos, nunca los de otra. Es lo que convierte esto en una plataforma en vez de una agencia que entrega trabajos sueltos.'
where clave = 'portal';

update public.catalogo set descripcion =
'Un chat donde el cliente prueba su agente antes de soltarlo. Corre exactamente el mismo flujo que en producción, pero la respuesta se queda en el simulador en vez de salir por WhatsApp. Sirve para afinar el tono y descubrir lo que falta en el documento sin arriesgar el número del negocio ni molestar a nadie.'
where clave = 'sandbox';

update public.catalogo set descripcion =
'Los pedidos que entran por Rappi salen impresos en el mostrador del local, con su detalle y sin que nadie los transcriba. Se acaban los errores de copiar a mano y los pedidos que se pierden porque nadie vio la pantalla.'
where clave = 'impresion-pedidos';

update public.catalogo set descripcion =
'Un bot para el EQUIPO del negocio, no para sus clientes. Desde el chat consultan y operan: cuánto saldo le queda a alguien, registrar una asistencia, aplicar una recarga. Evita entrar a un sistema para cada cosa pequeña.'
where clave = 'agente-admin';

update public.catalogo set descripcion =
'Un tablero que muestra cómo va la ocupación sin que nadie arme el reporte. Se actualiza solo y responde de un vistazo la pregunta de todos los días: cuántas habitaciones hay ocupadas y cómo viene la semana.'
where clave = 'kpi-ocupacion';

update public.catalogo set descripcion =
'Toma los documentos que el negocio ya registra y calcula las retenciones que aplican, en vez de que alguien las saque a mano con una tabla al lado. Reduce el trabajo repetitivo del cierre contable y los errores que trae.'
where clave = 'retenciones';

update public.catalogo set descripcion =
'Escribe y publica artículos en el blog del negocio, pensados para que la gente los encuentre buscando en Google. Se alimenta solo con los temas que el negocio elige. Construido para nuestros propios blogs; nunca se le ha vendido a un cliente.'
where clave = 'motor-contenido';

update public.catalogo set descripcion =
'Emitir las facturas y enviarlas por correo sin que nadie las arme una por una. NADIE lo ha pedido todavía: si un cliente lo pide, se cotiza como encargo aparte, y no se promete como producto hasta que lo pida un segundo.'
where clave = 'facturacion';

-- ── Herramientas ─────────────────────────────────────────────────────────────
update public.catalogo set descripcion =
'La base del agente: responder usando el documento que el cliente cargó, y nada más. Si algo no está escrito ahí, lo dice en vez de inventarlo. Va incluida siempre y no se puede apagar.'
where clave = 'responder-conocimiento';

update public.catalogo set descripcion =
'Cuando alguien pregunta cuántas clases o cupos le quedan, el agente lo consulta en la ficha de esa persona y se lo dice en el momento, con su fecha de renovación. Sin esto tendría que pasar la conversación a un humano para algo que ya está en la base.'
where clave = 'consultar-saldo';

update public.catalogo set descripcion =
'El agente consulta un pedido o un precio contra el sistema del negocio y responde ahí mismo. Hoy eso existe pero solo por Telegram y para el equipo: falta exponerlo al agente que atiende a los clientes.'
where clave = 'estado-pedido';

update public.catalogo set descripcion =
'Cuando alguien dice que ya pagó, el agente verifica si la transferencia entró en vez de hacerlo esperar a que alguien lo revise. Sirve a cualquier negocio que cobre por transferencia, no solo al que lo pidió primero.'
where clave = 'confirmar-pago';

update public.catalogo set descripcion =
'El agente mira el calendario que el negocio ya usa y ofrece solo horas que de verdad están libres. Sin esto propondría las 3 de la tarde mientras recepción ya puso a alguien a esa hora.'
where clave = 'ver-disponibilidad';

update public.catalogo set descripcion =
'La cita queda agendada dentro de la misma conversación, en el calendario que el negocio ya usa. Ahí está el valor: cada paso extra entre «quiero una cita» y tenerla agendada pierde gente.'
where clave = 'agendar-cita';

update public.catalogo set descripcion =
'Cuando alguien reclama, el agente deja el caso registrado con su número de seguimiento en vez de solo pasarlo a un humano. Así el reclamo no se pierde en un chat y después se puede saber qué pasó con él.'
where clave = 'registrar-reclamo';

-- ── Automatizaciones ─────────────────────────────────────────────────────────
update public.catalogo set descripcion =
'Le escribe por WhatsApp a un grupo de contactos elegido por sus características, con el mensaje y el momento que el negocio decida. Sale por lotes para no quemar el número, y siempre pide confirmación explícita antes de mandar nada. Después se ve quién recibió y quién respondió.'
where clave = 'campanas';

update public.catalogo set descripcion =
'Cuando un cobro no pasa, el cliente final se entera por WhatsApp en el momento, sin que nadie tenga que revisar la pasarela. Evita perder la venta simplemente por no darse cuenta a tiempo.'
where clave = 'pago-fallido';

update public.catalogo set descripcion =
'Busca a quién lleva tiempo sin volver y le escribe para invitarlo de nuevo. Sirve para cualquier negocio de compra recurrente: gimnasios, clínicas, servicios por suscripción.'
where clave = 'reactivacion';

update public.catalogo set descripcion =
'Le recuerda la cita a quien la tiene y le pide que confirme. Es el argumento de venta más fuerte del producto, porque el que no llega se siente directamente en la caja del negocio.'
where clave = 'recordatorio-cita';

update public.catalogo set descripcion =
'Cada semana le llega al dueño un resumen de cómo le fue: cuánta gente escribió, qué preguntaron, cuántas citas se agendaron. Sin que nadie arme nada.'
where clave = 'reporte-semanal';

update public.catalogo set descripcion =
'La pauta en Google y Meta corriendo y revisada, sin que el negocio tenga que entrar a las plataformas. Se opera a mano: está en el catálogo porque se le factura a un cliente, no porque esté automatizado.'
where clave = 'pauta-digital';
