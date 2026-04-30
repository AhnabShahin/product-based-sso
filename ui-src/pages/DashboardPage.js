import { Badge } from "../components/Badge";
import { Ico, I } from "../components/Icon";
import { StatCard } from "../components/StatCard";

const PRODUCTS_INIT = [
  { id: 1, name: "Main Site", page_url: "https://main.example.com/dashboard", web_key: "wk_a1b2c3d4e5f6a1b2", is_active: true, created_at: "2026-04-29" },
  { id: 2, name: "Shop Site", page_url: "https://shop.example.com/products", web_key: "wk_g7h8i9j0k1l2g7h8", is_active: true, created_at: "2026-04-28" },
  { id: 3, name: "Blog", page_url: "https://blog.example.com/", web_key: "wk_m3n4o5p6q7r8m3n4", is_active: false, created_at: "2026-04-27" },
];
const LOGS_INIT = [
  { id: 1, type: "success", email: "alice@example.com", from: "Main Site", to: "Shop", ip: "203.0.113.10", reason: null, time: "11:42:10" },
  { id: 2, type: "failure", email: "bob@example.com", from: "Blog", to: "Main Site", ip: "198.51.100.4", reason: "token_expired", time: "11:40:05" },
  { id: 3, type: "success", email: "carol@example.com", from: "Shop", to: "Blog", ip: "203.0.113.22", reason: null, time: "11:38:52" },
  { id: 4, type: "device_mismatch", email: "dan@example.com", from: "Main Site", to: "Shop", ip: "192.0.2.88", reason: "device_mismatch", time: "11:35:10" },
  { id: 5, type: "failure", email: "eve@example.com", from: "Shop", to: "Main Site", ip: "10.0.0.5", reason: "user_not_found", time: "11:30:01" },
];

export const DashboardPage = () => {
  const ok = LOGS_INIT.filter(l => l.type === "success").length;
  const fail = LOGS_INIT.filter(l => l.type !== "success").length;
  return (
    <div className="page-anim">
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Dashboard</h2>
      <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 20 }}>SSO activity overview for this site</p>

      <div style={{ background: "var(--bg0)", border: "1px solid var(--border1)", borderRadius: "var(--radius-lg)", padding: "18px 20px", transition: "background 0.25s, border-color 0.25s", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, background: "var(--accent-bg)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border1)", color: "var(--accent)" }}>
            <Ico d={I.shield} size={18} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>My WordPress Site</p>
            <p style={{ fontSize: 11, color: "var(--text3)" }}>https://mysite.example.com</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Badge status="active" />
          <span style={{ fontSize: 11, color: "var(--text3)" }}>{PRODUCTS_INIT.filter(p => p.is_active).length} active products</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
        <StatCard label="Total attempts" value={LOGS_INIT.length} />
        <StatCard label="Successful" value={ok} color="var(--success)" />
        <StatCard label="Failed" value={fail} color="var(--danger)" />
        <StatCard label="Avg response" value="240ms" />
      </div>

      <div style={{ background: "var(--bg0)", border: "1px solid var(--border1)", borderRadius: "var(--radius-lg)", padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border1)", fontSize: 13, fontWeight: 600 }}>Recent auth attempts</div>
        <table>
          <thead><tr><th>User</th><th>Route</th><th>Status</th><th>IP</th><th>Time</th></tr></thead>
          <tbody>{LOGS_INIT.slice(0, 4).map(l => (
            <tr key={l.id}>
              <td style={{ fontWeight: 500 }}>{l.email}</td>
              <td><span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>{l.from} -> {l.to}</span></td>
              <td><Badge status={l.reason || l.type} /></td>
              <td><span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>{l.ip}</span></td>
              <td style={{ color: "var(--text3)", fontSize: 11 }}>{l.time}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
};
