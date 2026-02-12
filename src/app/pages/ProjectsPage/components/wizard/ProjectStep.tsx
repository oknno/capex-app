import { useState } from "react";

import { Field } from "../../../../components/ui/Field";
import type { ProjectDraft } from "../../../../../services/sharepoint/projectsApi";
import {
  ASSET_TYPE_OPTIONS,
  buildYearOptions,
  CATEGORY_OPTIONS,
  CENTER_OPTIONS_BY_COMPANY,
  COMPANY_OPTIONS,
  EXCHANGE_RATE,
  FUNDING_SOURCE_OPTIONS,
  INVESTMENT_LEVEL_OPTIONS,
  INVESTMENT_TYPE_OPTIONS,
  KPI_TYPE_OPTIONS,
  LOCATION_OPTIONS_BY_UNIT,
  ROCE_CLASS_OPTIONS,
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

function investmentLevelLabel(level?: string) {
  if (!level) return "";
  return INVESTMENT_LEVEL_OPTIONS.find((option) => option.value === level)?.label ?? level;
}

export function ProjectStep(props: { draft: ProjectDraft; readOnly: boolean; onChange: (patch: Partial<ProjectDraft>) => void }) {
  const d = props.draft;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const yearOptions = buildYearOptions(5);
  const today = todayIsoDate();
  const centerOptions = getOptionsWithFallback(CENTER_OPTIONS_BY_COMPANY[d.company ?? ""], "Centro");
  const unitOptions = getOptionsWithFallback(UNIT_OPTIONS_BY_CENTER[d.center ?? ""], "Unidade");
  const locationOptions = getOptionsWithFallback(LOCATION_OPTIONS_BY_UNIT[d.unit ?? ""], "Local");

  return (
    <div style={{ display: "grid", gap: 12, padding: 14 }}>
      <SectionTitle title="Sobre o Projeto" subtitle="Preencha os dados principais do projeto para iniciar o cadastro." />

      <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", width: "fit-content" }}>
        <input type="checkbox" checked={showAdvanced} onChange={(e) => setShowAdvanced(e.target.checked)} disabled={props.readOnly} />
        Mostrar campos avançados
      </label>

      <div style={wizardLayoutStyles.grid2}>
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

      <SectionTitle title="Informação Operacional" />
      <div style={wizardLayoutStyles.grid2}>
        <FieldSelect label="Empresa" value={d.company ?? ""} options={COMPANY_OPTIONS} disabled={props.readOnly} onChange={(v) => props.onChange({ company: v || undefined, center: undefined, unit: undefined, location: undefined })} />
        <FieldSelect label="Centro" value={d.center ?? ""} options={centerOptions} disabled={props.readOnly || !d.company} onChange={(v) => props.onChange({ center: v || undefined, unit: undefined, location: undefined })} />

        <FieldSelect label="Unidade" value={d.unit ?? ""} options={unitOptions} disabled={props.readOnly || !d.center} onChange={(v) => props.onChange({ unit: v || undefined, location: undefined })} />
        <FieldSelect label="Local de Implantação" value={d.location ?? ""} options={locationOptions} disabled={props.readOnly || !d.unit} onChange={(v) => props.onChange({ location: v || undefined })} />
      </div>

      {showAdvanced && (
        <div style={{ display: "grid", gap: 12, border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, background: "#f9fafb" }}>
          <SectionTitle title="Informações avançadas" subtitle="Campos complementares para detalhamento do projeto." />

          <div style={wizardLayoutStyles.grid2}>
            <FieldText label="Status do Projeto" value={d.status ?? "Rascunho"} disabled={true} onChange={() => { }} />
            <FieldText label="Nível de Investimento" value={investmentLevelLabel(d.investmentLevel)} placeholder={`Calculado automaticamente (câmbio ${EXCHANGE_RATE})`} disabled={true} onChange={() => { }} />

            <FieldText label="Função do Projeto" value={d.projectFunction ?? ""} maxLength={35} disabled={props.readOnly} onChange={(v) => props.onChange({ projectFunction: v.slice(0, 35) })} />
            <FieldText label="C. Custo Depreciação" value={d.depreciationCostCenter ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ depreciationCostCenter: v })} />

            <FieldSelect label="Categoria" value={d.category ?? ""} options={CATEGORY_OPTIONS} disabled={props.readOnly} onChange={(v) => props.onChange({ category: v || undefined })} />
            <FieldSelect label="Tipo de Investimento" value={d.investmentType ?? ""} options={INVESTMENT_TYPE_OPTIONS} disabled={props.readOnly} onChange={(v) => props.onChange({ investmentType: v || undefined })} />

            <FieldSelect label="Tipo de Ativo" value={d.assetType ?? ""} options={ASSET_TYPE_OPTIONS} disabled={props.readOnly} onChange={(v) => props.onChange({ assetType: v || undefined })} />
            <FieldText label="Usuário do Projeto" value={d.projectUser ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ projectUser: v.toUpperCase() })} />

            <FieldText label="Líder do Projeto" value={d.projectLeader ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ projectLeader: v.toUpperCase() })} />
          </div>

          <SectionTitle title="Detalhamento Complementar" />
          <Field label="Necessidade do Negócio">
            <textarea value={d.businessNeed ?? ""} disabled={props.readOnly} onChange={(e) => props.onChange({ businessNeed: e.target.value })} rows={3} style={{ ...wizardLayoutStyles.input, resize: "vertical" }} />
          </Field>

          <Field label="Solução da Proposta">
            <textarea value={d.proposedSolution ?? ""} disabled={props.readOnly} onChange={(e) => props.onChange({ proposedSolution: e.target.value })} rows={3} style={{ ...wizardLayoutStyles.input, resize: "vertical" }} />
          </Field>

          <SectionTitle title="Indicadores de Desempenho" />
          <div style={wizardLayoutStyles.grid2}>
            <FieldSelect label="Tipo de KPI" value={d.kpiType ?? ""} options={KPI_TYPE_OPTIONS} disabled={props.readOnly} onChange={(v) => props.onChange({ kpiType: v || undefined })} />
            <FieldText label="Nome do KPI" value={d.kpiName ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ kpiName: v.toUpperCase() })} />

            <FieldNumber label="KPI Atual" value={d.kpiCurrent ?? "0"} disabled={props.readOnly} onChange={(v) => {
              const clean = onlyIntegerOrEmpty(v);
              if (clean === null) return;
              props.onChange({ kpiCurrent: clean === "" ? "0" : clean });
            }} />
            <FieldNumber label="KPI Esperado" value={d.kpiExpected ?? "0"} disabled={props.readOnly} onChange={(v) => {
              const clean = onlyIntegerOrEmpty(v);
              if (clean === null) return;
              props.onChange({ kpiExpected: clean === "" ? "0" : clean });
            }} />
          </div>

          <Field label="Descrição do KPI">
            <textarea value={d.kpiDescription ?? ""} disabled={props.readOnly} onChange={(e) => props.onChange({ kpiDescription: e.target.value })} rows={3} style={{ ...wizardLayoutStyles.input, resize: "vertical" }} />
          </Field>

          <SectionTitle title="ROCE" />
          <div style={wizardLayoutStyles.grid2}>
            <FieldSelect label="Classificação do ROCE" value={d.roceClassification ?? ""} options={ROCE_CLASS_OPTIONS} disabled={props.readOnly} onChange={(v) => props.onChange({ roceClassification: v || undefined })} />
            <FieldNumber label="ROCE" value={d.roce ?? ""} disabled={props.readOnly} onChange={(v) => {
              const clean = onlyIntegerOrEmpty(v);
              if (clean === null) return;
              props.onChange({ roce: clean === "" ? undefined : Number(clean) });
            }} />

            <FieldNumber label="Ganho (R$)" value={d.roceGain ?? ""} disabled={props.readOnly} onChange={(v) => {
              const clean = onlyIntegerOrEmpty(v);
              if (clean === null) return;
              props.onChange({ roceGain: clean === "" ? undefined : Number(clean) });
            }} />
            <FieldNumber label="Perda (R$)" value={d.roceLoss ?? ""} disabled={props.readOnly} onChange={(v) => {
              const clean = onlyIntegerOrEmpty(v);
              if (clean === null) return;
              props.onChange({ roceLoss: clean === "" ? undefined : Number(clean) });
            }} />
          </div>

          <Field label="Descrição do ganho">
            <textarea value={d.roceGainDescription ?? ""} disabled={props.readOnly} onChange={(e) => props.onChange({ roceGainDescription: e.target.value })} rows={2} style={{ ...wizardLayoutStyles.input, resize: "vertical" }} />
          </Field>

          <Field label="Descrição da perda">
            <textarea value={d.roceLossDescription ?? ""} disabled={props.readOnly} onChange={(e) => props.onChange({ roceLossDescription: e.target.value })} rows={2} style={{ ...wizardLayoutStyles.input, resize: "vertical" }} />
          </Field>
        </div>
      )}

      <div style={{ fontSize: 12, color: "#6b7280" }}>Regra 1M: &lt; 1.000.000 → só PEPs • ≥ 1.000.000 → estrutura completa.</div>
    </div>
  );
}
