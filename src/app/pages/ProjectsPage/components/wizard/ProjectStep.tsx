import type { ProjectDraft } from "../../../../../services/sharepoint/projectsApi";
import { FieldNumber, FieldText, SectionTitle, wizardLayoutStyles } from "./WizardUi";

export function ProjectStep(props: { draft: ProjectDraft; readOnly: boolean; onChange: (patch: Partial<ProjectDraft>) => void }) {
  const d = props.draft;

  return (
    <div style={{ display: "grid", gap: 12, padding: 14 }}>
      <SectionTitle title="Projeto" subtitle="Campos essenciais e governança (maiúsculo / inteiros / status controlado)." />

      <div style={wizardLayoutStyles.grid2}>
        <FieldText label="Title * (MAIÚSCULO)" value={d.Title ?? ""} placeholder="Ex: MODERNIZAÇÃO LINHA..." disabled={props.readOnly} onChange={(v) => props.onChange({ Title: v.toUpperCase() })} />
        <FieldNumber label="budgetBrl (inteiro)" value={d.budgetBrl ?? ""} placeholder="Ex: 5000000" disabled={props.readOnly} onChange={(v) => props.onChange({ budgetBrl: v === "" ? undefined : Math.round(Number(v)) })} />
        <FieldNumber label="approvalYear" value={d.approvalYear ?? new Date().getFullYear()} placeholder="2026" disabled={props.readOnly} onChange={(v) => props.onChange({ approvalYear: v === "" ? undefined : Math.round(Number(v)) })} />
        <FieldText label="status (controle do sistema)" value={d.status ?? "Rascunho"} disabled={true} onChange={() => {}} />
        <FieldText label="fundingSource" value={d.fundingSource ?? ""} placeholder="Ex: BUDGET 2026" disabled={props.readOnly} onChange={(v) => props.onChange({ fundingSource: v })} />
        <FieldText label="projectLeader (MAIÚSCULO)" value={d.projectLeader ?? ""} placeholder="NOME SOBRENOME" disabled={props.readOnly} onChange={(v) => props.onChange({ projectLeader: v.toUpperCase() })} />
        <FieldText label="projectUser (MAIÚSCULO)" value={d.projectUser ?? ""} placeholder="NOME SOBRENOME" disabled={props.readOnly} onChange={(v) => props.onChange({ projectUser: v.toUpperCase() })} />
        <FieldText label="kpiName (MAIÚSCULO)" value={d.kpiName ?? ""} placeholder="EX: REDUÇÃO CONSUMO..." disabled={props.readOnly} onChange={(v) => props.onChange({ kpiName: v.toUpperCase() })} />
      </div>

      <div style={{ fontSize: 12, color: "#6b7280" }}>Regra 1M: &lt; 1.000.000 → só PEPs • ≥ 1.000.000 → estrutura completa.</div>
    </div>
  );
}
