import { useState } from "@wordpress/element";
import { Badge } from "../components/Badge";
import { Btn } from "../components/Button";
import { Field } from "../components/Field";
import { Ico, I } from "../components/Icon";
import { Modal } from "../components/Modal";

const PRODUCTS_INIT = [
  { id: 1, name: "Main Site", page_url: "https://main.example.com/dashboard", web_key: "wk_a1b2c3d4e5f6a1b2", is_active: true, created_at: "2026-04-29" },
  { id: 2, name: "Shop Site", page_url: "https://shop.example.com/products", web_key: "wk_g7h8i9j0k1l2g7h8", is_active: true, created_at: "2026-04-28" },
  { id: 3, name: "Blog", page_url: "https://blog.example.com/", web_key: "wk_m3n4o5p6q7r8m3n4", is_active: false, created_at: "2026-04-27" },
];
const AVATAR_COLORS = [["#dbeafe", "#1d4ed8"], ["#dcfce7", "#15803d"], ["#fef3c7", "#92400e"], ["#fce7f3", "#be185d"], ["#ede9fe", "#6d28d9"]];

export const ProductsPage = ({ toast }) => {
  const [products, setProducts] = useState(PRODUCTS_INIT);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ name: "", page_url: "", web_key: "", is_active: true });
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setForm({ name: "", page_url: "", web_key: "", is_active: true }); setEditId(null); setShowForm(true); };
  const openEdit = p => { setForm({ ...p }); setEditId(p.id); setShowForm(true); };
  const save = async () => {
    if (!form.name || !form.page_url || !form.web_key) { toast("Fill in all required fields", "error"); return; }
    setSaving(true); await new Promise(r => setTimeout(r, 600));
    if (editId) { setProducts(prev => prev.map(p => p.id === editId ? { ...p, ...form } : p)); toast("Product updated", "success"); }
    else { setProducts(prev => [...prev, { ...form, id: Date.now(), created_at: new Date().toISOString().split("T")[0] }]); toast("Product added", "success"); }
    setSaving(false); setShowForm(false); setEditId(null);
  };

  return (
    <div className="page-anim">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div><h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Products</h2><p style={{ fontSize: 12, color: "var(--text3)" }}>Remote sites users can switch to</p></div>
        <Btn variant="primary" onClick={openAdd}><Ico d={I.plus} size={12} /> Add product</Btn>
      </div>

      {showForm && (
        <div style={{ background: "var(--bg0)", border: "1px solid var(--border1)", borderRadius: "var(--radius-lg)", padding: "18px 20px", transition: "background 0.25s, border-color 0.25s", marginBottom: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text1)", marginBottom: 12 }}>{editId ? "Edit product" : "Add product"}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <Field label="Product name *"><input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Shop Site" /></Field>
            <Field label="Page URL *"><input type="text" value={form.page_url} onChange={e => setForm(f => ({ ...f, page_url: e.target.value }))} placeholder="https://example.com/dashboard" /></Field>
          </div>
          <Field label="Web key (from target site) *" hint="Paste the web key generated on the target site's SSO settings page.">
            <input type="password" value={form.web_key} onChange={e => setForm(f => ({ ...f, web_key: e.target.value }))} placeholder="wk_xxxxxxxxxxxxxxxx" />
          </Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4 }}>
            <Btn onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</Btn>
            <Btn variant="primary" onClick={save} loading={saving}>{editId ? "Save changes" : "Add product"}</Btn>
          </div>
        </div>
      )}

      <div style={{ background: "var(--bg0)", border: "1px solid var(--border1)", borderRadius: "var(--radius-lg)", padding: 0, overflow: "hidden" }}>
        <table>
          <thead><tr><th>Product</th><th>Page URL</th><th>Web key</th><th>Status</th><th>Added</th><th>Actions</th></tr></thead>
          <tbody>{products.map((p, i) => {
            const [bg, color] = AVATAR_COLORS[i % AVATAR_COLORS.length];
            return <tr key={p.id}>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "var(--radius-sm)", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color, flexShrink: 0 }}>
                    {p.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                </div>
              </td>
              <td><a href={p.page_url} style={{ fontFamily: "var(--mono)", fontSize: 10 }}>{p.page_url.replace("https://", "")}</a></td>
              <td><code>{"*".repeat(10)} {p.web_key.slice(-4)}</code></td>
              <td><Badge status={p.is_active ? "active" : "inactive"} /></td>
              <td style={{ color: "var(--text3)", fontSize: 11 }}>{p.created_at}</td>
              <td>
                <div style={{ display: "flex", gap: 5 }}>
                  <Btn size="sm" onClick={() => openEdit(p)}><Ico d={I.edit} size={11} /> Edit</Btn>
                  <Btn size="sm" variant="danger" onClick={() => setDeleteId(p.id)}><Ico d={I.trash} size={11} /></Btn>
                </div>
              </td>
            </tr>;
          })}</tbody>
        </table>
      </div>

      {deleteId && <Modal title="Delete product" onClose={() => setDeleteId(null)} width={380}>
        <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6, marginBottom: 20 }}>This will remove the product and all stored auth data. Connected sessions will not be affected.</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn onClick={() => setDeleteId(null)}>Cancel</Btn>
          <Btn variant="danger" onClick={() => { setProducts(p => p.filter(x => x.id !== deleteId)); setDeleteId(null); toast("Product deleted", "success"); }}>Delete</Btn>
        </div>
      </Modal>}
    </div>
  );
};
