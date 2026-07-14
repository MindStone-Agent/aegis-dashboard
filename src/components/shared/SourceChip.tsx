interface SourceChipProps {
  source: string
}

const SOURCE_COLORS: Record<string, string> = {
  'CISA':      'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Dragos':    'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'CloudSEK':  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'NVD':       'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'E-ISAC':    'bg-green-500/20 text-green-400 border-green-500/30',
  'WaterISAC': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  'ICS-ISAC':  'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
}

export function SourceChip({ source }: SourceChipProps) {
  const colors = SOURCE_COLORS[source] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  return (
    <span className={`inline-block text-xs font-mono px-1.5 py-0.5 border ${colors}`}>
      {source}
    </span>
  )
}
