import { useEffect, useId, useRef, useState } from "react";
import { Button } from "../../components/ui/Button";
import { fieldControlStyles } from "../../components/ui/fieldControlStyles";
import { uiTokens } from "../../components/ui/tokens";
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

const styles = {
  commandBar: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: uiTokens.colors.surface,
    borderBottom: `1px solid ${uiTokens.colors.border}`,
    padding: `${uiTokens.spacing.sm + 2}px ${uiTokens.spacing.md}px`,
    display: "flex",
    alignItems: "center",
    gap: uiTokens.spacing.sm,
    justifyContent: "space-between",
  } satisfies React.CSSProperties,
  titleWrap: {
    display: "flex",
    alignItems: "center",
    gap: uiTokens.spacing.sm,
    minWidth: 0,
  } satisfies React.CSSProperties,
  title: {
    fontWeight: uiTokens.typography.titleWeight,
    color: uiTokens.colors.textStrong,
  } satisfies React.CSSProperties,
  actionsWrap: {
    display: "flex",
    gap: uiTokens.spacing.sm,
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  } satisfies React.CSSProperties,
  divider: {
    width: 1,
    height: 26,
    background: uiTokens.colors.border,
    margin: `0 ${uiTokens.spacing.xs}px`,
  } satisfies React.CSSProperties,
  filterRoot: {
    position: "relative",
  } satisfies React.CSSProperties,
  popover: {
    position: "absolute",
    right: 0,
    top: "calc(100% + 8px)",
    width: 420,
    maxWidth: "90vw",
    background: uiTokens.colors.surface,
    border: `1px solid ${uiTokens.colors.border}`,
    borderRadius: uiTokens.radius.md,
    padding: uiTokens.spacing.md,
    boxShadow: `0 10px 30px ${uiTokens.colors.shadowSoft}`,
    zIndex: 9999,
    overflow: "hidden",
  } satisfies React.CSSProperties,
  popoverContent: {
    display: "grid",
    gap: uiTokens.spacing.sm + uiTokens.spacing.xxs,
    maxHeight: "60vh",
    overflowY: "auto",
    paddingRight: uiTokens.spacing.xs,
  } satisfies React.CSSProperties,
  fieldGroup: {
    display: "grid",
    gap: uiTokens.spacing.xs + uiTokens.spacing.xxs,
  } satisfies React.CSSProperties,
  fieldLabel: {
    fontSize: uiTokens.typography.xs,
    color: uiTokens.colors.textMuted,
  } satisfies React.CSSProperties,
  inputBase: {
    width: "100%",
    boxSizing: "border-box",
    ...fieldControlStyles.input,
  } satisfies React.CSSProperties,
  select: {
    ...fieldControlStyles.select,
  } satisfies React.CSSProperties,
  twoColumns: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: uiTokens.spacing.sm + uiTokens.spacing.xxs,
  } satisfies React.CSSProperties,
  footerActions: {
    display: "flex",
    gap: uiTokens.spacing.sm,
    justifyContent: "flex-end",
    marginTop: uiTokens.spacing.xs,
  } satisfies React.CSSProperties,
};

export type ProjectsFilters = {
  searchTitle: string;
  status: string;
  unit: string;
  sortBy: SortBy;
  sortDir: SortDir;
};

export function CommandBar(props: {
  selectedId: number | null;
  totalLoaded: number;

  canEdit: boolean;
  canDelete: boolean;
  canSend: boolean;
  canBack: boolean;

  filters: ProjectsFilters;
  onChangeFilters: (patch: Partial<ProjectsFilters>) => void;

  onApply: () => void;
  onClear: () => void;

  onRefresh: () => void;

  onNew: () => void;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;

  onSendToApproval: () => void;
  onBackStatus: () => void;

  onExport: () => void;
}) {
  const hasSelection = props.selectedId != null;

  return (
    <div style={styles.commandBar}>
      <div style={styles.titleWrap}>
        <div style={styles.title}>Termo de Abertura de Projeto - TAP 2.0</div>
      </div>

      <div style={styles.actionsWrap}>
        <Button onClick={props.onRefresh}>Atualizar</Button>
        <Button tone="primary" onClick={props.onNew}>Novo</Button>

        <Button disabled={!hasSelection} onClick={props.onView}>Visualizar</Button>
        <Button disabled={!props.canEdit} onClick={props.onEdit}>Editar</Button>
        <Button disabled={!hasSelection} onClick={props.onDuplicate}>Duplicar</Button>
        <Button disabled={!props.canDelete} onClick={props.onDelete}>Excluir</Button>

        <span style={styles.divider} />

        <Button disabled={!props.canSend} onClick={props.onSendToApproval}>Enviar p/ Aprovação</Button>
        <Button disabled={!props.canBack} onClick={props.onBackStatus}>Voltar Status</Button>

        <span style={styles.divider} />

        <FilterMenu
          value={props.filters}
          onChange={props.onChangeFilters}
          onApply={props.onApply}
          onClear={props.onClear}
        />

        <Button onClick={props.onExport}>Exportar</Button>
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

  function applyAndClose() {
    props.onApply();
    setOpen(false);
  }

  function clearAndClose() {
    props.onClear();
    setOpen(false);
  }

  return (
    <div ref={rootRef} style={styles.filterRoot}>
      <Button
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popupId}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        Filtro ▾
      </Button>

      {open && (
        <div id={popupId} role="dialog" aria-label="Filtro de projetos" style={styles.popover}>
          <div style={styles.popoverContent}>
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Nome do projeto (contém)</label>
              <input
                value={value.searchTitle}
                onChange={(e) => props.onChange({ searchTitle: e.target.value })}
                placeholder="Ex: Máquina..."
                style={styles.inputBase}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Status</label>
              <select
                value={value.status}
                onChange={(e) => props.onChange({ status: e.target.value })}
                style={styles.select}
              >
                <option value="">Todos</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Unidade</label>
              <select
                value={value.unit}
                onChange={(e) => props.onChange({ unit: e.target.value })}
                style={styles.select}
              >
                <option value="">Todas</option>
                {UNIT_OPTIONS.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            <div style={styles.twoColumns}>
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Ordenar por</label>
                <select
                  value={value.sortBy}
                  onChange={(e) => props.onChange({ sortBy: e.target.value as SortBy })}
                  style={styles.select}
                >
                  <option value="Title">Nome (Title)</option>
                  <option value="Id">ID</option>
                  <option value="approvalYear">Ano</option>
                </select>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Direção</label>
                <select
                  value={value.sortDir}
                  onChange={(e) => props.onChange({ sortDir: e.target.value as SortDir })}
                  style={styles.select}
                >
                  <option value="asc">Crescente (A→Z / menor→maior)</option>
                  <option value="desc">Decrescente (Z→A / maior→menor)</option>
                </select>
              </div>
            </div>

            <div style={styles.footerActions}>
              <Button type="button" onClick={clearAndClose}>Limpar</Button>
              <Button tone="primary" type="button" onClick={applyAndClose}>Aplicar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
