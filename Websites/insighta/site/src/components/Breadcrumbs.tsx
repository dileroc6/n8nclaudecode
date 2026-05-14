import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import SchemaMarkup from './SchemaMarkup'

export interface Crumb {
  label: string
  href: string
}

const BASE_URL = 'https://insighta.com.co'

export default function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: `${BASE_URL}${c.href}`,
    })),
  }

  return (
    <>
      <SchemaMarkup schema={schema} />
      <nav aria-label="Breadcrumb" className="px-4 md:px-12 pt-6 pb-2 max-w-7xl mx-auto">
        <ol className="flex items-center gap-1.5 flex-wrap">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1
            return (
              <li key={crumb.href} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight size={10} className="text-zinc-300" />}
                {isLast ? (
                  <span className="text-[11px] font-medium text-zinc-700" aria-current="page">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    to={crumb.href}
                    className="text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
