export const Badge = ({ status }) => {
  const map = {
    success:        { bg: "#e6f4ec", color: "#1a7a3a", label: "Success" },
    failure:        { bg: "#fce8e8", color: "#b91c1c", label: "Failure" },
    invalid_key:    { bg: "#fef3c7", color: "#92400e", label: "Invalid key" },
    device_mismatch:{ bg: "#fce8e8", color: "#b91c1c", label: "Device mismatch" },
    token_expired:  { bg: "#fef3c7", color: "#92400e", label: "Expired" },
    user_not_found: { bg: "#fce8e8", color: "#b91c1c", label: "User not found" },
    active:         { bg: "#e6f4ec", color: "#1a7a3a", label: "Active" },
    inactive:       { bg: "#f3f4f6", color: "#6b7280", label: "Inactive" },
  };
  const s = map[status] || { bg: "#f3f4f6", color: "#6b7280", label: status };
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 600,
      padding: "2px 8px", borderRadius: 20, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
};
