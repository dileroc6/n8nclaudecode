// blog.jsx — Blog index page

const POSTS = [
  { cat: 'asistentes', read: 6, img: 'wavy-pattern.jpg', title: 'Por qué tu chat automático suena a robot (y cómo arreglarlo)', excerpt: '9 de cada 10 asistentes virtuales fallan en la primera frase. No es la tecnología: es lo que le enseñaste a decir.', date: '03 may 2026', featured: true },
  { cat: 'automatización', read: 4, img: 'tech-network.jpg', title: 'El test de los 30 segundos: ¿este proceso debería existir?', excerpt: 'Antes de automatizar algo, conviene preguntarse si vale la pena. Tres preguntas que eliminan el 40% del trabajo manual.', date: '28 abr 2026' },
  { cat: 'estrategia', read: 7, img: 'futuristic-3.jpg', title: 'El nuevo mínimo: por qué automatizar dejó de ser opcional', excerpt: 'Lo que antes era una ventaja extra hoy es lo básico para no quedarse atrás.', date: '21 abr 2026' },
  { cat: 'caso real', tag: 'caso · ferretería', read: 5, img: 'urban-people.jpg', title: 'De 40 horas de seguimiento manual a cero, en una semana', excerpt: 'Cómo una ferretería con dos sedes dejó de facturar a mano sin cambiar de herramientas.', date: '14 abr 2026' },
  { cat: 'asistentes', read: 8, img: 'cyborg-statue.jpg', title: 'El momento en que el asistente debe callarse y pasarte la conversación', excerpt: 'El detalle que separa un asistente útil de uno que espanta clientes: saber cuándo dejar de responder.', date: '07 abr 2026' },
  { cat: 'automatización', read: 6, img: 'twin-avatar.jpg', title: 'Tu sistema de clientes miente. La verdad está en la conversación.', excerpt: 'Por qué lo que está escrito en tu CRM casi nunca refleja lo que el cliente realmente dijo, y cómo arreglarlo.', date: '30 mar 2026' },
  { cat: 'estrategia', read: 5, img: 'portrait-light.jpg', title: 'Cuándo NO automatizar (y cómo darte cuenta a tiempo)', excerpt: 'Cuatro señales claras de que un proceso aún no está listo para que lo haga una máquina.', date: '22 mar 2026' },
  { cat: 'caso real', tag: 'caso · retail', read: 4, img: 'futuristic-1.jpg', title: 'El cliente que creyó que habíamos contratado más vendedores', excerpt: 'Un comercio triplicó sus respuestas sin contratar a nadie más. Esto es lo que hizo la diferencia.', date: '15 mar 2026' },
  { cat: 'asistentes', read: 9, img: 'futuristic-7.jpg', title: 'El tono no es un adorno: es la base de todo', excerpt: 'Cómo le enseñamos a un asistente a hablar como tu marca, sin caer en el clásico "Hola, espero te encuentres muy bien".', date: '08 mar 2026' },
];

function BlogHero({ filter, setFilter }) {
  const cats = ['todo', 'asistentes', 'automatización', 'estrategia', 'caso real'];
  return (
    <section className="hero hero-inner section-dark">
      <div className="bp-grid" style={{ opacity: .5 }}></div>
      <div className="glow" style={{ left: '-200px', top: '-140px', opacity: .35 }}></div>
      <div className="container hero-inner-content">
        <div className="eyebrow" data-reveal>blog</div>
        <h1 data-reveal data-reveal-delay="1">
          Notas sobre cómo trabajar con<br/>
          <em>menos esfuerzo y mejores resultados.</em>
        </h1>
        <p className="hero-sub" data-reveal data-reveal-delay="2" style={{ maxWidth: '60ch', marginTop: 28 }}>
          Lo que aprendemos ayudando a empresas a atender mejor, vender más y dejar de hacer tareas a mano. <span className="hl">Sin humo, sin palabras de moda, sin paja.</span>
        </p>
        <div className="blog-filters" data-reveal data-reveal-delay="3">
          {cats.map((c) => (
            <button
              key={c}
              type="button"
              className={`blog-filter ${filter === c ? 'is-active' : ''}`}
              onClick={() => setFilter(c)}
            >
              {c === 'todo' ? 'todo' : c}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function PostCard({ post, featured }) {
  return (
    <a href={$('blog-post.html')} className={`post-card ${featured ? 'is-featured' : ''}`}>
      <div className="post-image" aria-hidden="true">
        {post.img
          ? <img className="post-image-photo" src={$('assets/img/' + post.img)} alt="" loading="lazy" />
          : <><div className="post-image-grid"></div><div className="post-image-glow"></div></>}
        <div className="post-image-tint"></div>
        <span className="post-image-cat">{post.tag || post.cat}</span>
      </div>
      <div className="post-body">
        <div className="post-meta">
          <span className="post-read">// {post.read} min</span>
          <span className="post-cat">{post.tag || post.cat}</span>
        </div>
        <h3 className="post-title">{post.title}</h3>
        <p className="post-excerpt">{post.excerpt}</p>
        <div className="post-foot">
          <span className="post-date">{post.date}</span>
          <span className="post-arrow">→</span>
        </div>
      </div>
    </a>
  );
}

function PostGrid({ filter }) {
  const filtered = filter === 'todo'
    ? POSTS
    : POSTS.filter((p) => p.cat === filter);
  const featured = filtered.find((p) => p.featured) || filtered[0];
  const rest = filtered.filter((p) => p !== featured);

  return (
    <section className="section section-light">
      <div className="container">
        {featured && (
          <div className="post-featured-wrap" data-reveal>
            <PostCard post={featured} featured />
          </div>
        )}
        <div className="post-grid">
          {rest.map((p, i) => (
            <div key={i} data-reveal data-reveal-delay={(i % 3) + 1}>
              <PostCard post={p} />
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--mute)', fontFamily: 'var(--mono)' }}>
            // sin posts en esta categoría todavía
          </div>
        )}
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

function BlogApp() {
  const [filter, setFilter] = React.useState('todo');

  React.useEffect(() => {
    applyDefaultTokens();
    const id = requestAnimationFrame(() => initRevealObserver());
    return () => cancelAnimationFrame(id);
  }, [filter]);

  return (
    <div>
      <Nav active="blog" />
      <BlogHero filter={filter} setFilter={setFilter} />
      <PostGrid filter={filter} />
      <NewsletterCTA />
      <Footer />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<BlogApp />);
