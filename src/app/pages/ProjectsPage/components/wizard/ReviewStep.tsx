import type { WizardDraftState } from "../../../../../domain/projects/project.validators";
import { Button } from "../../../../components/ui/Button";
import { SectionTitle } from "./WizardUi";

function SummaryRow(props: { label: string; value: string | number | undefined }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 8, fontSize: 13 }}>
      <b>{props.label}</b>
      <span>{props.value === undefined || props.value === "" ? "—" : String(props.value)}</span>
    </div>
  );
}

export function ReviewStep(props: {
  readOnly: boolean;
  projectId: number | null;
  state: WizardDraftState;
  needStructure: boolean;
  onBackToDraft: () => Promise<void>;
}) {
  const { project, milestones, activities, peps } = props.state;

  return (
    <div style={{ padding: 14, display: "grid", gap: 12 }}>
      <SectionTitle title="Resumo para validação" subtitle="Conferência final com dados separados por tópicos." />

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 700 }}>1. Sobre o Projeto</div>
        <SummaryRow label="Nome" value={project.Title} />
        <SummaryRow label="Orçamento (R$)" value={project.budgetBrl?.toLocaleString("pt-BR")} />
        <SummaryRow label="Ano" value={project.approvalYear} />
        <SummaryRow label="Nível investimento" value={project.investmentLevel} />
        <SummaryRow label="Início" value={project.startDate} />
        <SummaryRow label="Término" value={project.endDate} />
      </div>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 700 }}>2/3/4/6/7</div>
        <SummaryRow label="Origem da verba" value={project.fundingSource} />
        <SummaryRow label="Função" value={project.projectFunction} />
        <SummaryRow label="Empresa/Centro/Unidade" value={[project.company, project.center, project.unit].filter(Boolean).join(" / ")} />
        <SummaryRow label="Tipo investimento / ativo" value={[project.investmentType, project.assetType].filter(Boolean).join(" / ")} />
        <SummaryRow label="KPI" value={[project.kpiType, project.kpiName].filter(Boolean).join(" - ")} />
        <SummaryRow label="ROCE" value={project.roce} />
      </div>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 700 }}>{props.needStructure ? "8. KEY Projects" : "5. Elemento PEP (projeto abaixo de 1M)"}</div>
        {props.needStructure && <SummaryRow label="Marcos" value={milestones.length} />}
        {props.needStructure && <SummaryRow label="Atividades" value={activities.length} />}
        <SummaryRow label="PEPs" value={peps.length} />
        <SummaryRow label="Total PEPs (R$)" value={peps.reduce((acc, pep) => acc + (Number(pep.amountBrl) || 0), 0).toLocaleString("pt-BR")} />
      </div>

      {props.projectId && <div style={{ fontSize: 12, color: "#6b7280" }}>ProjectId atual no SharePoint: <b>{props.projectId}</b></div>}

      {!props.readOnly && props.projectId && <Button onClick={props.onBackToDraft}>Voltar para Rascunho (SharePoint)</Button>}
    </div>
  );
}
