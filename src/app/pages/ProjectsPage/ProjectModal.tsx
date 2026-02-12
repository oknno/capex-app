import type { ProjectDraft, ProjectRow } from "../../../services/sharepoint/projectsApi";
import { useMemo, useState } from "react";

export function ProjectModal(props: {
  mode: "create" | "edit";
  initial?: Partial<ProjectRow>;
  onClose: () => void;
  onSubmit: (draft: ProjectDraft) => Promise<void>;
}) {
  const init = props.initial ?? {};

  const [title, setTitle] = useState<string>(String(init.Title ?? ""));
  const [approvalYear, setApprovalYear] = useState<string>(init.approvalYear ? String(init.approvalYear) : "");
  const [status, setStatus] = useState<string>(String(init.status ?? ""));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const header = useMemo(() => (props.mode === "create" ? "Novo Projeto" : "Editar Projeto"), [props.mode]);

  async function submit() {
    setErr("");
    const draft: ProjectDraft = {
      Title: title,
      approvalYear: approvalYear.trim() ? Number(approvalYear) : undefined,
      status: status.trim() ? status.trim() : undefined
    };

    try {
      setSaving(true);
      await props.onSubmit(draft);
      props.onClose();
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "Erro ao salvar.");
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
        // clique no backdrop fecha
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <div style={{ width: "min(720px, 100%)", background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb" }}>
        <div style={{ padding: 14, borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontWeight: 600 }}>{header}</div>
          <button className="btn" onClick={props.onClose} disabled={saving}>Fechar</button>
        </div>

        <div style={{ padding: 14, display: "grid", gap: 10 }}>
          {err && (
            <div style={{ padding: 10, borderRadius: 10, border: "1px solid #f5c2c7", background: "#f8d7da", color: "#842029" }}>
              <b>Erro:</b> {err}
            </div>
          )}

          <Field label="Title *">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do projeto..."
              style={{ width: "100%", padding: "9px 10px", borderRadius: 10, border: "1px solid #d1d5db" }}
            />
          </Field>

          <Field label="approvalYear">
            <input
              value={approvalYear}
              onChange={(e) => setApprovalYear(e.target.value)}
              placeholder="2026"
              inputMode="numeric"
              style={{ width: 200, padding: "9px 10px", borderRadius: 10, border: "1px solid #d1d5db" }}
            />
          </Field>

          <Field label="status">
            <input
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="Rascunho / Em Aprovação / Aprovado ..."
              style={{ width: 320, padding: "9px 10px", borderRadius: 10, border: "1px solid #d1d5db" }}
            />
          </Field>
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

function Field({ label, children }: { label: string; children: any }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12, alignItems: "center" }}>
      <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}
