import { useEffect, useState } from "@wordpress/element";
import { api } from "../utils/api";
import { Btn } from "../components/Button";
import { Field } from "../components/Field";
import { Ico, I } from "../components/Icon";

export const WebKeyPage = ({ toast }) => {
  const [webKey, setWebKey] = useState("");
  const [visible, setVisible] = useState(false);
  const [pin, setPin] = useState("");
  const [copied, setCopied] = useState(false);
  const [regen, setRegen] = useState(false);

  useEffect(() => {
    api("/web-key")
      .then((data) => setWebKey(data.web_key || ""))
      .catch(() => toast("Failed to load web key", "error"));
  }, [toast]);

  const copyKey = async () => {
    await navigator.clipboard.writeText(webKey).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    toast("Web key copied", "success");
  };
  const regenKey = async () => {
    if (pin.length < 4) { toast("PIN must be at least 4 characters", "error"); return; }
    setRegen(true);
    try {
      const data = await api("/web-key", { method: "POST", body: JSON.stringify({ pin }) });
      setWebKey(data.web_key || "");
      setPin("");
      setVisible(false);
      toast("Web key regenerated successfully", "success");
    } catch (err) {
      toast("Failed to regenerate web key", "error");
    } finally {
      setRegen(false);
    }
  };

  return (
    <div className="page-anim">
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Web key</h2>
      <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 20 }}>This site's HMAC signing key - share it with remote sites</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ background: "var(--bg0)", border: "1px solid var(--border1)", borderRadius: "var(--radius-lg)", padding: "18px 20px", transition: "background 0.25s, border-color 0.25s" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text1)", marginBottom: 12 }}>Current web key</p>
          <div style={{ background: "var(--bg2)", borderRadius: "var(--radius-sm)", padding: "10px 12px", fontFamily: "var(--mono)", fontSize: 11, wordBreak: "break-all", marginBottom: 12, letterSpacing: "0.04em" }}>
            {webKey ? (visible ? webKey : `${webKey.slice(0, 3)}${"*".repeat(Math.max(webKey.length - 3, 4))}`) : "-"}
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            <Btn size="sm" onClick={() => setVisible(v => !v)}><Ico d={visible ? I.eyeOff : I.eye} size={11} />{visible ? " Hide" : " Reveal"}</Btn>
            <Btn size="sm" onClick={copyKey}><Ico d={copied ? I.check : I.copy} size={11} />{copied ? " Copied!" : " Copy"}</Btn>
          </div>
        </div>
        <div style={{ background: "var(--bg0)", border: "1px solid var(--border1)", borderRadius: "var(--radius-lg)", padding: "18px 20px", transition: "background 0.25s, border-color 0.25s" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text1)", marginBottom: 12 }}>Key properties</p>
          {[["Algorithm", "HMAC-SHA256"], ["Encoding", "Base64"], ["Token lifetime", "30 seconds"], ["Storage", "WordPress options"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 0", borderBottom: "1px solid var(--border1)" }}>
              <span style={{ color: "var(--text3)" }}>{k}</span>
              <span style={{ fontWeight: 500, fontFamily: ["Algorithm", "Encoding"].includes(k) ? "var(--mono)" : undefined, fontSize: ["Algorithm", "Encoding"].includes(k) ? 11 : undefined }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--bg0)", border: "1px solid var(--border1)", borderRadius: "var(--radius-lg)", padding: "18px 20px", transition: "background 0.25s, border-color 0.25s" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text1)", marginBottom: 12 }}>Regenerate web key</p>
        <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12, lineHeight: 1.6 }}>Generate a new key using a PIN. All connected sites must be updated immediately - in-flight tokens will be invalidated.</p>
        <div style={{ background: "var(--warn-bg)", border: "1px solid var(--warn)", borderRadius: "var(--radius-sm)", padding: "9px 13px", marginBottom: 14, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span style={{ color: "var(--warn)", flexShrink: 0 }}><Ico d={I.alert} size={13} /></span>
          <p style={{ fontSize: 11, color: "var(--warn)", lineHeight: 1.6 }}>Coordinate with all connected site admins before regenerating. This cannot be undone.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Field label="Security PIN (min. 4 characters)">
              <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="Enter your PIN" />
            </Field>
          </div>
          <div style={{ paddingBottom: 14 }}>
            <Btn variant="danger" onClick={regenKey} loading={regen} disabled={pin.length < 4}><Ico d={I.refresh} size={12} /> Regenerate key</Btn>
          </div>
        </div>
      </div>
    </div>
  );
};
