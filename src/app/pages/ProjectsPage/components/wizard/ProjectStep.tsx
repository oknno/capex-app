import { Field } from "../../../../components/ui/Field";
import type { ProjectDraft } from "../../../../../services/sharepoint/projectsApi";
import { FieldNumber, FieldText, SectionTitle, wizardLayoutStyles } from "./WizardUi";

export function ProjectStep(props: { draft: ProjectDraft; readOnly: boolean; onChange: (patch: Partial<ProjectDraft>) => void }) {
  const d = props.draft;

  return (
    <div style={{ display: "grid", gap: 12, padding: 14 }}>
      <SectionTitle title="Projeto" subtitle="Cadastro completo de campos da lista Projects." />

      <div style={wizardLayoutStyles.grid2}>
        <FieldText label="Title * (MAIÚSCULO)" value={d.Title ?? ""} placeholder="Ex: MODERNIZAÇÃO LINHA..." disabled={props.readOnly} onChange={(v) => props.onChange({ Title: v.toUpperCase() })} />
        <FieldNumber label="approvalYear" value={d.approvalYear ?? new Date().getFullYear()} placeholder="2026" disabled={props.readOnly} onChange={(v) => props.onChange({ approvalYear: v === "" ? undefined : Math.round(Number(v)) })} />

        <FieldNumber label="budgetBrl (inteiro)" value={d.budgetBrl ?? ""} placeholder="Ex: 5000000" disabled={props.readOnly} onChange={(v) => props.onChange({ budgetBrl: v === "" ? undefined : Math.round(Number(v)) })} />
        <FieldText label="status (controle do sistema)" value={d.status ?? "Rascunho"} disabled={true} onChange={() => {}} />

        <FieldText label="investmentLevel" value={d.investmentLevel ?? ""} placeholder="Auto: LT_1M / GE_1M" disabled={true} onChange={() => {}} />
        <FieldText label="fundingSource" value={d.fundingSource ?? ""} placeholder="Ex: BUDGET 2026" disabled={props.readOnly} onChange={(v) => props.onChange({ fundingSource: v })} />

        <FieldText label="company" value={d.company ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ company: v })} />
        <FieldText label="center" value={d.center ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ center: v })} />

        <FieldText label="unit" value={d.unit ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ unit: v })} />
        <FieldText label="location" value={d.location ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ location: v })} />

        <FieldText label="depreciationCostCenter" value={d.depreciationCostCenter ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ depreciationCostCenter: v })} />
        <FieldText label="category" value={d.category ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ category: v })} />

        <FieldText label="investmentType" value={d.investmentType ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ investmentType: v })} />
        <FieldText label="assetType" value={d.assetType ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ assetType: v })} />

        <FieldText label="projectFunction" value={d.projectFunction ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ projectFunction: v })} />
        <FieldText label="projectLeader (MAIÚSCULO)" value={d.projectLeader ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ projectLeader: v.toUpperCase() })} />

        <FieldText label="projectUser (MAIÚSCULO)" value={d.projectUser ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ projectUser: v.toUpperCase() })} />
        <FieldText label="startDate (YYYY-MM-DD ou ISO)" value={d.startDate ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ startDate: v })} />

        <FieldText label="endDate (YYYY-MM-DD ou ISO)" value={d.endDate ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ endDate: v })} />
        <FieldText label="kpiType" value={d.kpiType ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ kpiType: v })} />

        <FieldText label="kpiName (MAIÚSCULO)" value={d.kpiName ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ kpiName: v.toUpperCase() })} />
        <FieldText label="kpiCurrent" value={d.kpiCurrent ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ kpiCurrent: v })} />

        <FieldText label="kpiExpected" value={d.kpiExpected ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ kpiExpected: v })} />
        <FieldNumber label="roceGain" value={d.roceGain ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ roceGain: v === "" ? undefined : Number(v) })} />

        <FieldNumber label="roceLoss" value={d.roceLoss ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ roceLoss: v === "" ? undefined : Number(v) })} />
        <FieldText label="roceClassification" value={d.roceClassification ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ roceClassification: v })} />
      </div>

      <Field label="businessNeed">
        <textarea value={d.businessNeed ?? ""} disabled={props.readOnly} onChange={(e) => props.onChange({ businessNeed: e.target.value })} rows={3} style={{ ...wizardLayoutStyles.input, resize: "vertical" }} />
      </Field>

      <Field label="proposedSolution">
        <textarea value={d.proposedSolution ?? ""} disabled={props.readOnly} onChange={(e) => props.onChange({ proposedSolution: e.target.value })} rows={3} style={{ ...wizardLayoutStyles.input, resize: "vertical" }} />
      </Field>

      <Field label="kpiDescription">
        <textarea value={d.kpiDescription ?? ""} disabled={props.readOnly} onChange={(e) => props.onChange({ kpiDescription: e.target.value })} rows={3} style={{ ...wizardLayoutStyles.input, resize: "vertical" }} />
      </Field>

      <Field label="roceGainDescription">
        <textarea value={d.roceGainDescription ?? ""} disabled={props.readOnly} onChange={(e) => props.onChange({ roceGainDescription: e.target.value })} rows={2} style={{ ...wizardLayoutStyles.input, resize: "vertical" }} />
      </Field>

      <Field label="roceLossDescription">
        <textarea value={d.roceLossDescription ?? ""} disabled={props.readOnly} onChange={(e) => props.onChange({ roceLossDescription: e.target.value })} rows={2} style={{ ...wizardLayoutStyles.input, resize: "vertical" }} />
      </Field>

      <div style={{ fontSize: 12, color: "#6b7280" }}>Regra 1M: &lt; 1.000.000 → só PEPs • ≥ 1.000.000 → estrutura completa.</div>
    </div>
  );
}
