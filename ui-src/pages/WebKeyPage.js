import { useEffect, useState } from "@wordpress/element";
import { api } from "../utils/api";
import { Btn } from "../components/Button";
import { Field } from "../components/Field";
import { Icon, Icons } from "../components/Icon";
import { Input } from "../components/Input";
import { Modal } from "../components/Modal";

export const WebKeyPage = ({ toast }) => {
  const [webKey, setWebKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [pin, setPin] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);

  useEffect(() => {
    api("/web-key")
      .then((data) => setWebKey(data.web_key || ""))
      .catch(() => toast("Failed to load web key", "error"));
  }, [toast]);

  const generateKey = async () => {
    if (!pin || pin.length < 4) { toast("Enter a PIN of at least 4 characters", "error"); return; }
    setGenerating(true);
    try {
      const data = await api("/web-key", { method: "POST", body: JSON.stringify({ pin }) });
      setWebKey(data.web_key || "");
      setPin("");
      setShowRegenConfirm(false);
      toast("Web key regenerated. Share it with connected sites.", "success");
    } catch (err) {
      toast("Failed to regenerate web key", "error");
    } finally {
      setGenerating(false);
    }
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
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>This site's signing key - share it with sites that need to authenticate users here</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-lg)", padding: "20px 24px" }}>
          <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 500 }}>Current web key</p>
          <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)",
            padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 12,
            color: "var(--color-text-primary)", wordBreak: "break-all", marginBottom: 12, letterSpacing: "0.05em" }}>
            {showKey ? webKey : webKey.replace(/[^wk_]/g, "*")}
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
          <li>Go to the other site's SSO plugin - Products page</li>
          <li>Add this site as a product and paste the web key in the web key field</li>
          <li>Do the same in reverse: copy the other site's web key and add it here</li>
        </ol>
      </div>
    </div>
  );
};
