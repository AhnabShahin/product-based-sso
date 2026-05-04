import { useEffect, useRef, useState } from "@wordpress/element";
import { api } from "../utils/api";
import { Ico, I } from "./Icon";

const SSO_STEPS = [
  "Verifying your session",
  "Collecting browser, OS, IP, and screen details",
  "Generating signed auth token with nonce and web key",
  "Redirecting with secure auth_token",
];

const getBrowserName = () => {
  const ua = navigator.userAgent || "";
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("OPR/")) return "Opera";
  if (ua.includes("Chrome/")) return "Chrome";
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Safari/")) return "Safari";
  return "Unknown";
};

const getOsName = () => {
  const platform = `${navigator.userAgent || ""} ${navigator.platform || ""}`.toLowerCase();
  if (platform.includes("win")) return "Windows";
  if (platform.includes("mac")) return "macOS";
  if (platform.includes("android")) return "Android";
  if (platform.includes("iphone") || platform.includes("ipad") || platform.includes("ios")) return "iOS";
  if (platform.includes("linux")) return "Linux";
  return "Unknown";
};

const hash = (input) => {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = (h * 33) ^ input.charCodeAt(i);
  return (h >>> 0).toString(16);
};

const DEVICE_PARAMS = ["device_fingerprint", "browser", "os", "platform", "screen_resolution", "timezone", "accept_language"];

const cleanRedirectUrl = (url) => {
  try {
    const u = new URL(url);
    DEVICE_PARAMS.forEach((p) => u.searchParams.delete(p));
    return u.toString();
  } catch {
    return url;
  }
};

const collectDeviceContext = () => {
  const screenResolution = `${window.screen?.width || 0}x${window.screen?.height || 0}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const acceptLanguage = navigator.language || "";
  const platform = navigator.platform || "";
  const userAgent = navigator.userAgent || "";
  const deviceFingerprint = hash([userAgent, acceptLanguage, platform, screenResolution, timezone].join("|"));

  return {
    browser: getBrowserName(),
    os: getOsName(),
    platform,
    screen_resolution: screenResolution,
    timezone,
    accept_language: acceptLanguage,
    device_fingerprint: deviceFingerprint,
  };
};

export const ProductSwitcher = ({ inline = false, toast }) => {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [ssoTarget, setSsoTarget] = useState(null);
  const [step, setStep] = useState(0);
  const wrapRef = useRef(null);

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
    let cancelled = false;
    const timers = [];

    // Advance step after each interval; setStep(i+1) so reaching SSO_STEPS.length means all done
    SSO_STEPS.forEach((_, i) =>
      timers.push(setTimeout(() => { if (!cancelled) setStep(i + 1); }, 600 * (i + 1)))
    );

    let pendingData = null;
    let stepsComplete = false;

    const doRedirect = (data) => {
      if (cancelled) return;
      const url = cleanRedirectUrl(data.redirect_url);
      if (data.open_target === "new_tab") {
        // window.open() with "noopener" always returns null by spec — never use
        // the return value to detect popup blocking when noopener is present.
        window.open(url, "_blank", "noopener,noreferrer");
        setSsoTarget(null); // close modal; current tab stays untouched
      } else {
        window.location.href = url;
      }
    };

    // Fire redirect only after all step animations finish
    timers.push(setTimeout(() => {
      stepsComplete = true;
      if (pendingData) doRedirect(pendingData);
    }, 600 * SSO_STEPS.length + 200));

    api("/switch-token", {
      method: "POST",
      body: JSON.stringify({ product_id: ssoTarget.id, ...collectDeviceContext() }),
    })
      .then((data) => {
        if (cancelled || !data?.redirect_url) return;
        if (stepsComplete) {
          doRedirect(data);
        } else {
          pendingData = data;
        }
      })
      .catch((error) => {
        if (cancelled) return;
        const message = error?.message || "Failed to generate SSO auth token.";
        if (typeof toast === "function") {
          toast(message, "error");
        } else {
          window.alert(message);
        }
        setSsoTarget(null);
        setStep(0);
      });

    return () => {
      cancelled = true;
      timers.forEach(t => clearTimeout(t));
    };
  }, [ssoTarget]);

  const handleSwitch = (p) => {
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
              ) : active.map((p) => (
                <button key={p.id} onClick={() => { handleSwitch(p); setOpen(false); }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, background: "transparent", border: "none", cursor: "pointer" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff", fontWeight: 800 }}>{(p.name||"").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</div>
                  <div style={{ fontSize: 11, color: "var(--text1)", textAlign: "center" }}>{p.name}</div>
                </button>
              ))}
            </div>
            <div style={{ height: 1, background: "var(--border1)", margin: "6px 0" }} />
            <div style={{ padding: 8, fontSize: 11, color: "var(--text3)", textAlign: "center" }}><Ico d={I.shield} size={10}/> Auth token carries IP, browser, screen, nonce · HMAC-SHA256</div>
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
