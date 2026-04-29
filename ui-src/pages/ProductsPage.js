import { useCallback, useEffect, useState } from "@wordpress/element";
import { api } from "../utils/api";
import { Badge } from "../components/Badge";
import { Btn } from "../components/Button";
import { Field } from "../components/Field";
import { Icon, Icons } from "../components/Icon";
import { Input } from "../components/Input";
import { Modal } from "../components/Modal";

export const ProductsPage = ({ toast }) => {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [showKeyId, setShowKeyId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ name: "", logo_url: "", page_url: "", web_key: "", is_active: true });
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(() => {
    api("/products")
      .then(setProducts)
      .catch(() => toast("Failed to load products", "error"));
  }, [toast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const openAdd = () => { setForm({ name: "", logo_url: "", page_url: "", web_key: "", is_active: true }); setEditProduct(null); setShowModal(true); };
  const openEdit = (p) => { setForm({ ...p }); setEditProduct(p.id); setShowModal(true); };

  const save = async () => {
    if (!form.name || !form.page_url || !form.web_key) { toast("Fill in all required fields", "error"); return; }
    setSaving(true);
    try {
      if (editProduct) {
        await api(`/products/${editProduct}`, { method: "PUT", body: JSON.stringify(form) });
        toast("Product updated", "success");
      } else {
        await api("/products", { method: "POST", body: JSON.stringify(form) });
        toast("Product added", "success");
      }
      await loadProducts();
      setShowModal(false);
    } catch (err) {
      toast("Failed to save product", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (product) => {
    try {
      await api(`/products/${product.id}`, { method: "PUT", body: JSON.stringify({ ...product, is_active: !product.is_active }) });
      await loadProducts();
      toast("Status updated", "success");
    } catch (err) {
      toast("Failed to update status", "error");
    }
  };

  const confirmDelete = async () => {
    try {
      await api(`/products/${deleteId}`, { method: "DELETE" });
      await loadProducts();
      toast("Product deleted", "success");
    } catch (err) {
      toast("Failed to delete product", "error");
    }
    setDeleteId(null);
  };

  const initials = (name) => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["var(--color-background-info)", "var(--color-background-success)", "var(--color-background-warning)"];
  const textColors = ["var(--color-text-info)", "var(--color-text-success)", "var(--color-text-warning)"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 500 }}>Products</h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>Remote sites that users can switch to</p>
        </div>
        <Btn variant="primary" onClick={openAdd}><Icon d={Icons.plus} size={13} /> Add product</Btn>
      </div>

      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)" }}>
        {products.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-secondary)", fontSize: 14 }}>
            No products yet. Add a remote site to get started.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--color-background-secondary)" }}>
                {["Product", "Page URL", "Web key", "Status", "Added", "Actions"].map(h => (
                  <th key={h} style={{ padding: "8px 16px", textAlign: "left", fontSize: 11, fontWeight: 500,
                    color: "var(--color-text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase",
                    borderBottom: "0.5px solid var(--color-border-tertiary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < products.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "var(--border-radius-md)",
                        background: colors[i % 3], display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 600, color: textColors[i % 3], flexShrink: 0 }}>
                        {initials(p.name)}
                      </div>
                      <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <a href={p.page_url} style={{ color: "var(--color-text-info)", fontSize: 12, textDecoration: "none",
                      fontFamily: "var(--font-mono)" }} target="_blank" rel="noopener noreferrer">{p.page_url}</a>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <code style={{ fontFamily: "var(--font-mono)", fontSize: 11, background: "var(--color-background-secondary)",
                        padding: "2px 8px", borderRadius: 4, color: "var(--color-text-secondary)" }}>
                        {showKeyId === p.id ? p.web_key : p.web_key.replace(/./g, "•").slice(0, 14)}
                      </code>
                      <button onClick={() => setShowKeyId(showKeyId === p.id ? null : p.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", padding: 2 }}>
                        <Icon d={showKeyId === p.id ? Icons.eyeOff : Icons.eye} size={12} />
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button onClick={() => toggleActive(p)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      <Badge status={p.is_active ? "active" : "inactive"} />
                    </button>
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--color-text-secondary)", fontSize: 12 }}>{p.created_at || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <Btn size="sm" onClick={() => openEdit(p)}><Icon d={Icons.edit} size={11} /> Edit</Btn>
                      <Btn size="sm" variant="danger" onClick={() => setDeleteId(p.id)}><Icon d={Icons.trash} size={11} /></Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title={editProduct ? "Edit product" : "Add product"} onClose={() => setShowModal(false)}>
          <Field label="Product name *">
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Shop Site" />
          </Field>
          <Field label="Logo URL" hint="Optional. A publicly accessible image URL.">
            <Input value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} placeholder="https://example.com/logo.png" />
          </Field>
          <Field label="Page URL *" hint="Where the user is redirected after SSO login.">
            <Input value={form.page_url} onChange={e => setForm(f => ({ ...f, page_url: e.target.value }))} placeholder="https://example.com/dashboard" />
          </Field>
          <Field label="Web key *" hint="Copy this from the target site's SSO settings. Used to verify auth tokens.">
            <Input value={form.web_key} onChange={e => setForm(f => ({ ...f, web_key: e.target.value }))} placeholder="wk_xxxxxxxxxxxxxxxx" type="password" />
          </Field>
          <Field label="Status">
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              Active
            </label>
          </Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 8 }}>
            <Btn onClick={() => setShowModal(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={save} loading={saving}>{editProduct ? "Save changes" : "Add product"}</Btn>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="Delete product" onClose={() => setDeleteId(null)} width={380}>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
            This will remove the product and all stored authentication data. Existing sessions on the remote site will not be affected.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn onClick={() => setDeleteId(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={confirmDelete}>Delete product</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};
