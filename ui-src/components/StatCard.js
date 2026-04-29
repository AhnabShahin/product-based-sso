import { Icon, Icons } from "./Icon";

export const StatCard = ({ label, value, icon, accent }) => (
  <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)",
    padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <span style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500 }}>{label}</span>
      <span style={{ color: accent || "var(--color-text-secondary)" }}>
        <Icon d={Icons[icon]} size={14} color={accent || "var(--color-text-secondary)"} />
      </span>
    </div>
    <span style={{ fontSize: 26, fontWeight: 500, color: "var(--color-text-primary)" }}>{value}</span>
  </div>
);
