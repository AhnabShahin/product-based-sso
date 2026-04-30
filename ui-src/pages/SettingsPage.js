import { useState } from "@wordpress/element";
import { Btn } from "../components/Button";
import { Field } from "../components/Field";
import { ToggleSwitch } from "../components/ToggleSwitch";

export const SettingsPage = ({ toast }) => {
  const [s, setS] = useState({ ttl: 30, strict_device: true, strict_ip: false, rate_limit: true, logging: true, https: true });
  const set = (k, v) => setS(prev => ({ ...prev, [k]: v }));
  const [saving, setSaving] = useState(false);
  const save = async () => { setSaving(true); await new Promise(r => setTimeout(r, 700)); setSaving(false); toast("Settings saved", "success"); };

  const SettingRow = ({ label, hint, value, onChange }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border1)" }}>
      <div>
        <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text1)", marginBottom: 2 }}>{label}</p>
        {hint && <p style={{ fontSize: 11, color: "var(--text3)" }}>{hint}</p>}
      </div>
      <ToggleSwitch value={value} onChange={onChange} />
    </div>
  );

  return (
    <div className="page-anim">
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Settings</h2>
      <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 20 }}>Configure SSO security behavior and limits</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ background: "var(--bg0)", border: "1px solid var(--border1)", borderRadius: "var(--radius-lg)", padding: "18px 20px", transition: "background 0.25s, border-color 0.25s" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text1)", marginBottom: 12 }}>Token lifetime</p>
          <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 14 }}>Auth keys expire after this many seconds. 30s is recommended.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <input type="range" min={10} max={120} step={5} value={s.ttl} onChange={e => set("ttl", +e.target.value)} style={{ flex: 1 }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)", minWidth: 40 }}>{s.ttl}s</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text3)" }}><span>10s (min)</span><span>120s (max)</span></div>
        </div>
        <div style={{ background: "var(--bg0)", border: "1px solid var(--border1)", borderRadius: "var(--radius-lg)", padding: "18px 20px", transition: "background 0.25s, border-color 0.25s" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text1)", marginBottom: 12 }}>Rate limiting</p>
          <SettingRow label="Enable rate limiting" hint="Block brute-force auth attempts" value={s.rate_limit} onChange={v => set("rate_limit", v)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12, opacity: s.rate_limit ? 1 : 0.4, pointerEvents: s.rate_limit ? "all" : "none" }}>
            <Field label="Max attempts"><input type="number" defaultValue={5} style={{ fontSize: 12 }} /></Field>
            <Field label="Window (s)"><input type="number" defaultValue={60} style={{ fontSize: 12 }} /></Field>
          </div>
        </div>
      </div>

      <div style={{ background: "var(--bg0)", border: "1px solid var(--border1)", borderRadius: "var(--radius-lg)", padding: "18px 20px", transition: "background 0.25s, border-color 0.25s", marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text1)", marginBottom: 12 }}>Device and IP binding</p>
        <SettingRow label="Strict device binding" hint="Reject if browser, OS, or screen resolution changes" value={s.strict_device} onChange={v => set("strict_device", v)} />
        <SettingRow label="Strict IP binding" hint="Require exact IP match instead of subnet tolerance" value={s.strict_ip} onChange={v => set("strict_ip", v)} />
        <SettingRow label="Require HTTPS" hint="Reject any SSO request over plain HTTP" value={s.https} onChange={v => set("https", v)} />
      </div>

      <div style={{ background: "var(--bg0)", border: "1px solid var(--border1)", borderRadius: "var(--radius-lg)", padding: "18px 20px", transition: "background 0.25s, border-color 0.25s", marginBottom: 18 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text1)", marginBottom: 12 }}>Logging</p>
        <SettingRow label="Enable auth logging" hint="Store all attempts in wp_sso_logs. Keys are hashed, never logged in full." value={s.logging} onChange={v => set("logging", v)} />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn variant="primary" size="lg" onClick={save} loading={saving}>Save settings</Btn>
      </div>
    </div>
  );
};
