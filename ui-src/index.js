import { createRoot } from "@wordpress/element";
import App from "./app";

const root = document.getElementById("product-based-sso-root");
if (root) {
  createRoot(root).render(<App />);
}
