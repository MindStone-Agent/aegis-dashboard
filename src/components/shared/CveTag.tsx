interface CveTagProps {
  cve: string
}

export function CveTag({ cve }: CveTagProps) {
  return (
    <a
      href={`https://nvd.nist.gov/vuln/detail/${cve}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block text-xs font-mono px-1.5 py-0.5 bg-gray-700/50 text-cyan-300 border border-gray-600/50 hover:bg-cyan-900/30 hover:border-cyan-500/40 transition-colors"
    >
      {cve}
    </a>
  )
}
