import type { ReactNode } from 'react'

export interface PostData {
  slug: string
  title: string
  metaTitle: string
  metaDesc: string
  tag: string
  tagAccent: string
  date: string
  readTime: string
  excerpt: string
  image: string
  imageAlt: string
  faqs: { question: string; answer: string }[]
  content: ReactNode
}

export const BLOG_POSTS: PostData[] = [
  /* ─────────────────────────────────────────────────────── POST 1 ── */
  {
    slug: 'posicionar-marca-en-chatgpt-y-gemini',
    title: 'Cómo posicionar tu marca en ChatGPT y Gemini antes que tu competencia',
    metaTitle: 'Posicionar tu marca en ChatGPT y Gemini | InsightA Blog',
    metaDesc: 'Descubre qué es GEO (Generative Engine Optimization) y cómo hacer que la IA recomiende tu marca. Estrategias probadas para 2026.',
    tag: 'SEO + GEO',
    tagAccent: '#2563EB',
    date: 'Abr 2026',
    readTime: '6 min',
    excerpt: 'El SEO tradicional ya no es suficiente. Los buscadores de IA están cambiando cómo las personas encuentran productos y servicios. Te explicamos qué es GEO y cómo implementarlo hoy.',
    image: '/blog/seo-geo.svg',
    imageAlt: 'Red de nodos conectando Google, ChatGPT, Gemini y Perplexity',
    content: (
      <>
        <p>ChatGPT tiene más de 180 millones de usuarios activos. Gemini está integrado en cada búsqueda de Google. Perplexity creció más del 400% en el último año. Si tu marca no aparece en las respuestas de estos modelos, estás invisible para un segmento creciente de tu mercado — mientras tu competencia podría estar dominando ese espacio.</p>

        <h2>¿Qué es GEO y en qué se diferencia del SEO?</h2>
        <p>El <strong>GEO (Generative Engine Optimization)</strong> es la práctica de optimizar tu contenido y presencia digital para que los modelos de lenguaje generativo — ChatGPT, Gemini, Perplexity — te citen en sus respuestas. Es el SEO de la nueva generación de búsqueda.</p>
        <p>La diferencia es estructural: en Google buscas y ves diez resultados. En ChatGPT haces una pregunta y recibes <strong>una respuesta directa</strong> que cita 2 o 3 fuentes. Si no eres una de esas fuentes, no exististe en esa interacción de compra.</p>
        <blockquote>Según Gartner, para 2026 el 30% del tráfico de búsqueda orgánico será interceptado por IA generativa. Las marcas que no adapten su estrategia perderán visibilidad en el canal que más crece.</blockquote>

        <h2>Cómo los buscadores de IA deciden qué citar</h2>
        <p>Los modelos de IA operan con dos mecanismos: su <strong>conocimiento de entrenamiento</strong> (aprendido de miles de millones de textos) y la <strong>recuperación en tiempo real</strong> (RAG), donde buscan en la web antes de responder. Para aparecer en ambos, tu contenido necesita cumplir cuatro condiciones:</p>
        <ul>
          <li><strong>Ser una entidad reconocida:</strong> tu marca debe existir de forma consistente en fuentes de autoridad — Google Business Profile, Wikipedia, LinkedIn, medios digitales, directorios especializados.</li>
          <li><strong>Responder preguntas directamente:</strong> la IA prioriza contenido que da la respuesta en el primer párrafo, no después de cinco pantallas.</li>
          <li><strong>Tener estructura semántica:</strong> los datos estructurados (Schema Markup) son el idioma nativo que la IA lee con mayor precisión.</li>
          <li><strong>Estar citado en múltiples fuentes:</strong> la autoridad distribuida en la web es señal de confiabilidad para los modelos.</li>
        </ul>

        <h2>5 estrategias concretas de GEO para 2026</h2>

        <h3>1. Schema Markup: habla el idioma de la IA</h3>
        <p>Los datos estructurados JSON-LD son la herramienta más directa para comunicarle a los modelos qué hace tu empresa. Schema de tipo <code>Service</code>, <code>Organization</code>, <code>FAQPage</code> y <code>LocalBusiness</code> son los más efectivos. Una página sin Schema es opaca para la IA; una con Schema bien implementado es completamente legible.</p>

        <h3>2. Contenido conversacional con respuestas directas</h3>
        <p>Escribe como si respondieras preguntas en voz alta. "¿Cuánto cuesta un chatbot de IA en Colombia?" merece una respuesta clara en el primer párrafo. Este es exactamente el formato que los modelos extraen y citan. Cada sección de tu blog debería poder funcionar como respuesta autónoma a una pregunta específica.</p>

        <h3>3. Autoridad de entidad en múltiples fuentes</h3>
        <p>Tu nombre de empresa, lo que hace, en qué ciudad opera y a quién atiende debe aparecer de forma <strong>consistente y exacta</strong> en tu sitio, Google Business Profile, LinkedIn, directorios del sector y menciones en medios. La coherencia entre fuentes es lo que construye confianza para los modelos de IA.</p>

        <h3>4. Clusters temáticos de contenido profundo</h3>
        <p>Una página pilar — "Marketing Digital para PYMEs en Colombia" — con 8 a 10 artículos de soporte interconectados le señala a la IA que eres una fuente autoritativa del tema. La profundidad y la interconexión valen más que cien páginas aisladas y superficiales.</p>

        <h3>5. FAQ estructuradas con Schema en cada página relevante</h3>
        <p>Las preguntas frecuentes con Schema <code>FAQPage</code> son el activo más directo del GEO. Cuando alguien le pregunta a ChatGPT "¿qué incluye un servicio de SEO?", el modelo busca exactamente este tipo de contenido estructurado. Sin FAQ con Schema, dejas valor sobre la mesa.</p>

        <h2>Cómo medir tu presencia en buscadores de IA</h2>
        <p>No hay aún un "Google Search Console para GEO", pero existen métodos prácticos:</p>
        <ul>
          <li><strong>Prompt testing manual:</strong> escribe en ChatGPT, Gemini y Perplexity las preguntas que tus clientes harían sobre tu industria. Anota si mencionan tu marca, a tu competencia o a ninguno.</li>
          <li><strong>Tráfico de referencia:</strong> Perplexity y SearchGPT envían tráfico rastreable. Crea segmentos en GA4 para medir este canal específicamente.</li>
          <li><strong>Monitoreo de menciones:</strong> herramientas como Brand24 o Mention capturan cuándo la IA incluye tu nombre en respuestas que se indexan o comparten en la web.</li>
        </ul>
      </>
    ),
    faqs: [
      {
        question: '¿El GEO reemplaza al SEO tradicional?',
        answer: 'No son mutuamente excluyentes: son capas de la misma estrategia. El SEO posiciona tu contenido para que sea rastreable e indexado (por Google y por la IA que navega la web). El GEO optimiza cómo ese contenido es interpretado y citado por los modelos generativos. Una estrategia ganadora aplica ambas en paralelo.',
      },
      {
        question: '¿Cuánto tiempo tarda en verse resultados de GEO?',
        answer: 'Los primeros indicadores — mayor frecuencia de menciones en pruebas manuales de prompts — aparecen entre 4 y 8 semanas de trabajo consistente en contenido estructurado y construcción de autoridad. El tráfico de referencia desde Perplexity o SearchGPT empieza a ser medible entre los meses 2 y 4.',
      },
      {
        question: '¿Qué tipo de contenido prefieren citar los buscadores de IA?',
        answer: 'Los modelos priorizan contenido con: respuestas directas en los primeros párrafos, datos estructurados Schema Markup, estadísticas con fuentes citadas, listas numeradas y bullets claros, y preguntas frecuentes bien respondidas. Los textos densos y sin estructura tienen baja tasa de citación en comparación.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────── POST 2 ── */
  {
    slug: 'sesgos-cognitivos-decisiones-de-compra',
    title: 'Los 7 sesgos cognitivos que más impactan las decisiones de compra online',
    metaTitle: '7 Sesgos Cognitivos en Marketing Digital | InsightA Blog',
    metaDesc: 'El 95% de las decisiones de compra son subconscientes. Aprende a aplicar los 7 sesgos cognitivos más poderosos en tus campañas y aumenta tus conversiones.',
    tag: 'Psicología del Consumidor',
    tagAccent: '#7C3AED',
    date: 'Mar 2026',
    readTime: '7 min',
    excerpt: 'La ancla de precios, el efecto de escasez, la prueba social... Entender estos mecanismos mentales es la diferencia entre una campaña que convierte y una que solo gasta presupuesto.',
    image: '/blog/sesgos-cognitivos.svg',
    imageAlt: 'Diagrama del cerebro con 7 nodos representando los sesgos cognitivos del consumidor',
    content: (
      <>
        <p>El neurocientífico Gerald Zaltman de Harvard demostró que el <strong>95% de las decisiones de compra ocurren de forma subconsciente</strong>, antes de que el cerebro consciente justifique la elección con argumentos lógicos. Esto tiene una implicación directa para tu marketing: apelar solo a la razón — precio, características, ventajas comparativas — es hablarle al 5% de la decisión.</p>
        <p>Los sesgos cognitivos son los atajos mentales que el cerebro usa para decidir rápido con poco esfuerzo. No son errores: son el sistema operativo de la mente humana. Entenderlos no es manipulación — es hablar el idioma en el que tu cliente realmente decide.</p>

        <h2>Los 7 sesgos que más impactan las compras online</h2>

        <h3>1. Efecto Ancla — El primer número lo controla todo</h3>
        <p>Cuando el cerebro ve un precio, lo evalúa en relación al primer número que vio, no en términos absolutos. <strong>$199.000 tachado → $129.000</strong> parece una ganga aunque el precio "real" siempre haya sido $129.000. El ancla más alta hace que el precio actual parezca razonable.</p>
        <p><em>Cómo aplicarlo:</em> muestra siempre el precio original antes del precio con descuento. En planes de precios, coloca el plan más caro primero — hace que los demás parezcan accesibles.</p>

        <h3>2. Prueba Social — Lo que hacen los demás define lo que hacemos</h3>
        <p>Somos animales sociales. Cuando no sabemos qué hacer, miramos qué hacen otros. "Más de 5.000 empresas confían en nosotros" o "4.8 estrellas en 380 reseñas" reduce la incertidumbre y justifica la decisión emocionalmente.</p>
        <p><em>Cómo aplicarlo:</em> muestra reseñas reales, contadores de clientes o casos de éxito cerca del botón de compra. La especificidad importa: "empresa de Bogotá" convierte más que "empresa en Colombia".</p>

        <h3>3. Aversión a la Pérdida — Perder duele más que ganar</h3>
        <p>Las investigaciones de Kahneman y Tversky confirmaron que perder $100 genera el doble de malestar que el placer de ganar $100. El copy que enmarca en términos de pérdida — "Deja de perder ventas mientras duermes" — suele superar al copy positivo equivalente entre un 15% y un 30%.</p>
        <p><em>Cómo aplicarlo:</em> usa lenguaje de pérdida con moderación y en contexto correcto: en etapas de concienciación del problema. En el cierre, vuelve al beneficio positivo para no generar ansiedad.</p>

        <h3>4. Efecto de Escasez y Urgencia — Lo raro vale más</h3>
        <p>El cerebro valora más lo que puede desaparecer. "Solo quedan 3 lugares" o "Oferta válida hoy" activa el sistema de amenaza del cerebro reptiliano, que prioriza la acción inmediata sobre la evaluación racional.</p>
        <p><em>Cómo aplicarlo:</em> solo usa escasez real o bien fundamentada — la escasez falsa se detecta y destruye la confianza permanentemente. Los contadores de tiempo y el stock visible en e-commerce son implementaciones legítimas.</p>

        <h3>5. Efecto Halo — La primera impresión colorea todo lo demás</h3>
        <p>Si un sitio se ve profesional y moderno, el usuario asume que el producto también lo es, que el servicio será bueno y que la empresa es confiable. El diseño no es decoración: es señal de calidad percibida que precede a cualquier argumento.</p>
        <p><em>Cómo aplicarlo:</em> invierte en el diseño de tu home y landing pages. La velocidad de carga también forma parte del halo — un sitio lento es percibido como "descuidado" aunque el producto sea excelente.</p>

        <h3>6. Sesgo de Autoridad — Seguimos a los expertos</h3>
        <p>Somos más propensos a seguir el consejo de quien percibimos como experto o figura de autoridad. Logos de medios de comunicación, certificaciones, premios, "como fue visto en..." — todos estos activan el sesgo de autoridad y reducen la fricción cognitiva antes de la compra.</p>
        <p><em>Cómo aplicarlo:</em> incluye credenciales verificables cerca del CTA. Un "Google Partner Certificado" o "10 años de experiencia" vale más que cinco párrafos de autopresentación.</p>

        <h3>7. Sesgo de Confirmación — Creemos lo que ya creemos</h3>
        <p>El cerebro busca activamente información que confirme sus creencias y desestima la que las contradice. Si tu cliente cree que su problema es la falta de visibilidad online, un artículo que confirma esa creencia genera mayor engagement y predisposición a la compra que uno que la cuestiona.</p>
        <p><em>Cómo aplicarlo:</em> en la fase de atracción de contenido, habla el idioma del problema que tu cliente ya siente. No intentes cambiar su diagnóstico — confirma que tiene razón en identificar ese dolor, y entonces presenta tu solución.</p>
      </>
    ),
    faqs: [
      {
        question: '¿Usar sesgos cognitivos en marketing es manipulación?',
        answer: 'La diferencia entre persuasión ética y manipulación está en la honestidad. Mostrar reseñas reales (prueba social), comunicar un descuento genuino (efecto ancla) o indicar stock real (escasez) son prácticas legítimas que ayudan al consumidor a tomar decisiones más informadas. La manipulación ocurre cuando se fabrican evidencias falsas o se presiona con urgencias inventadas. Conocer los sesgos también te protege de ser manipulado.',
      },
      {
        question: '¿Cuál sesgo es más poderoso para e-commerce?',
        answer: 'La combinación más efectiva para e-commerce es: Prueba Social (reseñas prominentes) + Escasez genuina (stock visible) + Reducción de la pérdida (garantía de devolución). Estos tres juntos abordan los tres principales frenos de compra online: ¿es confiable?, ¿debería decidir ahora?, ¿qué pasa si me equivoco?',
      },
      {
        question: '¿Cómo puedo probar si un sesgo funciona en mi negocio específico?',
        answer: 'Con A/B testing. Crea dos versiones de tu landing page o anuncio: una con el sesgo implementado, otra sin él. Mide la tasa de conversión durante al menos 2 semanas con tráfico significativo (mínimo 500 visitas por variante). Herramientas como Google Optimize, VWO o Optimizely facilitan esta implementación. Sin datos, la intuición sobre qué "debería funcionar" suele estar equivocada.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────── POST 3 ── */
  {
    slug: 'chatbots-ia-vs-chatbots-tradicionales',
    title: 'Chatbots de IA vs. chatbots tradicionales: por qué la diferencia importa',
    metaTitle: 'Chatbots de IA vs Tradicionales: Diferencias Clave | InsightA Blog',
    metaDesc: 'No todos los chatbots son iguales. Descubre la diferencia entre un chatbot basado en reglas y un asistente de IA, y cuál necesita tu negocio para cerrar más ventas.',
    tag: 'IA & Automatización',
    tagAccent: '#059669',
    date: 'Mar 2026',
    readTime: '5 min',
    excerpt: 'No todos los chatbots son iguales. Un asistente de IA entrenado con tu marca puede cerrar ventas de madrugada mientras tú duermes. Así funciona la tecnología detrás.',
    image: '/blog/chatbots-ia.svg',
    imageAlt: 'Comparación visual entre chatbot tradicional (gris) y chatbot de IA (azul) con ejemplos de conversación',
    content: (
      <>
        <p>Hay una confusión común en el mercado: llamar "chatbot de IA" a cualquier sistema de mensajería automatizada. La diferencia entre un chatbot basado en reglas y un verdadero asistente de IA no es de matiz — es la diferencia entre un árbol de decisión y una conversación real. Y esa diferencia se mide directamente en ventas y satisfacción del cliente.</p>

        <h2>Cómo funciona un chatbot tradicional (basado en reglas)</h2>
        <p>Un chatbot tradicional opera con un árbol de decisión predefinido. Si el usuario escribe "precio", el sistema muestra la opción A. Si escribe "soporte", muestra la opción B. Si escribe algo fuera del vocabulario programado — "¿qué me recomendarías para mi caso?" — el sistema falla, devuelve "no entendí" y el usuario abandona.</p>
        <p>Sus limitaciones son estructurales:</p>
        <ul>
          <li>Solo entiende las palabras exactas o sinónimos programados manualmente.</li>
          <li>No tiene memoria de la conversación — cada mensaje es independiente.</li>
          <li>No puede adaptar el tono o el contenido según el perfil del usuario.</li>
          <li>Requiere mantenimiento constante cada vez que cambia el producto o el proceso.</li>
        </ul>

        <h2>Qué hace diferente a un chatbot de IA generativa</h2>
        <p>Un asistente de IA moderno — entrenado con modelos como GPT-4, Claude o Gemini — entiende el <strong>contexto completo de la conversación</strong>, no palabras sueltas. Puede responder "¿para una tienda con 80 productos qué plan me recomiendas?" sin haber visto esa pregunta específica nunca antes, porque comprende la intención detrás del texto.</p>
        <p>Sus capacidades fundamentales:</p>
        <ul>
          <li><strong>Comprensión de lenguaje natural:</strong> entiende preguntas mal escritas, jerga local y preguntas compuestas.</li>
          <li><strong>Memoria de contexto:</strong> recuerda lo que el usuario dijo al principio de la conversación y lo usa para personalizar la respuesta.</li>
          <li><strong>Entrenamiento con tu marca:</strong> aprende el tono, los productos, los precios y los procesos específicos de tu negocio.</li>
          <li><strong>Escalación inteligente:</strong> detecta cuándo una situación requiere intervención humana y transfiere con contexto completo.</li>
        </ul>

        <h2>Comparativa directa: métricas reales</h2>
        <blockquote>Las empresas que migran de chatbot basado en reglas a IA conversacional reportan una reducción del 40–60% en consultas que llegan al equipo humano, y un aumento del 25–35% en tasa de conversión desde el chat.</blockquote>
        <p>La diferencia más impactante es el <strong>tiempo de respuesta efectivo</strong>: un agente humano responde en promedio en 10 horas (incluyendo horario nocturno). Un chatbot tradicional responde instantáneamente pero falla en el 40–70% de las consultas fuera del guión. Un asistente de IA responde instantáneamente y resuelve entre el 70% y el 85% de las consultas sin escalación.</p>

        <h2>¿Cuándo usar cada tipo?</h2>
        <p>Un <strong>chatbot basado en reglas</strong> tiene sentido cuando el flujo de conversación es extremadamente predecible y limitado: encuestas de satisfacción post-servicio, navegación de menús simples, o confirmación de pedidos con variables conocidas. Si tu caso de uso tiene 10 variaciones posibles, las reglas funcionan bien.</p>
        <p>Un <strong>asistente de IA</strong> es la elección correcta cuando los clientes hacen preguntas abiertas, comparan opciones, necesitan recomendaciones personalizadas o donde el ciclo de venta implica múltiples intercambios. Es también la única opción viable para negocios con catálogos grandes, servicios complejos o audiencias diversas.</p>

        <h2>El impacto en ventas: el número que importa</h2>
        <p>El caso de negocio más sólido para la IA conversacional es simple: un negocio que recibe 100 consultas por WhatsApp cada semana fuera del horario laboral, con una tasa de conversión del 15%, pierde ~15 ventas semanales por no estar disponible. Con un asistente de IA que convierte al 10% de esas consultas nocturnas, recupera 10 ventas por semana que antes eran cero.</p>
      </>
    ),
    faqs: [
      {
        question: '¿Cuánto cuesta implementar un chatbot de IA?',
        answer: 'El costo varía según la complejidad: un asistente básico (FAQs + captación de leads) parte desde $800–1.500 USD en implementación y $150–300 USD/mes en mantenimiento y licencia del modelo. Un agente con flujos de ventas, integración con CRM y múltiples canales (WhatsApp + web) puede estar entre $2.500–5.000 USD de implementación. El ROI suele recuperar la inversión en el primer o segundo mes cuando hay volumen suficiente de consultas.',
      },
      {
        question: '¿Puede el chatbot de IA reemplazar completamente al equipo humano?',
        answer: 'No completamente, ni debería ser el objetivo. El chatbot de IA maneja eficientemente entre el 70% y el 85% de las consultas. El 15–30% restante — objeciones complejas, negociaciones de precios altos, situaciones de inconformidad — necesita intervención humana. El modelo ideal es IA que gestiona el volumen y escalación inteligente que envía al humano solo los casos que lo requieren, con contexto completo.',
      },
      {
        question: '¿En qué canales funciona un chatbot de IA?',
        answer: 'Los canales más efectivos en el mercado colombiano son WhatsApp Business (el canal de mayor adopción, con más del 85% de los usuarios activos diarios), el chat embebido en el sitio web, y en algunos sectores, Instagram DMs. El chatbot puede operar en múltiples canales simultáneamente con una sola implementación, respondiendo de forma nativa en cada plataforma.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────── POST 4 ── */
  {
    slug: 'triplicar-roi-meta-ads-neuropsicologia',
    title: 'Cómo triplicar el ROI de tus Meta Ads usando principios de neuropsicología',
    metaTitle: 'Triplicar ROI de Meta Ads con Neuropsicología | InsightA Blog',
    metaDesc: 'El ROAS promedio de Meta Ads es 2.3×. Con neuropsicología aplicada puedes llegar a 5–7×. Descubre los 6 principios que cambian los resultados de tus campañas.',
    tag: 'Performance',
    tagAccent: '#EA580C',
    date: 'Feb 2026',
    readTime: '7 min',
    excerpt: 'Los colores, el copywriting, la estructura del anuncio — todo tiene un impacto en el cerebro del usuario. Te mostramos cómo aplicar ciencia conductual a tus campañas de Meta Ads.',
    image: '/blog/meta-ads-roi.svg',
    imageAlt: 'Gráfica de barras mostrando el crecimiento del ROAS desde 1× hasta 6.1× con diferentes estrategias',
    content: (
      <>
        <p>El ROAS promedio de Meta Ads en Latinoamérica ronda el 2.3×. Las empresas que aplican principios de neuropsicología de forma sistemática en sus creatividades y copy reportan consistentemente ROAS de 4× a 7×. La diferencia no está en el presupuesto — está en entender cómo funciona el cerebro que decide comprar.</p>

        <h2>Por qué la mayoría de las campañas de Meta fracasan</h2>
        <p>El error más común es crear anuncios racionales para un cerebro emocional. Un carrusel con bullet points de características técnicas, precios y especificaciones puede ser exactamente correcto en lógica y completamente ineficaz en práctica. El neuromarketing llama a esto el <strong>"error de la corteza prefrontal"</strong>: diseñar para el cerebro que queremos que use el cliente, no para el que realmente tiene.</p>
        <p>Meta Ads opera en un entorno de distracción máxima: el scroll del feed. El cerebro solo tiene entre 1.5 y 3 segundos para decidir si para o sigue. Esa decisión no la toma la razón — la toma el sistema límbico.</p>

        <h2>Sistema 1 y Sistema 2: cómo decide el cerebro ante un anuncio</h2>
        <p>El psicólogo Daniel Kahneman describió dos sistemas de pensamiento. El <strong>Sistema 1</strong> es rápido, automático, emocional e intuitivo — es el que está activo mientras scrolleamos. El <strong>Sistema 2</strong> es lento, deliberado y analítico — se activa cuando le damos clic a algo y evaluamos si compramos.</p>
        <p>Tu anuncio tiene que ganar en el Sistema 1 para que el Sistema 2 tenga siquiera la oportunidad de evaluar. El copy más brillante del mundo no sirve si la imagen no hace que el cerebro emocional detenga el scroll.</p>

        <h2>Los 6 principios neuropsicológicos para Meta Ads</h2>

        <h3>1. Pattern interrupt visual</h3>
        <p>El cerebro ignora lo predecible. Una imagen de producto limpia sobre fondo blanco se convierte en ruido visual. Una imagen que rompe el patrón del feed — colores inesperados, ángulos atípicos, contexto sorpresivo — detiene el scroll involuntariamente. Prueba fondos que contrasten con el azul y blanco de Facebook, o imágenes que "se salen" del formato.</p>

        <h3>2. Aversión a la pérdida en el headline</h3>
        <p>Copy como "¿Cuánto estás perdiendo por no tener tu negocio en Google?" convierte sistemáticamente mejor que su equivalente positivo "Haz crecer tu negocio con SEO". La pérdida percibida activa el sistema de amenaza del cerebro con mayor intensidad que la ganancia equivalente. Úsalo con moderación — si todo es urgencia y miedo, nada lo es.</p>

        <h3>3. Caras y contacto visual</h3>
        <p>El cerebro humano tiene circuitos neuronales dedicados exclusivamente al reconocimiento de rostros (el giro fusiforme). Los anuncios con personas mirando a cámara generan en promedio un 35% más de atención en estudios de eye-tracking. Si el rostro mira hacia el texto o el CTA, la atención del espectador sigue involuntariamente esa dirección.</p>

        <h3>4. Especificidad como señal de confianza</h3>
        <p>"Aumentamos tus ventas" suena a promesa vacía. "Aumentamos el ROAS de una marca de suplementos de 1.8× a 5.6× en 60 días" activa el Sistema 2: el cerebro puede evaluar, verificar y creer. La especificidad es la diferencia entre publicity y prueba.</p>

        <h3>5. Reducción de fricción cognitiva en el CTA</h3>
        <p>Los botones genéricos "Más información" o "Comprar ahora" tienen menor efectividad que CTAs específicos al contexto: "Ver cómo funciona", "Calcular mi ROI", "Ver disponibilidad". El cerebro necesita saber qué va a pasar exactamente si hace clic — la incertidumbre genera resistencia.</p>

        <h3>6. Retargeting con progresión narrativa</h3>
        <p>El retargeting más efectivo no repite el mismo anuncio — cuenta el siguiente capítulo de la historia. Quien vio el anuncio de awareness recibe el de prueba social. Quien visitó el precio recibe el de garantía. Quien agregó al carrito recibe el de escasez. La progresión narrativa mantiene la relevancia y reduce la fatiga del anuncio.</p>

        <h2>La estructura del anuncio ganador</h2>
        <p>Basado en miles de pruebas A/B en el mercado latinoamericano, la estructura que más convierte consistentemente es: <strong>Imagen de pattern interrupt → Headline de pérdida o beneficio específico → Dos o tres bullets de especificidad → CTA contextual → Social proof mínimo (número de clientes o calificación)</strong>. No es una fórmula rígida — es un punto de partida que debes testear y adaptar a tu audiencia.</p>
      </>
    ),
    faqs: [
      {
        question: '¿Cuánto presupuesto mínimo necesito para ver resultados reales en Meta Ads?',
        answer: 'Para que el algoritmo de Meta complete su fase de aprendizaje y optimice con datos reales, recomendamos mínimo $500 USD/mes en inversión de medios (lo que le pagas directamente a Meta). Por debajo de ese umbral, el ciclo de aprendizaje no completa y es muy difícil escalar. Este es el presupuesto de pauta — los honorarios de gestión son adicionales.',
      },
      {
        question: '¿Video o imagen estática: qué funciona mejor en Meta Ads?',
        answer: 'Depende del objetivo y la etapa del funnel. Para awareness y primera impacto, los videos de 6–15 segundos suelen tener mayor alcance orgánico en la plataforma. Para conversión directa (e-commerce, lead gen), las imágenes estáticas bien diseñadas frecuentemente superan a los videos porque el procesamiento visual es instantáneo. La respuesta honesta: testéalo con tu audiencia específica — las generalidades engañan.',
      },
      {
        question: '¿Cómo sé si mi ROAS actual es bueno o malo?',
        answer: 'El ROAS "bueno" depende de tu margen de contribución, no de un número absoluto. Si vendes con margen del 40%, un ROAS de 2.5× apenas cubre los costos de pauta. Si vendes con margen del 70%, un ROAS de 2.5× puede ser rentable. La métrica clave es el ROAS de equilibrio: 1 ÷ margen de contribución = ROAS mínimo para no perder dinero en pauta. Trabaja desde ahí hacia arriba.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────── POST 5 ── */
  {
    slug: 'landing-pages-alta-conversion-10-elementos',
    title: 'Landing pages de alta conversión: los 10 elementos que no pueden faltar',
    metaTitle: 'Landing Pages de Alta Conversión: 10 Elementos Esenciales | InsightA Blog',
    metaDesc: 'La tasa de conversión promedio de landing pages es 2.35%. El top 25% convierte al 5.31%+. Estos son los 10 elementos que marcan la diferencia según miles de A/B tests.',
    tag: 'Diseño Web',
    tagAccent: '#0891B2',
    date: 'Feb 2026',
    readTime: '8 min',
    excerpt: 'Una landing page bien diseñada puede duplicar o triplicar tu tasa de conversión. Analizamos los 10 elementos críticos basados en miles de tests A/B y principios de psicología del consumidor.',
    image: '/blog/landing-pages.svg',
    imageAlt: 'Wireframe de landing page con los 10 elementos numerados y anotados',
    content: (
      <>
        <p>Según Wordstream, la tasa de conversión promedio de una landing page es del 2.35%. El 25% superior de páginas convierte al 5.31% o más. Ese 3% de diferencia puede significar el doble de leads, el doble de ventas, con el mismo presupuesto de pauta. La diferencia no está en el tráfico — está en qué sucede cuando el usuario llega.</p>

        <h2>Los 10 elementos de una landing page que convierte</h2>

        <h3>1. Headline que responde "¿qué gano yo?" en menos de 8 palabras</h3>
        <p>El headline es lo único que el usuario lee si no continúa leyendo. Debe comunicar el beneficio principal — no el nombre del producto ni lo que hace la empresa. "Duplica tus ventas online en 90 días" vs "Servicios de marketing digital para empresas". Solo uno responde la pregunta del usuario: ¿para qué me sirve esto a mí?</p>

        <h3>2. Subtítulo de refuerzo específico</h3>
        <p>El subtítulo hace el trabajo que el headline no puede: añade especificidad. "Diseñamos campañas de Meta Ads con psicología del consumidor para e-commerce colombiano que quiere escalar sin quemar presupuesto." Una frase que califica al visitante (e-commerce, colombiano, quiere escalar) y diferencia de la competencia.</p>

        <h3>3. Imagen o video hero de alta carga emocional</h3>
        <p>El visual no debe mostrar el producto — debe mostrar <strong>el resultado de tener el producto</strong>. No el software de contabilidad: el dueño de empresa tranquilo con su teléfono. No el chatbot: el emprendedor dormido mientras el chat trabaja. La emoción del resultado vende más que la explicación de la herramienta.</p>

        <h3>4. Propuesta de valor única en 3 bullets</h3>
        <p>Tres razones concretas y diferenciadas de por qué elegirte a ti. No "Calidad garantizada, atención personalizada, precios competitivos" — eso lo dice todo el mundo. Sí: "IA entrenada con tu marca en 3 semanas", "Reportes semanales sin tecnicismos", "ROAS garantizado o ajustamos sin costo". La especificidad convierte. La genericidad no.</p>

        <h3>5. Prueba social inmediata y específica</h3>
        <p>El usuario llega con desconfianza por defecto. La prueba social la deshace. Los mejores elementos en orden de efectividad: testimonios con foto real y resultado específico ("aumentamos las ventas un 40% en 2 meses"), logos de clientes reconocibles, número de clientes o proyectos, calificaciones con plataforma de reseña visible.</p>

        <h3>6. CTA principal visible sin hacer scroll (above the fold)</h3>
        <p>El 57% de los usuarios no llega al pliegue de la página. Si tu único botón de acción está abajo del todo, estás perdiendo más de la mitad de las oportunidades. El CTA debe estar visible en la primera pantalla, repetirse en el medio y al final, y su color debe contrastar visiblemente con el fondo.</p>

        <h3>7. Formulario de máximo 3 campos</h3>
        <p>Cada campo adicional en un formulario reduce la tasa de envío entre un 11% y un 25%. Nombre, teléfono y mensaje es suficiente para calificar un lead. El correo y la empresa los obtienes en el primer contacto. No pidas lo que no necesitas antes de hablar con el cliente — la fricción mata la conversión.</p>

        <h3>8. Reducción de riesgo percibido</h3>
        <p>"Sin compromiso", "Gratis los primeros 30 días", "Si no funciona, te devolvemos el dinero". El cerebro del cliente tiene miedo de equivocarse. Una garantía o política clara activa el sistema de seguridad y destraba la decisión. Colócala cerca del formulario o botón de compra, donde la ansiedad es más alta.</p>

        <h3>9. Velocidad y Core Web Vitals ≥ 90</h3>
        <p>El 53% de los usuarios en móvil abandona si la página tarda más de 3 segundos en cargar. Cada segundo adicional de carga reduce la conversión entre un 7% y un 20%. Una landing page perfectamente diseñada que carga en 4 segundos convierte menos que una diseño regular que carga en 1.2 segundos. La velocidad es parte del producto.</p>

        <h3>10. Pixel, GA4 y seguimiento de conversiones desde el día uno</h3>
        <p>Una landing sin tracking es un experimento sin resultados. Instala Meta Pixel + Conversions API, Google Analytics 4, Google Tag Manager, y configura eventos de conversión antes de lanzar tráfico. Sin datos, no sabes si funciona. Con datos incorrectos, optimizas en la dirección equivocada.</p>

        <h2>El orden importa tanto como los elementos</h2>
        <p>La arquitectura de información sigue la lógica del proceso de decisión: <strong>captar atención → generar interés → construir deseo → eliminar el riesgo → facilitar la acción</strong>. Los elementos anteriores mapeados en ese orden generan una experiencia de conversión coherente. Una landing que mezcla CTA antes de generar confianza, o que pide el formulario antes de explicar el valor, interrumpe ese flujo y pierde la conversión.</p>
      </>
    ),
    faqs: [
      {
        question: '¿Cuántos campos debe tener el formulario de mi landing page?',
        answer: 'La regla es pedir el mínimo necesario para el siguiente paso del proceso de venta. Para una landing de agenda de cita: nombre y teléfono (2 campos). Para lead gen de contenido descargable: nombre y correo (2 campos). Si necesitas clasificar al lead antes de contactarlo, agrega un campo de selección (tipo de empresa, presupuesto). Nunca más de 4 campos antes de la primera interacción real.',
      },
      {
        question: '¿Debo tener una landing page diferente para cada campaña?',
        answer: 'Idealmente sí, al menos por fuente de tráfico y oferta. Una landing para tráfico de Google Search (alta intención, busca solución específica) debe ser diferente a la de tráfico de Meta (interrupción, aún en etapa de consideración). La relevancia entre el anuncio y la landing — llamada Message Match — es uno de los factores más críticos para la conversión. Si el anuncio promete "SEO en Colombia" y la landing habla de marketing digital en general, hay una ruptura de confianza.',
      },
      {
        question: '¿Cuál es la tasa de conversión que debería esperar en mi landing?',
        answer: 'Depende del sector, el tipo de oferta y la temperatura del tráfico. Para lead gen (contacto o agenda de cita) con tráfico de búsqueda pagado (alta intención): 8–15% es posible. Con tráfico de redes sociales (menor intención): 2–6% es realista. Para ventas directas en e-commerce: 1–4% es el rango típico. El punto de referencia real es tu propia página base: cualquier mejora sistemática sobre ese número es una ganancia.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────── POST 6 ── */
  {
    slug: 'marketing-digital-colombia-2026',
    title: 'Marketing digital en Colombia 2026: tendencias y oportunidades',
    metaTitle: 'Marketing Digital en Colombia 2026: Tendencias y Oportunidades | InsightA Blog',
    metaDesc: 'Colombia tiene 38 millones de usuarios de internet y el e-commerce creció 32% en 2023. Estas son las 5 tendencias que dominarán el marketing digital colombiano en 2026.',
    tag: 'Estrategia',
    tagAccent: '#1B3A6B',
    date: 'Ene 2026',
    readTime: '6 min',
    excerpt: 'El mercado digital colombiano está creciendo más rápido que el promedio regional. Estas son las tendencias que dominarán 2026 y cómo posicionar tu empresa para aprovecharlas antes que tu competencia.',
    image: '/blog/marketing-colombia.svg',
    imageAlt: 'Gráfica de tendencias de marketing digital en Colombia con líneas de crecimiento para e-commerce, IA y social media',
    content: (
      <>
        <p>Colombia tiene más de 38 millones de usuarios de internet, una penetración del 78%, y un e-commerce que creció un 32% interanual en 2023, según cifras de la Cámara Colombiana de Comercio Electrónico. Es el tercer mercado de e-commerce más dinámico de Latinoamérica después de Brasil y México. Lo que cambia en 2026 no es el crecimiento — es la velocidad con que cambia cómo se hace marketing aquí.</p>

        <h2>Tendencia 1: IA en el marketing del día a día</h2>
        <p>La Inteligencia Artificial dejó de ser una promesa futura para convertirse en herramienta práctica. En 2026, las empresas colombianas que usan IA para personalización, automatización de campañas y análisis predictivo tienen una ventaja estructural sobre las que no lo hacen — no por razones de tecnología, sino de velocidad y costo de operación.</p>
        <p>Las aplicaciones más accesibles y de mayor impacto inmediato:</p>
        <ul>
          <li><strong>Chatbots de IA para atención y ventas:</strong> WhatsApp Business + IA es el canal con mayor adopción en el mercado colombiano, con más del 85% de usuarios activos diarios.</li>
          <li><strong>Generación de contenido asistida:</strong> copy de anuncios, artículos de blog y emails generados con IA y revisados por humanos — reducción de hasta el 70% en tiempo de producción de contenido.</li>
          <li><strong>Segmentación predictiva:</strong> modelos que predicen qué clientes están próximos a comprar o a abandonar, permitiendo intervenciones proactivas.</li>
        </ul>

        <h2>Tendencia 2: Video short-form como canal de ventas directo</h2>
        <p>TikTok superó los 22 millones de usuarios activos en Colombia en 2025. Instagram Reels tiene engagement promedio 4× superior al de posts estáticos. Pero lo que cambió en 2026 no es el consumo de video — es la <strong>atribución directa de compras</strong>. TikTok Shop y el social commerce en Instagram permiten que el usuario compre sin salir de la plataforma, acortando el funnel de conversión radicalmente.</p>
        <blockquote>El 62% de los usuarios colombianos de TikTok entre 18 y 34 años reporta haber comprado un producto que vio en la plataforma, según encuesta de Ipsos 2025.</blockquote>
        <p>Para las marcas, el imperativo es claro: presencia en video short-form con contenido nativo (no anuncios disfrazados) y un proceso de compra que funcione directamente desde la plataforma.</p>

        <h2>Tendencia 3: Social commerce — el checkout dentro de las redes</h2>
        <p>El recorrido tradicional era: anuncio → clic → landing page → formulario o tienda → conversión. En 2026, ese recorrido se comprime: contenido → CTA nativo → checkout en la misma app. Meta, TikTok y WhatsApp Business están invirtiendo activamente en hacer que la compra ocurra sin salir de la plataforma.</p>
        <p>Para el mercado colombiano, donde el abandono de carrito en e-commerce supera el 70%, eliminar cada paso del funnel puede tener un impacto significativo en la tasa de conversión final. La barrera para entrar a este canal es menor de lo que parece: catálogo de productos, perfil de empresa verificado y un proceso de pago conectado.</p>

        <h2>Tendencia 4: Búsqueda por voz y optimización local</h2>
        <p>El 27% de las búsquedas en Google en Colombia se realizan por voz, según datos de Google 2025. Las búsquedas por voz tienen características distintas: son más largas ("¿cuál es el mejor restaurante italiano cerca del Parque 93?"), más conversacionales y con intención local más marcada.</p>
        <p>La optimización para voz requiere: Google Business Profile completo y actualizado, contenido con preguntas y respuestas en lenguaje natural, Schema de LocalBusiness con horarios y servicios, y reseñas recientes y activas.</p>

        <h2>Tendencia 5: Marketing de propósito y valores de marca</h2>
        <p>La generación Z (hoy con entre 18 y 27 años) representa el 32% de la población colombiana y tiene un poder adquisitivo creciente. Este segmento toma decisiones de compra evaluando no solo el producto sino los <strong>valores de la empresa</strong>: sostenibilidad, transparencia, diversidad, impacto social. Las marcas que no tienen una narrativa de propósito auténtica pierden relevancia con esta audiencia.</p>
        <p>Esto no significa seguir modas. Significa identificar qué causa genuina conecta con tu marca y construir alrededor de eso de forma consistente y verificable — no como campaña puntual, sino como parte del ADN de comunicación.</p>

        <h2>Plan de acción: qué hacer en los próximos 90 días</h2>
        <p>Ante cinco tendencias simultáneas, la tentación es querer implementar todo al mismo tiempo. El enfoque correcto es secuencial y basado en dónde está tu mayor brecha actual:</p>
        <ul>
          <li>Si aún no tienes automatización de atención al cliente: <strong>Prioridad 1 es el chatbot de WhatsApp.</strong> El impacto en ventas es inmediato y el costo de oportunidad de no tenerlo crece cada semana.</li>
          <li>Si ya tienes automatización pero no tienes presencia en video: <strong>Prioridad 1 es el canal de TikTok o Reels</strong> con 3-4 videos semanales de contenido de valor.</li>
          <li>Si tienes ambos pero tu tráfico orgánico es bajo: <strong>Prioridad 1 es la estrategia SEO + GEO</strong> para capturar demanda antes de que la competencia lo haga.</li>
        </ul>
        <p>El mercado digital colombiano sigue teniendo una ventana de oportunidad que los mercados más maduros ya cerraron: hay menos competencia por los mejores espacios, los costos de adquisición aún son relativamente bajos, y el consumidor digital colombiano está en plena fase de adopción. Las marcas que construyan su presencia sólida ahora tendrán una ventaja compuesta difícil de alcanzar en 2 o 3 años.</p>
      </>
    ),
    faqs: [
      {
        question: '¿TikTok es realmente efectivo para vender en Colombia?',
        answer: 'Sí, especialmente para productos de consumo masivo, belleza, moda, hogar y entretenimiento con precio bajo-medio (bajo $300.000 COP). Para servicios B2B o productos de alto ticket, TikTok funciona mejor como canal de awareness y construcción de confianza que de conversión directa. El contenido educativo y el "behind the scenes" del negocio tienen alto engagement en el mercado colombiano específicamente.',
      },
      {
        question: '¿Cuánto invierte en marketing digital una empresa colombiana típica?',
        answer: 'Según datos de la ANDI 2025, las PYMEs colombianas con presencia digital destinan entre el 5% y el 12% de sus ingresos a marketing digital. Para empresas de servicios B2B, el rango típico es 8–15%. El benchmarking internacional (HubSpot State of Marketing) sugiere que las empresas en crecimiento acelerado invierten entre el 15% y el 20%. El número correcto depende de tu objetivo de crecimiento, no de un promedio de industria.',
      },
      {
        question: '¿Cuál es la plataforma de e-commerce más usada en Colombia?',
        answer: 'En el mercado colombiano, los marketplaces dominan el volumen de transacciones: Mercado Libre lidera con más del 40% del e-commerce, seguido de Rappi (principalmente delivery y quick commerce), Falabella.com y Éxito.com. Para tiendas propias, WordPress + WooCommerce tiene la mayor base instalada en PYMEs, mientras que Shopify crece rápidamente en marcas con ambición de escalar. La elección depende del volumen esperado, capacidad técnica y si el objetivo es construir audiencia propia o aprovechar tráfico del marketplace.',
      },
    ],
  },
]
