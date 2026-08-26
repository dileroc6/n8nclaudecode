// blog-post.jsx — Single blog post page (template)

function ArticleHeader() {
  return (
    <section className="hero hero-inner section-dark article-header">
      <div className="bp-grid" style={{ opacity: .5 }}></div>
      <div className="glow" style={{ right: '-200px', top: '-160px', opacity: .3 }}></div>
      <div className="container hero-inner-content" style={{ maxWidth: 920 }}>
        <a href={$('blog.html')} className="back-link" data-reveal>
          <span>←</span> volver al blog
        </a>
        <div className="article-meta-top" data-reveal data-reveal-delay="1">
          <span className="post-cat">asistentes</span>
          <span className="article-meta-dot">·</span>
          <span className="article-meta-item">// 6 min de lectura</span>
          <span className="article-meta-dot">·</span>
          <span className="article-meta-item">03 may 2026</span>
        </div>
        <h1 data-reveal data-reveal-delay="2">
          Por qué tu chat automático<br/>
          <em>suena a robot</em> (y cómo arreglarlo).
        </h1>
        <p className="hero-sub" data-reveal data-reveal-delay="3" style={{ maxWidth: '64ch', marginTop: 24 }}>
          9 de cada 10 asistentes virtuales fallan en la primera frase. No es la tecnología: <span className="hl">es lo que le enseñaste a decir.</span>
        </p>
        <div className="article-author" data-reveal data-reveal-delay="4">
          <div className="author-avatar">DM</div>
          <div>
            <b>Diego Marín</b>
            <span>// fundador · toqueflow</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ArticleFeaturedImage() {
  return (
    <div className="article-featured">
      <div className="container" style={{ maxWidth: 1080 }}>
        <div className="article-fig" data-reveal>
          <img className="article-fig-photo" src={$('https://pub-0e0fe333e9d349258d55b3986cb8d38b.r2.dev/img/wavy-pattern.jpg')} alt="" />
          <div className="article-fig-tint"></div>
          <span className="article-fig-caption">// fig 01 · el tono empieza en la primera línea</span>
        </div>
      </div>
    </div>
  );
}

function ArticleBody() {
  return (
    <article className="article-body">
      <div className="container" style={{ maxWidth: 760 }}>

        <p className="article-lede">
          La primera frase del asistente decide si el cliente sigue leyendo o cierra la ventana. Y casi todos los chats automáticos que vemos arrancan igual.
        </p>

        <p>
          <em>"Hola, espero te encuentres muy bien. Mi nombre es Asistente Virtual y estoy aquí para ayudarte."</em> Esa frase suena bien escrita. El problema es que <span className="hl">nadie habla así en WhatsApp.</span> Ni tu mejor vendedor, ni tu peor vendedor, ni tú. Solo un robot.
        </p>

        <p>
          El cliente lo nota antes de leer la segunda frase. Y a partir de ahí, todo lo que diga el asistente —por bien programado que esté— lo va a leer con sospecha.
        </p>

        <h2 className="article-h2">El primer error: la formalidad de manual</h2>

        <p>
          Cuando un equipo arma un asistente virtual, instintivamente lo viste con corbata. Lo entrenan con frases &quot;profesionales&quot;: pronombres formales, presentaciones largas, oraciones largas. Quieren que sea respetuoso.
        </p>

        <p>
          Pero tus clientes no quieren respeto. Quieren respuestas. Y la formalidad mal ejecutada se siente como <span className="hl">distancia</span>, no como cortesía.
        </p>

        <aside className="article-callout">
          <span className="callout-tag">// regla 01</span>
          <p>Si tu mejor vendedor no escribiría esa frase, tu asistente tampoco debería.</p>
        </aside>

        <h2 className="article-h2">El segundo error: explicarse demasiado</h2>

        <p>
          Otro patrón típico: <em>&quot;Para poderte ayudar mejor, necesito que me indiques tu nombre completo, número de cédula, ciudad de residencia y el motivo de tu consulta.&quot;</em> El cliente vino a preguntar por un precio. No vino a llenar un formulario.
        </p>

        <p>
          Un buen vendedor humano nunca arranca pidiendo datos. Arranca respondiendo lo que el cliente preguntó. <span className="hl">El dato lo pide cuando ya hay conversación.</span>
        </p>

        <h2 className="article-h2">El tercer error: nunca callarse</h2>

        <p>
          Los asistentes mal entrenados intentan resolver todo. Si el cliente pregunta algo difícil, inventan. Si la conversación se complica, insisten. Si el cliente dice <em>&quot;quiero hablar con alguien&quot;</em>, lo intentan retener cinco mensajes más.
        </p>

        <p>
          Eso es lo que más espanta. Un asistente bueno sabe cuándo callarse y pasarle la conversación a una persona. Y lo hace sin disculparse cinco veces.
        </p>

        <div className="article-pullquote">
          <p>El asistente que más vende es el que reconoce cuándo no es él quien debe vender.</p>
        </div>

        <h2 className="article-h2">Cómo arreglarlo: tres movimientos</h2>

        <ol className="article-ol">
          <li>
            <b>Pasa tres días leyendo WhatsApps reales de tu equipo.</b> Anota cómo arrancan. Las palabras que usan. Las que nunca usan. Esa es la materia prima del tono.
          </li>
          <li>
            <b>Bórrale al asistente cualquier frase &quot;de catálogo&quot;.</b> Especialmente las que empiezan con &quot;Espero te encuentres&quot;, &quot;Es un gusto saludarte&quot; o &quot;Para nosotros es muy importante&quot;.
          </li>
          <li>
            <b>Define explícitamente cuándo debe pasarle la conversación a un humano.</b> No es solo cuando no sabe responder. Es cuando el cliente está cerca de comprar.
          </li>
        </ol>

        <h2 className="article-h2">El test final</h2>

        <p>
          Lee la primera respuesta de tu asistente en voz alta. Si suena a un mensaje que tú le mandarías a un amigo que te pregunta lo mismo, vas bien. Si suena a una circular del banco, hay que volver al primer paso.
        </p>

        <p>
          La tecnología no es el cuello de botella. <span className="hl">El cuello de botella es cómo le enseñamos a hablar.</span>
        </p>

        <div className="article-foot">
          <div className="article-tags">
            <span className="article-tag">asistentes</span>
            <span className="article-tag">tono de marca</span>
            <span className="article-tag">whatsapp</span>
          </div>
          <div className="article-share">
            <span className="article-share-label">// compartir</span>
            <a href="#" aria-label="LinkedIn">LinkedIn</a>
            <a href="#" aria-label="X">X</a>
            <a href="#" aria-label="Copiar enlace">Copiar enlace</a>
          </div>
        </div>
      </div>
    </article>
  );
}

function RelatedPosts() {
  const related = [
    { cat: 'asistentes', img: 'cyborg-statue.jpg', read: 8, title: 'El momento en que el asistente debe callarse y pasarte la conversación', excerpt: 'El detalle que separa un asistente útil de uno que espanta clientes: saber cuándo dejar de responder.', date: '07 abr 2026' },
    { cat: 'asistentes', img: 'futuristic-7.jpg', read: 9, title: 'El tono no es un adorno: es la base de todo', excerpt: 'Cómo le enseñamos a un asistente a hablar como tu marca, sin caer en el clásico saludo de circular.', date: '08 mar 2026' },
    { cat: 'estrategia', img: 'futuristic-3.jpg', read: 7, title: 'El nuevo mínimo: por qué automatizar dejó de ser opcional', excerpt: 'Lo que antes era una ventaja extra hoy es lo básico para no quedarse atrás.', date: '21 abr 2026' },
  ];
  return (
    <section className="section section-light">
      <div className="container">
        <div className="shead" style={{ marginBottom: 40 }}>
          <div className="eyebrow" data-reveal>sigue leyendo</div>
          <h2 data-reveal data-reveal-delay="1">
            Notas que se parecen a esta.
          </h2>
        </div>
        <div className="post-grid">
          {related.map((p, i) => (
            <div key={i} data-reveal data-reveal-delay={(i % 3) + 1}>
              <a href={$('blog-post.html')} className="post-card">
                <div className="post-image" aria-hidden="true">
                  <img className="post-image-photo" src={$('https://pub-0e0fe333e9d349258d55b3986cb8d38b.r2.dev/img/' + p.img)} alt="" loading="lazy" />
                  <div className="post-image-tint"></div>
                  <span className="post-image-cat">{p.cat}</span>
                </div>
                <div className="post-body">
                  <div className="post-meta">
                    <span className="post-read">// {p.read} min</span>
                    <span className="post-cat">{p.cat}</span>
                  </div>
                  <h3 className="post-title">{p.title}</h3>
                  <p className="post-excerpt">{p.excerpt}</p>
                  <div className="post-foot">
                    <span className="post-date">{p.date}</span>
                    <span className="post-arrow">→</span>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NewsletterCTA() {
  return (
    <section className="section section-dark" style={{ paddingTop: 90, paddingBottom: 90, overflow: 'hidden' }}>
      <div className="bp-grid" style={{ opacity: .4 }}></div>
      <div className="glow" style={{ right: '-200px', top: '-150px', opacity: .35 }}></div>
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div className="newsletter-grid">
          <div data-reveal>
            <div className="eyebrow">la lista</div>
            <h2 style={{ marginTop: 12 }}>
              Una nota cada dos semanas.<br/>
              <span className="hl">Cero ruido.</span>
            </h2>
            <p style={{ marginTop: 20, maxWidth: '50ch' }}>
              Las mejores ideas que vamos aprendiendo, aterrizadas en algo que puedes aplicar el mismo lunes. Si no aporta, te bajas.
            </p>
          </div>
          <form className="newsletter-form" data-reveal data-reveal-delay="1" onSubmit={(e) => e.preventDefault()}>
            <div className="form-field">
              <label>tu correo</label>
              <input type="email" placeholder="ana@empresa.com" />
            </div>
            <button type="submit" className="btn btn-primary">Suscribirme <span className="arrow">→</span></button>
            <span className="form-hint" style={{ marginTop: 4 }}>// 1 correo cada 14 días · 0 spam · cancelas con un clic</span>
          </form>
        </div>
      </div>
    </section>
  );
}

function PostApp() {
  React.useEffect(() => {
    applyDefaultTokens();
    const id = requestAnimationFrame(() => initRevealObserver());
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div>
      <Nav active="blog" />
      <ArticleHeader />
      <ArticleFeaturedImage />
      <ArticleBody />
      <RelatedPosts />
      <NewsletterCTA />
      <Footer />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PostApp />);
