import { useCallback, useEffect, useState } from "@wordpress/element";
import { Toast } from "./components/Toast";
import { Ico, I } from "./components/Icon";
import { DashboardPage } from "./pages/DashboardPage";
import { ProductsPage } from "./pages/ProductsPage";
import { WebKeyPage } from "./pages/WebKeyPage";
import { LogsPage } from "./pages/LogsPage";
import { SettingsPage } from "./pages/SettingsPage";

const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sso_theme") ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    }
    return "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("sso_theme", theme);
  }, [theme]);

  return [theme, setTheme];
};

const ThemeStyles = () => (
  <style>{`
    :root {
      --bg0:#ffffff; --bg1:#f6f7f9; --bg2:#eef0f3; --bg3:#e4e6ea;
      --text1:#111318; --text2:#4a4f5c; --text3:#8b909e;
      --border1:rgba(0,0,0,0.08); --border2:rgba(0,0,0,0.14);
      --accent:#2563eb; --accent-bg:#eff4ff; --accent-text:#1d4ed8;
      --success-bg:#ecfdf5; --success:#15803d;
      --warn-bg:#fffbeb; --warn:#92400e;
      --danger-bg:#fef2f2; --danger:#b91c1c;
      --radius-sm:6px; --radius-md:8px; --radius-lg:12px;
      --mono:'JetBrains Mono',monospace;
    }
    [data-theme="dark"] {
      --bg0:#141820; --bg1:#1a2030; --bg2:#202736; --bg3:#28303f;
      --text1:#e8ecf4; --text2:#8f98b0; --text3:#545e74;
      --border1:rgba(255,255,255,0.07); --border2:rgba(255,255,255,0.12);
      --accent:#3b82f6; --accent-bg:#1e2d4a; --accent-text:#93c5fd;
      --success-bg:#052e16; --success:#4ade80;
      --warn-bg:#1c1400; --warn:#fbbf24;
      --danger-bg:#2d0a0a; --danger:#f87171;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: var(--font-sans, system-ui, sans-serif); background: var(--bg1); color: var(--text1); transition: background 0.25s, color 0.25s; }
    input[type="text"], input[type="password"], input[type="number"], input[type="url"], select {
      background: var(--bg1); border: 1px solid var(--border2); border-radius: var(--radius-sm);
      padding: 7px 10px; font-size: 13px; color: var(--text1); font-family: inherit;
      outline: none; width: 100%; transition: border-color 0.15s, background 0.25s;
    }
    input:focus, select:focus { border-color: var(--accent); }
    input[type="range"] { accent-color: var(--accent); width: 100%; }
    input[type="checkbox"] { accent-color: var(--accent); }
    @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    .page-anim { animation: fadeUp 0.18s ease; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead tr { background: var(--bg2); }
    th { padding: 7px 14px; text-align: left; font-size: 10px; font-weight: 600; color: var(--text3); letter-spacing: 0.05em; text-transform: uppercase; border-bottom: 1px solid var(--border1); }
    td { padding: 10px 14px; border-bottom: 1px solid var(--border1); color: var(--text1); vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: var(--bg1); transition: background 0.1s; }
    code { font-family: var(--mono); font-size: 11px; background: var(--bg2); padding: 2px 7px; border-radius: 4px; color: var(--text2); }
    a { color: var(--accent); text-decoration: none; }
  `}</style>
);

const ThemeToggle = ({ theme, setTheme }) => (
  <div style={{ background: "var(--bg2)", border: "1px solid var(--border1)", borderRadius: 20, padding: 3, display: "flex", gap: 2 }}>
    {[["light", I.sun, "Light"], ["dark", I.moon, "Dark"]].map(([t, icon, label]) => (
      <button key={t} onClick={() => setTheme(t)} title={`${label} mode`}
        style={{ width: 26, height: 20, border: "none", background: theme === t ? "var(--bg0)" : "transparent",
          cursor: "pointer", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
          color: theme === t ? "var(--text1)" : "var(--text3)", transition: "all 0.15s",
          boxShadow: theme === t ? "0 1px 3px rgba(0,0,0,0.15)" : "none" }}>
        <Ico d={icon} size={12} />
      </button>
    ))}
  </div>
);

export default function App() {
  const [theme, setTheme] = useTheme();
  const [page, setPage] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = "info") => setToast({ msg, type, id: Date.now() }), []);
  const PageComp = { dashboard: DashboardPage, products: ProductsPage, webkey: WebKeyPage, logs: LogsPage, settings: SettingsPage }[page];

  const nav = [
    { id: "dashboard", label: "Dashboard" },
    { id: "products", label: "Products" },
    { id: "webkey", label: "Web key" },
    { id: "logs", label: "Auth logs" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div data-theme={theme} style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui,sans-serif", background: "var(--bg1)", color: "var(--text1)", transition: "background 0.25s,color 0.25s" }}>
      <ThemeStyles />

      <aside style={{ width: 210, flexShrink: 0, background: "var(--bg0)", borderRight: "1px solid var(--border1)", display: "flex", flexDirection: "column", transition: "background 0.25s,border-color 0.25s" }}>
        <div style={{ padding: "16px", borderBottom: "1px solid var(--border1)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "var(--accent)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff" }}>
            <Ico d={I.shield} size={16} />
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text1)" }}>Cross-Site SSO</p>
            <p style={{ fontSize: 10, color: "var(--text3)" }}>WordPress plugin</p>
          </div>
        </div>

        <nav style={{ padding: "10px 8px", flex: 1 }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit", fontSize: 12, fontWeight: page === n.id ? 500 : 400, marginBottom: 2, transition: "all 0.15s", background: page === n.id ? "var(--bg2)" : "transparent", color: page === n.id ? "var(--text1)" : "var(--text2)" }}>
              <span style={{ color: page === n.id ? "var(--text1)" : "var(--text3)" }}><Ico d={I[n.id]} size={13} /></span>
              {n.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 10, color: "var(--text3)", lineHeight: 1.5 }}>v1.0.0<br />/wp-json/product-sso/v1</p>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </aside>

      <main style={{ flex: 1, padding: "24px 28px", overflow: "auto", background: "var(--bg1)", transition: "background 0.25s" }}>
        <PageComp key={page} toast={showToast} />
      </main>

      {toast && <Toast key={toast.id} msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
