interface Props {
  summary: string | null
  loading: boolean
}

export default function AiSummary({ summary, loading }: Props) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <h3 className="text-sm font-medium text-text-muted mb-2">AI Weekly Summary</h3>
      {loading ? (
        <div className="flex items-center gap-2 text-text-muted text-sm py-2">
          <span className="animate-pulse">Generating insights...</span>
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-text">{summary}</p>
      )}
    </div>
  )
}
