import { useState, useEffect, useCallback, useRef } from "react";

// ─── Theme ─────────────────────────────────────────────────────────────────────
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

// ─── CSS ───────────────────────────────────────────────────────────────────────
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
      --topbar-h:52px;
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
    @keyframes fadeUp  { from { opacity:0; transform:translateY(6px); }  to { opacity:1; transform:translateY(0); } }
    @keyframes popIn   { from { opacity:0; transform:scale(.92) translateY(-8px); } to { opacity:1; transform:scale(1) translateY(0); } }
    @keyframes spin    { to { transform: rotate(360deg); } }
    @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
    .page-anim { animation: fadeUp 0.18s ease; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead tr { background: var(--bg2); }
    th { padding: 7px 14px; text-align: left; font-size: 10px; font-weight: 600; color: var(--text3); letter-spacing: 0.05em; text-transform: uppercase; border-bottom: 1px solid var(--border1); }
    td { padding: 10px 14px; border-bottom: 1px solid var(--border1); color: var(--text1); vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: var(--bg1); transition: background 0.1s; }
    code { font-family: var(--mono); font-size: 11px; background: var(--bg2); padding: 2px 7px; border-radius: 4px; color: var(--text2); }
    a { color: var(--accent); text-decoration: none; }

    /* ── Top bar ── */
    .topbar {
      height: var(--topbar-h);
      background: var(--bg0);
      border-bottom: 1px solid var(--border1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      flex-shrink: 0;
      transition: background 0.25s, border-color 0.25s;
      position: relative;
      z-index: 50;
    }
    .topbar-site { display:flex; align-items:center; gap:10px; }
    .topbar-site-badge {
      font-size: 11px; font-weight: 600; color: var(--accent);
      background: var(--accent-bg); border: 1px solid rgba(37,99,235,.15);
      padding: 3px 10px; border-radius: 20px;
    }
    .topbar-right { display:flex; align-items:center; gap:8px; }

    /* ── 9-dot grid button ── */
    .grid-btn {
      width: 36px; height: 36px; border-radius: 50%; border: none;
      background: transparent; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s; position: relative;
      color: var(--text2);
    }
    .grid-btn:hover { background: var(--bg2); }
    .grid-btn.open  { background: var(--accent-bg); color: var(--accent); }
    .grid-dots { display: grid; grid-template-columns: repeat(3,4.5px); grid-template-rows: repeat(3,4.5px); gap: 2.5px; }
    .grid-dots span { width:4.5px; height:4.5px; background:currentColor; border-radius:50%; display:block; }

    /* ── Switcher panel ── */
    .sw-panel-wrap {
      position: absolute; top: calc(var(--topbar-h) + 6px); right: 14px; z-index: 200;
    }
    .sw-panel {
      background: var(--bg0);
      border: 1px solid var(--border2);
      border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0,0,0,.18), 0 2px 8px rgba(0,0,0,.1);
      width: 300px;
      animation: popIn 0.18s cubic-bezier(.34,1.56,.64,1);
      overflow: hidden;
    }
    [data-theme="dark"] .sw-panel {
      box-shadow: 0 8px 40px rgba(0,0,0,.55), 0 2px 8px rgba(0,0,0,.4);
    }
    .sw-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px 6px;
    }
    .sw-title { font-size: 13px; font-weight: 600; color: var(--text1); }
    .sw-manage {
      width: 32px; height: 32px; border-radius: 50%; border: none;
      background: var(--bg2); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--text3); transition: background 0.15s;
    }
    .sw-manage:hover { background: var(--bg3); color: var(--text1); }
    .sw-grid {
      display: grid; grid-template-columns: repeat(3,1fr);
      padding: 6px 8px 10px; gap: 2px;
    }
    .sw-item {
      display: flex; flex-direction: column; align-items: center; gap: 7px;
      padding: 12px 6px 10px; border-radius: 10px; cursor: pointer;
      border: none; background: transparent; font-family: inherit;
      transition: background 0.12s; text-align: center;
    }
    .sw-item:hover { background: var(--bg2); }
    .sw-item:active { background: var(--bg3); transform: scale(.96); }
    .sw-item-icon {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; font-weight: 800; overflow: hidden; position: relative;
      flex-shrink: 0;
    }
    .sw-item-icon img { width:100%; height:100%; object-fit:contain; }
    .sw-item-label { font-size: 11px; color: var(--text1); line-height: 1.3; }
    .sw-current-ring { box-shadow: 0 0 0 2.5px var(--accent), 0 0 0 4.5px var(--accent-bg); }
    .sw-current-dot {
      position: absolute; bottom: 2px; right: 2px;
      width: 10px; height: 10px; background: var(--accent);
      border-radius: 50%; border: 2px solid var(--bg0);
    }
    .sw-divider { height: 1px; background: var(--border1); margin: 0 12px 4px; }
    .sw-footer { padding: 8px 12px 12px; }
    .sw-footer-hint { font-size: 10px; color: var(--text3); text-align: center; line-height: 1.5; }

    /* ── SSO Loading overlay ── */
    .sso-overlay {
      position: fixed; inset: 0; z-index: 9000;
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(6px);
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
      animation: fadeIn 0.15s ease;
    }
    .sso-card {
      background: var(--bg0); border: 1px solid var(--border1);
      border-radius: var(--radius-lg); padding: 32px 40px;
      display: flex; flex-direction: column; align-items: center; gap: 14px;
      min-width: 260px;
      box-shadow: 0 20px 60px rgba(0,0,0,.25);
    }
    .sso-spinner {
      width: 38px; height: 38px;
      border: 3px solid var(--border1);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    .sso-product-icon {
      width: 52px; height: 52px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 800; color: #fff;
    }
    .sso-title { font-size: 15px; font-weight: 600; color: var(--text1); }
    .sso-sub   { font-size: 12px; color: var(--text3); }
    .sso-steps { display:flex; flex-direction:column; gap:6px; width:100%; }
    .sso-step  { display:flex; align-items:center; gap:8px; font-size:11px; color:var(--text3); }
    .sso-step.done { color: var(--success); }
    .sso-step.active { color: var(--text1); font-weight:500; }
    .sso-step-dot { width:6px; height:6px; border-radius:50%; background:currentColor; flex-shrink:0; }
  `}</style>
);

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ico = ({ d, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const I = {
  dashboard: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  products:  "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
  key:       "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  logs:      "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  settings:  "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06-.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z",
  sun:       "M12 7a5 5 0 100 10A5 5 0 0012 7z M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42",
  moon:      "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
  shield:    "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  plus:      "M12 5v14 M5 12h14",
  edit:      "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:     "M3 6h18 M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2",
  refresh:   "M1 4v6h6 M23 20v-6h-6 M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15",
  copy:      "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2 M16 8h2a2 2 0 012 2v8a2 2 0 01-2 2h-8a2 2 0 01-2-2v-2",
  eye:       "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z",
  eyeOff:    "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24 M1 1l22 22",
  check:     "M20 6L9 17l-5-5",
  x:         "M18 6L6 18 M6 6l12 12",
  alert:     "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  externalLink: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6 M15 3h6v6 M10 14L21 3",
};

// ─── Shared styles ─────────────────────────────────────────────────────────────
const S = {
  card:         { background:"var(--bg0)", border:"1px solid var(--border1)", borderRadius:"var(--radius-lg)", padding:"18px 20px", transition:"background 0.25s,border-color 0.25s" },
  row:          { display:"flex", alignItems:"center", justifyContent:"space-between" },
  sectionTitle: { fontSize:13, fontWeight:600, color:"var(--text1)", marginBottom:12 },
};

// ─── Shared components ─────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const m = {
    success:         ["#ecfdf5","#15803d","Success"],
    failure:         ["#fef2f2","#b91c1c","Failure"],
    device_mismatch: ["#fef2f2","#b91c1c","Device mismatch"],
    token_expired:   ["#fffbeb","#92400e","Expired"],
    user_not_found:  ["#fef2f2","#b91c1c","User not found"],
    invalid_key:     ["#fffbeb","#92400e","Invalid key"],
    active:          ["#ecfdf5","#15803d","Active"],
    inactive:        ["var(--bg2)","var(--text2)","Inactive"],
  };
  const [bg, color, label] = m[status] || ["var(--bg2)","var(--text2)", status];
  return <span style={{ background:bg, color, fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:20, whiteSpace:"nowrap" }}>{label}</span>;
};

const Btn = ({ children, onClick, variant="default", size="md", disabled, loading }) => {
  const variants = {
    default: { background:"var(--bg0)", border:"1px solid var(--border2)", color:"var(--text2)" },
    primary: { background:"var(--accent)", border:"1px solid var(--accent)", color:"#fff" },
    danger:  { background:"var(--danger-bg)", border:"1px solid var(--danger)", color:"var(--danger)" },
  };
  const sizes = { sm:{fontSize:11,padding:"5px 10px"}, md:{fontSize:12,padding:"7px 13px"}, lg:{fontSize:13,padding:"9px 18px"} };
  return (
    <button onClick={disabled||loading ? undefined : onClick}
      style={{ cursor:disabled||loading?"not-allowed":"pointer", display:"inline-flex", alignItems:"center",
        gap:5, fontFamily:"inherit", fontWeight:500, borderRadius:"var(--radius-md)", transition:"all 0.12s",
        opacity:disabled?0.5:1, whiteSpace:"nowrap", ...variants[variant], ...sizes[size] }}>
      {loading && <span style={{ width:11,height:11,border:"1.5px solid currentColor",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.6s linear infinite" }}/>}
      {children}
    </button>
  );
};

const Field = ({ label, children, hint }) => (
  <div style={{ marginBottom:14 }}>
    <label style={{ fontSize:10, fontWeight:600, color:"var(--text3)", letterSpacing:"0.05em", textTransform:"uppercase", display:"block", marginBottom:5 }}>{label}</label>
    {children}
    {hint && <p style={{ fontSize:11, color:"var(--text3)", marginTop:4 }}>{hint}</p>}
  </div>
);

const ToggleSwitch = ({ value, onChange }) => (
  <button onClick={() => onChange(!value)}
    style={{ background:value?"var(--accent)":"var(--bg3)", border:"none", borderRadius:20,
      width:36, height:20, cursor:"pointer", position:"relative", flexShrink:0,
      transition:"background 0.2s", marginLeft:16 }}>
    <span style={{ position:"absolute", top:2, left:value?18:2, width:16, height:16,
      background:"#fff", borderRadius:"50%", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
  </button>
);

const SettingRow = ({ label, hint, value, onChange }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid var(--border1)" }}>
    <div>
      <p style={{ fontSize:12, fontWeight:500, color:"var(--text1)", marginBottom:2 }}>{label}</p>
      {hint && <p style={{ fontSize:11, color:"var(--text3)" }}>{hint}</p>}
    </div>
    <ToggleSwitch value={value} onChange={onChange}/>
  </div>
);

const Toast = ({ msg, type, onDismiss }) => {
  useEffect(() => { const t = setTimeout(onDismiss, 2800); return () => clearTimeout(t); }, []);
  const c = { success:"var(--success)", error:"var(--danger)", info:"var(--accent)" }[type] || "var(--accent)";
  return (
    <div style={{ position:"fixed", top:16, right:16, zIndex:9999, display:"flex", alignItems:"center",
      gap:8, background:"var(--bg0)", border:"1px solid var(--border2)", borderLeft:`3px solid ${c}`,
      borderRadius:"var(--radius-md)", padding:"10px 14px", maxWidth:280, fontSize:12,
      boxShadow:"0 4px 20px rgba(0,0,0,0.15)" }}>
      <span style={{ color:c }}><Ico d={type==="success"?I.check:I.x} size={13}/></span>
      <span style={{ color:"var(--text1)" }}>{msg}</span>
      <button onClick={onDismiss} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text3)", padding:0, marginLeft:"auto" }}>
        <Ico d={I.x} size={11}/>
      </button>
    </div>
  );
};

const Modal = ({ title, children, onClose, width=500 }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
    <div style={{ background:"var(--bg0)", borderRadius:"var(--radius-lg)", border:"1px solid var(--border2)", width:"100%", maxWidth:width, maxHeight:"90vh", overflow:"auto" }}>
      <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border1)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:14, fontWeight:600, color:"var(--text1)" }}>{title}</span>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text3)", padding:4 }}><Ico d={I.x} size={15}/></button>
      </div>
      <div style={{ padding:"18px 20px" }}>{children}</div>
    </div>
  </div>
);

const StatCard = ({ label, value, color }) => (
  <div style={{ background:"var(--bg2)", borderRadius:"var(--radius-md)", padding:"12px 14px", flex:1 }}>
    <p style={{ fontSize:10, fontWeight:600, color:"var(--text3)", letterSpacing:"0.04em", textTransform:"uppercase", marginBottom:6 }}>{label}</p>
    <p style={{ fontSize:22, fontWeight:600, color:color||"var(--text1)" }}>{value}</p>
  </div>
);

const ThemeToggle = ({ theme, setTheme }) => (
  <div style={{ background:"var(--bg2)", border:"1px solid var(--border1)", borderRadius:20, padding:3, display:"flex", gap:2 }}>
    {[["light",I.sun,"Light"],["dark",I.moon,"Dark"]].map(([t,icon,label]) => (
      <button key={t} onClick={() => setTheme(t)} title={`${label} mode`}
        style={{ width:26, height:20, border:"none", background:theme===t?"var(--bg0)":"transparent",
          cursor:"pointer", borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center",
          color:theme===t?"var(--text1)":"var(--text3)", transition:"all 0.15s",
          boxShadow:theme===t?"0 1px 3px rgba(0,0,0,0.15)":"none" }}>
        <Ico d={icon} size={12}/>
      </button>
    ))}
  </div>
);

// ─── Avatar colours ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ["#dbeafe","#1d4ed8"], ["#dcfce7","#15803d"], ["#fef3c7","#92400e"],
  ["#fce7f3","#be185d"], ["#ede9fe","#6d28d9"],
];
const GRADIENT_BG = [
  "linear-gradient(135deg,#1d4ed8,#3b82f6)",
  "linear-gradient(135deg,#15803d,#4ade80)",
  "linear-gradient(135deg,#b45309,#f59e0b)",
  "linear-gradient(135deg,#be185d,#f472b6)",
  "linear-gradient(135deg,#6d28d9,#a78bfa)",
];

// ─── Data ──────────────────────────────────────────────────────────────────────
const PRODUCTS_INIT = [
  { id:1, name:"ABC HR",    domain:"https://abc.com",           route:"/dashboard", web_key:"SajneibaAkhAYWBIWU",   is_active:true,  created_at:"2026-04-29", image:null },
  { id:2, name:"Shop Site", domain:"https://shop.example.com",  route:"/products",  web_key:"wk_g7h8i9j0k1l2g7h8", is_active:true,  created_at:"2026-04-28", image:null },
  { id:3, name:"Blog",      domain:"https://blog.example.com",  route:"/",          web_key:"wk_m3n4o5p6q7r8m3n4", is_active:false, created_at:"2026-04-27", image:null },
];

const LOGS_INIT = [
  { id:1, type:"success",         email:"alice@example.com", from:"ABC HR",    to:"Shop Site", ip:"203.0.113.10", reason:null,             time:"11:42:10" },
  { id:2, type:"failure",         email:"bob@example.com",   from:"Blog",      to:"ABC HR",    ip:"198.51.100.4", reason:"token_expired",  time:"11:40:05" },
  { id:3, type:"success",         email:"carol@example.com", from:"Shop Site", to:"Blog",      ip:"203.0.113.22", reason:null,             time:"11:38:52" },
  { id:4, type:"device_mismatch", email:"dan@example.com",   from:"ABC HR",    to:"Shop Site", ip:"192.0.2.88",   reason:"device_mismatch",time:"11:35:10" },
  { id:5, type:"failure",         email:"eve@example.com",   from:"Shop Site", to:"ABC HR",    ip:"10.0.0.5",     reason:"user_not_found", time:"11:30:01" },
];

// ══════════════════════════════════════════════════════════════════════════════
// ── PRODUCT SWITCHER ──────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const SSO_STEPS = [
  "Verifying your session",
  "Generating auth token",
  "Encrypting with HMAC-SHA256",
  "Redirecting securely…",
];

function SsoOverlay({ product, onDone }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = SSO_STEPS.map((_, i) =>
      setTimeout(() => setStep(i + 1), (i + 1) * 380)
    );
    const done = setTimeout(onDone, SSO_STEPS.length * 380 + 300);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, []);

  const initials = product.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
  const idx      = PRODUCTS_INIT.findIndex(p => p.id === product.id) % GRADIENT_BG.length;

  return (
    <div className="sso-overlay">
      <div className="sso-card">
        <div className="sso-product-icon" style={{ background: GRADIENT_BG[idx] }}>
          {product.image
            ? <img src={product.image} alt={product.name} style={{ width:"100%", height:"100%", objectFit:"contain", borderRadius:10 }}/>
            : initials}
        </div>
        <div>
          <p className="sso-title" style={{ textAlign:"center" }}>Switching to {product.name}</p>
          <p className="sso-sub"   style={{ textAlign:"center", marginTop:3 }}>{product.domain}{product.route}</p>
        </div>
        <div className="sso-spinner"/>
        <div className="sso-steps">
          {SSO_STEPS.map((s, i) => (
            <div key={i} className={`sso-step ${step > i ? "done" : step === i ? "active" : ""}`}>
              <span className="sso-step-dot"/>
              {step > i ? <Ico d={I.check} size={11}/> : null}
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductSwitcherPanel({ products, currentSiteName, onClose, onManage }) {
  const active = products.filter(p => p.is_active);

  const handleSwitch = (p) => {
    onClose();
    // Dispatch a custom event so App can show overlay
    window.dispatchEvent(new CustomEvent("sso-switch", { detail: p }));
  };

  return (
    <div className="sw-panel-wrap">
      <div className="sw-panel">
        <div className="sw-header">
          <span className="sw-title">Your products</span>
          <button className="sw-manage" onClick={onManage} title="Manage products">
            <Ico d={I.edit} size={13}/>
          </button>
        </div>

        {active.length === 0 ? (
          <div style={{ padding:"20px 16px", textAlign:"center", fontSize:12, color:"var(--text3)" }}>
            No active products. <br/>Go to Products to add one.
          </div>
        ) : (
          <div className="sw-grid">
            {active.map((p, i) => {
              const isCurrent = p.name === currentSiteName;
              const initials  = p.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
              const [avatarBg, avatarColor] = AVATAR_COLORS[i % AVATAR_COLORS.length];

              return (
                <button key={p.id} className="sw-item" onClick={() => !isCurrent && handleSwitch(p)}
                  title={isCurrent ? `${p.name} (current)` : `Switch to ${p.name}`}
                  style={{ cursor: isCurrent ? "default" : "pointer" }}>
                  <div className={`sw-item-icon ${isCurrent ? "sw-current-ring" : ""}`}
                    style={{ background: p.image ? "var(--bg2)" : avatarBg, color: avatarColor }}>
                    {p.image
                      ? <img src={p.image} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
                      : <span style={{ fontSize:15, fontWeight:800, color:avatarColor }}>{initials}</span>}
                    {isCurrent && <span className="sw-current-dot"/>}
                  </div>
                  <span className="sw-item-label">
                    {p.name}
                    {isCurrent && (
                      <><br/><span style={{ fontSize:9, color:"var(--accent)", fontWeight:600 }}>current</span></>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="sw-divider"/>
        <div className="sw-footer">
          <p className="sw-footer-hint">
            <Ico d={I.shield} size={10}/>{" "}
            Auth tokens expire in 30s · HMAC-SHA256
          </p>
        </div>
      </div>
    </div>
  );
}

// ── 9-dot trigger button ───────────────────────────────────────────────────────
function GridButton({ open, onClick }) {
  return (
    <button className={`grid-btn${open?" open":""}`} onClick={onClick} title="Switch product">
      <div className="grid-dots">
        {Array(9).fill(0).map((_, i) => <span key={i}/>)}
      </div>
    </button>
  );
}

// ─── Top bar ───────────────────────────────────────────────────────────────────
function TopBar({ products, currentSiteName, theme, setTheme, onNavigate }) {
  const [open, setOpen]   = useState(false);
  const [ssoTarget, setSsoTarget] = useState(null);
  const wrapRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Listen for SSO switch events
  useEffect(() => {
    const handler = (e) => setSsoTarget(e.detail);
    window.addEventListener("sso-switch", handler);
    return () => window.removeEventListener("sso-switch", handler);
  }, []);

  const handleSsoDone = () => {
    // In production: window.open(`${ssoTarget.domain}${ssoTarget.route}?auth_key=TOKEN`, "_blank");
    window.open(`${ssoTarget.domain}${ssoTarget.route}`, "_blank");
    setSsoTarget(null);
  };

  return (
    <>
      <div className="topbar">
        {/* Left: site identity */}
        <div className="topbar-site" style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:28, height:28, background:"var(--accent)", borderRadius:"var(--radius-sm)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", flexShrink:0 }}>
            <Ico d={I.shield} size={14}/>
          </div>
          <div>
            <p style={{ fontSize:12, fontWeight:600, color:"var(--text1)", lineHeight:1.2 }}>Cross-Site SSO</p>
            <p style={{ fontSize:10, color:"var(--text3)" }}>Admin Panel</p>
          </div>
          <span className="topbar-site-badge">ABC HR Portal</span>
        </div>

        {/* Right: actions */}
        <div className="topbar-right" ref={wrapRef} style={{ position:"relative" }}>
          <ThemeToggle theme={theme} setTheme={setTheme}/>

          {/* 9-dot switcher */}
          <GridButton open={open} onClick={() => setOpen(o => !o)}/>

          {/* User avatar */}
          <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,var(--accent),#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff", cursor:"pointer", flexShrink:0 }}>
            AB
          </div>

          {/* Switcher dropdown */}
          {open && (
            <ProductSwitcherPanel
              products={products}
              currentSiteName={currentSiteName}
              onClose={() => setOpen(false)}
              onManage={() => { setOpen(false); onNavigate("products"); }}
            />
          )}
        </div>
      </div>

      {/* SSO loading overlay */}
      {ssoTarget && (
        <SsoOverlay product={ssoTarget} onDone={handleSsoDone}/>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── PAGES ─────────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function DashboardPage({ toast, products }) {
  const ok   = LOGS_INIT.filter(l => l.type === "success").length;
  const fail = LOGS_INIT.filter(l => l.type !== "success").length;
  return (
    <div className="page-anim">
      <h2 style={{ fontSize:18, fontWeight:600, marginBottom:4 }}>Dashboard</h2>
      <p style={{ fontSize:12, color:"var(--text3)", marginBottom:20 }}>SSO activity overview for this site</p>

      <div style={{ ...S.card, display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:40, height:40, background:"var(--accent-bg)", borderRadius:"var(--radius-md)", display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid var(--border1)", color:"var(--accent)" }}>
            <Ico d={I.shield} size={18}/>
          </div>
          <div>
            <p style={{ fontSize:14, fontWeight:600, marginBottom:2 }}>ABC HR Portal</p>
            <p style={{ fontSize:11, color:"var(--text3)" }}>https://abc.com</p>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Badge status="active"/>
          <span style={{ fontSize:11, color:"var(--text3)" }}>{products.filter(p=>p.is_active).length} active products</span>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:18 }}>
        <StatCard label="Total attempts" value={LOGS_INIT.length}/>
        <StatCard label="Successful"     value={ok}     color="var(--success)"/>
        <StatCard label="Failed"         value={fail}   color="var(--danger)"/>
        <StatCard label="Avg response"   value="240ms"/>
      </div>

      {/* Switcher preview callout */}
      <div style={{ background:"var(--accent-bg)", border:"1px solid rgba(37,99,235,.18)", borderRadius:"var(--radius-lg)", padding:"14px 18px", marginBottom:18, display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ width:40, height:40, background:"var(--accent)", borderRadius:"var(--radius-md)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,4px)", gap:2 }}>
            {Array(9).fill(0).map((_,i) => <span key={i} style={{ width:4, height:4, background:"#fff", borderRadius:"50%", display:"block" }}/>)}
          </div>
        </div>
        <div>
          <p style={{ fontSize:13, fontWeight:600, color:"var(--accent-text)", marginBottom:3 }}>Product switcher is live</p>
          <p style={{ fontSize:11, color:"var(--accent-text)", opacity:0.8 }}>
            Click the <strong>⋮⋮⋮ grid icon</strong> in the top-right bar to switch between {products.filter(p=>p.is_active).length} active products seamlessly.
          </p>
        </div>
      </div>

      <div style={{ ...S.card, padding:0, overflow:"hidden" }}>
        <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--border1)", fontSize:13, fontWeight:600 }}>Recent auth attempts</div>
        <table>
          <thead><tr><th>User</th><th>Route</th><th>Status</th><th>IP</th><th>Time</th></tr></thead>
          <tbody>{LOGS_INIT.slice(0,4).map(l => (
            <tr key={l.id}>
              <td style={{ fontWeight:500 }}>{l.email}</td>
              <td><span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text3)" }}>{l.from} → {l.to}</span></td>
              <td><Badge status={l.reason||l.type}/></td>
              <td><span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text3)" }}>{l.ip}</span></td>
              <td style={{ color:"var(--text3)", fontSize:11 }}>{l.time}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function ProductsPage({ toast, products, setProducts }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm]         = useState({ name:"", domain:"", route:"/dashboard", web_key:"", is_active:true, image:null });
  const [saving, setSaving]     = useState(false);

  const openAdd  = () => { setForm({ name:"", domain:"", route:"/dashboard", web_key:"", is_active:true, image:null }); setEditId(null); setShowForm(true); };
  const openEdit = p  => { setForm({ name:p.name, domain:p.domain, route:p.route, web_key:p.web_key, is_active:p.is_active, image:p.image||null }); setEditId(p.id); setShowForm(true); };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2*1024*1024) { toast("Image must be under 2MB","error"); return; }
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, image: ev.target.result, image_name: file.name }));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!form.name.trim() || !form.domain.trim() || !form.web_key.trim()) { toast("Fill in all required fields","error"); return; }
    setSaving(true); await new Promise(r=>setTimeout(r,600));
    if (editId) {
      setProducts(prev => prev.map(p => p.id===editId ? {...p,...form} : p));
      toast("Product updated","success");
    } else {
      setProducts(prev => [...prev, { ...form, id:Date.now(), created_at:new Date().toISOString().split("T")[0] }]);
      toast("Product added","success");
    }
    setSaving(false); setShowForm(false); setEditId(null);
  };

  const fullUrl = (p) => `${p.domain}${p.route || "/"}`;

  return (
    <div className="page-anim">
      <div style={{ ...S.row, marginBottom:18 }}>
        <div>
          <h2 style={{ fontSize:18, fontWeight:600, marginBottom:4 }}>Products</h2>
          <p style={{ fontSize:12, color:"var(--text3)" }}>Remote sites available in the product switcher</p>
        </div>
        <Btn variant="primary" onClick={openAdd}><Ico d={I.plus} size={12}/> Add product</Btn>
      </div>

      {/* Stats */}
      <div style={{ display:"flex", gap:10, marginBottom:18 }}>
        {[["Total",products.length,""],["Active",products.filter(p=>p.is_active).length,"var(--success)"],["Inactive",products.filter(p=>!p.is_active).length,"var(--text3)"]].map(([l,v,c]) => (
          <div key={l} style={{ background:"var(--bg2)", borderRadius:"var(--radius-md)", padding:"10px 14px", flex:1 }}>
            <p style={{ fontSize:10, fontWeight:600, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:5 }}>{l}</p>
            <p style={{ fontSize:20, fontWeight:700, color:c||"var(--text1)" }}>{v}</p>
          </div>
        ))}
        <div style={{ background:"var(--bg2)", borderRadius:"var(--radius-md)", padding:"10px 14px", flex:3 }}>
          <p style={{ fontSize:10, fontWeight:600, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:5 }}>Switcher endpoint</p>
          <code style={{ fontSize:11, color:"var(--text1)" }}>POST /wp-json/product-sso/v1/generate-auth-key</code>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ ...S.card, marginBottom:16 }}>
          <p style={S.sectionTitle}>{editId ? "Edit product" : "Add product"}</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:4 }}>
            <Field label="Product name *">
              <input type="text" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. ABC HR"/>
            </Field>
            <Field label="Product image" hint="PNG, JPG, SVG — max 2MB">
              {form.image ? (
                <div style={{ display:"flex", alignItems:"center", gap:10, background:"var(--bg2)", borderRadius:"var(--radius-sm)", padding:"6px 10px" }}>
                  <img src={form.image} style={{ width:32, height:32, objectFit:"contain", borderRadius:4, border:"1px solid var(--border1)", background:"#fff" }}/>
                  <span style={{ fontSize:11, color:"var(--text2)", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{form.image_name}</span>
                  <button onClick={() => setForm(f=>({...f,image:null,image_name:null}))} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--danger)", padding:2 }}><Ico d={I.x} size={12}/></button>
                </div>
              ) : (
                <label style={{ display:"flex", alignItems:"center", gap:8, background:"var(--bg1)", border:"1.5px dashed var(--border2)", borderRadius:"var(--radius-sm)", padding:"8px 12px", cursor:"pointer", fontSize:12, color:"var(--text3)", transition:"border-color .15s" }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="var(--accent)"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border2)"}>
                  <Ico d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M17 8l-5-5-5 5 M12 3v12" size={14}/>
                  Click to upload logo
                  <input type="file" accept="image/*" style={{ display:"none" }} onChange={handleImage}/>
                </label>
              )}
            </Field>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:4 }}>
            <Field label="Domain *" hint="Full domain including https://">
              <input type="text" value={form.domain} onChange={e=>setForm(f=>({...f,domain:e.target.value}))} placeholder="https://abc.com"/>
            </Field>
            <Field label="Redirect route" hint="Path user lands on after SSO login">
              <input type="text" value={form.route} onChange={e=>setForm(f=>({...f,route:e.target.value}))} placeholder="/dashboard"/>
            </Field>
          </div>
          {/* URL preview */}
          {(form.domain || form.route) && (
            <div style={{ background:"var(--bg2)", borderRadius:"var(--radius-sm)", padding:"6px 10px", marginBottom:12, fontFamily:"var(--mono)", fontSize:11 }}>
              <span style={{ color:"var(--text3)" }}>Redirect URL: </span>
              <span style={{ color:"var(--text1)", fontWeight:500 }}>{form.domain}</span>
              <span style={{ color:"var(--accent)" }}>{form.route || "/"}</span>
            </div>
          )}
          <Field label="Web key (from target site) *" hint="Copy from the target site's SSO settings → Web key page">
            <input type="password" value={form.web_key} onChange={e=>setForm(f=>({...f,web_key:e.target.value}))} placeholder="Paste the target site's web key"/>
          </Field>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:4, borderTop:"1px solid var(--border1)" }}>
            <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, cursor:"pointer" }}>
              <ToggleSwitch value={form.is_active} onChange={v=>setForm(f=>({...f,is_active:v}))}/>
              <span style={{ color:"var(--text2)", marginLeft:4 }}>Active (visible in switcher)</span>
            </label>
            <div style={{ display:"flex", gap:8 }}>
              <Btn onClick={()=>{setShowForm(false);setEditId(null);}}>Cancel</Btn>
              <Btn variant="primary" onClick={save} loading={saving}>{editId?"Save changes":"Add product"}</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ ...S.card, padding:0, overflow:"hidden" }}>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Domain</th>
              <th>Route</th>
              <th>Full URL</th>
              <th>Web key</th>
              <th>Status</th>
              <th>Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>{products.map((p, i) => {
            const [bg, color] = AVATAR_COLORS[i % AVATAR_COLORS.length];
            return (
              <tr key={p.id}>
                <td>
                  <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                    <div style={{ width:32, height:32, borderRadius:"var(--radius-sm)", background:p.image?"var(--bg2)":bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color, flexShrink:0, overflow:"hidden", border:"1px solid var(--border1)" }}>
                      {p.image
                        ? <img src={p.image} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
                        : p.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                    </div>
                    <span style={{ fontWeight:600, fontSize:12 }}>{p.name}</span>
                  </div>
                </td>
                <td><span style={{ fontFamily:"var(--mono)", fontSize:10, fontWeight:500 }}>{p.domain}</span></td>
                <td><span style={{ fontFamily:"var(--mono)", fontSize:10, background:"var(--accent-bg)", color:"var(--accent-text)", padding:"2px 7px", borderRadius:4, fontWeight:500 }}>{p.route||"/"}</span></td>
                <td>
                  <a href={fullUrl(p)} target="_blank" rel="noopener noreferrer"
                    style={{ fontFamily:"var(--mono)", fontSize:10, display:"flex", alignItems:"center", gap:4 }}>
                    {fullUrl(p).replace("https://","")}
                    <Ico d={I.externalLink} size={10}/>
                  </a>
                </td>
                <td><code>{"•".repeat(8)} {p.web_key.slice(-4)}</code></td>
                <td><Badge status={p.is_active?"active":"inactive"}/></td>
                <td style={{ color:"var(--text3)", fontSize:11 }}>{p.created_at}</td>
                <td>
                  <div style={{ display:"flex", gap:5 }}>
                    <Btn size="sm" onClick={()=>openEdit(p)}><Ico d={I.edit} size={11}/> Edit</Btn>
                    <Btn size="sm" variant="danger" onClick={()=>setDeleteId(p.id)}><Ico d={I.trash} size={11}/></Btn>
                  </div>
                </td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>

      {/* Tip */}
      <div style={{ marginTop:14, background:"var(--accent-bg)", border:"1px solid rgba(37,99,235,.12)", borderRadius:"var(--radius-md)", padding:"10px 14px", display:"flex", alignItems:"center", gap:9 }}>
        <span style={{ color:"var(--accent)" }}><Ico d={I.shield} size={13}/></span>
        <p style={{ fontSize:11, color:"var(--accent-text)", lineHeight:1.6 }}>
          <strong>Active products</strong> appear in the <strong>⋮⋮⋮ grid switcher</strong> in the top bar. Click it to try switching between products.
        </p>
      </div>

      {deleteId && (
        <Modal title="Delete product" onClose={()=>setDeleteId(null)} width={380}>
          <p style={{ fontSize:13, color:"var(--text2)", lineHeight:1.6, marginBottom:20 }}>This will remove the product from the switcher and delete all stored auth data. Active sessions on the remote site won't be affected.</p>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <Btn onClick={()=>setDeleteId(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={()=>{ setProducts(p=>p.filter(x=>x.id!==deleteId)); setDeleteId(null); toast("Product deleted","success"); }}>Delete</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function WebKeyPage({ toast }) {
  const [webKey] = useState("SajneibaAkhAYWBIWU_9f2a1b3c4d5e6f7a");
  const [visible, setVisible] = useState(false);
  const [pin, setPin]         = useState("");
  const [copied, setCopied]   = useState(false);
  const [regen, setRegen]     = useState(false);

  const copyKey = async () => {
    await navigator.clipboard.writeText(webKey).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false),2000);
    toast("Web key copied","success");
  };
  const regenKey = async () => {
    if (pin.length < 4) { toast("PIN must be at least 4 characters","error"); return; }
    setRegen(true); await new Promise(r=>setTimeout(r,800)); setRegen(false);
    setPin(""); setVisible(false);
    toast("Web key regenerated successfully","success");
  };

  return (
    <div className="page-anim">
      <h2 style={{ fontSize:18, fontWeight:600, marginBottom:4 }}>Web key</h2>
      <p style={{ fontSize:12, color:"var(--text3)", marginBottom:20 }}>This site's HMAC signing key — share it with remote sites</p>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
        <div style={S.card}>
          <p style={S.sectionTitle}>Current web key</p>
          <div style={{ background:"var(--bg2)", borderRadius:"var(--radius-sm)", padding:"10px 12px", fontFamily:"var(--mono)", fontSize:11, wordBreak:"break-all", marginBottom:12, letterSpacing:"0.04em" }}>
            {visible ? webKey : "wk_" + "•".repeat(webKey.length - 3)}
          </div>
          <div style={{ display:"flex", gap:7 }}>
            <Btn size="sm" onClick={()=>setVisible(v=>!v)}><Ico d={visible?I.eyeOff:I.eye} size={11}/>{visible?" Hide":" Reveal"}</Btn>
            <Btn size="sm" onClick={copyKey}><Ico d={copied?I.check:I.copy} size={11}/>{copied?" Copied!":" Copy"}</Btn>
          </div>
        </div>
        <div style={S.card}>
          <p style={S.sectionTitle}>Key properties</p>
          {[["Algorithm","HMAC-SHA256"],["Encoding","Base64"],["Token lifetime","30 seconds"],["Storage","WordPress options"]].map(([k,v]) => (
            <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"6px 0", borderBottom:"1px solid var(--border1)" }}>
              <span style={{ color:"var(--text3)" }}>{k}</span>
              <span style={{ fontWeight:500, fontFamily:["Algorithm","Encoding"].includes(k)?"var(--mono)":undefined }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={S.card}>
        <p style={S.sectionTitle}>Regenerate web key</p>
        <p style={{ fontSize:12, color:"var(--text3)", marginBottom:12, lineHeight:1.6 }}>Generate a new key using a PIN. All connected sites must be updated immediately — in-flight tokens will be invalidated.</p>
        <div style={{ background:"var(--warn-bg)", border:"1px solid var(--warn)", borderRadius:"var(--radius-sm)", padding:"9px 13px", marginBottom:14, display:"flex", gap:8, alignItems:"flex-start" }}>
          <span style={{ color:"var(--warn)", flexShrink:0 }}><Ico d={I.alert} size={13}/></span>
          <p style={{ fontSize:11, color:"var(--warn)", lineHeight:1.6 }}>Coordinate with all connected site admins before regenerating. This cannot be undone.</p>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"flex-end" }}>
          <div style={{ flex:1 }}>
            <Field label="Security PIN (min. 4 characters)">
              <input type="password" value={pin} onChange={e=>setPin(e.target.value)} placeholder="Enter your PIN"/>
            </Field>
          </div>
          <div style={{ paddingBottom:14 }}>
            <Btn variant="danger" onClick={regenKey} loading={regen} disabled={pin.length<4}><Ico d={I.refresh} size={12}/> Regenerate key</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogsPage({ toast }) {
  const [logs, setLogs]     = useState(LOGS_INIT);
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? logs : logs.filter(l => l.type===filter || l.reason===filter);

  return (
    <div className="page-anim">
      <div style={{ ...S.row, marginBottom:16 }}>
        <div>
          <h2 style={{ fontSize:18, fontWeight:600, marginBottom:4 }}>Auth logs</h2>
          <p style={{ fontSize:12, color:"var(--text3)" }}>All authentication attempts on this site</p>
        </div>
        <Btn size="sm" variant="danger" onClick={()=>{setLogs([]);toast("Logs cleared","success");}}><Ico d={I.trash} size={11}/> Clear</Btn>
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
        {[["all","All"],["success","Success"],["failure","Failed"],["device_mismatch","Device mismatch"],["token_expired","Expired"]].map(([v,l]) => (
          <button key={v} onClick={()=>setFilter(v)} style={{ fontSize:11, padding:"4px 11px", borderRadius:20, cursor:"pointer", fontFamily:"inherit", fontWeight:500, transition:"all 0.12s", background:filter===v?"var(--accent)":"var(--bg0)", color:filter===v?"#fff":"var(--text2)", border:`1px solid ${filter===v?"var(--accent)":"var(--border2)"}` }}>{l}</button>
        ))}
      </div>
      <div style={{ ...S.card, padding:0, overflow:"hidden" }}>
        <table>
          <thead><tr><th>Time</th><th>User</th><th>Route</th><th>IP</th><th>Result</th><th>Reason</th></tr></thead>
          <tbody>{filtered.length===0
            ? <tr><td colSpan={6} style={{ textAlign:"center", padding:32, color:"var(--text3)" }}>No entries found</td></tr>
            : filtered.map(l => (
              <tr key={l.id}>
                <td style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text3)" }}>{l.time}</td>
                <td style={{ fontWeight:500 }}>{l.email}</td>
                <td><span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text3)" }}>{l.from}→{l.to}</span></td>
                <td><span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text3)" }}>{l.ip}</span></td>
                <td><Badge status={l.type}/></td>
                <td>{l.reason ? <Badge status={l.reason}/> : <span style={{ color:"var(--text3)" }}>—</span>}</td>
              </tr>
            ))
          }</tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsPage({ toast }) {
  const [s, setS]     = useState({ ttl:30, strict_device:true, strict_ip:false, rate_limit:true, logging:true, https:true });
  const set           = (k,v) => setS(prev=>({...prev,[k]:v}));
  const [saving, setSaving] = useState(false);
  const save = async () => { setSaving(true); await new Promise(r=>setTimeout(r,700)); setSaving(false); toast("Settings saved","success"); };

  return (
    <div className="page-anim">
      <h2 style={{ fontSize:18, fontWeight:600, marginBottom:4 }}>Settings</h2>
      <p style={{ fontSize:12, color:"var(--text3)", marginBottom:20 }}>Configure SSO security behaviour and limits</p>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
        <div style={S.card}>
          <p style={S.sectionTitle}>Token lifetime</p>
          <p style={{ fontSize:11, color:"var(--text3)", marginBottom:14 }}>Auth keys expire after this many seconds. 30s is recommended.</p>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <input type="range" min={10} max={120} step={5} value={s.ttl} onChange={e=>set("ttl",+e.target.value)} style={{ flex:1 }}/>
            <span style={{ fontSize:16, fontWeight:700, color:"var(--accent)", minWidth:40 }}>{s.ttl}s</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--text3)" }}><span>10s (min)</span><span>120s (max)</span></div>
        </div>
        <div style={S.card}>
          <p style={S.sectionTitle}>Rate limiting</p>
          <SettingRow label="Enable rate limiting" hint="Block brute-force auth attempts" value={s.rate_limit} onChange={v=>set("rate_limit",v)}/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:12, opacity:s.rate_limit?1:0.4, pointerEvents:s.rate_limit?"all":"none" }}>
            <Field label="Max attempts"><input type="number" defaultValue={5} style={{ fontSize:12 }}/></Field>
            <Field label="Window (s)"><input type="number" defaultValue={60} style={{ fontSize:12 }}/></Field>
          </div>
        </div>
      </div>

      <div style={{ ...S.card, marginBottom:14 }}>
        <p style={S.sectionTitle}>Device & IP binding</p>
        <SettingRow label="Strict device binding" hint="Reject if browser, OS, or screen resolution changes" value={s.strict_device} onChange={v=>set("strict_device",v)}/>
        <SettingRow label="Strict IP binding"     hint="Require exact IP match instead of subnet tolerance"  value={s.strict_ip}     onChange={v=>set("strict_ip",v)}/>
        <SettingRow label="Require HTTPS"          hint="Reject any SSO request over plain HTTP"             value={s.https}         onChange={v=>set("https",v)}/>
      </div>

      <div style={{ ...S.card, marginBottom:18 }}>
        <p style={S.sectionTitle}>Logging</p>
        <SettingRow label="Enable auth logging" hint="Store all attempts in wp_sso_logs. Keys are hashed, never logged in full." value={s.logging} onChange={v=>set("logging",v)}/>
      </div>

      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <Btn variant="primary" size="lg" onClick={save} loading={saving}>Save settings</Btn>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── APP SHELL ──────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const NAV = [
  { id:"dashboard", label:"Dashboard" },
  { id:"products",  label:"Products"  },
  { id:"webkey",    label:"Web key"   },
  { id:"logs",      label:"Auth logs" },
  { id:"settings",  label:"Settings"  },
];

export default function App() {
  const [theme, setTheme]   = useTheme();
  const [page, setPage]     = useState("dashboard");
  const [toast, setToast]   = useState(null);
  const [products, setProducts] = useState(PRODUCTS_INIT);
  const showToast = useCallback((msg, type="info") => setToast({ msg, type, id:Date.now() }), []);

  const pageProps = { toast:showToast, products, setProducts };
  const PAGES = {
    dashboard: () => <DashboardPage {...pageProps}/>,
    products:  () => <ProductsPage  {...pageProps}/>,
    webkey:    () => <WebKeyPage    toast={showToast}/>,
    logs:      () => <LogsPage      toast={showToast}/>,
    settings:  () => <SettingsPage  toast={showToast}/>,
  };

  return (
    <div data-theme={theme} style={{ display:"flex", flexDirection:"column", minHeight:"100vh", fontFamily:"system-ui,sans-serif", background:"var(--bg1)", color:"var(--text1)", transition:"background 0.25s,color 0.25s" }}>
      <ThemeStyles/>

      {/* ── Top bar with 9-dot switcher ── */}
      <TopBar
        products={products}
        currentSiteName="ABC HR"
        theme={theme}
        setTheme={setTheme}
        onNavigate={setPage}
      />

      {/* ── Body: sidebar + main ── */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* Sidebar */}
        <aside style={{ width:200, flexShrink:0, background:"var(--bg0)", borderRight:"1px solid var(--border1)", display:"flex", flexDirection:"column", transition:"background 0.25s,border-color 0.25s" }}>
          <div style={{ padding:"14px 16px", borderBottom:"1px solid var(--border1)", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:30, height:30, background:"var(--accent)", borderRadius:"var(--radius-md)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"#fff" }}>
              <Ico d={I.shield} size={15}/>
            </div>
            <div>
              <p style={{ fontSize:12, fontWeight:600, color:"var(--text1)" }}>SSO Settings</p>
              <p style={{ fontSize:10, color:"var(--text3)" }}>product-based-sso</p>
            </div>
          </div>

          <nav style={{ padding:"10px 8px", flex:1 }}>
            {NAV.map(n => (
              <button key={n.id} onClick={()=>setPage(n.id)}
                style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"7px 10px", borderRadius:"var(--radius-md)", border:"none", cursor:"pointer", textAlign:"left", fontFamily:"inherit", fontSize:12, fontWeight:page===n.id?500:400, marginBottom:2, transition:"all 0.15s", background:page===n.id?"var(--bg2)":"transparent", color:page===n.id?"var(--text1)":"var(--text2)" }}>
                <span style={{ color:page===n.id?"var(--text1)":"var(--text3)" }}><Ico d={I[n.id]} size={13}/></span>
                {n.label}
              </button>
            ))}
          </nav>

          <div style={{ padding:"10px 14px", borderTop:"1px solid var(--border1)" }}>
            <p style={{ fontSize:10, color:"var(--text3)", lineHeight:1.5 }}>v1.0.0<br/>/wp-json/product-sso/v1</p>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex:1, padding:"24px 28px", overflow:"auto", background:"var(--bg1)", transition:"background 0.25s" }}>
          {PAGES[page] ? PAGES[page]() : null}
        </main>
      </div>

      {toast && <Toast key={toast.id} msg={toast.msg} type={toast.type} onDismiss={()=>setToast(null)}/>}
    </div>
  );
}
