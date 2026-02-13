import type { CSSProperties, ReactNode } from "react";

import type { WizardDraftState } from "../../../../../domain/projects/project.validators";
import { Button } from "../../../../components/ui/Button";
import { SectionTitle } from "./WizardUi";

type SummaryValue = string | number | undefined;

function renderValue(value: SummaryValue) {
  return value === undefined || value === "" ? "—" : String(value);
}

function SummaryField(props: { label: string; value: SummaryValue; minWidth?: number }) {
  return (
    <div style={{ minWidth: props.minWidth ?? 180 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>{props.label}</div>
      <div style={{ fontSize: 14, color: "#111827", lineHeight: 1.4, wordBreak: "break-word" }}>{renderValue(props.value)}</div>
    </div>
  );
}

function SummarySection(props: {
  title: string;
  columns?: number;
  children: ReactNode;
}) {
  const style: CSSProperties = {
    border: "1px solid #d1d5db",
    borderRadius: 16,
    padding: 22,
    display: "grid",
    gap: 16,
    background: "#f9fafb",
  };

  return (
    <section style={style}>
      <h3 style={{ margin: 0, fontSize: 32 / 2, fontWeight: 700, color: "#111827" }}>{props.title}</h3>
      <div
        style={{
          display: "grid",
          gap: 14,
          gridTemplateColumns: `repeat(${props.columns ?? 3}, minmax(180px, 1fr))`,
        }}
      >
        {props.children}
      </div>
    </section>
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
    <div style={{ padding: 14, display: "grid", gap: 16 }}>
      <SectionTitle title="Resumo para validação" subtitle="Conferência final com dados separados por tópicos." />

      <SummarySection title="1. Sobre o Projeto">
        <SummaryField label="Nome" value={project.Title} />
        <SummaryField label="Orçamento (R$)" value={project.budgetBrl?.toLocaleString("pt-BR")} />
        <SummaryField label="Nível de investimento" value={project.investmentLevel} />
        <SummaryField label="Ano" value={project.approvalYear} />
        <SummaryField label="Início" value={project.startDate} />
        <SummaryField label="Término" value={project.endDate} />
      </SummarySection>

      <SummarySection title="2/3/4/6/7">
        <SummaryField label="Origem da verba" value={project.fundingSource} />
        <SummaryField label="Programa" value={project.program} />
        <SummaryField label="Função" value={project.projectFunction} />
        <SummaryField label="Tipo de investimento" value={project.investmentType} />
        <SummaryField label="Tipo de ativo" value={project.assetType} />
        <SummaryField label="Empresa / Centro / Unidade" value={[project.company, project.center, project.unit].filter(Boolean).join(" / ")} />
        <SummaryField label="KPI" value={[project.kpiType, project.kpiName].filter(Boolean).join(" - ")} />
        <SummaryField label="ROCE" value={project.roce} />
      </SummarySection>

      <SummarySection title={props.needStructure ? "8. KEY Projects" : "5. Elemento PEP (projeto abaixo de 1M)"} columns={props.needStructure ? 4 : 2}>
        {props.needStructure && <SummaryField label="Marcos" value={milestones.length} />}
        {props.needStructure && <SummaryField label="Atividades" value={activities.length} />}
        <SummaryField label="PEPs" value={peps.length} />
        <SummaryField label="Total PEPs (R$)" value={peps.reduce((acc, pep) => acc + (Number(pep.amountBrl) || 0), 0).toLocaleString("pt-BR")} />
      </SummarySection>

      {props.projectId && (
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          ProjectId atual no SharePoint: <b>{props.projectId}</b>
        </div>
      )}

      {!props.readOnly && props.projectId && <Button onClick={props.onBackToDraft}>Voltar para Rascunho (SharePoint)</Button>}
    </div>
  );
}
