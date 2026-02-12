import { useMemo, useState } from "react";

function toIsoDateInput(v: string) {
  // recebe "YYYY-MM-DD" do input e converte pra ISO (mantém sem timezone)
  // SharePoint aceita ISO; aqui usamos 00:00Z pra evitar mudanças visuais
  return `${v}T00:00:00Z`;
}

export function ActivityModal(props: {
  projectId: number;
  milestoneId: number;
  onClose: () => void;
  onSubmit: (draft: {
    title: string;
    startDate?: string;
    endDate?: string;
    supplier?: string;
    activityDescription?: string;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [supplier, setSupplier] = useState("");
  const [start, setStart] = useState(""); // YYYY-MM-DD
  const [end, setEnd] = useState("");     // YYYY-MM-DD
  const [desc, setDesc] = useState("");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const dateError = useMemo(() => {
    if (start && end && end < start) return "Data fim não pode ser menor que data início.";
    return "";
  }, [start, end]);

  async function submit() {
    setErr("");
    const t = title.trim();
    if (!t) {
      setErr("Title é obrigatório.");
      return;
    }
    if (dateError) {
      setErr(dateError);
      return;
    }

    try {
      setSaving(true);
      await props.onSubmit({
        title: t,
        supplier: supplier.trim() || undefined,
        startDate: start ? toIsoDateInput(start) : undefined,
        endDate: end ? toIsoDateInput(end) : undefined,
        activityDescription: desc.trim() || undefined
      });
      props.onClose();
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "Erro ao salvar activity.");
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
      <div style={{ width: "min(760px, 100%)", background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb" }}>
        <div style={{ padding: 14, borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontWeight: 700 }}>Nova Activity</div>
          <button className="btn" onClick={props.onClose} disabled={saving}>
            Fechar
          </button>
        </div>

        <div style={{ padding: 14, display: "grid", gap: 12 }}>
          {err && (
            <div style={{ padding: 10, borderRadius: 10, border: "1px solid #f5c2c7", background: "#f8d7da", color: "#842029" }}>
              <b>Erro:</b> {err}
            </div>
          )}

          <Row label="Title *">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Contratação fornecedor, Compra equipamento..."
              style={{ width: "100%", padding: "9px 10px", borderRadius: 10, border: "1px solid #d1d5db" }}
            />
          </Row>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Row label="Data início">
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                style={{ width: "100%", padding: "9px 10px", borderRadius: 10, border: "1px solid #d1d5db" }}
              />
            </Row>

            <Row label="Data fim">
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                style={{ width: "100%", padding: "9px 10px", borderRadius: 10, border: "1px solid #d1d5db" }}
              />
            </Row>
          </div>

          <Row label="Fornecedor">
            <input
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Ex: ABC Ltda"
              style={{ width: "100%", padding: "9px 10px", borderRadius: 10, border: "1px solid #d1d5db" }}
            />
          </Row>

          <Row label="Descrição">
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
              placeholder="Descreva a activity..."
              style={{ width: "100%", padding: "9px 10px", borderRadius: 10, border: "1px solid #d1d5db", resize: "vertical" }}
            />
          </Row>

          {dateError && <div style={{ color: "#b45309", fontSize: 12 }}>{dateError}</div>}
        </div>

        <div style={{ padding: 14, borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn" onClick={props.onClose} disabled={saving}>
            Cancelar
          </button>
          <button className="btn primary" onClick={submit} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: any }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12, alignItems: "center" }}>
      <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}
