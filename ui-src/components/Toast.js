import { useEffect } from "@wordpress/element";
import { Icon, Icons } from "./Icon";

export const Toast = ({ msg, type, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3200);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const colors = { success: "#1a7a3a", error: "#b91c1c", info: "#1e40af" };

  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", alignItems: "center",
      gap: 10, background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)",
      borderLeft: `3px solid ${colors[type] || colors.info}`, borderRadius: "var(--border-radius-md)",
      padding: "12px 16px", boxShadow: "none", maxWidth: 320, fontSize: 13 }}>
      <span style={{ color: colors[type] || colors.info }}>
        <Icon d={type === "success" ? Icons.check : type === "error" ? Icons.x : Icons.alert} size={14} />
      </span>
      <span style={{ color: "var(--color-text-primary)" }}>{msg}</span>
      <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer",
        color: "var(--color-text-secondary)", padding: 0, lineHeight: 1, marginLeft: "auto" }}>
        <Icon d={Icons.x} size={12} />
      </button>
    </div>
  );
};
