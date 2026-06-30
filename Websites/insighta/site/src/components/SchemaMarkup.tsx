import { useEffect, useRef } from 'react'

export default function SchemaMarkup({ schema }: { schema: object | object[] }) {
  const ref = useRef<object | object[]>(schema)
  useEffect(() => {
    const el = document.createElement('script')
    el.type = 'application/ld+json'
    el.textContent = JSON.stringify(ref.current)
    document.head.appendChild(el)
    return () => { document.head.removeChild(el) }
  }, [])
  return null
}
