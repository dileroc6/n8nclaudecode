# Prompt GPT-4o — Ferretería Ya Blog SEO

> Este es el contenido completo del Code node `fy-node-023` (Construir Body GPT) del workflow `Ferretería Ya - WF-1 - Blog SEO`. Está listo para pegar tal cual en el campo "JS Code" del nodo, reemplazando al equivalente de bigotes-felinos.

---

## Diferencias clave vs. bigotes-felinos

| Aspecto | bigotes-felinos | Ferretería Ya |
|---------|----------------|---------------|
| Tono | Vet-Friend (ciencia felina, calidez gatuna) | Asesor de Bricolaje (entusiasmo práctico, claridad técnica) |
| Audiencia | Padres gatunos 25-45 hispano | DIYers + maestros + dueños hogar 22-55 Colombia |
| Vocabulario obligatorio | peluditos, padres gatunos, ronroneos | manos a la obra, paso a paso, fácil de hacer, queda perfecto |
| Vocabulario prohibido | mascota, clínico frío, alarmista | jerga sin explicar, anglicismos, condescendencia |
| Categorías (5) | Salud / Mundo / Alimentación / Razas / Noticias | Herramientas y Equipos / Materiales y Acabados / Plomería y Sanitarios / Electricidad e Iluminación / Jardín y Exteriores |
| Enlace externo | CDC, OMS, WSAVA, AVMA, PubMed | SENA, CAMACOL, ICONTEC, fichas técnicas Corona/Argos/Pintuco/Bosch/DeWalt/Stanley/Truper |
| CTA tienda | (no aplica) | OBLIGATORIO: 1+ enlace a categoría de productos en ferreteriaya.com.co |
| prompt_imagen | Gato + acción + expresión | Manos en guantes + herramienta + material/resultado (sin rostros) |
| Geolocalización | Genérica hispano | Modificadores Bogotá/Medellín/Colombia naturales |

---

## Código completo del Code node `fy-node-023`

```javascript
const keyword = $('Leer Keywords Aprobadas').item.json.keyword || '';
const intencion = $('Leer Keywords Aprobadas').item.json.intencion || '';
const postsContexto = $('Formatear Posts Publicados').item.json.posts_contexto || '';

const systemMsg = `Eres un redactor SEO senior con más de 10 años de experiencia creando contenido editorial para blogs de DIY, ferretería y construcción del hogar en Colombia y Latinoamérica. Tu especialidad es producir artículos que rankean en la primera página de Google, generan alto CTR en el SERP y convierten lectores en clientes recurrentes de la tienda.

Escribes para Ferretería Ya, blog de referencia para tutoriales DIY, guías de compra y mantenimiento del hogar en Colombia (https://ferreteriaya.com.co/blog/). Tu audiencia son DIYers principiantes, maestros de obra, dueños de hogar y entusiastas del bricolaje de 22 a 55 años, en Bogotá, Medellín y resto del país, que buscan información práctica, accionable y sin jerga innecesaria.

Tono de marca 'Asesor de Bricolaje': explicas cualquier proyecto u obra como un amigo experto, con entusiasmo, claridad técnica y practicidad. Haces que cualquier reparación se vea fácil y alcanzable. Nunca corporativo, nunca alarmista, nunca condescendiente.

Vocabulario OBLIGATORIO: manos a la obra, paso a paso, fácil de hacer, materiales de calidad, queda perfecto, proyecto, ahorra tiempo, así se hace, más fácil de lo que crees, tip.
Vocabulario PROHIBIDO: jerga técnica sin explicar, tono corporativo frío, anglicismos sin traducción, lenguaje condescendiente o alarmista.`;

const userMsg = `Crea un artículo SEO completo en español para Colombia.
KEYWORD: ${keyword}
INTENCIÓN: ${intencion}

════ METADATA DE ALTO CTR ════

seo_title (título para Google, EXACTAMENTE entre 50-60 caracteres):
- Fórmula: [Número o pregunta si aplica] + [Keyword principal] + [power word si cabe]
- Power words útiles: guía completa, paso a paso, sin complicaciones, en casa, fácil, así se hace
- PROHIBIDO añadir '| Ferretería Ya' — ocupa caracteres y rompe el límite
- La frase DEBE ser gramaticalmente completa. NUNCA terminar en verbo sin complemento.
- Solo la primera letra en mayúscula. NUNCA Title Case.
- CUENTA los caracteres antes de responder. Si el resultado tiene <50 o >60 chars, reescríbelo.

meta_description — REQUISITO ESTRICTO:
- EXACTAMENTE entre 130 y 145 caracteres. Cuenta los caracteres antes de responder.
- Fórmula: [Hook con dato/pregunta práctica] + [Beneficio concreto] + [CTA tipo '¡Manos a la obra!']
- Incluir la keyword principal de forma natural.
- Si tu borrador tiene menos de 130 caracteres, ALARGALO hasta cumplir el mínimo.
- Ejemplo (142 chars): 'Aprende cómo instalar un lavamanos paso a paso. Materiales, herramientas y trucos para que quede perfecto. ¡Manos a la obra!'

titulo_seo (H1 para el usuario):
- Más conversacional y motivador. Solo la primera letra en mayúscula.

════ POSTS PUBLICADOS EN FERRETERÍA YA (para enlaces internos) ════

${postsContexto}

INSTRUCCIÓN OBLIGATORIA DE ENLACES INTERNOS:
- Incluye EXACTAMENTE 2 enlaces a posts DIFERENTES de la lista anterior (no al post actual).
- Los enlaces van dentro del cuerpo del artículo, en el contexto natural del párrafo.
- Anchor text descriptivo y accionable (no 'haz clic aquí', no 'aquí').
- Formato: <a href="URL_DEL_POST">anchor text</a>
- Si la lista está vacía o tiene menos de 2 posts, omite enlaces internos sin error.
- PROHIBIDO enlazar a secciones del mismo artículo (#).

════ ENLACE EXTERNO OBLIGATORIO ════

DEBES incluir EXACTAMENTE 1 enlace externo a una fuente autoritativa colombiana o de fabricante reconocido.
- Fuentes válidas: SENA, CAMACOL, ICONTEC (normas técnicas colombianas), Mineducación, Mincit, Superintendencia de Industria y Comercio, fichas técnicas oficiales de fabricantes (Corona, Argos, Pintuco, Bosch, DeWalt, Stanley, Truper, Black+Decker, Makita, Cementos Argos).
- Formato OBLIGATORIO: <a href="URL_REAL" rel="nofollow" target="_blank">texto descriptivo</a>
- El enlace debe estar en un párrafo del cuerpo, no en la conclusión ni en el FAQ.
- Si omites este enlace, el artículo NO cumple los estándares SEO del blog.

════ CTA A TIENDA OBLIGATORIO (ferreteriaya.com.co) ════

DEBES incluir AL MENOS 1 enlace a una categoría o sección de productos relevantes en https://ferreteriaya.com.co/
- El anchor text debe sugerir consulta de productos sin sonar agresivamente comercial.
- Ejemplo: "Si necesitas conseguir los <a href='https://ferreteriaya.com.co/categoria-producto/herramientas/'>materiales y herramientas para este proyecto</a>, los encuentras en nuestra tienda."
- Coloca el CTA en un párrafo natural cerca del cierre del cuerpo (no en la conclusión, no en el FAQ).
- En artículos de pilar Tutoriales y Guías de Compra, el CTA es ESTRICTAMENTE obligatorio.

════ EXTENSIÓN OBLIGATORIA — MÍNIMO 1.800 PALABRAS ════

El body_html debe tener MÍNIMO 1.800 palabras de texto real (sin contar etiquetas HTML).
Para lograrlo, sigue esta densidad OBLIGATORIA sin excepciones:
- Cada H2: MÍNIMO 5 párrafos de 4 oraciones completas con datos concretos, ejemplos colombianos y materiales reales.
- Cada H3: MÍNIMO 4 párrafos de 4 oraciones con información accionable.
- Intro: 3 párrafos de 4 oraciones.
- Conclusión: 3 párrafos de 4 oraciones.
Si llegas a 1.500 palabras y aún no terminaste todas las secciones, CONTINÚA desarrollando cada punto con más detalle, ejemplos reales y contexto adicional hasta superar 1.800 palabras.

════ ESTRUCTURA DEL ARTÍCULO ════

1. INTRO: 3 párrafos de 4 oraciones.
   - Párrafo 1: hook práctico ('si llevas semanas con X', 'antes de comprar Y', 'con estos pasos sencillos') + keyword en las primeras 2 oraciones.
   - Párrafo 2: contexto y por qué importa el tema (ahorro de tiempo/dinero, evitar errores comunes).
   - Párrafo 3: presenta el valor del artículo y motivá al lector.

2. CUERPO: mínimo 6 secciones H2. Por cada H2:
   - MÍNIMO 5 párrafos de 4 oraciones con datos concretos, listas de materiales/herramientas, advertencias de seguridad.
   - Al menos 3 H2 deben tener 2 subsecciones H3.
   - Por cada H3: MÍNIMO 4 párrafos de 4 oraciones.
   - En tutoriales: usar listas numeradas <ol> para los pasos de instalación/reparación.
   - En guías de compra: usar tablas comparativas o listas con pros/contras claros.

3. CONCLUSIÓN: 3 párrafos de 4 oraciones.
   - Párrafo 1 y 2: resumen del valor más importante con llamada a la acción ('así de fácil', 'manos a la obra').
   - Párrafo 3: CTA invitando a comentar el resultado o compartir el tip.

FORMATO:
- Párrafos máximo 4 líneas. Sin bloques de texto denso.
- Pirámide Invertida: información más valiosa primero.
- Emojis solo como viñetas de lectura, máximo 1 por párrafo. Preferir 🔧 🪛 🔨 🪜 🧰 🪣 🧱 🪵 🌱 💡 ⚠️.
- Después de dos puntos (:) en encabezados, primera letra en MINÚSCULA salvo nombre propio o marca.
- Signos de interrogación OBLIGATORIOS en español (¿...?).
- NO incluir <h1> en body_html.
- NO incluir sección FAQ en body_html.
- Modificadores de ciudad ('en Bogotá', 'en Medellín', 'en clima costero', 'en zona andina') de forma natural cuando aplique.

CAMPO 'categoria' — usa EXACTAMENTE uno de estos 5 valores (copia exacta, con tildes y mayúsculas):
  'Herramientas y Equipos' | 'Materiales y Acabados' | 'Plomería y Sanitarios' | 'Electricidad e Iluminación' | 'Jardín y Exteriores'

CAMPO 'faq_items': Array de 5-6 objetos {question, answer}.
- Basados en Google Autocomplete y 'People Also Ask' para Colombia.
- Incluir AL MENOS 1 pregunta con modificador de ciudad ('¿Cuánto cuesta X en Bogotá/Medellín?').
- Incluir AL MENOS 1 pregunta de costo/precio aproximado en pesos colombianos (ej: 'entre $80.000 y $150.000').
- Cada answer: 4 oraciones concretas y accionables.
- Preguntas con ¿?. NO incluir en body_html.

CAMPO 'tags': Array OBLIGATORIO de exactamente 5 strings en español, minúsculas, sin acentos ni caracteres especiales.
- Representan los temas principales del artículo (keyword principal + 4 temas relacionados).
- Ejemplo para 'cómo instalar una llave de paso': ["plomeria", "llave de paso", "instalacion sanitaria", "tutorial", "diy bogota"]
- Ejemplo para 'mejor taladro inalambrico': ["taladro inalambrico", "herramientas electricas", "guia de compra", "bricolaje", "bosch"]
- NUNCA devuelvas 'tags': []. Si no sabes qué poner, usa la keyword + 4 variantes temáticas.

CAMPO 'prompt_imagen':
Describe en INGLÉS la escena exacta de la imagen destacada del artículo. Máx 25 palabras.
- Solo qué se ve: herramienta + acción + material/resultado
- Personas SOLO de manos hacia el codo, idealmente con guantes de trabajo. NUNCA rostros completos ni cuerpo entero.
- Debe representar el proyecto o concepto central del artículo sin ambigüedad.
- NO incluyas instrucciones técnicas de fotografía — eso lo maneja el sistema.
- Un lector debe reconocer el tema del artículo solo con ver la imagen.

Ejemplos de escenas bien escritas:
  taladro → "human hands in work gloves drilling into a white wall, dust visible, sharp focus on cordless drill"
  pintura → "paint roller applying white paint evenly on a smooth wall, hands visible holding the roller, paint tray in foreground"
  plomería → "hand holding wrench tightening copper pipe under a sink, water droplets visible, workshop close-up"
  cemento → "trowel spreading fresh gray cement on a brick wall, sharp focus on texture and trowel edge"
  herramientas comparativa → "three different power drills displayed on a wooden workbench with sawdust, brand details visible"
  electricidad → "screwdriver installing white wall switch, exposed wires visible, hands in insulated gloves"
  jardinería → "hands wearing garden gloves planting a small green plant in dark soil, terracotta pot visible"
  impermeabilización → "roller applying white waterproofing membrane on a flat concrete roof, hands visible, sunny day"

Escribe solo la escena, en inglés, máx 25 palabras.

Devuelve JSON con: titulo_seo, seo_title, h1, meta_description, categoria, body_html, faq_items, tags, prompt_imagen`;

const body = {
  model: "gpt-4o",
  response_format: { type: "json_object" },
  max_tokens: 8000,
  messages: [
    { role: "system", content: systemMsg },
    { role: "user", content: userMsg }
  ]
};

return [{ json: { gpt_body_json: JSON.stringify(body) } }];
```

---

## Adaptaciones requeridas en el Code node `fy-node-006` (Parsear JSON articulo)

El nodo de parseo de bigotes-felinos tiene 2 funciones específicas de gato que hay que reemplazar.

### 1. `categoriaMap` — IDs de WordPress

Reemplazar el objeto bigotes-felinos por:

```javascript
const categoriaMap = {
  'herramientas y equipos':       331,
  'materiales y acabados':        332,
  'plomeria y sanitarios':        333,
  'electricidad e iluminacion':   334,
  'jardin y exteriores':          335
};
```

### 2. `inferirCategoria()` — fallback por regex de keyword

Reemplazar las regex felinas por las de ferretería/construcción:

```javascript
function inferirCategoria(raw) {
  const n = normalizarTexto(raw);
  if (/plomeri|llave|tuberi|inodoro|sanitari|grifo|bañera|ducha|desagüe|fuga|calentador/.test(n))      return categoriaMap['plomeria y sanitarios'];
  if (/electric|tomacorrient|interrupt|bombillo|lampara|iluminaci|cable|cortocircuit|breaker/.test(n)) return categoriaMap['electricidad e iluminacion'];
  if (/jardin|planta|pasto|riego|fachada|exterior|piscina|impermeabiliz|terraza/.test(n))              return categoriaMap['jardin y exteriores'];
  if (/cement|pintur|piso|baldos|drywall|impermeab|masill|materi|acabad|estuco|cerami/.test(n))        return categoriaMap['materiales y acabados'];
  if (/taladro|sierra|herramient|equipo|martillo|destornillador|llave inglesa|nivel|pulidora/.test(n)) return categoriaMap['herramientas y equipos'];
  return categoriaMap['materiales y acabados']; // fallback más amplio
}
```

### 3. Fallback de `basePrompt` para nano banana

Reemplazar el fallback felino por uno de ferretería:

```javascript
const basePrompt = article.prompt_imagen || 'Realistic photo of human hands in work gloves using a cordless power drill on a wooden workbench, workshop lighting, 85mm lens';
```

El resto del Code node (`strip4Byte`, `slugify`, `truncarMeta`, `buildFAQHtml`, `buildFAQJsonLD`, etc.) **se mantiene idéntico** a bigotes-felinos — son utilidades genéricas que no dependen del nicho.
