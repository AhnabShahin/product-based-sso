export const Btn = ({ children, onClick, variant = "default", size = "md", disabled, loading }) => {
  const variants = {
    default: { background: "var(--bg0)", border: "1px solid var(--border2)", color: "var(--text2)" },
    primary: { background: "var(--accent)", border: "1px solid var(--accent)", color: "#fff" },
    danger:  { background: "var(--danger-bg)", border: "1px solid var(--danger)", color: "var(--danger)" },
  };
  const sizes = { sm: { fontSize: 11, padding: "5px 10px" }, md: { fontSize: 12, padding: "7px 13px" }, lg: { fontSize: 13, padding: "9px 18px" } };
  return (
    <button onClick={disabled || loading ? undefined : onClick}
      style={{ cursor: disabled || loading ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center",
        gap: 5, fontFamily: "inherit", fontWeight: 500, borderRadius: "var(--radius-md)", transition: "all 0.12s",
        opacity: disabled ? 0.5 : 1, whiteSpace: "nowrap", ...variants[variant], ...sizes[size] }}>
      {loading && <span style={{ width: 11, height: 11, border: "1.5px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />}
      {children}
    </button>
  );
};
