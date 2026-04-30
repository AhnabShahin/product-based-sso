import { Ico, I } from "./Icon";

export const Modal = ({ title, children, onClose, width = 500 }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
    <div style={{ background: "var(--bg0)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border2)", width: "100%", maxWidth: width, maxHeight: "90vh", overflow: "auto" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text1)" }}>{title}</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 4 }}><Ico d={I.x} size={15} /></button>
      </div>
      <div style={{ padding: "18px 20px" }}>{children}</div>
    </div>
  </div>
);
