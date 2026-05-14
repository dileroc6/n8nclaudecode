import { useEffect } from 'react'

interface SeoProps {
  title: string
  description: string
}

export default function Seo({ title, description }: SeoProps) {
  useEffect(() => {
    document.title = title

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    meta.content = description
  }, [title, description])

  return null
}
