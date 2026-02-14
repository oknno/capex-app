import { Badge } from "../../../components/ui/Badge";
import { Field } from "../../../components/ui/Field";
import { StateMessage } from "../../../components/ui/StateMessage";
import { uiTokens } from "../../../components/ui/tokens";
import type { ProjectRow } from "../../../../services/sharepoint/projectsApi";

export function ProjectSummarySection(props: {
  selectedId: number | null;
  selectedFull: ProjectRow | null;
  selectedFullState: "idle" | "loading" | "error";
}) {
  return (
    <>
      <div style={styles.summaryHeader}>
        <div style={styles.summaryTitle}>Resumo</div>
      </div>

      {!props.selectedId && <StateMessage state="empty" message="Selecione um projeto para ver o resumo." />}
      {props.selectedId && props.selectedFullState === "loading" && <StateMessage state="loading" message="Carregando detalhes..." />}
      {props.selectedId && props.selectedFullState === "error" && <StateMessage state="error" message="Erro ao carregar detalhes." />}

      {props.selectedFull && (
        <div style={styles.summaryContent}>
          <div style={styles.summaryTitleRow}>
            <div style={styles.projectTitle}>{props.selectedFull.Title}</div>
            <StatusBadge status={String(props.selectedFull.status ?? "Rascunho")} />
          </div>

          <div style={styles.fieldGrid}>
            <Field label="Orçamento (BRL)" layout="inline">{fmtMoney(props.selectedFull.budgetBrl)}</Field>
            <Field label="Responsável" layout="inline">{String(props.selectedFull.projectLeader ?? "-")}</Field>
            <Field label="Início / Fim" layout="inline">{`${fmtDate(props.selectedFull.startDate)}  →  ${fmtDate(props.selectedFull.endDate)}`}</Field>
            <Field label="Unidade" layout="inline">{String(props.selectedFull.unit ?? "-")}</Field>
            <Field label="Origem" layout="inline">{String(props.selectedFull.fundingSource ?? "-")}</Field>
            <Field label="Programa" layout="inline">{String(props.selectedFull.program ?? "-")}</Field>
          </div>

          <div style={styles.longTextWrap}>
            <LongTextBlock title="Business Need" text={truncateText(props.selectedFull.businessNeed ?? "-", 380)} />
            <LongTextBlock title="Proposed Solution" text={truncateText(props.selectedFull.proposedSolution ?? "-", 380)} />
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
  summaryTitle: { fontWeight: 800, color: uiTokens.colors.textStrong },
  summaryContent: { display: "grid", gap: 10 },
  summaryTitleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 },
  projectTitle: { fontWeight: 800, color: uiTokens.colors.textStrong, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  fieldGrid: { borderTop: `1px solid ${uiTokens.colors.borderMuted}`, paddingTop: 10, display: "grid", gap: 8 },
  longTextWrap: { borderTop: `1px solid ${uiTokens.colors.borderMuted}`, paddingTop: 10, display: "grid", gap: 10 },
  longText: { fontSize: 13, color: uiTokens.colors.text, whiteSpace: "pre-wrap" },
  sectionTitle: { fontWeight: 800, marginBottom: 6 },
} as const;
