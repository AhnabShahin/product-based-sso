import { useEffect } from "@wordpress/element";
import { Ico, I } from "./Icon";

export const Toast = ({ msg, type, onDismiss }) => {
  useEffect(() => { const t = setTimeout(onDismiss, 2800); return () => clearTimeout(t); }, [onDismiss]);
  const c = { success: "var(--success)", error: "var(--danger)", info: "var(--accent)" }[type] || "var(--accent)";
  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, display: "flex", alignItems: "center",
      gap: 8, background: "var(--bg0)", border: "1px solid var(--border2)", borderLeft: `3px solid ${c}`,
      borderRadius: "var(--radius-md)", padding: "10px 14px", maxWidth: 280, fontSize: 12,
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
      <span style={{ color: c }}><Ico d={type === "success" ? I.check : I.x} size={13} /></span>
      <span style={{ color: "var(--text1)" }}>{msg}</span>
      <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 0, marginLeft: "auto" }}>
        <Ico d={I.x} size={11} />
      </button>
    </div>
  );
};
