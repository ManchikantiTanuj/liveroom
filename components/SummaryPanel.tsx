'use client'

interface SummaryPanelProps {
  summary: string
}

export default function SummaryPanel({ summary }: SummaryPanelProps) {
  let parsed: { summary: string; keyPoints: string[]; actionItems: string[] } | null = null

  try {
    parsed = JSON.parse(summary)
  } catch {
    // If not JSON, show raw
  }

  return (
    <div className="border border-zinc-800 rounded-xl p-4 mb-4 bg-zinc-950">
      <div className="flex items-center gap-2 mb-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        <span className="text-xs font-mono text-green-400">AI Summary</span>
      </div>

      {parsed ? (
        <div className="space-y-3">
          <p className="text-zinc-300 text-sm leading-relaxed">{parsed.summary}</p>

          {parsed.keyPoints?.length > 0 && (
            <div>
              <p className="text-[10px] font-mono text-zinc-600 mb-1.5 uppercase tracking-wider">Key points</p>
              <ul className="space-y-1">
                {parsed.keyPoints.map((point, i) => (
                  <li key={i} className="text-zinc-400 text-sm flex gap-2">
                    <span className="text-green-400 mt-0.5">·</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsed.actionItems?.length > 0 && (
            <div>
              <p className="text-[10px] font-mono text-zinc-600 mb-1.5 uppercase tracking-wider">Action items</p>
              <ul className="space-y-1">
                {parsed.actionItems.map((item, i) => (
                  <li key={i} className="text-zinc-400 text-sm flex gap-2">
                    <span className="text-amber-400 mt-0.5">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p className="text-zinc-300 text-sm leading-relaxed">{summary}</p>
      )}
    </div>
  )
}
