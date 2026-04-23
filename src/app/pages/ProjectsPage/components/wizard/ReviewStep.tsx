import type { CSSProperties, ReactNode } from "react";

import type { WizardDraftState } from "../../../../../domain/projects/project.validators";
import { projectFieldLabel } from "../../fieldLabels";
import { SectionTitle } from "./WizardUi";
import { uiTokens } from "../../../../components/ui/tokens";
import { PepSummaryList } from "./PepSummaryList";

type SummaryValue = string | number | undefined;
type GanttItem = {
  milestone: string;
  title: string;
  startDate: string;
  endDate: string;
};

type GanttBounds = {
  min: number;
  max: number;
};

type MilestoneGroup = {
  milestoneName: string;
  startDateMin: string;
  endDateMax: string;
  activities: GanttItem[];
};

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

function getBarPosition(startDate: string, endDate: string, bounds: GanttBounds) {
  const total = Math.max(bounds.max - bounds.min, 1);
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T00:00:00`).getTime();
  const left = ((start - bounds.min) / total) * 100;
  const width = (Math.max(end - start, 86400000) / total) * 100;
  return { left, width: Math.min(width, 100 - left) };
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

export function ReviewStep(props: {
  projectId: number | null;
  state: WizardDraftState;
  needStructure: boolean;
}) {
  const { project, milestones, activities, peps } = props.state;


  const ganttItems: GanttItem[] = activities
    .filter((activity) => activity.startDate && activity.endDate)
    .map((activity) => ({
      milestone: milestones.find((item) => item.tempId === activity.milestoneTempId)?.Title ?? "MARCO",
      title: activity.Title,
      startDate: activity.startDate as string,
      endDate: activity.endDate as string
    }));

  const ganttBounds: GanttBounds | null = ganttItems.length > 0
    ? {
      min: Math.min(...ganttItems.map((item) => new Date(`${item.startDate}T00:00:00`).getTime())),
      max: Math.max(...ganttItems.map((item) => new Date(`${item.endDate}T00:00:00`).getTime()))
    }
    : null;

  const milestoneGroups: MilestoneGroup[] = Object.values(
    ganttItems.reduce<Record<string, MilestoneGroup>>((acc, item) => {
      const current = acc[item.milestone];
      if (!current) {
        acc[item.milestone] = {
          milestoneName: item.milestone,
          startDateMin: item.startDate,
          endDateMax: item.endDate,
          activities: [item]
        };
        return acc;
      }

      acc[item.milestone] = {
        ...current,
        startDateMin: item.startDate < current.startDateMin ? item.startDate : current.startDateMin,
        endDateMax: item.endDate > current.endDateMax ? item.endDate : current.endDateMax,
        activities: [...current.activities, item]
      };
      return acc;
    }, {})
  );

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
        <PepSummaryList
          needStructure={props.needStructure}
          peps={peps}
          activities={activities}
          milestones={milestones}
        />
      </SummarySection>

      {props.needStructure && (
        <SummarySection title="8. Cronograma (Gantt)" columns={1}>
          {!ganttBounds || ganttItems.length === 0 ? (
            <SummaryField label="Status" value="Sem atividades com início e término para exibir cronograma." />
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {milestoneGroups.map((milestoneGroup) => {
                const milestoneBar = getBarPosition(milestoneGroup.startDateMin, milestoneGroup.endDateMax, ganttBounds);
                return (
                  <div key={`${milestoneGroup.milestoneName}_${milestoneGroup.startDateMin}_${milestoneGroup.endDateMax}`} style={{ display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: uiTokens.colors.text, marginBottom: 2 }}>
                      <span style={{ minWidth: 0, flex: 1 }}>{milestoneGroup.milestoneName}</span>
                      <span style={{ marginLeft: "auto", textAlign: "right" }}>{toDateLabel(milestoneGroup.startDateMin)} - {toDateLabel(milestoneGroup.endDateMax)}</span>
                    </div>
                    <div style={{ position: "relative", height: 14, borderRadius: 999, background: uiTokens.colors.border, overflow: "hidden" }}>
                      <div style={{ position: "absolute", left: `${milestoneBar.left}%`, width: `${milestoneBar.width}%`, top: 0, bottom: 0, background: uiTokens.colors.accentWarning, borderRadius: 999 }} />
                    </div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {milestoneGroup.activities.map((item) => {
                        const activityBar = getBarPosition(item.startDate, item.endDate, ganttBounds);
                        return (
                          <div key={`${item.milestone}_${item.title}_${item.startDate}_${item.endDate}`}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: uiTokens.colors.text, marginBottom: 4 }}>
                              <span style={{ minWidth: 0, flex: 1 }}>{item.title}</span>
                              <span style={{ marginLeft: "auto", textAlign: "right" }}>{toDateLabel(item.startDate)} - {toDateLabel(item.endDate)}</span>
                            </div>
                            <div style={{ position: "relative", height: 14, borderRadius: 999, background: uiTokens.colors.border, overflow: "hidden" }}>
                              <div style={{ position: "absolute", left: `${activityBar.left}%`, width: `${activityBar.width}%`, top: 0, bottom: 0, background: uiTokens.colors.accentAlt, borderRadius: 999 }} />
                            </div>
                          </div>
                        );
                      })}
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
