import { useEffect, useRef, useState } from "@wordpress/element";
import { api } from "../utils/api";
import { Ico, I } from "./Icon";

const SSO_STEPS = [
  "Verifying your session",
  "Generating auth token",
  "Encrypting with HMAC-SHA256",
  "Redirecting securely…",
];

export const ProductSwitcher = ({ inline = false }) => {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [ssoTarget, setSsoTarget] = useState(null);
  const [step, setStep] = useState(0);
  const wrapRef = useRef(null);
  const newTabRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    api("/products").then((p) => { if (mounted) setProducts(p || []); }).catch(()=>{});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!ssoTarget) return;
    setStep(0);
    const timers = [];
    SSO_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setStep(i), 600 * (i + 1)));
    });
    // final redirect
    timers.push(setTimeout(() => {
      try { if (newTabRef.current) newTabRef.current.location.href = ssoTarget.page_url || ssoTarget.domain || "/"; }
      catch (err) { /* ignore */ }
      newTabRef.current = null;
      setSsoTarget(null);
      setStep(0);
    }, 600 * (SSO_STEPS.length + 1)));

    return () => timers.forEach(t => clearTimeout(t));
  }, [ssoTarget]);

  const handleSwitch = (p) => {
    // open blank tab synchronously to avoid popup blockers, then show overlay
    try { newTabRef.current = window.open("", "_blank"); } catch (err) { newTabRef.current = null; }
    setSsoTarget(p);
  };

  const active = products.filter(p => p.is_active);

  const rootStyle = inline
    ? { position: "relative", zIndex: 1200, flexShrink: 0 }
    : { position: "fixed", top: 12, right: 12, zIndex: 1200 };

  return (
    <div ref={wrapRef} style={rootStyle}>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <button onClick={() => setOpen(o => !o)} title="Switch product"
          style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text2)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,4.5px)", gridTemplateRows: "repeat(3,4.5px)", gap: 2.5 }}>
            {Array(9).fill(0).map((_, i) => <span key={i} style={{ width:4.5, height:4.5, background: "currentColor", borderRadius: 99, display: "block" }} />)}
          </div>
        </button>

        {open && (
          <div style={{ position: "absolute", top: 44, right: 0, width: 300, background: "var(--bg0)", border: "1px solid var(--border2)", borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,.12)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text1)" }}>Your products</div>
              <button onClick={() => setOpen(false)} style={{ width: 32, height: 32, borderRadius: 32, border: "none", background: "var(--bg2)", cursor: "pointer" }}><Ico d={I.edit} size={13} /></button>
            </div>
            <div style={{ padding: 8, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
              {active.length === 0 ? (
                <div style={{ padding: 16, textAlign: "center", color: "var(--text3)", fontSize: 12 }}>No active products</div>
              ) : active.map((p, i) => (
                <button key={p.id} onClick={() => { handleSwitch(p); setOpen(false); }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, background: "transparent", border: "none", cursor: "pointer" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff", fontWeight: 800 }}>{(p.name||"").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</div>
                  <div style={{ fontSize: 11, color: "var(--text1)", textAlign: "center" }}>{p.name}</div>
                </button>
              ))}
            </div>
            <div style={{ height: 1, background: "var(--border1)", margin: "6px 0" }} />
            <div style={{ padding: 8, fontSize: 11, color: "var(--text3)", textAlign: "center" }}><Ico d={I.shield} size={10}/> Auth tokens expire in 30s · HMAC-SHA256</div>
          </div>
        )}

      </div>

      {ssoTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--bg0)", border: "1px solid var(--border1)", borderRadius: 12, padding: 28, minWidth: 260, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff", background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>{(ssoTarget.name||"").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text1)" }}>Switching to {ssoTarget.name}</div>
              <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>{ssoTarget.page_url || ssoTarget.domain || ""}</div>
            </div>
            <div style={{ width: 38, height: 38, border: "3px solid var(--border1)", borderTopColor: "var(--accent)", borderRadius: 999, animation: "spin 0.7s linear infinite" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
              {SSO_STEPS.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: step > i ? "var(--success)" : step === i ? "var(--text1)" : "var(--text3)", fontWeight: step === i ? 500 : 400 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 99, background: step > i ? "var(--success)" : "currentColor", flexShrink: 0 }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{step > i ? <Ico d={I.check} size={11} /> : null}{s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductSwitcher;
