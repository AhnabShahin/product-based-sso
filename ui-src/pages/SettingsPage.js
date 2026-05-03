import { useEffect, useState } from "@wordpress/element";
import { api } from "../utils/api";
import { Btn } from "../components/Button";
import { Field } from "../components/Field";
import { ToggleSwitch } from "../components/ToggleSwitch";

export const SettingsPage = ({ toast }) => {
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
  const set = (k, v) => setSettings(prev => ({ ...prev, [k]: v }));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("/settings")
      .then((data) => setSettings((prev) => ({ ...prev, ...data })))
      .catch(() => toast("Failed to load settings", "error"));
  }, [toast]);

  const save = async () => {
    setSaving(true);
    try {
      await api("/settings", { method: "POST", body: JSON.stringify(settings) });
      toast("Settings saved", "success");
    } catch (err) {
      toast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

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
            <input type="range" min={10} max={120} step={5} value={settings.token_lifetime} onChange={e => set("token_lifetime", +e.target.value)} style={{ flex: 1 }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)", minWidth: 40 }}>{settings.token_lifetime}s</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text3)" }}><span>10s (min)</span><span>120s (max)</span></div>
          <div style={{ paddingTop: 10 }}>
            <SettingRow label="Allow same-site re-auth" hint="Permit re-authentication on the same site" value={settings.allow_same_site_reauth} onChange={v => set("allow_same_site_reauth", v)} />
          </div>
        </div>
        <div style={{ background: "var(--bg0)", border: "1px solid var(--border1)", borderRadius: "var(--radius-lg)", padding: "18px 20px", transition: "background 0.25s, border-color 0.25s" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text1)", marginBottom: 12 }}>Rate limiting</p>
          <SettingRow label="Enable rate limiting" hint="Block brute-force auth attempts" value={settings.rate_limit_enabled} onChange={v => set("rate_limit_enabled", v)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12, opacity: settings.rate_limit_enabled ? 1 : 0.4, pointerEvents: settings.rate_limit_enabled ? "all" : "none" }}>
            <Field label="Max attempts"><input type="number" value={settings.rate_limit_attempts} onChange={e => set("rate_limit_attempts", Number(e.target.value))} style={{ fontSize: 12 }} /></Field>
            <Field label="Window (s)"><input type="number" value={settings.rate_limit_window} onChange={e => set("rate_limit_window", Number(e.target.value))} style={{ fontSize: 12 }} /></Field>
          </div>
        </div>
      </div>

      <div style={{ background: "var(--bg0)", border: "1px solid var(--border1)", borderRadius: "var(--radius-lg)", padding: "18px 20px", transition: "background 0.25s, border-color 0.25s", marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text1)", marginBottom: 12 }}>Device and IP binding</p>
        <SettingRow label="Strict device binding" hint="Reject if browser, OS, or screen resolution changes" value={settings.strict_device_binding} onChange={v => set("strict_device_binding", v)} />
        <SettingRow label="Strict IP binding" hint="Require exact IP match instead of subnet tolerance" value={settings.strict_ip_binding} onChange={v => set("strict_ip_binding", v)} />
        {!settings.strict_ip_binding && (
          <div style={{ paddingTop: 12 }}>
            <Field label="IP tolerance mode">
              <select value={settings.ip_tolerance} onChange={e => set("ip_tolerance", e.target.value)}>
                <option value="subnet">Same /24 subnet</option>
                <option value="any">Any IP (no restriction)</option>
              </select>
            </Field>
          </div>
        )}
        <SettingRow label="Require HTTPS" hint="Reject any SSO request over plain HTTP" value={settings.require_https} onChange={v => set("require_https", v)} />
      </div>

      <div style={{ background: "var(--bg0)", border: "1px solid var(--border1)", borderRadius: "var(--radius-lg)", padding: "18px 20px", transition: "background 0.25s, border-color 0.25s", marginBottom: 18 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text1)", marginBottom: 12 }}>Logging</p>
        <SettingRow label="Enable auth logging" hint="Store all attempts in wp_sso_logs. Keys are hashed, never logged in full." value={settings.logging_enabled} onChange={v => set("logging_enabled", v)} />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn variant="primary" size="lg" onClick={save} loading={saving}>Save settings</Btn>
      </div>
    </div>
  );
};
