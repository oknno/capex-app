import { useMemo, useState } from "react";

function parseNumberLoose(s: string): number | null {
  const t = (s ?? "").trim();
  if (!t) return null;
  // aceita "1.234,56" e "1234.56"
  const normalized = t.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export function PepModal(props: {
  projectId: number;
  activityId: number;
  onClose: () => void;
  onSubmit: (draft: { title: string; year?: number; amountBrl?: number }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [amount, setAmount] = useState("");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const yearNum = useMemo(() => {
    const t = year.trim();
    if (!t) return undefined;
    const n = Number(t);
    return Number.isFinite(n) ? n : NaN;
  }, [year]);

  const amountNum = useMemo(() => parseNumberLoose(amount), [amount]);

  async function submit() {
    setErr("");
    const t = title.trim();
    if (!t) {
      setErr("Title é obrigatório.");
      return;
    }
    if (yearNum !== undefined && Number.isNaN(yearNum)) {
      setErr("Ano inválido.");
      return;
    }
    if (amount.trim() && amountNum == null) {
      setErr("Valor inválido. Use 1234,56 ou 1234.56");
      return;
    }

    try {
      setSaving(true);
      await props.onSubmit({
        title: t,
        year: yearNum === undefined ? undefined : yearNum,
        amountBrl: amountNum == null ? undefined : amountNum
      });
      props.onClose();
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "Erro ao salvar PEP.");
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
          <div style={{ fontWeight: 700 }}>Novo PEP</div>
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

          <Row label="PEP (Title) *">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: UM-LE0011 / PEP-000123"
              style={{ width: "100%", padding: "9px 10px", borderRadius: 10, border: "1px solid #d1d5db" }}
            />
          </Row>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Row label="Ano">
              <input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2026"
                style={{ width: "100%", padding: "9px 10px", borderRadius: 10, border: "1px solid #d1d5db" }}
              />
            </Row>

            <Row label="Valor (BRL)">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000000,00"
                style={{ width: "100%", padding: "9px 10px", borderRadius: 10, border: "1px solid #d1d5db" }}
              />
            </Row>
          </div>
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
