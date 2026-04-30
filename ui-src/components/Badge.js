export const Badge = ({ status }) => {
  const m = {
    success:         ["badge-success", "#ecfdf5", "#15803d", "Success"],
    failure:         ["badge-danger",  "#fef2f2", "#b91c1c", "Failure"],
    device_mismatch: ["badge-danger",  "#fef2f2", "#b91c1c", "Device mismatch"],
    token_expired:   ["badge-warn",    "#fffbeb", "#92400e", "Expired"],
    user_not_found:  ["badge-danger",  "#fef2f2", "#b91c1c", "User not found"],
    invalid_key:     ["badge-warn",    "#fffbeb", "#92400e", "Invalid key"],
    active:          ["badge-success", "#ecfdf5", "#15803d", "Active"],
    inactive:        ["badge-neutral", "var(--bg2)", "var(--text2)", "Inactive"],
  };
  const [, bg, color, label] = m[status] || ["", "var(--bg2)", "var(--text2)", status];
  return <span style={{ background: bg, color, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>{label}</span>;
};
