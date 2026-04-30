import { useState } from "@wordpress/element";
import { Badge } from "../components/Badge";
import { Btn } from "../components/Button";
import { Ico, I } from "../components/Icon";

const LOGS_INIT = [
  { id: 1, type: "success", email: "alice@example.com", from: "Main Site", to: "Shop", ip: "203.0.113.10", reason: null, time: "11:42:10" },
  { id: 2, type: "failure", email: "bob@example.com", from: "Blog", to: "Main Site", ip: "198.51.100.4", reason: "token_expired", time: "11:40:05" },
  { id: 3, type: "success", email: "carol@example.com", from: "Shop", to: "Blog", ip: "203.0.113.22", reason: null, time: "11:38:52" },
  { id: 4, type: "device_mismatch", email: "dan@example.com", from: "Main Site", to: "Shop", ip: "192.0.2.88", reason: "device_mismatch", time: "11:35:10" },
  { id: 5, type: "failure", email: "eve@example.com", from: "Shop", to: "Main Site", ip: "10.0.0.5", reason: "user_not_found", time: "11:30:01" },
];

export const LogsPage = ({ toast }) => {
  const [logs, setLogs] = useState(LOGS_INIT);
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? logs : logs.filter(l => l.type === filter || l.reason === filter);

  return (
    <div className="page-anim">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div><h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Auth logs</h2><p style={{ fontSize: 12, color: "var(--text3)" }}>All authentication attempts on this site</p></div>
        <Btn size="sm" variant="danger" onClick={() => { setLogs([]); toast("Logs cleared", "success"); }}><Ico d={I.trash} size={11} /> Clear</Btn>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {[["all", "All"], ["success", "Success"], ["failure", "Failed"], ["device_mismatch", "Device mismatch"], ["token_expired", "Expired"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ fontSize: 11, padding: "4px 11px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit", fontWeight: 500, transition: "all 0.12s", background: filter === v ? "var(--accent)" : "var(--bg0)", color: filter === v ? "#fff" : "var(--text2)", border: `1px solid ${filter === v ? "var(--accent)" : "var(--border2)"}` }}>{l}</button>
        ))}
      </div>
      <div style={{ background: "var(--bg0)", border: "1px solid var(--border1)", borderRadius: "var(--radius-lg)", padding: 0, overflow: "hidden" }}>
        <table>
          <thead><tr><th>Time</th><th>User</th><th>Route</th><th>IP</th><th>Result</th><th>Reason</th></tr></thead>
          <tbody>{filtered.length === 0
            ? <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--text3)" }}>No entries found</td></tr>
            : filtered.map(l => <tr key={l.id}>
                <td style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>{l.time}</td>
                <td style={{ fontWeight: 500 }}>{l.email}</td>
                <td><span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>{l.from}->{l.to}</span></td>
                <td><span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>{l.ip}</span></td>
                <td><Badge status={l.type} /></td>
                <td>{l.reason ? <Badge status={l.reason} /> : <span style={{ color: "var(--text3)" }}>-</span>}</td>
              </tr>)
          }</tbody>
        </table>
      </div>
    </div>
  );
};
