import type { CSSProperties, ReactNode } from "react";

import type { WizardDraftState } from "../../../../../domain/projects/project.validators";
import { projectFieldLabel } from "../../fieldLabels";
import { SectionTitle } from "./WizardUi";
import { uiTokens } from "../../../../components/ui/tokens";

type SummaryValue = string | number | undefined;

function renderValue(value: SummaryValue) {
  return value === undefined || value === "" ? "—" : String(value);
}

function getSummaryFieldSpan(value: SummaryValue, forceSpan?: 1 | 2 | 3): 1 | 2 | 3 {
  if (forceSpan) {
    return forceSpan;
  }

  const renderedValue = renderValue(value);
  const hasLineBreak = renderedValue.includes("\n");
  const normalizedLength = renderedValue.trim().length;

  if (hasLineBreak || normalizedLength > 110) {
    return 3;
  }

  if (normalizedLength > 55) {
    return 2;
  }

  return 1;
}

function toDateLabel(value?: string) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

function SummaryField(props: {
  label: string;
  value: SummaryValue;
  minWidth?: number;
  colSpan?: 1 | 2 | 3;
  forceSpan?: 1 | 2 | 3;
}) {
  const colSpan = props.colSpan ?? getSummaryFieldSpan(props.value, props.forceSpan);

  return (
    <div
      className="summary-field"
      style={{
        minWidth: props.minWidth ?? 180,
        gridColumn: `span ${colSpan}`
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: uiTokens.colors.text, marginBottom: 4 }}>{props.label}</div>
      <div style={{ fontSize: 14, color: uiTokens.colors.textStrong, lineHeight: 1.4, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>{renderValue(props.value)}</div>
    </div>
  );
}

function SummarySection(props: {
  title: string;
  columns?: number;
  children: ReactNode;
}) {
  const style: CSSProperties = {
    border: `1px solid ${uiTokens.colors.borderStrong}`,
    borderRadius: 16,
    padding: 22,
    display: "grid",
    gap: 16,
    background: uiTokens.colors.surfaceMuted
  };

  return (
    <section style={style}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: uiTokens.colors.textStrong }}>{props.title}</h3>
      <div
        className="summary-section-grid"
        style={{
          display: "grid",
          gap: 14,
          gridTemplateColumns: `repeat(${props.columns ?? 3}, minmax(180px, 1fr))`
        }}
      >
        {props.children}
      </div>
    </section>
  );
}

function PepSummaryCard(props: {
  needStructure: boolean;
  pepTitle: string;
  year: number;
  activity?: string;
  milestone?: string;
  amountBrl: number;
}) {
  const primaryText = props.needStructure ? (props.milestone ?? "—") : props.pepTitle;
  const secondaryText = props.needStructure ? (props.activity ?? props.pepTitle) : String(props.year);

  return (
    <article
      style={{
        border: `1px solid ${uiTokens.colors.border}`,
        borderRadius: 12,
        padding: 12,
        background: uiTokens.colors.surface
      }}
    >
      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: props.needStructure
            ? "minmax(0, 1.05fr) minmax(0, 1.35fr) minmax(150px, 0.7fr)"
            : "minmax(0, 1.5fr) minmax(84px, 0.5fr) minmax(150px, 0.7fr)",
          alignItems: "start"
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: uiTokens.colors.text, marginBottom: 4 }}>
            {props.needStructure ? "Marco" : "Elemento PEP"}
          </div>
          <div
            title={primaryText}
            style={{
              fontSize: 14,
              color: uiTokens.colors.textStrong,
              lineHeight: 1.4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {primaryText}
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: uiTokens.colors.text, marginBottom: 4 }}>
            {props.needStructure ? "Atividade" : "Ano"}
          </div>
          <div
            title={secondaryText}
            style={{
              fontSize: 14,
              color: uiTokens.colors.textStrong,
              lineHeight: 1.4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {secondaryText}
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: uiTokens.colors.text, marginBottom: 4, textAlign: "right" }}>
            Valor (R$)
          </div>
          <div
            style={{
              fontSize: 14,
              color: uiTokens.colors.textStrong,
              lineHeight: 1.4,
              textAlign: "right",
              whiteSpace: "nowrap"
            }}
          >
            {props.amountBrl.toLocaleString("pt-BR")}
          </div>
        </div>
      </div>
    </article>
  );
}

export function ReviewStep(props: {
  projectId: number | null;
  state: WizardDraftState;
  needStructure: boolean;
}) {
  const { project, milestones, activities, peps } = props.state;

  const pepSummaryItems = peps.map((pep) => {
    const activity = activities.find((item) => item.tempId === pep.activityTempId);
    const milestone = milestones.find((item) => item.tempId === activity?.milestoneTempId);
    return {
      pepTitle: pep.Title,
      year: pep.year,
      activity: activity?.Title,
      milestone: milestone?.Title,
      amountBrl: Number(pep.amountBrl) || 0
    };
  });

  const ganttItems = activities
    .filter((activity) => activity.startDate && activity.endDate)
    .map((activity) => ({
      milestone: milestones.find((item) => item.tempId === activity.milestoneTempId)?.Title ?? "MARCO",
      title: activity.Title,
      startDate: activity.startDate as string,
      endDate: activity.endDate as string
    }));

  const ganttBounds = ganttItems.length > 0
    ? {
      min: Math.min(...ganttItems.map((item) => new Date(`${item.startDate}T00:00:00`).getTime())),
      max: Math.max(...ganttItems.map((item) => new Date(`${item.endDate}T00:00:00`).getTime()))
    }
    : null;

  return (
    <div style={{ padding: 14, display: "grid", gap: 16 }}>
      <style>{`
        @media (max-width: 900px) {
          .summary-section-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }

          .summary-field {
            grid-column: span 1 !important;
          }
        }
      `}</style>
      <SectionTitle title="Resumo para validação" subtitle="Conferência final das informações preenchidas nas etapas 1 e 2." />

      <SummarySection title="1. Sobre o Projeto" columns={3}>
        <SummaryField label={projectFieldLabel("Title")} value={project.Title} />
        <SummaryField label="Orçamento (R$)" value={project.budgetBrl?.toLocaleString("pt-BR")} />
        <SummaryField label={projectFieldLabel("investmentLevel")} value={project.investmentLevel} />
        <SummaryField label={projectFieldLabel("approvalYear")} value={project.approvalYear} />
        <SummaryField label={projectFieldLabel("startDate")} value={toDateLabel(project.startDate)} />
        <SummaryField label={projectFieldLabel("endDate")} value={toDateLabel(project.endDate)} />
        <SummaryField label={projectFieldLabel("projectFunction")} value={project.projectFunction} />
      </SummarySection>

      <SummarySection title="2. Origem e Programa" columns={3}>
        <SummaryField label="Origem da verba" value={project.fundingSource} />
        <SummaryField label="Programa" value={project.program} />
        <SummaryField label="Projeto de origem" value={project.sourceProjectCode} />
      </SummarySection>

      <SummarySection title="3. Informação Operacional" columns={3}>
        <SummaryField label="Empresa" value={project.company} />
        <SummaryField label="Centro" value={project.center} />
        <SummaryField label="Unidade" value={project.unit} />
        <SummaryField label="Local" value={project.location} />
        <SummaryField label="Centro de custo depreciação" value={project.depreciationCostCenter} />
        <SummaryField label="Categoria" value={project.category} />
        <SummaryField label="Tipo de investimento" value={project.investmentType} />
        <SummaryField label="Tipo de ativo" value={project.assetType} />
        <SummaryField label="Líder do projeto" value={project.projectLeader} />
        <SummaryField label="Usuário do projeto" value={project.projectUser} />
      </SummarySection>

      <SummarySection title="4. Detalhamento Complementar" columns={2}>
        <SummaryField label="Necessidade do negócio" value={project.businessNeed} />
        <SummaryField label="Solução proposta" value={project.proposedSolution} />
      </SummarySection>

      <SummarySection title="5. Indicadores de Desempenho" columns={3}>
        <SummaryField label="Tipo de KPI" value={project.kpiType} />
        <SummaryField label="Nome do KPI" value={project.kpiName} />
        <SummaryField label="KPI atual" value={project.kpiCurrent} />
        <SummaryField label="KPI esperado" value={project.kpiExpected} />
        <SummaryField label="Descrição do KPI" value={project.kpiDescription} />
      </SummarySection>

      <SummarySection title="6. ROCE" columns={3}>
        <SummaryField label="Tem ROCE" value={project.hasRoce} />
        <SummaryField label="Ganho ROCE (R$)" value={project.roceGain?.toLocaleString("pt-BR")} />
        <SummaryField label="Descrição do ganho" value={project.roceGainDescription} />
        <SummaryField label="Perda ROCE (R$)" value={project.roceLoss?.toLocaleString("pt-BR")} />
        <SummaryField label="Descrição da perda" value={project.roceLossDescription} />
        <SummaryField label="Classificação ROCE" value={project.roceClassification} />
      </SummarySection>

      <SummarySection title={props.needStructure ? "7. Resumo de Estrutura e PEPs" : "7. Resumo de PEPs"} columns={1}>
        {!pepSummaryItems.length ? (
          <SummaryField label="Status" value="Nenhum PEP cadastrado." />
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {pepSummaryItems.map((item, index) => (
              <PepSummaryCard
                key={`${item.pepTitle}_${item.activity ?? "sem-atividade"}_${index}`}
                needStructure={props.needStructure}
                pepTitle={item.pepTitle}
                year={item.year}
                activity={item.activity}
                milestone={item.milestone}
                amountBrl={item.amountBrl}
              />
            ))}
          </div>
        )}
      </SummarySection>

      {props.needStructure && (
        <SummarySection title="8. Cronograma (Gantt)" columns={1}>
          {!ganttBounds || ganttItems.length === 0 ? (
            <SummaryField label="Status" value="Sem atividades com início e término para exibir cronograma." />
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {ganttItems.map((item) => {
                const total = Math.max(ganttBounds.max - ganttBounds.min, 1);
                const start = new Date(`${item.startDate}T00:00:00`).getTime();
                const end = new Date(`${item.endDate}T00:00:00`).getTime();
                const left = ((start - ganttBounds.min) / total) * 100;
                const width = (Math.max(end - start, 86400000) / total) * 100;
                return (
                  <div key={`${item.milestone}_${item.title}_${item.startDate}_${item.endDate}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, color: uiTokens.colors.text, marginBottom: 4 }}>
                      <span>{item.milestone} • {item.title}</span>
                      <span>{toDateLabel(item.startDate)} - {toDateLabel(item.endDate)}</span>
                    </div>
                    <div style={{ position: "relative", height: 14, borderRadius: 999, background: uiTokens.colors.border, overflow: "hidden" }}>
                      <div style={{ position: "absolute", left: `${left}%`, width: `${Math.min(width, 100 - left)}%`, top: 0, bottom: 0, background: uiTokens.colors.accentAlt, borderRadius: 999 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SummarySection>
      )}

      {props.projectId && (
        <div style={{ fontSize: 12, color: uiTokens.colors.textMuted }}>
          ID do projeto no SharePoint: <b>{props.projectId}</b>
        </div>
      )}
    </div>
  );
}
