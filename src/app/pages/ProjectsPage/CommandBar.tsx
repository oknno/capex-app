import { useEffect, useId, useRef, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { UNIT_OPTIONS_BY_CENTER } from "./components/wizard/wizardOptions";

type SortBy = "Title" | "Id" | "approvalYear";
type SortDir = "asc" | "desc";

const STATUS_OPTIONS = ["Rascunho", "Em Aprovação", "Aprovado", "Reprovado"];
const UNIT_OPTIONS = Array.from(
  new Set(
    Object.values(UNIT_OPTIONS_BY_CENTER)
      .flat()
      .map((option) => option.value)
      .filter(Boolean)
  )
).sort((a, b) => a.localeCompare(b, "pt-BR"));

export type ProjectsFilters = {
  searchTitle: string;
  status: string;
  unit: string;
  sortBy: SortBy;
  sortDir: SortDir;
};

export function CommandBar(props: {
  selectedId: number | null;
  selectedStatus?: string;
  totalLoaded: number;

  filters: ProjectsFilters;
  onChangeFilters: (patch: Partial<ProjectsFilters>) => void;

  onApply: () => void;
  onClear: () => void;

  onRefresh: () => void;

  onNew: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;

  onSendToApproval: () => void;
  onBackStatus: () => void;

  onExport: () => void;
}) {
  const hasSelection = props.selectedId != null;
  const normalizedStatus = (props.selectedStatus ?? "").trim().toLowerCase();
  const canDelete = hasSelection && (!normalizedStatus || normalizedStatus === "rascunho");

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        justifyContent: "space-between"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <div style={{ fontWeight: 800, color: "#111827" }}>CAPEX · Projetos</div>
        <Badge text={`Carregados: ${props.totalLoaded}`} tone="neutral" />
        {hasSelection && <Badge text={`Selecionado: #${props.selectedId}`} tone="info" />}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button className="btn" onClick={props.onRefresh}>Atualizar</button>
        <button className="btn primary" onClick={props.onNew}>Novo</button>

        <button className="btn" disabled={!hasSelection} onClick={props.onView}>Visualizar</button>
        <button className="btn" disabled={!hasSelection} onClick={props.onEdit}>Editar</button>
        <button className="btn" disabled={!canDelete} onClick={props.onDelete}>Excluir</button>

        <span style={{ width: 1, height: 26, background: "#e5e7eb", margin: "0 4px" }} />

        <button className="btn" disabled={!hasSelection} onClick={props.onSendToApproval}>Enviar p/ Aprovação</button>
        <button className="btn" disabled={!hasSelection} onClick={props.onBackStatus}>Voltar Status</button>

        <span style={{ width: 1, height: 26, background: "#e5e7eb", margin: "0 4px" }} />

        <FilterMenu
          value={props.filters}
          onChange={props.onChangeFilters}
          onApply={props.onApply}
          onClear={props.onClear}
        />

        <button className="btn" onClick={props.onExport}>Exportar</button>
      </div>
    </div>
  );
}

function FilterMenu(props: {
  value: ProjectsFilters;
  onChange: (patch: Partial<ProjectsFilters>) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  const { value } = props;

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const popupId = useId();

  useEffect(() => {
    function onDocMouseDown(ev: MouseEvent) {
      if (!open) return;
      const target = ev.target as Node | null;
      if (!target) return;
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  const popoverStyle: React.CSSProperties = {
    position: "absolute",
    right: 0,
    top: "calc(100% + 8px)",
    width: 420,
    maxWidth: "90vw",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,.10)",
    zIndex: 9999,
    overflow: "hidden"
  };

  const contentStyle: React.CSSProperties = {
    display: "grid",
    gap: 10,
    maxHeight: "60vh",
    overflowY: "auto",
    paddingRight: 4
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #d1d5db"
  };

  const selectStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#fff"
  };

  function applyAndClose() {
    props.onApply();
    setOpen(false);
  }

  function clearAndClose() {
    props.onClear();
    setOpen(false);
  }

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        className="btn"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popupId}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        Filtro ▾
      </button>

      {open && (
        <div id={popupId} role="dialog" aria-label="Filtro de projetos" style={popoverStyle}>
          <div style={contentStyle}>
            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontSize: 12, color: "#6b7280" }}>Nome do projeto (contém)</label>
              <input
                value={value.searchTitle}
                onChange={(e) => props.onChange({ searchTitle: e.target.value })}
                placeholder="Ex: Máquina..."
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontSize: 12, color: "#6b7280" }}>Status</label>
              <select
                value={value.status}
                onChange={(e) => props.onChange({ status: e.target.value })}
                style={selectStyle}
              >
                <option value="">Todos</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontSize: 12, color: "#6b7280" }}>Unidade</label>
              <select
                value={value.unit}
                onChange={(e) => props.onChange({ unit: e.target.value })}
                style={selectStyle}
              >
                <option value="">Todas</option>
                {UNIT_OPTIONS.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontSize: 12, color: "#6b7280" }}>Ordenar por</label>
                <select
                  value={value.sortBy}
                  onChange={(e) => props.onChange({ sortBy: e.target.value as SortBy })}
                  style={selectStyle}
                >
                  <option value="Title">Nome (Title)</option>
                  <option value="Id">ID</option>
                  <option value="approvalYear">Ano</option>
                </select>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontSize: 12, color: "#6b7280" }}>Direção</label>
                <select
                  value={value.sortDir}
                  onChange={(e) => props.onChange({ sortDir: e.target.value as SortDir })}
                  style={selectStyle}
                >
                  <option value="asc">Crescente (A→Z / menor→maior)</option>
                  <option value="desc">Decrescente (Z→A / maior→menor)</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
              <button className="btn" type="button" onClick={clearAndClose}>Limpar</button>
              <button className="btn primary" type="button" onClick={applyAndClose}>Aplicar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
