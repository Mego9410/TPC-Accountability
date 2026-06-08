export function AppFooter() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--rule-on-paper)",
        padding: "28px 48px",
        color: "var(--fg-on-paper-muted)",
        font: "500 10px/1.6 var(--font-sans)",
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <span>The Principals Club · Est. MMXXVI</span>
      <span style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <span>House Rules</span>
        <span>Privacy</span>
        <span>The Concierge</span>
      </span>
    </footer>
  );
}
