import { useCallback, useState } from "@wordpress/element";
import { Toast } from "./components/Toast";
import { Icon, Icons } from "./components/Icon";
import { DashboardPage } from "./pages/DashboardPage";
import { ProductsPage } from "./pages/ProductsPage";
import { WebKeyPage } from "./pages/WebKeyPage";
import { LogsPage } from "./pages/LogsPage";
import { SettingsPage } from "./pages/SettingsPage";

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
