import { Badge } from "../../../components/ui/Badge";
import type { ProjectRow } from "../../../../services/sharepoint/projectsApi";
import type { MilestoneRow } from "../../../../services/sharepoint/milestonesApi";
import type { ActivityRowLite } from "../hooks/useProjectTimeline";

export function ProjectSummarySection(props: {
  selectedId: number | null;
  selectedFull: ProjectRow | null;
  selectedFullState: "idle" | "loading" | "error";
  onRefresh: () => void;
  activitiesState: "idle" | "loading" | "error";
  milestones: MilestoneRow[];
  activities: ActivityRowLite[];
}) {
  return (
    <>
      <div style={styles.summaryHeader}>
        <div style={styles.summaryTitle}>Resumo</div>
        <button className="btn" onClick={props.onRefresh}>Atualizar</button>
      </div>

      {!props.selectedId && <div style={styles.muted}>Selecione um projeto para ver o resumo e o Gantt.</div>}
      {props.selectedId && props.selectedFullState === "loading" && <div style={styles.muted}>Carregando detalhes...</div>}
      {props.selectedId && props.selectedFullState === "error" && <div style={styles.error}>Erro ao carregar detalhes.</div>}

      {props.selectedFull && (
        <div style={styles.summaryContent}>
          <div style={styles.summaryTitleRow}>
            <div style={styles.projectTitle}>{props.selectedFull.Title}</div>
            <StatusBadge status={String(props.selectedFull.status ?? "Rascunho")} />
          </div>

          <div style={styles.fieldGrid}>
            <Field label="Orçamento (BRL)" value={fmtMoney(props.selectedFull.budgetBrl)} />
            <Field label="Responsável" value={String(props.selectedFull.projectLeader ?? "-")} />
            <Field label="Início / Fim" value={`${fmtDate(props.selectedFull.startDate)}  →  ${fmtDate(props.selectedFull.endDate)}`} />
            <Field label="Unidade" value={String(props.selectedFull.unit ?? "-")} />
            <Field label="Origem" value={String(props.selectedFull.fundingSource ?? "-")} />
          </div>

          <div style={styles.longTextWrap}>
            <LongTextBlock title="Business Need" text={truncateText(props.selectedFull.businessNeed ?? "-", 380)} />
            <LongTextBlock title="Proposed Solution" text={truncateText(props.selectedFull.proposedSolution ?? "-", 380)} />
          </div>

          <div style={styles.timelineWrap}>
            <div style={styles.sectionTitle}>Gantt (Marcos → Atividades)</div>
            {props.activitiesState === "loading" && <div style={styles.muted}>Carregando timeline...</div>}
            {props.activitiesState === "error" && <div style={styles.error}>Erro ao carregar timeline.</div>}
            {props.activitiesState === "idle" && props.activities.length === 0 && <div style={styles.muted}>Sem atividades para este projeto.</div>}
            {props.activitiesState === "idle" && props.activities.length > 0 && <GanttByMilestone activities={props.activities} milestones={props.milestones} />}
          </div>
        </div>
      )}
    </>
  );
}

function LongTextBlock(props: { title: string; text: string }) {
  return (
    <div>
      <div style={styles.sectionTitle}>{props.title}</div>
      <div style={styles.longText}>{props.text}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.trim().toLowerCase();
  let tone: "neutral" | "info" | "success" | "danger" | "warning" = "neutral";

  if (s.includes("em aprova")) tone = "info";
  else if (s.includes("aprovado")) tone = "success";
  else if (s.includes("reprov")) tone = "danger";
  else if (s.includes("rascun")) tone = "neutral";
  else tone = "warning";

  return <Badge text={status} tone={tone} />;
}

function GanttByMilestone(props: { activities: ActivityRowLite[]; milestones: MilestoneRow[] }) {
  const msMap = new Map<number, string>();
  for (const m of props.milestones ?? []) msMap.set(m.Id, m.Title ?? `Milestone #${m.Id}`);

  const rows = props.activities
    .map((a) => ({ ...a, _s: a.startDate ? new Date(a.startDate) : null, _e: a.endDate ? new Date(a.endDate) : null }))
    .filter((a) => a._s && a._e && !Number.isNaN(a._s.getTime()) && !Number.isNaN(a._e.getTime()))
    .map((a) => ({ id: a.Id, title: a.Title, s: a._s as Date, e: a._e as Date, milestoneId: a.milestonesIdId ?? -1 }));

  if (!rows.length) return <div style={styles.muted}>Atividades sem datas (startDate/endDate) não entram no Gantt.</div>;

  const min = new Date(Math.min(...rows.map((r) => r.s.getTime())));
  const max = new Date(Math.max(...rows.map((r) => r.e.getTime())));
  const span = Math.max(1, max.getTime() - min.getTime());

  const groups = new Map<number, typeof rows>();
  for (const r of rows) {
    const arr = groups.get(r.milestoneId) ?? [];
    arr.push(r);
    groups.set(r.milestoneId, arr);
  }

  const orderedKeys = Array.from(groups.keys()).sort((a, b) => a - b);

  return (
    <div style={styles.ganttGrid}>
      {orderedKeys.slice(0, 8).map((mid) => {
        const acts = groups.get(mid) ?? [];
        const title = mid === -1 ? "Sem Marco" : (msMap.get(mid) ?? `Milestone #${mid}`);
        return (
          <div key={mid} style={styles.ganttCard}>
            <div style={styles.ganttCardHead}>{title} <span style={styles.muted}>({acts.length})</span></div>
            <div style={styles.ganttRows}>
              {acts.slice(0, 12).map((r) => {
                const left = ((r.s.getTime() - min.getTime()) / span) * 100;
                const width = ((r.e.getTime() - r.s.getTime()) / span) * 100;
                return (
                  <div key={r.id} style={styles.ganttRow}>
                    <div style={styles.ganttLabel}>{r.title}</div>
                    <div style={styles.ganttTrack}>
                      <div style={{ ...styles.ganttBar, left: `${left}%`, width: `${Math.max(2, width)}%` }} title={`${r.s.toLocaleDateString("pt-BR")} → ${r.e.toLocaleDateString("pt-BR")}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div style={styles.field}><div style={styles.fieldLabel}>{label}</div><div style={styles.fieldValue}>{value}</div></div>;
}

function fmtMoney(v?: number) {
  if (v == null || !Number.isFinite(Number(v))) return "-";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(v?: string) {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("pt-BR");
}

function truncateText(s: string, max: number) {
  const t = String(s ?? "");
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

const styles = {
  summaryHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  summaryTitle: { fontWeight: 800, color: "#111827" },
  summaryContent: { display: "grid", gap: 10 },
  summaryTitleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 },
  projectTitle: { fontWeight: 800, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  fieldGrid: { borderTop: "1px solid #f3f4f6", paddingTop: 10, display: "grid", gap: 8 },
  longTextWrap: { borderTop: "1px solid #f3f4f6", paddingTop: 10, display: "grid", gap: 10 },
  longText: { fontSize: 13, color: "#374151", whiteSpace: "pre-wrap" },
  sectionTitle: { fontWeight: 800, marginBottom: 6 },
  timelineWrap: { borderTop: "1px solid #f3f4f6", paddingTop: 10 },
  muted: { color: "#6b7280" },
  error: { color: "#b91c1c" },
  field: { display: "grid", gridTemplateColumns: "160px 1fr", gap: 10, alignItems: "center" },
  fieldLabel: { fontSize: 12, color: "#6b7280" },
  fieldValue: { fontSize: 13, color: "#111827" },
  ganttGrid: { display: "grid", gap: 12 },
  ganttCard: { border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" },
  ganttCardHead: { padding: "8px 10px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontWeight: 800 },
  ganttRows: { padding: 10, display: "grid", gap: 10 },
  ganttRow: { display: "grid", gridTemplateColumns: "160px 1fr", gap: 10, alignItems: "center" },
  ganttLabel: { fontSize: 12, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  ganttTrack: { position: "relative", height: 16, background: "#eef2ff", borderRadius: 999 },
  ganttBar: { position: "absolute", height: "100%", borderRadius: 999, background: "#1f2937" }
} as const;
