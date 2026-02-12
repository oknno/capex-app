import { useState } from "react";

export function MilestoneModal(props: {
  projectId: number;
  onClose: () => void;
  onSubmit: (title: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setErr("");
    const t = title.trim();
    if (!t) {
      setErr("Title é obrigatório.");
      return;
    }
    try {
      setSaving(true);
      await props.onSubmit(t);
      props.onClose();
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "Erro ao salvar milestone.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17,24,39,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 9999
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <div style={{ width: "min(620px, 100%)", background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb" }}>
        <div style={{ padding: 14, borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontWeight: 700 }}>Novo Milestone</div>
          <button className="btn" onClick={props.onClose} disabled={saving}>Fechar</button>
        </div>

        <div style={{ padding: 14, display: "grid", gap: 10 }}>
          {err && (
            <div style={{ padding: 10, borderRadius: 10, border: "1px solid #f5c2c7", background: "#f8d7da", color: "#842029" }}>
              <b>Erro:</b> {err}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, alignItems: "center" }}>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Title *</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Aprovação técnica, Liberação obra..."
              style={{ width: "100%", padding: "9px 10px", borderRadius: 10, border: "1px solid #d1d5db" }}
            />
          </div>
        </div>

        <div style={{ padding: 14, borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn" onClick={props.onClose} disabled={saving}>Cancelar</button>
          <button className="btn primary" onClick={submit} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
