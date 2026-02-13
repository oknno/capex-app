import type { CSSProperties, ReactNode } from "react";

import type { WizardDraftState } from "../../../../../domain/projects/project.validators";
import { Button } from "../../../../components/ui/Button";
import { SectionTitle } from "./WizardUi";

type SummaryValue = string | number | undefined;

function renderValue(value: SummaryValue) {
  return value === undefined || value === "" ? "—" : String(value);
}

function SummaryField(props: { label: string; value: SummaryValue }) {
  return (
    <div style={{ minWidth: 180 }}>
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
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>{props.title}</h3>
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
      <SectionTitle title="Resumo para validação" subtitle="Conferência final com dados separados pelos blocos da fase 1." />

      <SummarySection title="1. Sobre o Projeto">
        <SummaryField label="Nome do Projeto" value={project.Title} />
        <SummaryField label="Orçamento do Projeto (R$)" value={project.budgetBrl?.toLocaleString("pt-BR")} />
        <SummaryField label="Nível de Investimento" value={project.investmentLevel} />
        <SummaryField label="Ano de Aprovação" value={project.approvalYear} />
        <SummaryField label="Data de Início" value={project.startDate} />
        <SummaryField label="Data de Término" value={project.endDate} />
      </SummarySection>

      <SummarySection title="2. Origem e Função" columns={2}>
        <SummaryField label="Origem da Verba" value={project.fundingSource} />
        <SummaryField label="Função do Projeto" value={project.projectFunction} />
      </SummarySection>

      <SummarySection title="3. Informação Operacional">
        <SummaryField label="Empresa" value={project.company} />
        <SummaryField label="Centro" value={project.center} />
        <SummaryField label="Unidade" value={project.unit} />
        <SummaryField label="Local de Implantação" value={project.location} />
        <SummaryField label="C. Custo Depreciação" value={project.depreciationCostCenter} />
        <SummaryField label="Categoria" value={project.category} />
        <SummaryField label="Tipo de Investimento" value={project.investmentType} />
        <SummaryField label="Tipo de Ativo" value={project.assetType} />
        <SummaryField label="Usuário do Projeto" value={project.projectUser} />
        <SummaryField label="Líder do Projeto" value={project.projectLeader} />
      </SummarySection>

      <SummarySection title="4. Detalhamento Complementar" columns={1}>
        <SummaryField label="Necessidade do Negócio" value={project.businessNeed} />
        <SummaryField label="Solução da Proposta" value={project.proposedSolution} />
      </SummarySection>

      <SummarySection title="6. Indicadores de Desempenho">
        <SummaryField label="Tipo de KPI" value={project.kpiType} />
        <SummaryField label="Nome do KPI" value={project.kpiName} />
        <SummaryField label="KPI Atual" value={project.kpiCurrent} />
        <SummaryField label="KPI Esperado" value={project.kpiExpected} />
        <SummaryField label="Descrição do KPI" value={project.kpiDescription} />
      </SummarySection>

      <SummarySection title="7. ROCE">
        <SummaryField label="Classificação do ROCE" value={project.roceClassification} />
        <SummaryField label="ROCE" value={project.roce} />
        <SummaryField label="Ganho (R$)" value={project.roceGain?.toLocaleString("pt-BR")} />
        <SummaryField label="Perda (R$)" value={project.roceLoss?.toLocaleString("pt-BR")} />
        <SummaryField label="Descrição do ganho" value={project.roceGainDescription} />
        <SummaryField label="Descrição da perda" value={project.roceLossDescription} />
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
