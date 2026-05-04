const API_BASE = window.ProductBasedSSOAdmin?.apiBase || "/wp-json/product-sso/v1";
const API_NONCE = window.ProductBasedSSOAdmin?.nonce || "";

export const api = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-WP-Nonce": API_NONCE,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text || "Request failed";

    try {
      const parsed = JSON.parse(text);
      if (parsed?.message) {
        message = parsed.message;
      } else if (parsed?.code) {
        message = parsed.code;
      }
    } catch (error) {
      // Ignore JSON parse failures and keep raw response text.
    }

    throw new Error(message);
  }

  return response.json();
};
