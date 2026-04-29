(() => {
  const root = document.querySelector(".product-sso-switcher");
  if (!root || !window.ProductBasedSSO) return;

  const hash = (input) => {
    let h = 5381;
    for (let i = 0; i < input.length; i++) {
      h = (h * 33) ^ input.charCodeAt(i);
    }
    return (h >>> 0).toString(16);
  };

  const buildFingerprint = () => {
    const parts = [
      navigator.userAgent || "",
      navigator.language || "",
      navigator.platform || "",
      `${screen.width}x${screen.height}`,
      Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    ];
    return hash(parts.join("|"));
  };

  root.addEventListener("click", (event) => {
    const btn = event.target.closest(".product-sso-btn");
    if (!btn) return;

    const productId = btn.dataset.productId;
    const fingerprint = buildFingerprint();
    const url = new URL(window.ProductBasedSSO.switchUrl, window.location.origin);
    url.searchParams.set("product_sso_switch", productId);
    url.searchParams.set("device_fingerprint", fingerprint);
    window.location.href = url.toString();
  });
})();
