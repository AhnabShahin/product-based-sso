import { useEffect, useState } from "@wordpress/element";
import { api } from "../utils/api";
import { Btn } from "../components/Button";
import { Field } from "../components/Field";
import { Input } from "../components/Input";

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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("/settings")
      .then((data) => setSettings((prev) => ({ ...prev, ...data })))
      .catch(() => toast("Failed to load settings", "error"));
  }, [toast]);

  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));

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
          Authentication logs never store full auth keys or web keys - only hashes.
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
