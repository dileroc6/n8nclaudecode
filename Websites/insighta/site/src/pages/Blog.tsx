import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BLOG_POSTS } from '../data/blog'
import ServiceHero from '../components/ServiceHero'

const TEXT  = '#09090b'
const NAVY  = '#1B3A6B'
const MUTED = '#71717A'

const CRUMBS = [
  { label: 'Inicio', href: '/' },
  { label: 'Blog',   href: '/blog' },
]

export default function Blog() {
  const featured = BLOG_POSTS[0]
  const rest     = BLOG_POSTS.slice(1)

  return (
    <div className="bg-white">

      <ServiceHero
        title="Blog"
        subtitle="Ideas que hacen crecer marcas."
        breadcrumbs={CRUMBS}
      />

      {/* Posts grid */}
      <section className="px-4 md:px-12 pb-24 max-w-7xl mx-auto">

        {/* Featured post */}
        <Link
          to={`/blog/${featured.slug}`}
          className="group block rounded-2xl border overflow-hidden mb-6 hover:shadow-lg transition-shadow"
          style={{ borderColor: '#E4E4E7' }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="overflow-hidden" style={{ minHeight: 240 }}>
              <img
                src={featured.image}
                alt={featured.imageAlt}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                style={{ minHeight: 240 }}
                loading="eager"
              />
            </div>
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: `${featured.tagAccent}15`, color: featured.tagAccent }}
                >
                  {featured.tag}
                </span>
                <span className="text-[10px]" style={{ color: MUTED }}>{featured.date}</span>
                <span className="text-[10px]" style={{ color: MUTED }}>· {featured.readTime} lectura</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-3 leading-snug" style={{ color: TEXT }}>
                {featured.title}
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: MUTED }}>
                {featured.excerpt}
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-semibold group/link" style={{ color: NAVY }}>
                Leer artículo
                <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        </Link>

        {/* Grid posts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rest.map(p => (
            <Link
              key={p.slug}
              to={`/blog/${p.slug}`}
              className="group rounded-2xl border overflow-hidden flex flex-col hover:shadow-md transition-shadow"
              style={{ borderColor: '#E4E4E7' }}
            >
              <div className="overflow-hidden aspect-video">
                <img
                  src={p.image}
                  alt={p.imageAlt}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${p.tagAccent}15`, color: p.tagAccent }}
                  >
                    {p.tag}
                  </span>
                  <span className="text-[10px]" style={{ color: MUTED }}>{p.date}</span>
                </div>
                <h3 className="font-bold text-sm leading-snug mb-2 flex-1" style={{ color: TEXT }}>
                  {p.title}
                </h3>
                <p className="text-xs leading-relaxed mb-4" style={{ color: MUTED }}>
                  {p.excerpt}
                </p>
                <span className="text-xs font-semibold inline-flex items-center gap-1 group/link" style={{ color: NAVY }}>
                  Leer <ArrowRight size={11} className="group-hover/link:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  )
}
