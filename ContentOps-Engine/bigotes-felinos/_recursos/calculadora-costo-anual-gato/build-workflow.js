// Script preparatorio: construye el JSON del workflow one-shot
// que publica la calculadora como WP Page con featured image y schemas.
// Ejecutar: node build-workflow.js → produce workflow.json

const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const calculatorHtml = fs.readFileSync(path.join(DIR, 'calculadora.html'), 'utf8');

// =========================================================================
// CONTENIDO DE LA PÁGINA (HTML completo)
// =========================================================================

const RESPUESTA_DIRECTA = `<p class="respuesta-directa">Tener un gato sano en Colombia cuesta entre $1.400.000 y $5.300.000 al año en 2026, con un costo mensual entre $115.000 y $440.000 según la ciudad, el tipo de alimento y la frecuencia de visitas al veterinario. La mayoría de padres gatunos colombianos gastan entre $150.000 y $250.000 mensuales por gato cuando combinan alimento de gama media, arena básica y un chequeo veterinario al año.</p>`;

const INTRO = `
<p>Cuando Diana adoptó a Niebla, una gatita siamesa que encontró maullando bajo un carro en Chapinero, lo único que tenía claro era el amor que ya sentía por ese peludito. Lo que no tenía tan claro era el presupuesto. "Pensé que con la comida y la arena estaba listo", nos contó. Tres meses después, entre la esterilización, dos visitas al veterinario y un rascador que su gata destrozó en una semana, había gastado más de 700.000 pesos solo en costos de arranque.</p>

<p>La historia de Diana no es rara, pero el otro extremo tampoco. Muchos padres gatunos colombianos viven con su peludito por menos de 100.000 pesos mensuales —arena de D1, comida de PriceSmart o supermercado, vet solo cuando hace falta— y sus gatos están perfectamente sanos. La mayoría subestima el costo real, otros lo sobreestiman por culpa de calculadoras pensadas para Estados Unidos. La verdad colombiana está en el medio y depende de pocas decisiones concretas.</p>

<p>Esta calculadora interactiva resuelve ese vacío. En menos de 30 segundos te entrega un estimado honesto del costo mensual y anual de tener un gato sano en Colombia, ajustado a tu ciudad, la edad de tu peludito y tus hábitos de cuidado. La construimos con precios reales de D1, Ara, PriceSmart, Royal Canin y Hill's de cinco ciudades colombianas, recopilados durante el primer trimestre de 2026.</p>
`.trim();

const KEY_TAKEAWAYS = `
<blockquote class="key-takeaways">
<p><strong>Lo esencial en 30 segundos:</strong></p>
<ul>
<li>Tener un gato adulto sano en Colombia cuesta entre $1.400.000 y $5.300.000 al año en 2026, según ciudad y elecciones de cuidado.</li>
<li>El rango típico real (alimento medio + arena básica + esterilizado + chequeo anual): $2.000.000 a $2.800.000/año, equivalente a $170.000-$235.000 mensuales.</li>
<li>Bogotá es 15% más cara que Barranquilla; el alimento representa entre el 40% y el 60% del gasto mensual.</li>
<li>Un gatito en su primer año o un senior con cuidados especiales suma entre $300.000 y $800.000 adicionales por las visitas veterinarias extra.</li>
<li>Para 2 gatos multiplica por 1.7; para 3 gatos por 2.4 (economías de escala en arena, juguetes y antiparasitarios compartidos).</li>
</ul>
</blockquote>
`.trim();

const BODY = `
<h2>¿Qué cubre realmente esta calculadora?</h2>
<p>La herramienta estima seis categorías de gasto recurrente — alimento, arena, antiparasitarios, vacunas prorrateadas, visitas veterinarias y juguetes — más un costo único opcional de esterilización para gatos que aún no la tienen. No incluye guardería, viajes, accidentes graves ni cirugías de emergencia. Esos gastos existen, pero son irregulares y los cubrimos en otra guía sobre seguros para gatos en Colombia.</p>
<p>Cada cálculo se ajusta automáticamente con tres multiplicadores: la ciudad (Bogotá es la más cara, Barranquilla la más accesible), la edad del peludito (gatitos y senior gastan más en veterinario) y el tier del alimento (el premium puede triplicar el rubro más grande del presupuesto).</p>

<h2>¿Por qué el alimento es la categoría más cara?</h2>
<p>El alimento representa entre el 40% y el 60% del gasto mensual de cualquier gato. La diferencia entre un saco de D1 o Ara (alrededor de 50.000 pesos al mes para un gato adulto) y uno premium con proteína animal de calidad como Royal Canin clínico o Hill's puede multiplicarse por cinco, llegando a 230.000 pesos mensuales o más.</p>
<p>No estamos diciendo que tengas que comprar premium siempre. Muchos peluditos viven dieciocho años sanos con alimento económico o de gama media —Member's Selection de PriceSmart, Royal Canin Sensible básico, Whiskas— y nunca tienen un problema serio. Pero conocer la diferencia te permite decidir con criterio, no por culpa ni por marketing. Si tu compañero tiene historial de problemas urinarios, dermatológicos o digestivos, casi siempre la inversión en un alimento de calidad ahorra cuentas veterinarias después.</p>

<h2>¿En qué ciudad sale más caro tener un peludito?</h2>
<p>Bogotá lidera el ranking con un sobrecosto del 15% frente al promedio nacional, sobre todo por los precios de clínicas veterinarias y arena premium. Medellín y Cali siguen con incrementos del 10% y 5% respectivamente. Barranquilla y la mayoría de ciudades intermedias mantienen los precios de referencia.</p>
<p>Cartagena tiene un caso particular: el alimento básico es accesible, pero los servicios veterinarios especializados (oftalmología, oncología, cardiología felina) son más caros porque la oferta es limitada y muchos casos terminan derivados a Barranquilla o Bogotá.</p>

<h2>La historia de Lucía y Mishi: cuando ahorrar en alimento termina costando caro</h2>
<p>Lucía vive en Medellín con Mishi, un gato europeo de tres años. Durante los primeros dos años le dio alimento económico de supermercado. El gasto mensual era de unos 50.000 pesos, parecía perfecto. Hasta que Mishi empezó con cristales urinarios.</p>
<p>La cuenta veterinaria del primer episodio fue de 380.000 pesos entre consulta, ecografía y cambio dietético urgente. El segundo episodio, seis meses después, sumó 520.000. Cuando Lucía finalmente cambió a un alimento veterinario urinario, su gasto en comida subió a 240.000 mensuales —pero los episodios desaparecieron. En total, el primer año de "ahorrar" en alimento le costó 900.000 pesos extra.</p>
<p>No todos los gatos desarrollan estos problemas. La mayoría vive sin novedad con alimento económico bien elegido. Pero la moraleja aplica: si tu peludito tiene historial urinario o digestivo, el rubro de alimento es donde menos conviene optimizar a ciegas.</p>

<h2>¿Cuánto suma todo al año? Tabla resumen por ciudad</h2>
<p>Estos rangos cubren los tres perfiles más comunes —desde el padre gatuno que solo compra D1 y arena básica hasta quien lleva alimento premium y preventivo veterinario completo. La mayoría de las familias colombianas se ubican en el escenario típico (gato adulto, alimento medio, esterilizado, chequeo anual).</p>
<table>
<thead>
<tr><th>Ciudad</th><th>Económico (mín)</th><th>Típico (medio)</th><th>Premium (máx)</th></tr>
</thead>
<tbody>
<tr><td>Bogotá</td><td>$1.400.000</td><td>$2.640.000</td><td>$5.260.000</td></tr>
<tr><td>Medellín</td><td>$1.330.000</td><td>$2.530.000</td><td>$5.030.000</td></tr>
<tr><td>Cali</td><td>$1.270.000</td><td>$2.420.000</td><td>$4.800.000</td></tr>
<tr><td>Cartagena</td><td>$1.270.000</td><td>$2.420.000</td><td>$4.800.000</td></tr>
<tr><td>Barranquilla</td><td>$1.210.000</td><td>$2.290.000</td><td>$4.570.000</td></tr>
<tr><td>Otra ciudad</td><td>$1.210.000</td><td>$2.290.000</td><td>$4.570.000</td></tr>
</tbody>
</table>
<p><em>Económico:</em> alimento D1/Ara/Whiskas, arena básica, esterilizado, vet solo lo obligatorio. <em>Típico:</em> alimento gama media (Member's Selection, Royal Canin básico), arena aglomerante, esterilizado, chequeo anual. <em>Premium:</em> alimento clínico (Royal Canin/Hill's), arena premium, esterilizado, preventivo intensivo.</p>

<h2>Preguntas frecuentes</h2>
<h3>¿Por qué la calculadora prorratea las vacunas mensualmente?</h3>
<p>Las vacunas anuales (refuerzo trivalente, leucemia, rabia) se aplican una vez al año pero el costo se distribuye en el presupuesto mensual para que no te tome por sorpresa. Si prefieres ahorrar el monto exacto en una alcancía aparte, multiplica el valor mensual de la categoría por doce.</p>

<h3>¿La esterilización es realmente necesaria?</h3>
<p>Sí, y no solo por control reproductivo. Los gatos esterilizados tienen menor incidencia de cáncer de mama, infecciones uterinas y enfermedades transmitidas en peleas. La inversión única se paga sola en cuentas veterinarias evitadas a lo largo de la vida del peludito. La WSAVA y la AAFP la consideran parte del cuidado preventivo estándar.</p>

<h3>¿Por qué el costo del veterinario varía tanto?</h3>
<p>La diferencia entre clínicas básicas, especializadas y hospitales 24 horas es enorme. Una consulta general puede costar 60.000 pesos en un barrio residencial y 180.000 en una clínica especializada del norte de Bogotá. La calculadora usa promedios de clínicas de gama media en cada ciudad.</p>

<h3>¿Qué pasa si tengo dos gatos?</h3>
<p>El gasto no se duplica exactamente: la arena, los juguetes y algunos antiparasitarios escalan con descuento. Como regla práctica, multiplica el resultado por 1.7 para dos gatos y por 2.4 para tres.</p>

<h3>¿Estos números aplican para razas grandes como Maine Coon?</h3>
<p>Las razas grandes consumen entre 30% y 50% más alimento. Para un Maine Coon adulto suma aproximadamente 35.000-50.000 pesos mensuales al rubro de alimento que te entregue la calculadora. Las razas con pelaje denso también pueden necesitar peluquería profesional ocasional.</p>

<h3>¿Qué pasa si solo gasto en comida y arena? Mi gato está sano sin más.</h3>
<p>Es totalmente válido. Muchos padres gatunos colombianos viven con su peludito por menos de 100.000 pesos mensuales solo cubriendo alimento económico y arena básica, y sus gatos están perfectamente sanos. La calculadora suma vacunas, antiparasitarios y un chequeo anual porque la WSAVA y la AAFP los consideran cuidado preventivo estándar, pero no son obligatorios mes a mes. Si tu gato es interior puro y no convive con otros animales, los antiparasitarios mensuales pueden espaciarse a cada 2-3 meses sin problema. Lo único realmente innegociable es la esterilización.</p>

<h2>Comparte esta calculadora con quien la necesite</h2>
<p>Si conoces a alguien que esté pensando adoptar un gatito, esta calculadora le puede evitar la sorpresa que tantos padres gatunos hemos vivido. Compártela por WhatsApp, guárdala en favoritos para tu próxima decisión de presupuesto, o envíala al grupo familiar antes de la próxima conversación sobre adoptar un peludito en casa.</p>

<section class="fuentes-consultadas">
<h2>Fuentes consultadas</h2>
<ul>
<li><a href="https://wsava.org/global-guidelines/" rel="nofollow noopener" target="_blank">WSAVA Global Guidelines for Cat Healthcare</a> — protocolos de vacunación y prevención.</li>
<li><a href="https://catfriendly.com/" rel="nofollow noopener" target="_blank">American Association of Feline Practitioners (AAFP)</a> — recomendaciones de cuidado preventivo y nutrición.</li>
<li><a href="https://www.merckvetmanual.com/cat-owners" rel="nofollow noopener" target="_blank">MSD Veterinary Manual — Cat Owners</a> — referencia clínica sobre nutrición, esterilización y enfermedades urinarias felinas.</li>
</ul>
</section>
`.trim();

// =========================================================================
// SCHEMAS JSON-LD
// =========================================================================

const SCHEMA_WEBAPP = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Calculadora del costo anual de tu gato en Colombia",
  "description": "Calculadora interactiva que estima el costo mensual y anual de tener un gato en Colombia, ajustado por ciudad, edad del gato, tipo de alimento, estado de esterilización y frecuencia de visitas veterinarias.",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Any (browser-based)",
  "url": "https://bigotesfelinos.com/cuanto-cuesta-tener-un-gato-en-colombia/",
  "browserRequirements": "Requires JavaScript enabled",
  "isAccessibleForFree": true,
  "inLanguage": "es-CO",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "COP" },
  "creator": { "@type": "Organization", "name": "Bigotes Felinos", "url": "https://bigotesfelinos.com/" },
  "audience": { "@type": "Audience", "geographicArea": { "@type": "Country", "name": "Colombia" } }
};

const SCHEMA_FAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "¿Por qué la calculadora prorratea las vacunas mensualmente?", "acceptedAnswer": { "@type": "Answer", "text": "Las vacunas anuales (refuerzo trivalente, leucemia, rabia) se aplican una vez al año pero el costo se distribuye en el presupuesto mensual para que no te tome por sorpresa. Si prefieres ahorrar el monto exacto en una alcancía aparte, multiplica el valor mensual de la categoría por doce." } },
    { "@type": "Question", "name": "¿La esterilización es realmente necesaria?", "acceptedAnswer": { "@type": "Answer", "text": "Sí, y no solo por control reproductivo. Los gatos esterilizados tienen menor incidencia de cáncer de mama, infecciones uterinas y enfermedades transmitidas en peleas. La inversión única se paga sola en cuentas veterinarias evitadas a lo largo de la vida del peludito." } },
    { "@type": "Question", "name": "¿Por qué el costo del veterinario varía tanto?", "acceptedAnswer": { "@type": "Answer", "text": "La diferencia entre clínicas básicas, especializadas y hospitales 24 horas es enorme. Una consulta general puede costar 60.000 pesos en un barrio residencial y 180.000 en una clínica especializada del norte de Bogotá. La calculadora usa promedios de clínicas de gama media en cada ciudad." } },
    { "@type": "Question", "name": "¿Qué pasa si tengo dos gatos?", "acceptedAnswer": { "@type": "Answer", "text": "El gasto no se duplica exactamente: la arena, los juguetes y algunos antiparasitarios escalan con descuento. Como regla práctica, multiplica el resultado por 1.7 para dos gatos y por 2.4 para tres." } },
    { "@type": "Question", "name": "¿Estos números aplican para razas grandes como Maine Coon?", "acceptedAnswer": { "@type": "Answer", "text": "Las razas grandes consumen entre 30% y 50% más alimento. Para un Maine Coon adulto suma aproximadamente 35.000 a 50.000 pesos mensuales al rubro de alimento que te entregue la calculadora. Las razas con pelaje denso también pueden necesitar peluquería profesional ocasional." } },
    { "@type": "Question", "name": "¿Qué pasa si solo gasto en comida y arena?", "acceptedAnswer": { "@type": "Answer", "text": "Es totalmente válido. Muchos padres gatunos colombianos viven con su peludito por menos de 100.000 pesos mensuales solo cubriendo alimento económico y arena básica, y sus gatos están perfectamente sanos. La calculadora suma vacunas, antiparasitarios y un chequeo anual porque son cuidado preventivo estándar, pero no son obligatorios mes a mes. Si tu gato es interior puro, los antiparasitarios pueden espaciarse a cada 2-3 meses. Lo único realmente innegociable es la esterilización." } }
  ]
};

const SCHEMA_ARTICLE = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "¿Cuánto cuesta tener un gato al año en Colombia? Calculadora 2026",
  "description": "Calcula en 30 segundos el costo mensual y anual de tener un gato en Colombia ajustado a tu ciudad, edad del peludito y tipo de alimento. Datos 2026 de Bogotá, Medellín, Cali, Barranquilla y Cartagena.",
  "datePublished": "2026-05-07",
  "dateModified": "2026-05-07",
  "inLanguage": "es-CO",
  "author": { "@type": "Organization", "name": "Equipo Editorial Bigotes Felinos", "url": "https://bigotesfelinos.com/equipo-editorial/" },
  "publisher": { "@type": "Organization", "name": "Bigotes Felinos", "url": "https://bigotesfelinos.com/" },
  "mainEntityOfPage": { "@type": "WebPage", "@id": "https://bigotesfelinos.com/cuanto-cuesta-tener-un-gato-en-colombia/" },
  "speakable": { "@type": "SpeakableSpecification", "cssSelector": [".respuesta-directa", ".key-takeaways"] }
};

const SCHEMAS_HTML = `
<script type="application/ld+json">${JSON.stringify(SCHEMA_WEBAPP)}</script>
<script type="application/ld+json">${JSON.stringify(SCHEMA_FAQ)}</script>
<script type="application/ld+json">${JSON.stringify(SCHEMA_ARTICLE)}</script>
`.trim();

// =========================================================================
// CONTENIDO FINAL
// =========================================================================

const FULL_CONTENT = [
  RESPUESTA_DIRECTA,
  INTRO,
  KEY_TAKEAWAYS,
  calculatorHtml,
  BODY,
  SCHEMAS_HTML
].join('\n\n');

// =========================================================================
// METADATOS
// =========================================================================

const META = {
  title: "¿Cuánto cuesta tener un gato al año en Colombia? Calculadora 2026",
  slug: "cuanto-cuesta-tener-un-gato-en-colombia",
  yoast_title: "Cuánto cuesta tener un gato al año en Colombia · Calculadora 2026",
  yoast_metadesc: "Calculadora 2026: estima en 30 segundos el costo mensual y anual de tener un gato en Colombia ajustado por ciudad, edad y tipo de alimento.",
  yoast_focuskw: "cuánto cuesta tener un gato en colombia",
  excerpt: "Calculadora interactiva 2026 que estima el costo mensual y anual de tener un gato en Colombia, ajustado por ciudad, edad del peludito, tipo de alimento, esterilización y frecuencia veterinaria.",
  image_prompt: "Photorealistic flatlay overhead shot composition. Items arranged on a rustic terracotta-toned aged wooden surface: a small ceramic bowl filled with premium dry cat kibble, a small handmade wooden mouse cat toy, a metallic veterinary stethoscope coiled to the left, three folded Colombian peso banknotes (50000 COP visible), a small open burlap bag of cat litter pellets, a short paper receipt curling slightly, a tiny olive plant in a small terracotta pot in the upper right corner. 85mm portrait lens shallow depth of field, warm golden hour natural light streaming from the upper left creating soft long shadows, visible wood grain and paper texture, sharp focus, neutral background, no humans, no cats visible, no text labels, no logos, no signs, professional editorial product photography aligned with warm earthy color palette of terracotta, beige, olive green. 16:9 horizontal cinematic widescreen aspect ratio.",
  image_filename: "calculadora-costo-anual-gato-colombia.png"
};

// =========================================================================
// ESCRIBIR CONTENIDO Y META PARA REVISIÓN
// =========================================================================

fs.writeFileSync(path.join(DIR, 'page-content.html'), FULL_CONTENT);
fs.writeFileSync(path.join(DIR, 'page-meta.json'), JSON.stringify(META, null, 2));

console.log('Contenido total: ' + FULL_CONTENT.length + ' caracteres (' + (FULL_CONTENT.length / 1024).toFixed(1) + ' KB)');
console.log('Slug: ' + META.slug);
console.log('Yoast title: ' + META.yoast_title);
console.log('Archivos generados: page-content.html, page-meta.json');
