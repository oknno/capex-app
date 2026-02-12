import { Button } from "../../../../components/ui/Button";
import { SectionTitle, SummaryBadge } from "./WizardUi";

export function ReviewStep(props: {
  readOnly: boolean;
  projectId: number | null;
  totals: { milestones: number; activities: number; peps: number; totalPeps: number };
  onBackToDraft: () => Promise<void>;
}) {
  return (
    <div style={{ padding: 14, display: "grid", gap: 12 }}>
      <SectionTitle title="Revisão" subtitle="Conferência final antes do commit transacional." />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <SummaryBadge label="Milestones" value={props.totals.milestones} />
        <SummaryBadge label="Activities" value={props.totals.activities} />
        <SummaryBadge label="PEPs" value={props.totals.peps} />
        <SummaryBadge label="Total PEPs (BRL)" value={props.totals.totalPeps.toLocaleString("pt-BR")} />
      </div>

      {props.projectId && <div style={{ fontSize: 12, color: "#6b7280" }}>Edit/View: ProjectId atual no SharePoint: <b>{props.projectId}</b></div>}

      {!props.readOnly && props.projectId && <Button onClick={props.onBackToDraft}>Voltar para Rascunho (SharePoint)</Button>}
      {!props.readOnly && <div style={{ fontSize: 12, color: "#6b7280" }}>O commit cria/atualiza o projeto, cria estrutura e PEPs e envia para Aprovação.</div>}
    </div>
  );
}
