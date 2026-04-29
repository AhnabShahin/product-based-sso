export const Btn = ({ children, onClick, variant = "default", size = "md", disabled, loading }) => {
  const base = { cursor: disabled || loading ? "not-allowed" : "pointer", display: "inline-flex",
    alignItems: "center", gap: 6, fontFamily: "inherit", fontWeight: 500, borderRadius: "var(--border-radius-md)",
    transition: "all 0.15s", opacity: disabled ? 0.5 : 1, whiteSpace: "nowrap" };
  const sizes = { sm: { fontSize: 12, padding: "5px 10px" }, md: { fontSize: 13, padding: "7px 14px" }, lg: { fontSize: 14, padding: "9px 18px" } };
  const variants = {
    default: { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", color: "var(--color-text-primary)" },
    primary: { background: "var(--color-text-primary)", border: "0.5px solid var(--color-text-primary)", color: "var(--color-background-primary)" },
    danger:  { background: "#fce8e8", border: "0.5px solid #fca5a5", color: "#b91c1c" },
    ghost:   { background: "transparent", border: "0.5px solid transparent", color: "var(--color-text-secondary)" },
  };
  return (
    <button onClick={disabled || loading ? undefined : onClick}
      style={{ ...base, ...sizes[size], ...variants[variant] }}>
      {loading ? <span style={{ width: 12, height: 12, border: "1.5px solid currentColor",
        borderTopColor: "transparent", borderRadius: "50%", display: "inline-block",
        animation: "spin 0.6s linear infinite" }} /> : null}
      {children}
    </button>
  );
};
