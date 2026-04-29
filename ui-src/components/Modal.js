import { Icon, Icons } from "./Icon";

export const Modal = ({ title, children, onClose, width = 520 }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
    <div style={{ background: "var(--color-background-primary)", borderRadius: "var(--border-radius-lg)",
      border: "0.5px solid var(--color-border-secondary)", width: "100%", maxWidth: width,
      maxHeight: "90vh", overflow: "auto" }}>
      <div style={{ padding: "20px 24px", borderBottom: "0.5px solid var(--color-border-tertiary)",
        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>{title}</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer",
          color: "var(--color-text-secondary)", padding: 4 }}>
          <Icon d={Icons.x} size={16} />
        </button>
      </div>
      <div style={{ padding: "20px 24px" }}>{children}</div>
    </div>
  </div>
);
