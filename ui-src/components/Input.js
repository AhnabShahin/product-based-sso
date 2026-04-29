export const Input = ({ value, onChange, placeholder, type = "text", disabled, style = {} }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
    style={{ width: "100%", boxSizing: "border-box", ...style }} />
);
