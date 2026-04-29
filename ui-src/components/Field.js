export const Field = ({ label, children, hint }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)",
      marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
    {children}
    {hint && <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: "4px 0 0" }}>{hint}</p>}
  </div>
);
