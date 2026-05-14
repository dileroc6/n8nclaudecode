import { Navigate, useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { ArrowLeft, Clock, ArrowRight } from 'lucide-react'
import Seo from '../components/Seo'
import SchemaMarkup from '../components/SchemaMarkup'
import Breadcrumbs from '../components/Breadcrumbs'
import Accordion from '../components/Accordion'
import { BLOG_POSTS } from '../data/blog'

const TEXT  = '#09090b'
const NAVY  = '#1B3A6B'
const BLUE  = '#2563EB'
const MUTED = '#71717A'

const BASE_URL = 'https://insighta.com.co'

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const post      = BLOG_POSTS.find(p => p.slug === slug)
  const related   = BLOG_POSTS.filter(p => p.slug !== slug).slice(0, 3)

  if (!post) return <Navigate to="/blog" replace />

  const crumbs = [
    { label: 'Inicio',  href: '/' },
    { label: 'Blog',    href: '/blog' },
    { label: post.title, href: `/blog/${post.slug}` },
  ]

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDesc,
    image: `${BASE_URL}${post.image}`,
    datePublished: post.date,
    author: { '@type': 'Organization', name: 'InsightA', url: BASE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'InsightA',
      url: BASE_URL,
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/favicon.svg` },
    },
  }

  const faqSchema = post.faqs.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: post.faqs.map(f => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }
    : null

  const schemas = faqSchema ? [articleSchema, faqSchema] : [articleSchema]

  return (
    <>
      <Seo title={post.metaTitle} description={post.metaDesc} />
      <SchemaMarkup schema={schemas} />

      <div className="bg-white pt-24 md:pt-28">
        <Breadcrumbs crumbs={crumbs} />

        {/* ── Hero image ── */}
        <div className="max-w-7xl mx-auto px-4 md:px-12 pt-6 pb-8">
          <div className="rounded-2xl overflow-hidden" style={{ maxHeight: 460 }}>
            <img
              src={post.image}
              alt={post.imageAlt}
              className="w-full h-full object-cover"
              style={{ maxHeight: 460 }}
              loading="eager"
              decoding="async"
            />
          </div>
        </div>

        {/* ── Article layout ── */}
        <div className="max-w-7xl mx-auto px-4 md:px-12 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 items-start">

            {/* ── Main article ── */}
            <article>
              {/* Header */}
              <header className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                  <span
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${post.tagAccent}15`, color: post.tagAccent }}
                  >
                    {post.tag}
                  </span>
                  <span className="text-[11px]" style={{ color: MUTED }}>{post.date}</span>
                  <span className="text-[11px] flex items-center gap-1" style={{ color: MUTED }}>
                    <Clock size={10} />
                    {post.readTime} lectura
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-[2.625rem] font-bold leading-[1.1] tracking-tight mb-5" style={{ color: TEXT }}>
                  {post.title}
                </h1>

                <p className="text-base leading-relaxed" style={{ color: MUTED }}>
                  {post.excerpt}
                </p>

                {/* Divider */}
                <div className="mt-8 h-px" style={{ backgroundColor: '#E4E4E7' }} />
              </header>

              {/* Body */}
              <div className="blog-article">
                {post.content}
              </div>

              {/* FAQ */}
              {post.faqs.length > 0 && (
                <section aria-labelledby="faq-heading" className="mt-14">
                  <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: BLUE }}>
                    FAQ
                  </p>
                  <h2 id="faq-heading" className="text-2xl font-bold mb-6" style={{ color: TEXT }}>
                    Preguntas Frecuentes
                  </h2>
                  <Accordion items={post.faqs} />
                </section>
              )}

              {/* Back to blog */}
              <div className="mt-14 pt-8" style={{ borderTop: '1px solid #E4E4E7' }}>
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 text-sm font-semibold group"
                  style={{ color: NAVY }}
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                  Volver al Blog
                </Link>
              </div>
            </article>

            {/* ── Sidebar ── */}
            <aside className="space-y-8 lg:sticky lg:top-28">
              {/* CTA box */}
              <div className="rounded-2xl p-6" style={{ backgroundColor: NAVY }}>
                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-3 text-white/50">
                  ¿Listo para aplicarlo?
                </p>
                <p className="text-base font-bold text-white leading-snug mb-4">
                  Agenda una sesión de estrategia gratuita con nuestro equipo.
                </p>
                <Link
                  to="/contacto"
                  className="group inline-flex items-center gap-2 rounded-full pl-5 pr-2 py-2 bg-white transition-all"
                >
                  <span className="text-xs font-semibold" style={{ color: NAVY }}>Agenda ahora</span>
                  <span
                    className="rounded-full w-8 h-8 flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: NAVY }}
                  >
                    <ArrowRight size={12} className="text-white" />
                  </span>
                </Link>
              </div>

              {/* Related posts */}
              {related.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: MUTED }}>
                    También te puede interesar
                  </p>
                  <div className="space-y-4">
                    {related.map(r => (
                      <Link
                        key={r.slug}
                        to={`/blog/${r.slug}`}
                        className="flex gap-3 group"
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={r.image}
                            alt={r.imageAlt}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div>
                          <span
                            className="text-[9px] font-semibold px-2 py-0.5 rounded-full inline-block mb-1"
                            style={{ backgroundColor: `${r.tagAccent}15`, color: r.tagAccent }}
                          >
                            {r.tag}
                          </span>
                          <p
                            className="text-xs font-semibold leading-snug group-hover:underline"
                            style={{ color: TEXT }}
                          >
                            {r.title}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* All services link */}
              <div className="rounded-xl border p-5" style={{ borderColor: '#E4E4E7' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: TEXT }}>¿Necesitas ayuda con esto?</p>
                <p className="text-xs leading-relaxed mb-3" style={{ color: MUTED }}>
                  Somos expertos en SEO, IA, diseño web y performance marketing para empresas en Colombia.
                </p>
                <Link
                  to="/servicios"
                  className="text-xs font-semibold inline-flex items-center gap-1 group"
                  style={{ color: BLUE }}
                >
                  Ver nuestros servicios
                  <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </aside>

          </div>
        </div>
      </div>
    </>
  )
}
