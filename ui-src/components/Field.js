export const Field = ({ label, children, hint }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ fontSize: 10, fontWeight: 600, color: "var(--text3)", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>{label}</label>
    {children}
    {hint && <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{hint}</p>}
  </div>
);
