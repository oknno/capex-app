import { Field } from "../../../../components/ui/Field";
import type { ProjectDraft } from "../../../../../services/sharepoint/projectsApi";
import { FieldNumber, FieldText, SectionTitle, wizardLayoutStyles } from "./WizardUi";

export function ProjectStep(props: { draft: ProjectDraft; readOnly: boolean; onChange: (patch: Partial<ProjectDraft>) => void }) {
  const d = props.draft;

  return (
    <div style={{ display: "grid", gap: 12, padding: 14 }}>
      <SectionTitle title="Sobre o Projeto" subtitle="Preencha os dados principais do projeto para iniciar o cadastro." />

      <div style={wizardLayoutStyles.grid2}>
        <FieldText label="Nome do Projeto *" value={d.Title ?? ""} placeholder="Ex: MODERNIZAÇÃO DA LINHA" disabled={props.readOnly} onChange={(v) => props.onChange({ Title: v.toUpperCase() })} />
        <FieldNumber label="Ano de Aprovação *" value={d.approvalYear ?? new Date().getFullYear()} placeholder="2026" disabled={props.readOnly} onChange={(v) => props.onChange({ approvalYear: v === "" ? undefined : Math.round(Number(v)) })} />

        <FieldNumber label="Orçamento do Projeto (R$) *" value={d.budgetBrl ?? ""} placeholder="Ex: 5000000" disabled={props.readOnly} onChange={(v) => props.onChange({ budgetBrl: v === "" ? undefined : Math.round(Number(v)) })} />
        <FieldText label="Status do Projeto" value={d.status ?? "Rascunho"} disabled={true} onChange={() => {}} />

        <FieldText label="Nível de Investimento" value={d.investmentLevel ?? ""} placeholder="Calculado automaticamente" disabled={true} onChange={() => {}} />
        <FieldText label="Origem da Verba" value={d.fundingSource ?? ""} placeholder="Ex: BUDGET 2026" disabled={props.readOnly} onChange={(v) => props.onChange({ fundingSource: v })} />

        <FieldText label="Empresa" value={d.company ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ company: v })} />
        <FieldText label="Centro" value={d.center ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ center: v })} />

        <FieldText label="Unidade" value={d.unit ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ unit: v })} />
        <FieldText label="Local de Implantação" value={d.location ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ location: v })} />

        <FieldText label="Centro de Custo de Depreciação" value={d.depreciationCostCenter ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ depreciationCostCenter: v })} />
        <FieldText label="Categoria" value={d.category ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ category: v })} />

        <FieldText label="Tipo de Investimento" value={d.investmentType ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ investmentType: v })} />
        <FieldText label="Tipo de Ativo" value={d.assetType ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ assetType: v })} />

        <FieldText label="Função do Projeto" value={d.projectFunction ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ projectFunction: v })} />
        <FieldText label="Líder do Projeto" value={d.projectLeader ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ projectLeader: v.toUpperCase() })} />

        <FieldText label="Usuário do Projeto" value={d.projectUser ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ projectUser: v.toUpperCase() })} />
        <FieldText label="Data de Início" value={d.startDate ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ startDate: v })} />

        <FieldText label="Data de Término" value={d.endDate ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ endDate: v })} />
        <FieldText label="Tipo de KPI" value={d.kpiType ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ kpiType: v })} />

        <FieldText label="Nome do KPI" value={d.kpiName ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ kpiName: v.toUpperCase() })} />
        <FieldText label="KPI Atual" value={d.kpiCurrent ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ kpiCurrent: v })} />

        <FieldText label="KPI Esperado" value={d.kpiExpected ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ kpiExpected: v })} />
        <FieldNumber label="Ganho (R$)" value={d.roceGain ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ roceGain: v === "" ? undefined : Number(v) })} />

        <FieldNumber label="Perda (R$)" value={d.roceLoss ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ roceLoss: v === "" ? undefined : Number(v) })} />
        <FieldText label="Classificação do ROCE" value={d.roceClassification ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ roceClassification: v })} />
      </div>

      <Field label="Necessidade do Negócio">
        <textarea value={d.businessNeed ?? ""} disabled={props.readOnly} onChange={(e) => props.onChange({ businessNeed: e.target.value })} rows={3} style={{ ...wizardLayoutStyles.input, resize: "vertical" }} />
      </Field>

      <Field label="Solução Proposta">
        <textarea value={d.proposedSolution ?? ""} disabled={props.readOnly} onChange={(e) => props.onChange({ proposedSolution: e.target.value })} rows={3} style={{ ...wizardLayoutStyles.input, resize: "vertical" }} />
      </Field>

      <Field label="Descrição do KPI">
        <textarea value={d.kpiDescription ?? ""} disabled={props.readOnly} onChange={(e) => props.onChange({ kpiDescription: e.target.value })} rows={3} style={{ ...wizardLayoutStyles.input, resize: "vertical" }} />
      </Field>

      <Field label="Descrição do ganho">
        <textarea value={d.roceGainDescription ?? ""} disabled={props.readOnly} onChange={(e) => props.onChange({ roceGainDescription: e.target.value })} rows={2} style={{ ...wizardLayoutStyles.input, resize: "vertical" }} />
      </Field>

      <Field label="Descrição da perda">
        <textarea value={d.roceLossDescription ?? ""} disabled={props.readOnly} onChange={(e) => props.onChange({ roceLossDescription: e.target.value })} rows={2} style={{ ...wizardLayoutStyles.input, resize: "vertical" }} />
      </Field>

      <div style={{ fontSize: 12, color: "#6b7280" }}>Regra 1M: &lt; 1.000.000 → só PEPs • ≥ 1.000.000 → estrutura completa.</div>
    </div>
  );
}
