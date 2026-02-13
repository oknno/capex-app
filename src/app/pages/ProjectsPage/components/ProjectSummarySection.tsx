import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Field } from "../../../components/ui/Field";
import { StateMessage } from "../../../components/ui/StateMessage";
import { uiTokens } from "../../../components/ui/tokens";
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
        <Button onClick={props.onRefresh}>Atualizar</Button>
      </div>

      {!props.selectedId && <StateMessage state="empty" message="Selecione um projeto para ver o resumo e o Gantt." />}
      {props.selectedId && props.selectedFullState === "loading" && <StateMessage state="loading" message="Carregando detalhes..." />}
      {props.selectedId && props.selectedFullState === "error" && <StateMessage state="error" message="Erro ao carregar detalhes." />}

      {props.selectedFull && (
        <div style={styles.summaryContent}>
          <div style={styles.summaryTitleRow}>
            <div style={styles.projectTitle}>{hideSsoLabel(props.selectedFull.Title)}</div>
            <StatusBadge status={String(props.selectedFull.status ?? "Rascunho")} />
          </div>

          <div style={styles.fieldGrid}>
            <Field label="Orçamento (BRL)" layout="inline">{fmtMoney(props.selectedFull.budgetBrl)}</Field>
            <Field label="Responsável" layout="inline">{String(props.selectedFull.projectLeader ?? "-")}</Field>
            <Field label="Início / Fim" layout="inline">{`${fmtDate(props.selectedFull.startDate)}  →  ${fmtDate(props.selectedFull.endDate)}`}</Field>
            <Field label="Unidade" layout="inline">{String(props.selectedFull.unit ?? "-")}</Field>
            <Field label="Origem" layout="inline">{String(props.selectedFull.fundingSource ?? "-")}</Field>
          </div>

          <div style={styles.longTextWrap}>
            <LongTextBlock title="Business Need" text={truncateText(props.selectedFull.businessNeed ?? "-", 380)} />
            <LongTextBlock title="Proposed Solution" text={truncateText(props.selectedFull.proposedSolution ?? "-", 380)} />
          </div>

          <div style={styles.timelineWrap}>
            <div style={styles.sectionTitle}>Gantt (Marcos → Atividades)</div>
            {props.activitiesState === "loading" && <StateMessage state="loading" message="Carregando timeline..." />}
            {props.activitiesState === "error" && <StateMessage state="error" message="Erro ao carregar timeline." />}
            {props.activitiesState === "idle" && props.activities.length === 0 && <StateMessage state="empty" message="Sem atividades para este projeto." />}
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

  if (!rows.length) return <StateMessage state="empty" message="Atividades sem datas (startDate/endDate) não entram no Gantt." />;

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
            <div style={styles.ganttCardHead}>{title} <span style={{ color: uiTokens.colors.textMuted }}>({acts.length})</span></div>
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

function hideSsoLabel(value?: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return "-";

  const withoutSso = raw
    .replace(/\bSSO\b/gi, "")
    .replace(/\s*[-–—|/]\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return withoutSso || raw;
}

const styles = {
  summaryHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  summaryTitle: { fontWeight: 800, color: uiTokens.colors.textStrong },
  summaryContent: { display: "grid", gap: 10 },
  summaryTitleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 },
  projectTitle: { fontWeight: 800, color: uiTokens.colors.textStrong, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  fieldGrid: { borderTop: `1px solid ${uiTokens.colors.borderMuted}`, paddingTop: 10, display: "grid", gap: 8 },
  longTextWrap: { borderTop: `1px solid ${uiTokens.colors.borderMuted}`, paddingTop: 10, display: "grid", gap: 10 },
  longText: { fontSize: 13, color: uiTokens.colors.text, whiteSpace: "pre-wrap" },
  sectionTitle: { fontWeight: 800, marginBottom: 6 },
  timelineWrap: { borderTop: `1px solid ${uiTokens.colors.borderMuted}`, paddingTop: 10 },
  ganttGrid: { display: "grid", gap: 12 },
  ganttCard: { border: `1px solid ${uiTokens.colors.border}`, borderRadius: 12, overflow: "hidden" },
  ganttCardHead: { padding: "8px 10px", background: uiTokens.colors.surfaceMuted, borderBottom: `1px solid ${uiTokens.colors.border}`, fontWeight: 800 },
  ganttRows: { padding: 10, display: "grid", gap: 10 },
  ganttRow: { display: "grid", gridTemplateColumns: "160px 1fr", gap: 10, alignItems: "center" },
  ganttLabel: { fontSize: 12, color: uiTokens.colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  ganttTrack: { position: "relative", height: 16, background: uiTokens.colors.accentSoft, borderRadius: 999 },
  ganttBar: { position: "absolute", height: "100%", borderRadius: 999, background: uiTokens.colors.accent }
} as const;
