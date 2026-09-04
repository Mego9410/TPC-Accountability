export default function Loading() {
  return (
    <div className="section" aria-busy="true" aria-live="polite">
      <div className="eyebrow">One moment</div>
      <div className="h1" style={{ color: "var(--fg-on-paper-muted)" }}>Fetching the ledger…</div>
    </div>
  );
}
