import { calculateInvestmentLevel } from "../../../../../domain/projects/project.calculations";
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
  PROGRAM_OPTIONS,
  ROCE_CLASS_OPTIONS,
  UNIT_OPTIONS_BY_CENTER,
  todayIsoDate,
} from "./wizardOptions";
import { FieldDate, FieldNumber, FieldSelect, FieldText, SectionTitle, wizardLayoutStyles } from "./WizardUi";
import { Field } from "../../../../components/ui/Field";

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
  const levelCode = calculateInvestmentLevel(d.budgetBrl, EXCHANGE_RATE);
  const levelLabel = INVESTMENT_LEVEL_OPTIONS.find((item) => item.value === levelCode)?.label ?? "";

  return (
    <div style={{ ...wizardLayoutStyles.sectionStack, padding: 14 }}>
      <div style={wizardLayoutStyles.card}>
        <SectionTitle title="1. Sobre o Projeto" />
        <div style={wizardLayoutStyles.journeyStack}>
          <FieldText label="Nome do Projeto" value={d.Title ?? ""} maxLength={25} placeholder="Título do projeto" disabled={props.readOnly} onChange={(v) => props.onChange({ Title: v.toUpperCase().slice(0, 25) })} />

          <FieldNumber label="Orçamento do Projeto (R$)" value={d.budgetBrl ?? ""} placeholder="Ex: 500000 (sem pontos ou vírgulas)" disabled={props.readOnly} onChange={(v) => {
            const clean = onlyIntegerOrEmpty(v);
            if (clean === null) return;
            props.onChange({ budgetBrl: clean === "" ? undefined : Number(clean) });
          }} />

          <div style={wizardLayoutStyles.journeyPairGrid}>
            <FieldSelect label="Ano de Aprovação" value={d.approvalYear ?? ""} options={yearOptions} disabled={props.readOnly} onChange={(v) => props.onChange({ approvalYear: v ? Number(v) : undefined })} />
            <FieldText label="Nível de Investimento" value={levelCode ? `${levelCode} - ${levelLabel}` : ""} placeholder="Calculado automaticamente (câmbio 5,4)" disabled onChange={() => {}} />
          </div>

          <div style={wizardLayoutStyles.journeyPairGrid}>
            <FieldDate label="Data de Início" value={d.startDate ?? ""} min={today} disabled={props.readOnly} onChange={(v) => props.onChange({ startDate: v || undefined })} />
            <FieldDate label="Data de Término" value={d.endDate ?? ""} min={d.startDate || today} disabled={props.readOnly} onChange={(v) => props.onChange({ endDate: v || undefined })} />
          </div>
        </div>
      </div>

      <div style={wizardLayoutStyles.card}>
        <SectionTitle title="2. Origem e Função" />
        <div style={wizardLayoutStyles.journeyStack}>
          <div style={wizardLayoutStyles.journeyPairGrid}>
            <FieldSelect label="Origem da Verba" value={d.fundingSource ?? ""} options={FUNDING_SOURCE_OPTIONS} disabled={props.readOnly} onChange={(v) => props.onChange({ fundingSource: v || undefined })} />
            <FieldSelect label="Programa" value={d.program ?? ""} options={PROGRAM_OPTIONS} disabled={props.readOnly} onChange={(v) => props.onChange({ program: v || undefined })} />
          </div>
          <FieldText label="Função do Projeto" value={d.projectFunction ?? ""} maxLength={35} disabled={props.readOnly} onChange={(v) => props.onChange({ projectFunction: v.toUpperCase().slice(0, 35) })} />
        </div>
      </div>

      <div style={wizardLayoutStyles.card}>
        <SectionTitle title="3. Informação Operacional" />

        <div style={wizardLayoutStyles.journeyStack}>
          <div style={wizardLayoutStyles.journeyPairGrid}>
            <FieldSelect label="Empresa" value={d.company ?? ""} options={COMPANY_OPTIONS} disabled={props.readOnly} onChange={(v) => props.onChange({ company: v || undefined, center: undefined, unit: undefined, location: undefined })} />
            <FieldSelect label="Centro" value={d.center ?? ""} options={centerOptions} disabled={props.readOnly || !d.company} onChange={(v) => props.onChange({ center: v || undefined, unit: undefined, location: undefined })} />
          </div>

          <div style={wizardLayoutStyles.journeyPairGrid}>
            <FieldSelect label="Unidade" value={d.unit ?? ""} options={unitOptions} disabled={props.readOnly || !d.center} onChange={(v) => props.onChange({ unit: v || undefined, location: undefined })} />
            <FieldSelect label="Local de Implantação" value={d.location ?? ""} options={locationOptions} disabled={props.readOnly || !d.unit} onChange={(v) => props.onChange({ location: v || undefined })} />
          </div>

          <div style={wizardLayoutStyles.journeyPairGrid}>
            <FieldText label="C. Custo Depreciação" value={d.depreciationCostCenter ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ depreciationCostCenter: v.toUpperCase() })} />
            <FieldSelect label="Categoria" value={d.category ?? ""} options={CATEGORY_OPTIONS} disabled={props.readOnly} onChange={(v) => props.onChange({ category: v || undefined })} />
          </div>

          <div style={wizardLayoutStyles.journeyPairGrid}>
            <FieldSelect label="Tipo de Investimento" value={d.investmentType ?? ""} options={INVESTMENT_TYPE_OPTIONS} disabled={props.readOnly} onChange={(v) => props.onChange({ investmentType: v || undefined })} />
            <FieldSelect label="Tipo de Ativo" value={d.assetType ?? ""} options={ASSET_TYPE_OPTIONS} disabled={props.readOnly} onChange={(v) => props.onChange({ assetType: v || undefined })} />
          </div>

          <div style={wizardLayoutStyles.journeyPairGrid}>
            <FieldText label="Usuário do Projeto" value={d.projectUser ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ projectUser: v.toUpperCase() })} />
            <FieldText label="Líder do Projeto" value={d.projectLeader ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ projectLeader: v.toUpperCase() })} />
          </div>
        </div>
      </div>

      <div style={wizardLayoutStyles.card}>
        <SectionTitle title="4. Detalhamento Complementar" />
        <div style={wizardLayoutStyles.sectionStack}>
          <Field label="Necessidade do Negócio">
            <textarea
              value={d.businessNeed ?? ""}
              disabled={props.readOnly}
              rows={4}
              onChange={(e) => props.onChange({ businessNeed: e.target.value })}
              style={{ ...wizardLayoutStyles.input, ...wizardLayoutStyles.textareaReadable }}
            />
          </Field>

          <Field label="Solução da Proposta">
            <textarea
              value={d.proposedSolution ?? ""}
              disabled={props.readOnly}
              rows={4}
              onChange={(e) => props.onChange({ proposedSolution: e.target.value })}
              style={{ ...wizardLayoutStyles.input, ...wizardLayoutStyles.textareaReadable }}
            />
          </Field>
        </div>
      </div>

      <div style={wizardLayoutStyles.card}>
        <SectionTitle title="6. Indicadores de Desempenho" />
        <div style={wizardLayoutStyles.journeyStack}>
          <div style={wizardLayoutStyles.journeyPairGrid}>
            <FieldSelect label="Tipo de KPI" value={d.kpiType ?? ""} options={KPI_TYPE_OPTIONS} disabled={props.readOnly} onChange={(v) => props.onChange({ kpiType: v || undefined })} />
            <FieldText label="Nome do KPI" value={d.kpiName ?? ""} disabled={props.readOnly} onChange={(v) => props.onChange({ kpiName: v.toUpperCase() })} />
          </div>
          <div style={wizardLayoutStyles.journeyPairGrid}>
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
            <textarea value={d.kpiDescription ?? ""} disabled={props.readOnly} rows={3} onChange={(e) => props.onChange({ kpiDescription: e.target.value })} style={{ ...wizardLayoutStyles.input, ...wizardLayoutStyles.textareaReadable }} />
          </Field>
        </div>
      </div>

      <div style={wizardLayoutStyles.card}>
        <SectionTitle title="7. ROCE" />
        <div style={wizardLayoutStyles.journeyStack}>
          <div style={wizardLayoutStyles.journeyPairGrid}>
            <FieldSelect label="Classificação do ROCE" value={d.roceClassification ?? ""} options={ROCE_CLASS_OPTIONS} disabled={props.readOnly} onChange={(v) => props.onChange({ roceClassification: v || undefined })} />
            <FieldNumber label="ROCE" value={d.roce ?? ""} disabled={props.readOnly} onChange={(v) => {
              const clean = onlyIntegerOrEmpty(v);
              if (clean === null) return;
              props.onChange({ roce: clean === "" ? undefined : Number(clean) });
            }} />
          </div>

          <div style={wizardLayoutStyles.journeyPairGrid}>
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

          <div style={wizardLayoutStyles.journeyPairGrid}>
            <Field label="Descrição do ganho">
              <textarea value={d.roceGainDescription ?? ""} disabled={props.readOnly} rows={3} onChange={(e) => props.onChange({ roceGainDescription: e.target.value })} style={{ ...wizardLayoutStyles.input, ...wizardLayoutStyles.textareaReadable }} />
            </Field>
            <Field label="Descrição da perda">
              <textarea value={d.roceLossDescription ?? ""} disabled={props.readOnly} rows={3} onChange={(e) => props.onChange({ roceLossDescription: e.target.value })} style={{ ...wizardLayoutStyles.input, ...wizardLayoutStyles.textareaReadable }} />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}
