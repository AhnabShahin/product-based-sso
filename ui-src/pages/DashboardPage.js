import { useEffect, useState } from "@wordpress/element";
import { api } from "../utils/api";
import { Badge } from "../components/Badge";
import { Icon, Icons } from "../components/Icon";
import { StatCard } from "../components/StatCard";

export const DashboardPage = ({ toast }) => {
  const [site, setSite] = useState({ name: "", url: "", webKeySet: false, totalProducts: 0, activeProducts: 0 });
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
          totalProducts: data.site?.total_products || 0,
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
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 500 }}>Dashboard</h2>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>SSO activity overview for this site</p>
      </div>

      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)", padding: "20px 24px", marginBottom: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: "var(--border-radius-md)",
            background: "var(--color-background-info)", display: "flex", alignItems: "center",
            justifyContent: "center", border: "0.5px solid var(--color-border-info)" }}>
            <Icon d={Icons.shield} size={20} color="var(--color-text-info)" />
          </div>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>{site.name || "Current site"}</p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>{site.url || "—"}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Badge status={site.webKeySet ? "active" : "inactive"} />
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)", alignSelf: "center" }}>
            {site.activeProducts} active product{site.activeProducts !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="Total auth attempts" value={stats.totalAuths} icon="activity" />
        <StatCard label="Successful logins" value={stats.successAuths} icon="check" accent="#1a7a3a" />
        <StatCard label="Failed attempts" value={stats.failedAuths} icon="alert" accent="#b91c1c" />
        <StatCard label="Avg response time" value={stats.avgResponseMs ? `${stats.avgResponseMs}ms` : "—"} icon="zap" />
      </div>

      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "0.5px solid var(--color-border-tertiary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Recent auth attempts</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--color-background-secondary)" }}>
              {["User", "Route", "Status", "IP", "Time"].map(h => (
                <th key={h} style={{ padding: "8px 16px", textAlign: "left", fontSize: 11, fontWeight: 500,
                  color: "var(--color-text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase",
                  borderBottom: "0.5px solid var(--color-border-tertiary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentLogs.map((log, i) => (
              <tr key={log.id || i} style={{ borderBottom: i < recentLogs.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none" }}>
                <td style={{ padding: "10px 16px", color: "var(--color-text-primary)" }}>{log.user_email || "—"}</td>
                <td style={{ padding: "10px 16px", color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                  {log.source_product || "?"} -> {log.target_product || "?"}
                </td>
                <td style={{ padding: "10px 16px" }}><Badge status={log.error_reason || log.event_type} /></td>
                <td style={{ padding: "10px 16px", color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)", fontSize: 11 }}>{log.ip_address || "—"}</td>
                <td style={{ padding: "10px 16px", color: "var(--color-text-secondary)", fontSize: 11 }}>{(log.created_at || "").split(" ")[1] || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
