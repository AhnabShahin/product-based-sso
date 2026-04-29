import { useState, useEffect, useCallback } from "react";

const API_BASE = "/wp-json/product-sso/v1";

// ─── Icons (SVG paths) ────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const Icons = {
  dashboard: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  products:  "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
  key:       "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  logs:      "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  settings:  "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z",
  plus:      "M12 5v14 M5 12h14",
  edit:      "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:     "M3 6h18 M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2",
  refresh:   "M1 4v6h6 M23 20v-6h-6 M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15",
  copy:      "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2 M16 8h2a2 2 0 012 2v8a2 2 0 01-2 2h-8a2 2 0 01-2-2v-2",
  eye:       "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z",
  eyeOff:    "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24 M1 1l22 22",
  check:     "M20 6L9 17l-5-5",
  x:         "M18 6L6 18 M6 6l12 12",
  shield:    "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  zap:       "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  activity:  "M22 12h-4l-3 9L9 3l-3 9H2",
  globe:     "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M2 12h20 M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
  alert:     "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  link:      "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71 M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
  toggle:    "M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
};

// ─── Shared components ────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const map = {
    success:        { bg: "#e6f4ec", color: "#1a7a3a", label: "Success" },
    failure:        { bg: "#fce8e8", color: "#b91c1c", label: "Failure" },
    invalid_key:    { bg: "#fef3c7", color: "#92400e", label: "Invalid key" },
    device_mismatch:{ bg: "#fce8e8", color: "#b91c1c", label: "Device mismatch" },
    token_expired:  { bg: "#fef3c7", color: "#92400e", label: "Expired" },
    user_not_found: { bg: "#fce8e8", color: "#b91c1c", label: "User not found" },
    active:         { bg: "#e6f4ec", color: "#1a7a3a", label: "Active" },
    inactive:       { bg: "#f3f4f6", color: "#6b7280", label: "Inactive" },
  };
  const s = map[status] || { bg: "#f3f4f6", color: "#6b7280", label: status };
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 600,
      padding: "2px 8px", borderRadius: 20, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
};

const StatCard = ({ label, value, icon, accent }) => (
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

const Toast = ({ msg, type, onDismiss }) => {
  useEffect(() => { const t = setTimeout(onDismiss, 3200); return () => clearTimeout(t); }, [onDismiss]);
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

const Modal = ({ title, children, onClose, width = 520 }) => (
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

const Field = ({ label, children, hint }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)",
      marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
    {children}
    {hint && <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: "4px 0 0" }}>{hint}</p>}
  </div>
);

const Input = ({ value, onChange, placeholder, type = "text", disabled, style = {} }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
    style={{ width: "100%", boxSizing: "border-box", ...style }} />
);

const Btn = ({ children, onClick, variant = "default", size = "md", disabled, loading }) => {
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

// ─── Dashboard page ───────────────────────────────────────────────────────────
const DashboardPage = ({ toast }) => {
  const [site, setSite] = useState({ name: "My WordPress Site", url: "https://mysite.com", webKeySet: true, totalProducts: 3, activeProducts: 2 });
  const [stats, setStats] = useState({ totalAuths: 142, successAuths: 134, failedAuths: 8, avgResponseMs: 240 });
  const [recentLogs, setRecentLogs] = useState([
    { id: 1, event_type: "success", user_email: "alice@example.com", source_product: "Main Site", target_product: "Shop", created_at: "2026-04-29 11:42:10", ip_address: "203.0.113.10" },
    { id: 2, event_type: "failure", user_email: "bob@example.com", source_product: "Blog", target_product: "Main Site", created_at: "2026-04-29 11:40:05", ip_address: "198.51.100.4", error_reason: "token_expired" },
    { id: 3, event_type: "success", user_email: "carol@example.com", source_product: "Shop", target_product: "Blog", created_at: "2026-04-29 11:38:52", ip_address: "203.0.113.22" },
    { id: 4, event_type: "device_mismatch", user_email: "dan@example.com", source_product: "Main Site", target_product: "Shop", created_at: "2026-04-29 11:35:10", ip_address: "192.0.2.88", error_reason: "device_mismatch" },
  ]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 500 }}>Dashboard</h2>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>SSO activity overview for this site</p>
      </div>

      {/* Current site card */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)", padding: "20px 24px", marginBottom: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: "var(--border-radius-md)",
            background: "var(--color-background-info)", display: "flex", alignItems: "center",
            justifyContent: "center", border: "0.5px solid var(--color-border-info)" }}>
            <Icon d={Icons.shield} size={20} color="var(--color-text-info)" />
          </div>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>{site.name}</p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>{site.url}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Badge status={site.webKeySet ? "active" : "inactive"} />
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)", alignSelf: "center" }}>
            {site.activeProducts} active product{site.activeProducts !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="Total auth attempts" value={stats.totalAuths} icon="activity" />
        <StatCard label="Successful logins" value={stats.successAuths} icon="check" accent="#1a7a3a" />
        <StatCard label="Failed attempts" value={stats.failedAuths} icon="alert" accent="#b91c1c" />
        <StatCard label="Avg response time" value={`${stats.avgResponseMs}ms`} icon="zap" />
      </div>

      {/* Recent logs */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "0.5px solid var(--color-border-tertiary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Recent auth attempts</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--color-background-secondary)" }}>
              {["User", "Route", "Status", "IP", "Time"].map(h => (
                <th key={h} style={{ padding: "8px 16px", textAlign: "left", fontSize: 11, fontWeight: 500,
                  color: "var(--color-text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase",
                  borderBottom: "0.5px solid var(--color-border-tertiary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentLogs.map((log, i) => (
              <tr key={log.id} style={{ borderBottom: i < recentLogs.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none" }}>
                <td style={{ padding: "10px 16px", color: "var(--color-text-primary)" }}>{log.user_email}</td>
                <td style={{ padding: "10px 16px", color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                  {log.source_product} → {log.target_product}
                </td>
                <td style={{ padding: "10px 16px" }}><Badge status={log.error_reason || log.event_type} /></td>
                <td style={{ padding: "10px 16px", color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)", fontSize: 11 }}>{log.ip_address}</td>
                <td style={{ padding: "10px 16px", color: "var(--color-text-secondary)", fontSize: 11 }}>{log.created_at.split(" ")[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Products page ─────────────────────────────────────────────────────────────
const ProductsPage = ({ toast }) => {
  const [products, setProducts] = useState([
    { id: 1, name: "Main Site", logo_url: "https://main.example.com/logo.png", page_url: "https://main.example.com/dashboard", web_key: "wk_a1b2c3d4e5f6", is_active: true, created_at: "2026-04-29" },
    { id: 2, name: "Shop Site", logo_url: "https://shop.example.com/logo.png", page_url: "https://shop.example.com/products", web_key: "wk_g7h8i9j0k1l2", is_active: true, created_at: "2026-04-28" },
    { id: 3, name: "Blog", logo_url: "", page_url: "https://blog.example.com/", web_key: "wk_m3n4o5p6q7r8", is_active: false, created_at: "2026-04-27" },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [showKeyId, setShowKeyId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ name: "", logo_url: "", page_url: "", web_key: "", is_active: true });
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setForm({ name: "", logo_url: "", page_url: "", web_key: "", is_active: true }); setEditProduct(null); setShowModal(true); };
  const openEdit = (p) => { setForm({ ...p }); setEditProduct(p.id); setShowModal(true); };

  const save = async () => {
    if (!form.name || !form.page_url || !form.web_key) { toast("Fill in all required fields", "error"); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 700)); // simulate API
    if (editProduct) {
      setProducts(prev => prev.map(p => p.id === editProduct ? { ...p, ...form } : p));
      toast("Product updated", "success");
    } else {
      const newP = { ...form, id: Date.now(), created_at: new Date().toISOString().split("T")[0] };
      setProducts(prev => [...prev, newP]);
      toast("Product added", "success");
    }
    setSaving(false); setShowModal(false);
  };

  const toggleActive = async (id) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p));
    toast("Status updated", "success");
  };

  const confirmDelete = async () => {
    await new Promise(r => setTimeout(r, 400));
    setProducts(prev => prev.filter(p => p.id !== deleteId));
    toast("Product deleted", "success");
    setDeleteId(null);
  };

  const initials = (name) => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["var(--color-background-info)", "var(--color-background-success)", "var(--color-background-warning)"];
  const textColors = ["var(--color-text-info)", "var(--color-text-success)", "var(--color-text-warning)"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 500 }}>Products</h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>Remote sites that users can switch to</p>
        </div>
        <Btn variant="primary" onClick={openAdd}><Icon d={Icons.plus} size={13} /> Add product</Btn>
      </div>

      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)" }}>
        {products.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-secondary)", fontSize: 14 }}>
            No products yet. Add a remote site to get started.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--color-background-secondary)" }}>
                {["Product", "Page URL", "Web key", "Status", "Added", "Actions"].map(h => (
                  <th key={h} style={{ padding: "8px 16px", textAlign: "left", fontSize: 11, fontWeight: 500,
                    color: "var(--color-text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase",
                    borderBottom: "0.5px solid var(--color-border-tertiary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < products.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "var(--border-radius-md)",
                        background: colors[i % 3], display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 600, color: textColors[i % 3], flexShrink: 0 }}>
                        {initials(p.name)}
                      </div>
                      <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <a href={p.page_url} style={{ color: "var(--color-text-info)", fontSize: 12, textDecoration: "none",
                      fontFamily: "var(--font-mono)" }} target="_blank" rel="noopener noreferrer">{p.page_url}</a>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <code style={{ fontFamily: "var(--font-mono)", fontSize: 11, background: "var(--color-background-secondary)",
                        padding: "2px 8px", borderRadius: 4, color: "var(--color-text-secondary)" }}>
                        {showKeyId === p.id ? p.web_key : p.web_key.replace(/./g, "•").slice(0, 14)}
                      </code>
                      <button onClick={() => setShowKeyId(showKeyId === p.id ? null : p.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", padding: 2 }}>
                        <Icon d={showKeyId === p.id ? Icons.eyeOff : Icons.eye} size={12} />
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button onClick={() => toggleActive(p.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      <Badge status={p.is_active ? "active" : "inactive"} />
                    </button>
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--color-text-secondary)", fontSize: 12 }}>{p.created_at}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <Btn size="sm" onClick={() => openEdit(p)}><Icon d={Icons.edit} size={11} /> Edit</Btn>
                      <Btn size="sm" variant="danger" onClick={() => setDeleteId(p.id)}><Icon d={Icons.trash} size={11} /></Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title={editProduct ? "Edit product" : "Add product"} onClose={() => setShowModal(false)}>
          <Field label="Product name *">
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Shop Site" />
          </Field>
          <Field label="Logo URL" hint="Optional. A publicly accessible image URL.">
            <Input value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} placeholder="https://example.com/logo.png" />
          </Field>
          <Field label="Page URL *" hint="Where the user is redirected after SSO login.">
            <Input value={form.page_url} onChange={e => setForm(f => ({ ...f, page_url: e.target.value }))} placeholder="https://example.com/dashboard" />
          </Field>
          <Field label="Web key *" hint="Copy this from the target site's SSO settings. Used to verify auth tokens.">
            <Input value={form.web_key} onChange={e => setForm(f => ({ ...f, web_key: e.target.value }))} placeholder="wk_xxxxxxxxxxxxxxxx" type="password" />
          </Field>
          <Field label="Status">
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              Active
            </label>
          </Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 8 }}>
            <Btn onClick={() => setShowModal(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={save} loading={saving}>{editProduct ? "Save changes" : "Add product"}</Btn>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="Delete product" onClose={() => setDeleteId(null)} width={380}>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
            This will remove the product and all stored authentication data. Existing sessions on the remote site will not be affected.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn onClick={() => setDeleteId(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={confirmDelete}>Delete product</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── Web key page ─────────────────────────────────────────────────────────────
const WebKeyPage = ({ toast }) => {
  const [webKey, setWebKey] = useState("wk_9f2a1b3c4d5e6f7a8b9c0d1e2f3a4b5c");
  const [showKey, setShowKey] = useState(false);
  const [pin, setPin] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);

  const generateKey = async () => {
    if (!pin || pin.length < 4) { toast("Enter a PIN of at least 4 characters", "error"); return; }
    setGenerating(true);
    await new Promise(r => setTimeout(r, 900));
    const newKey = "wk_" + Array.from({ length: 32 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
    setWebKey(newKey); setPin(""); setGenerating(false); setShowRegenConfirm(false);
    toast("Web key regenerated. Share it with connected sites.", "success");
  };

  const copyKey = async () => {
    await navigator.clipboard.writeText(webKey);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    toast("Copied to clipboard", "success");
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 500 }}>Web key</h2>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>This site's signing key — share it with sites that need to authenticate users here</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-lg)", padding: "20px 24px" }}>
          <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 500 }}>Current web key</p>
          <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)",
            padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 12,
            color: "var(--color-text-primary)", wordBreak: "break-all", marginBottom: 12, letterSpacing: "0.05em" }}>
            {showKey ? webKey : webKey.replace(/[^wk_]/g, "•")}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn size="sm" onClick={() => setShowKey(s => !s)}>
              <Icon d={showKey ? Icons.eyeOff : Icons.eye} size={11} />
              {showKey ? "Hide" : "Reveal"}
            </Btn>
            <Btn size="sm" onClick={copyKey}>
              <Icon d={copied ? Icons.check : Icons.copy} size={11} />
              {copied ? "Copied!" : "Copy"}
            </Btn>
          </div>
        </div>

        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-lg)", padding: "20px 24px" }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 500 }}>Key details</p>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: "var(--color-text-secondary)" }}>Generated using HMAC-SHA256</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[["Algorithm", "HMAC-SHA256"], ["Token lifetime", "30 seconds"], ["Key length", "256-bit"], ["Storage", "WordPress options"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "var(--color-text-secondary)" }}>{k}</span>
                <span style={{ fontWeight: 500, fontFamily: k === "Algorithm" || k === "Key length" ? "var(--font-mono)" : undefined }}>
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)", padding: "20px 24px" }}>
        <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 500 }}>Regenerate web key</p>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
          Use a PIN to generate a new cryptographic key. All connected sites must be updated with the new key immediately.
          Existing in-flight auth tokens will be invalidated.
        </p>

        <div style={{ background: "#fffbeb", border: "0.5px solid #fcd34d", borderRadius: "var(--border-radius-md)",
          padding: "10px 14px", marginBottom: 16, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <Icon d={Icons.alert} size={14} color="#92400e" />
          <p style={{ margin: 0, fontSize: 12, color: "#92400e", lineHeight: 1.6 }}>
            Regenerating the key will break SSO for any connected site that hasn't received the new key. Coordinate with all site admins before regenerating.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Field label="Security PIN">
              <Input type="password" value={pin} onChange={e => setPin(e.target.value)}
                placeholder="Enter a PIN (min. 4 characters)" />
            </Field>
          </div>
          <div style={{ paddingBottom: 16 }}>
            <Btn variant="danger" onClick={() => setShowRegenConfirm(true)} disabled={pin.length < 4}>
              <Icon d={Icons.refresh} size={13} /> Regenerate key
            </Btn>
          </div>
        </div>
      </div>

      {showRegenConfirm && (
        <Modal title="Confirm key regeneration" onClose={() => setShowRegenConfirm(false)} width={400}>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
            This will immediately invalidate the current key and all in-flight tokens. Connected sites will stop working until updated.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn onClick={() => setShowRegenConfirm(false)}>Cancel</Btn>
            <Btn variant="danger" onClick={generateKey} loading={generating}><Icon d={Icons.refresh} size={13} /> Yes, regenerate</Btn>
          </div>
        </Modal>
      )}

      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)", padding: "20px 24px", marginTop: 16 }}>
        <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 500 }}>How to share with another site</p>
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 2 }}>
          <li>Reveal and copy this site's web key above</li>
          <li>Go to the other site's SSO plugin → Products page</li>
          <li>Add this site as a product and paste the web key in the web key field</li>
          <li>Do the same in reverse: copy the other site's web key and add it here</li>
        </ol>
      </div>
    </div>
  );
};

// ─── Logs page ────────────────────────────────────────────────────────────────
const LogsPage = ({ toast }) => {
  const [logs, setLogs] = useState([
    { id: 1, event_type: "success", user_email: "alice@example.com", source_product: "Main Site", target_product: "Shop", ip_address: "203.0.113.10", device_fingerprint: "a1b2c3d4", error_reason: null, created_at: "2026-04-29 11:42:10" },
    { id: 2, event_type: "failure", user_email: "bob@example.com", source_product: "Blog", target_product: "Main Site", ip_address: "198.51.100.4", device_fingerprint: "e5f6g7h8", error_reason: "token_expired", created_at: "2026-04-29 11:40:05" },
    { id: 3, event_type: "success", user_email: "carol@example.com", source_product: "Shop", target_product: "Blog", ip_address: "203.0.113.22", device_fingerprint: "i9j0k1l2", error_reason: null, created_at: "2026-04-29 11:38:52" },
    { id: 4, event_type: "device_mismatch", user_email: "dan@example.com", source_product: "Main Site", target_product: "Shop", ip_address: "192.0.2.88", device_fingerprint: "m3n4o5p6", error_reason: "device_mismatch", created_at: "2026-04-29 11:35:10" },
    { id: 5, event_type: "failure", user_email: "eve@example.com", source_product: "Shop", target_product: "Main Site", ip_address: "10.0.0.5", device_fingerprint: "q7r8s9t0", error_reason: "user_not_found", created_at: "2026-04-29 11:30:01" },
    { id: 6, event_type: "success", user_email: "frank@example.com", source_product: "Main Site", target_product: "Blog", ip_address: "203.0.113.99", device_fingerprint: "u1v2w3x4", error_reason: null, created_at: "2026-04-29 11:22:44" },
  ]);
  const [filter, setFilter] = useState("all");
  const [clearing, setClearing] = useState(false);

  const filtered = filter === "all" ? logs : logs.filter(l => l.event_type === filter || l.error_reason === filter);

  const clearLogs = async () => {
    setClearing(true);
    await new Promise(r => setTimeout(r, 600));
    setLogs([]); setClearing(false);
    toast("Logs cleared", "success");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 500 }}>Auth logs</h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>All authentication attempts on this site</p>
        </div>
        <Btn size="sm" variant="danger" onClick={clearLogs} loading={clearing}><Icon d={Icons.trash} size={11} /> Clear logs</Btn>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[["all", "All"], ["success", "Success"], ["failure", "Failed"], ["device_mismatch", "Device mismatch"], ["token_expired", "Expired"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, border: "0.5px solid",
              cursor: "pointer", fontFamily: "inherit",
              borderColor: filter === val ? "var(--color-border-primary)" : "var(--color-border-tertiary)",
              background: filter === val ? "var(--color-text-primary)" : "var(--color-background-primary)",
              color: filter === val ? "var(--color-background-primary)" : "var(--color-text-secondary)" }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-secondary)", fontSize: 14 }}>
            No log entries found.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--color-background-secondary)" }}>
                {["Time", "User", "Route", "IP", "Device", "Result", "Reason"].map(h => (
                  <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, fontWeight: 500,
                    color: "var(--color-text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase",
                    borderBottom: "0.5px solid var(--color-border-tertiary)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => (
                <tr key={log.id} style={{ borderBottom: i < filtered.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none" }}>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: "var(--color-text-secondary)", whiteSpace: "nowrap", fontFamily: "var(--font-mono)" }}>{log.created_at}</td>
                  <td style={{ padding: "10px 14px", color: "var(--color-text-primary)" }}>{log.user_email}</td>
                  <td style={{ padding: "10px 14px", color: "var(--color-text-secondary)", fontSize: 11, fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                    {log.source_product} → {log.target_product}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" }}>{log.ip_address}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <code style={{ fontSize: 10, fontFamily: "var(--font-mono)", background: "var(--color-background-secondary)",
                      padding: "2px 6px", borderRadius: 4, color: "var(--color-text-secondary)" }}>
                      {log.device_fingerprint}
                    </code>
                  </td>
                  <td style={{ padding: "10px 14px" }}><Badge status={log.event_type} /></td>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: "var(--color-text-secondary)" }}>
                    {log.error_reason ? <Badge status={log.error_reason} /> : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ─── Settings page ────────────────────────────────────────────────────────────
const SettingsPage = ({ toast }) => {
  const [settings, setSettings] = useState({
    token_lifetime: 30,
    strict_device_binding: true,
    strict_ip_binding: false,
    ip_tolerance: "subnet",
    allow_same_site_reauth: false,
    rate_limit_enabled: true,
    rate_limit_attempts: 5,
    rate_limit_window: 60,
    logging_enabled: true,
    require_https: true,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }));

  const save = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    setSaving(false);
    toast("Settings saved", "success");
  };

  const Toggle = ({ value, onChange, label, hint }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      padding: "14px 0", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
      <div>
        <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{label}</p>
        {hint && <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>{hint}</p>}
      </div>
      <button onClick={() => onChange(!value)}
        style={{ background: value ? "var(--color-text-primary)" : "var(--color-border-secondary)",
          border: "none", borderRadius: 20, width: 36, height: 20, cursor: "pointer",
          position: "relative", flexShrink: 0, transition: "background 0.2s", marginLeft: 16 }}>
        <span style={{ position: "absolute", top: 3, left: value ? 18 : 3, width: 14, height: 14,
          background: "var(--color-background-primary)", borderRadius: "50%", transition: "left 0.2s" }} />
      </button>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 500 }}>Settings</h2>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>Configure SSO security and behavior</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Token settings */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-lg)", padding: "20px 24px" }}>
          <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 500 }}>Token settings</p>
          <Field label="Token lifetime (seconds)" hint="How long an auth key remains valid. Default is 30s.">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="range" min={10} max={120} step={5} value={settings.token_lifetime}
                onChange={e => set("token_lifetime", Number(e.target.value))} style={{ flex: 1 }} />
              <span style={{ fontSize: 13, fontWeight: 500, minWidth: 36, textAlign: "right" }}>{settings.token_lifetime}s</span>
            </div>
          </Field>
          <Toggle value={settings.allow_same_site_reauth} onChange={v => set("allow_same_site_reauth", v)}
            label="Allow same-site re-auth" hint="Permit re-authentication on the same site" />
        </div>

        {/* Rate limiting */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-lg)", padding: "20px 24px" }}>
          <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 500 }}>Rate limiting</p>
          <Toggle value={settings.rate_limit_enabled} onChange={v => set("rate_limit_enabled", v)}
            label="Enable rate limiting" hint="Block repeated failed auth attempts" />
          <div style={{ marginTop: 16, opacity: settings.rate_limit_enabled ? 1 : 0.4, pointerEvents: settings.rate_limit_enabled ? "all" : "none" }}>
            <Field label="Max attempts">
              <Input type="number" value={settings.rate_limit_attempts}
                onChange={e => set("rate_limit_attempts", Number(e.target.value))} style={{ width: 80 }} />
            </Field>
            <Field label="Window (seconds)">
              <Input type="number" value={settings.rate_limit_window}
                onChange={e => set("rate_limit_window", Number(e.target.value))} style={{ width: 80 }} />
            </Field>
          </div>
        </div>
      </div>

      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)", padding: "20px 24px", marginBottom: 16 }}>
        <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 500 }}>Device & IP binding</p>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "var(--color-text-secondary)" }}>
          Controls how strictly auth tokens are bound to the requesting device and IP address.
        </p>
        <Toggle value={settings.strict_device_binding} onChange={v => set("strict_device_binding", v)}
          label="Strict device binding" hint="Reject tokens if browser/OS/screen resolution changes" />
        <Toggle value={settings.strict_ip_binding} onChange={v => set("strict_ip_binding", v)}
          label="Strict IP binding" hint="Require exact IP match instead of subnet tolerance" />
        {!settings.strict_ip_binding && (
          <div style={{ paddingTop: 14 }}>
            <Field label="IP tolerance mode">
              <select value={settings.ip_tolerance} onChange={e => set("ip_tolerance", e.target.value)}>
                <option value="subnet">Same /24 subnet</option>
                <option value="any">Any IP (no restriction)</option>
              </select>
            </Field>
          </div>
        )}
      </div>

      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)", padding: "20px 24px", marginBottom: 20 }}>
        <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 500 }}>Security & logging</p>
        <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--color-text-secondary)" }}>
          Authentication logs never store full auth keys or web keys — only hashes.
        </p>
        <Toggle value={settings.require_https} onChange={v => set("require_https", v)}
          label="Require HTTPS" hint="Reject any SSO request over plain HTTP" />
        <Toggle value={settings.logging_enabled} onChange={v => set("logging_enabled", v)}
          label="Enable logging" hint="Log all auth attempts to wp_sso_logs table" />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn variant="primary" size="lg" onClick={save} loading={saving}>Save settings</Btn>
      </div>
    </div>
  );
};

// ─── App shell ────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = "info") => setToast({ msg, type, id: Date.now() }), []);

  const nav = [
    { id: "dashboard", label: "Dashboard",  icon: Icons.dashboard },
    { id: "products",  label: "Products",   icon: Icons.products  },
    { id: "webkey",    label: "Web key",     icon: Icons.key       },
    { id: "logs",      label: "Auth logs",   icon: Icons.logs      },
    { id: "settings",  label: "Settings",    icon: Icons.settings  },
  ];

  const pages = { dashboard: DashboardPage, products: ProductsPage, webkey: WebKeyPage, logs: LogsPage, settings: SettingsPage };
  const PageComp = pages[page];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-sans)", background: "var(--color-background-tertiary)" }}>
      <style>{`
        * { box-sizing: border-box; }
        input[type="text"], input[type="password"], input[type="number"], input[type="url"], select, textarea {
          background: var(--color-background-primary); border: 0.5px solid var(--color-border-secondary);
          border-radius: var(--border-radius-md); padding: 7px 10px; font-size: 13px;
          color: var(--color-text-primary); font-family: var(--font-sans); outline: none;
          transition: border-color 0.15s; width: 100%;
        }
        input:focus, select:focus { border-color: var(--color-border-primary); }
        input[type="range"] { accent-color: var(--color-text-primary); }
        input[type="checkbox"] { accent-color: var(--color-text-primary); width: 14px; height: 14px; cursor: pointer; }
        @keyframes spin { to { transform: rotate(360deg); } }
        a { color: inherit; }
      `}</style>

      {/* Sidebar */}
      <aside style={{ width: 220, flexShrink: 0, background: "var(--color-background-primary)",
        borderRight: "0.5px solid var(--color-border-tertiary)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 20px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "var(--color-text-primary)", borderRadius: "var(--border-radius-md)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon d={Icons.shield} size={16} color="var(--color-background-primary)" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>Cross-Site SSO</p>
              <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-tertiary)" }}>WordPress plugin</p>
            </div>
          </div>
        </div>

        <nav style={{ padding: "12px 8px", flex: 1 }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 12px",
                borderRadius: "var(--border-radius-md)", border: "none", cursor: "pointer", textAlign: "left",
                fontFamily: "var(--font-sans)", fontSize: 13, marginBottom: 2,
                background: page === n.id ? "var(--color-background-secondary)" : "transparent",
                color: page === n.id ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                fontWeight: page === n.id ? 500 : 400 }}>
              <Icon d={n.icon} size={14} color={page === n.id ? "var(--color-text-primary)" : "var(--color-text-secondary)"} />
              {n.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "12px 16px", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
          <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-tertiary)", lineHeight: 1.5 }}>
            product-based-sso v1.0.0<br />
            API: /wp-json/product-sso/v1
          </p>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "28px 32px", overflow: "auto" }}>
        <PageComp toast={showToast} />
      </main>

      {toast && <Toast key={toast.id} msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}