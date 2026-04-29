import { useCallback, useEffect, useState } from "@wordpress/element";
import { api } from "../utils/api";
import { Badge } from "../components/Badge";
import { Btn } from "../components/Button";
import { Icon, Icons } from "../components/Icon";

export const LogsPage = ({ toast }) => {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [clearing, setClearing] = useState(false);

  const loadLogs = useCallback(() => {
    api(`/logs?limit=50&filter=${encodeURIComponent(filter)}`)
      .then(setLogs)
      .catch(() => toast("Failed to load logs", "error"));
  }, [filter, toast]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const clearLogs = async () => {
    setClearing(true);
    try {
      await api("/logs", { method: "DELETE" });
      setLogs([]);
      toast("Logs cleared", "success");
    } catch (err) {
      toast("Failed to clear logs", "error");
    } finally {
      setClearing(false);
    }
  };

  const filtered = filter === "all" ? logs : logs.filter(l => l.event_type === filter || l.error_reason === filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 500 }}>Auth logs</h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>All authentication attempts on this site</p>
        </div>
        <Btn size="sm" variant="danger" onClick={clearLogs} loading={clearing}><Icon d={Icons.trash} size={11} /> Clear logs</Btn>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[["all", "All"], ["success", "Success"], ["failure", "Failed"], ["device_mismatch", "Device mismatch"], ["token_expired", "Expired"], ["user_not_found", "User not found"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, border: "0.5px solid",
              cursor: "pointer", fontFamily: "inherit",
              borderColor: filter === val ? "var(--color-border-primary)" : "var(--color-border-tertiary)",
              background: filter === val ? "var(--color-text-primary)" : "var(--color-background-primary)",
              color: filter === val ? "var(--color-background-primary)" : "var(--color-text-secondary)" }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-secondary)", fontSize: 14 }}>
            No log entries found.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--color-background-secondary)" }}>
                {["Time", "User", "Route", "IP", "Device", "Result", "Reason"].map(h => (
                  <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, fontWeight: 500,
                    color: "var(--color-text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase",
                    borderBottom: "0.5px solid var(--color-border-tertiary)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => (
                <tr key={log.id || i} style={{ borderBottom: i < filtered.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none" }}>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: "var(--color-text-secondary)", whiteSpace: "nowrap", fontFamily: "var(--font-mono)" }}>{log.created_at}</td>
                  <td style={{ padding: "10px 14px", color: "var(--color-text-primary)" }}>{log.user_email || "—"}</td>
                  <td style={{ padding: "10px 14px", color: "var(--color-text-secondary)", fontSize: 11, fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                    {log.source_product || "—"} -> {log.target_product || "—"}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" }}>{log.ip_address || "—"}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <code style={{ fontSize: 10, fontFamily: "var(--font-mono)", background: "var(--color-background-secondary)",
                      padding: "2px 6px", borderRadius: 4, color: "var(--color-text-secondary)" }}>
                      {log.device_fingerprint || "—"}
                    </code>
                  </td>
                  <td style={{ padding: "10px 14px" }}><Badge status={log.event_type} /></td>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: "var(--color-text-secondary)" }}>
                    {log.error_reason ? <Badge status={log.error_reason} /> : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
