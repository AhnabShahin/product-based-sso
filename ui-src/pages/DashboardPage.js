import { useEffect, useState } from "@wordpress/element";
import { api } from "../utils/api";
import { Badge } from "../components/Badge";
import { Ico, I } from "../components/Icon";
import { StatCard } from "../components/StatCard";

export const DashboardPage = ({ toast }) => {
  const [site, setSite] = useState({ name: "", url: "", webKeySet: false, activeProducts: 0 });
  const [stats, setStats] = useState({ totalAuths: 0, successAuths: 0, failedAuths: 0, avgResponseMs: 0 });
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    let mounted = true;
    api("/dashboard")
      .then((data) => {
        if (!mounted) return;
        setSite({
          name: data.site?.name || "",
          url: data.site?.url || "",
          webKeySet: Boolean(data.site?.web_key_set),
          activeProducts: data.site?.active_products || 0,
        });
        setStats({
          totalAuths: data.stats?.total_auths || 0,
          successAuths: data.stats?.success_auths || 0,
          failedAuths: data.stats?.failed_auths || 0,
          avgResponseMs: data.stats?.avg_response_ms || 0,
        });
        setRecentLogs(data.recent_logs || []);
      })
      .catch(() => toast("Failed to load dashboard", "error"));
    return () => { mounted = false; };
  }, [toast]);

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
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{site.name || "Current site"}</p>
            <p style={{ fontSize: 11, color: "var(--text3)" }}>{site.url || "-"}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Badge status={site.webKeySet ? "active" : "inactive"} />
          <span style={{ fontSize: 11, color: "var(--text3)" }}>{site.activeProducts} active products</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
        <StatCard label="Total attempts" value={stats.totalAuths} />
        <StatCard label="Successful" value={stats.successAuths} color="var(--success)" />
        <StatCard label="Failed" value={stats.failedAuths} color="var(--danger)" />
        <StatCard label="Avg response" value={stats.avgResponseMs ? `${stats.avgResponseMs}ms` : "-"} />
      </div>

      <div style={{ background: "var(--bg0)", border: "1px solid var(--border1)", borderRadius: "var(--radius-lg)", padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border1)", fontSize: 13, fontWeight: 600 }}>Recent auth attempts</div>
        <table>
          <thead><tr><th>User</th><th>Route</th><th>Status</th><th>IP</th><th>Time</th></tr></thead>
          <tbody>
            {recentLogs.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--text3)" }}>No entries found</td></tr>
            ) : recentLogs.slice(0, 4).map((log, i) => (
              <tr key={log.id || i}>
                <td style={{ fontWeight: 500 }}>{log.user_email || "-"}</td>
                <td><span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>{log.source_product || "-"} -> {log.target_product || "-"}</span></td>
                <td><Badge status={log.error_reason || log.event_type} /></td>
                <td><span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>{log.ip_address || "-"}</span></td>
                <td style={{ color: "var(--text3)", fontSize: 11 }}>{(log.created_at || "").split(" ")[1] || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
