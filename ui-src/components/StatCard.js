export const StatCard = ({ label, value, color }) => (
  <div style={{ background: "var(--bg2)", borderRadius: "var(--radius-md)", padding: "12px 14px", flex: 1 }}>
    <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text3)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6 }}>{label}</p>
    <p style={{ fontSize: 22, fontWeight: 600, color: color || "var(--text1)" }}>{value}</p>
  </div>
);
