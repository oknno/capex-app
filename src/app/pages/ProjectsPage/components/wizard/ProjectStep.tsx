import type { ProjectDraft } from "../../../../../services/sharepoint/projectsApi";
import {
  buildYearOptions,
  CENTER_OPTIONS_BY_COMPANY,
  COMPANY_OPTIONS,
  FUNDING_SOURCE_OPTIONS,
  LOCATION_OPTIONS_BY_UNIT,
  UNIT_OPTIONS_BY_CENTER,
  todayIsoDate,
} from "./wizardOptions";
import { FieldDate, FieldNumber, FieldSelect, FieldText, SectionTitle, wizardLayoutStyles } from "./WizardUi";

function onlyIntegerOrEmpty(value: string) {
  if (value === "") return "";
  return /^\d+$/.test(value) ? value : null;
}

function getOptionsWithFallback(options: { value: string; label: string }[] | undefined, prefix: string) {
  if (options?.length) return options;
  return Array.from({ length: 4 }, (_, i) => ({ value: `${prefix}_${i + 1}`, label: `${prefix} ${i + 1}` }));
}

export function ProjectStep(props: { draft: ProjectDraft; readOnly: boolean; onChange: (patch: Partial<ProjectDraft>) => void }) {
  const d = props.draft;
  const yearOptions = buildYearOptions(5);
  const today = todayIsoDate();
  const centerOptions = getOptionsWithFallback(CENTER_OPTIONS_BY_COMPANY[d.company ?? ""], "Centro");
  const unitOptions = getOptionsWithFallback(UNIT_OPTIONS_BY_CENTER[d.center ?? ""], "Unidade");
  const locationOptions = getOptionsWithFallback(LOCATION_OPTIONS_BY_UNIT[d.unit ?? ""], "Local");

  return (
    <div style={{ ...wizardLayoutStyles.sectionStack, padding: 14 }}>
      <div style={wizardLayoutStyles.card}>
        <SectionTitle title="Dados principais" subtitle="O que preencher aqui: nome, orçamento, verba e datas do projeto." />

        <div style={wizardLayoutStyles.grid2Relaxed}>
          <FieldText label="Nome do Projeto *" value={d.Title ?? ""} maxLength={25} placeholder="Ex: MODERNIZAÇÃO DA LINHA" disabled={props.readOnly} onChange={(v) => props.onChange({ Title: v.toUpperCase().slice(0, 25) })} />
          <FieldSelect label="Ano de Aprovação *" value={d.approvalYear ?? ""} options={yearOptions} disabled={props.readOnly} onChange={(v) => props.onChange({ approvalYear: v ? Number(v) : undefined })} />

          <FieldNumber label="Orçamento do Projeto em R$ *" value={d.budgetBrl ?? ""} placeholder="Ex: 5000000" disabled={props.readOnly} onChange={(v) => {
            const clean = onlyIntegerOrEmpty(v);
            if (clean === null) return;
            props.onChange({ budgetBrl: clean === "" ? undefined : Number(clean) });
          }} />
          <FieldSelect label="Origem da Verba" value={d.fundingSource ?? ""} options={FUNDING_SOURCE_OPTIONS} disabled={props.readOnly} onChange={(v) => props.onChange({ fundingSource: v || undefined })} />

          <FieldDate label="Data de Início" value={d.startDate ?? ""} min={today} disabled={props.readOnly} onChange={(v) => props.onChange({ startDate: v || undefined })} />
          <FieldDate label="Data de Término" value={d.endDate ?? ""} min={d.startDate || today} disabled={props.readOnly} onChange={(v) => props.onChange({ endDate: v || undefined })} />
        </div>
      </div>

      <div style={wizardLayoutStyles.card}>
        <SectionTitle title="Estrutura operacional" subtitle="O que preencher aqui: empresa, centro, unidade e local da implantação." />

        <div style={wizardLayoutStyles.grid2Relaxed}>
          <FieldSelect label="Empresa" value={d.company ?? ""} options={COMPANY_OPTIONS} disabled={props.readOnly} onChange={(v) => props.onChange({ company: v || undefined, center: undefined, unit: undefined, location: undefined })} />
          <FieldSelect label="Centro" value={d.center ?? ""} options={centerOptions} disabled={props.readOnly || !d.company} onChange={(v) => props.onChange({ center: v || undefined, unit: undefined, location: undefined })} />

          <FieldSelect label="Unidade" value={d.unit ?? ""} options={unitOptions} disabled={props.readOnly || !d.center} onChange={(v) => props.onChange({ unit: v || undefined, location: undefined })} />
          <FieldSelect label="Local de Implantação" value={d.location ?? ""} options={locationOptions} disabled={props.readOnly || !d.unit} onChange={(v) => props.onChange({ location: v || undefined })} />
        </div>
      </div>

      <div style={{ fontSize: 12, color: "#6b7280" }}>Regra 1M: &lt; 1.000.000 → só PEPs • ≥ 1.000.000 → estrutura completa.</div>
    </div>
  );
}
