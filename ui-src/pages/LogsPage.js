import { useCallback, useEffect, useState } from "@wordpress/element";
import { api } from "../utils/api";
import { Badge } from "../components/Badge";
import { Btn } from "../components/Button";
import { Ico, I } from "../components/Icon";

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
    <div className="page-anim">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div><h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Auth logs</h2><p style={{ fontSize: 12, color: "var(--text3)" }}>All authentication attempts on this site</p></div>
        <Btn size="sm" variant="danger" onClick={clearLogs} loading={clearing}><Ico d={I.trash} size={11} /> Clear</Btn>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {[["all", "All"], ["success", "Success"], ["failure", "Failed"], ["device_mismatch", "Device mismatch"], ["token_expired", "Expired"], ["user_not_found", "User not found"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ fontSize: 11, padding: "4px 11px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit", fontWeight: 500, transition: "all 0.12s", background: filter === v ? "var(--accent)" : "var(--bg0)", color: filter === v ? "#fff" : "var(--text2)", border: `1px solid ${filter === v ? "var(--accent)" : "var(--border2)"}` }}>{l}</button>
        ))}
      </div>
      <div style={{ background: "var(--bg0)", border: "1px solid var(--border1)", borderRadius: "var(--radius-lg)", padding: 0, overflow: "hidden" }}>
        <table>
          <thead><tr><th>Time</th><th>User</th><th>Route</th><th>IP</th><th>Result</th><th>Reason</th></tr></thead>
          <tbody>{filtered.length === 0
            ? <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--text3)" }}>No entries found</td></tr>
            : filtered.map((l, i) => <tr key={l.id || i}>
                <td style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>{(l.created_at || "").split(" ")[1] || "-"}</td>
                <td style={{ fontWeight: 500 }}>{l.user_email || "-"}</td>
                <td><span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>{l.source_product || "-"}->{l.target_product || "-"}</span></td>
                <td><span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>{l.ip_address || "-"}</span></td>
                <td><Badge status={l.event_type} /></td>
                <td>{l.error_reason ? <Badge status={l.error_reason} /> : <span style={{ color: "var(--text3)" }}>-</span>}</td>
              </tr>)
          }</tbody>
        </table>
      </div>
    </div>
  );
};
