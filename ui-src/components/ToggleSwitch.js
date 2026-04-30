export const ToggleSwitch = ({ value, onChange }) => (
  <button onClick={() => onChange(!value)}
    style={{ background: value ? "var(--accent)" : "var(--bg3)", border: "none", borderRadius: 20,
      width: 36, height: 20, cursor: "pointer", position: "relative", flexShrink: 0,
      transition: "background 0.2s", marginLeft: 16 }}>
    <span style={{ position: "absolute", top: 2, left: value ? 18 : 2, width: 16, height: 16,
      background: "#fff", borderRadius: "50%", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
  </button>
);
