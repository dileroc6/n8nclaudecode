interface Badge {
  label: string
  accent?: string
}

export default function TrustBadges({
  badges,
  label = 'Tecnologías y plataformas que integramos',
}: {
  badges: Badge[]
  label?: string
}) {
  return (
    <div className="px-4 md:px-12 pb-10 pt-2 max-w-7xl mx-auto">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">{label}</p>
      <div className="flex flex-wrap gap-2">
        {badges.map((b) => (
          <span
            key={b.label}
            className="inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full border"
            style={{
              backgroundColor: b.accent ? `${b.accent}12` : '#F4F4F5',
              borderColor: b.accent ? `${b.accent}30` : '#E4E4E7',
              color: b.accent ?? '#52525B',
            }}
          >
            {b.label}
          </span>
        ))}
      </div>
    </div>
  )
}
