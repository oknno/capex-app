import type { ProjectRow } from "../../../../services/sharepoint/projectsApi";
import type { ActivityRow } from "../../../../services/sharepoint/activitiesApi";
import type { MilestoneRow } from "../../../../services/sharepoint/milestonesApi";
import { projectFieldLabel } from "../fieldLabels";
import { fmtDate, fmtMoney, getSapCodeDisplay, truncateText } from "./projectSummaryFormatters";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderField(label: string, value: string): string {
  return `
    <div class="field-item">
      <div class="field-label">${escapeHtml(label)}</div>
      <div class="field-value">${escapeHtml(value)}</div>
    </div>
  `;
}

function renderLongTextBlock(title: string, text: string): string {
  return `
    <div class="long-text-block">
      <h4>${escapeHtml(title)}</h4>
      <p>${escapeHtml(text)}</p>
    </div>
  `;
}

function renderSection(title: string, subtitle: string | undefined, fieldsHtml: string): string {
  return `
    <section class="summary-section">
      <div class="summary-section-header">
        <h3>${escapeHtml(title)}</h3>
        ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
      </div>
      <div class="summary-grid">${fieldsHtml}</div>
    </section>
  `;
}

type ScheduleExportData = {
  milestones: MilestoneRow[];
  activities: ActivityRow[];
};

type GanttItem = {
  milestoneTitle: string;
  activityTitle: string;
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

const MONEY_FIELDS: Array<keyof ProjectRow> = ["budgetBrl", "roceGain", "roceLoss"];
const DATE_FIELDS: Array<keyof ProjectRow> = ["startDate", "endDate"];

type ProjectSection = {
  title: string;
  subtitle?: string;
  fields: Array<keyof ProjectRow>;
};

const PROJECT_SECTIONS: ProjectSection[] = [
  {
    title: "1. Sobre o Projeto",
    subtitle: "Dados principais para identificação e planejamento.",
    fields: ["Title", "budgetBrl", "investmentLevel", "approvalYear", "startDate", "endDate", "projectFunction"]
  },
  {
    title: "2. Origem e Programa",
    subtitle: "Vínculo da verba com iniciativa e projeto de referência.",
    fields: ["fundingSource", "program", "sourceProjectCode"]
  },
  {
    title: "3. Informação Operacional",
    subtitle: "Estrutura organizacional e responsáveis pela execução.",
    fields: [
      "company",
      "center",
      "unit",
      "location",
      "depreciationCostCenter",
      "category",
      "investmentType",
      "assetType",
      "projectUser",
      "projectLeader"
    ]
  },
  {
    title: "4. Indicadores de Desempenho",
    subtitle: "Indicadores e metas esperadas com a implementação.",
    fields: ["kpiType", "kpiName", "kpiCurrent", "kpiExpected", "kpiDescription"]
  },
  {
    title: "5. ROCE",
    subtitle: "Ganhos, perdas e classificação financeira do investimento.",
    fields: ["hasRoce", "roceClassification", "roceGain", "roceLoss", "roceGainDescription", "roceLossDescription"]
  }
];

function formatFieldValue(project: ProjectRow, field: keyof ProjectRow): string {
  const value = project[field];

  if (MONEY_FIELDS.includes(field)) {
    return fmtMoney(typeof value === "number" ? value : Number(value));
  }

  if (DATE_FIELDS.includes(field)) {
    return fmtDate(typeof value === "string" ? value : undefined);
  }

  const normalized = typeof value === "string" ? value.trim() : value;
  if (normalized == null || normalized === "") return "-";

  return String(normalized);
}

function getBarPosition(startDate: string, endDate: string, bounds: GanttBounds) {
  const total = Math.max(bounds.max - bounds.min, 1);
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T00:00:00`).getTime();
  const left = ((start - bounds.min) / total) * 100;
  const width = (Math.max(end - start, 86400000) / total) * 100;

  return {
    left,
    width: Math.min(width, 100 - left)
  };
}

function groupByMilestone(items: GanttItem[]) {
  return Object.values(
    items.reduce<Record<string, MilestoneGroup>>((acc, item) => {
      const current = acc[item.milestoneTitle];
      if (!current) {
        acc[item.milestoneTitle] = {
          milestoneName: item.milestoneTitle,
          startDateMin: item.startDate,
          endDateMax: item.endDate,
          activities: [item]
        };
        return acc;
      }

      acc[item.milestoneTitle] = {
        ...current,
        startDateMin: item.startDate < current.startDateMin ? item.startDate : current.startDateMin,
        endDateMax: item.endDate > current.endDateMax ? item.endDate : current.endDateMax,
        activities: [...current.activities, item]
      };
      return acc;
    }, {})
  );
}

function toDateLabel(value?: string) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

function renderGanttSection(schedule: ScheduleExportData): string {
  const ganttItems: GanttItem[] = schedule.activities
    .filter((activity) => activity.startDate && activity.endDate)
    .map((activity) => ({
      milestoneTitle: schedule.milestones.find((milestone) => milestone.Id === activity.milestonesIdId)?.Title ?? "MARCO",
      activityTitle: activity.Title || "ATIVIDADE",
      startDate: String(activity.startDate).slice(0, 10),
      endDate: String(activity.endDate).slice(0, 10)
    }));

  if (ganttItems.length === 0) {
    return `
      <section class="block gantt-wrap">
        <h2>Cronograma (Gantt)</h2>
        <p>Sem atividades com início e término para exibir cronograma.</p>
      </section>
    `;
  }

  const starts = ganttItems.map((item) => new Date(`${item.startDate}T00:00:00`).getTime());
  const ends = ganttItems.map((item) => new Date(`${item.endDate}T00:00:00`).getTime());
  const bounds: GanttBounds = { min: Math.min(...starts), max: Math.max(...ends) };
  const rangeLabel = `${new Date(bounds.min).toLocaleDateString("pt-BR")} - ${new Date(bounds.max).toLocaleDateString("pt-BR")}`;
  const groups = groupByMilestone(ganttItems);

  const groupsHtml = groups.map((group) => {
    const milestoneBar = getBarPosition(group.startDateMin, group.endDateMax, bounds);
    const activitiesHtml = group.activities.map((item) => {
      const activityBar = getBarPosition(item.startDate, item.endDate, bounds);
      return `
        <div class="gantt-activity">
          <div class="gantt-row-label">
            <span class="gantt-name">${escapeHtml(item.activityTitle)}</span>
            <span class="gantt-date">${escapeHtml(toDateLabel(item.startDate))} - ${escapeHtml(toDateLabel(item.endDate))}</span>
          </div>
          <div class="gantt-track">
            <div class="gantt-bar activity" style="left:${activityBar.left}%;width:${activityBar.width}%;"></div>
          </div>
        </div>
      `;
    }).join("\n");

    return `
      <div class="gantt-group">
        <div class="gantt-row-label">
          <span class="gantt-name">${escapeHtml(group.milestoneName)}</span>
          <span class="gantt-date">${escapeHtml(toDateLabel(group.startDateMin))} - ${escapeHtml(toDateLabel(group.endDateMax))}</span>
        </div>
        <div class="gantt-track">
          <div class="gantt-bar milestone" style="left:${milestoneBar.left}%;width:${milestoneBar.width}%;"></div>
        </div>
        <div class="gantt-activities">
          ${activitiesHtml}
        </div>
      </div>
    `;
  }).join("\n");

  return `
    <section class="block gantt-wrap">
      <h2>Cronograma (Gantt)</h2>
      <div class="gantt-period">Período do cronograma: ${escapeHtml(rangeLabel)}</div>
      <div class="gantt-grid">${groupsHtml}</div>
    </section>
  `;
}

function buildProjectSummaryHtml(project: ProjectRow, schedule: ScheduleExportData): string {
  const title = String(project.Title ?? "-");
  const status = String(project.status ?? "Rascunho");
  const sapCodeLabel = projectFieldLabel("codigoSAP");

  const sectionsHtml = PROJECT_SECTIONS.map((section) => {
    const sectionFieldsHtml = section.fields
      .map((field) => renderField(projectFieldLabel(field), formatFieldValue(project, field)))
      .join("\n");

    return renderSection(section.title, section.subtitle, sectionFieldsHtml);
  }).join("\n");

  const businessNeed = truncateText(String(project.businessNeed ?? "-"), 10000);
  const proposedSolution = truncateText(String(project.proposedSolution ?? "-"), 10000);

  const detailSectionHtml = renderSection(
    "6. Detalhamento Complementar",
    "Contexto do problema e direcionamento da solução.",
    [
    renderLongTextBlock(projectFieldLabel("businessNeed"), businessNeed),
    renderLongTextBlock(projectFieldLabel("proposedSolution"), proposedSolution)
    ].join("\n")
  );

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Resumo do Projeto #${project.Id}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 24px; }
    .header { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 12px; break-inside: avoid; page-break-inside: avoid; }
    .title { font-size: 24px; font-weight: 700; margin: 0; }
    .status { font-size: 14px; font-weight: 700; }
    .sap { font-size: 14px; font-weight: 600; margin: 0 0 14px; break-inside: avoid; page-break-inside: avoid; }
    .sections { margin-top: 8px; display: grid; gap: 12px; }
    .summary-section { border: 1px solid #d1d5db; border-radius: 16px; background: #ffffff; padding: 16px; display: grid; gap: 12px; break-inside: avoid; page-break-inside: avoid; }
    .summary-section-header { display: grid; gap: 4px; }
    .summary-section-header h3 { margin: 0; font-size: 16px; font-weight: 800; color: #111827; }
    .summary-section-header p { margin: 0; font-size: 12px; color: #6b7280; }
    .summary-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 12px; align-items: start; }
    .field-item { break-inside: avoid; page-break-inside: avoid; border: 1px solid #d1d5db; border-radius: 12px; background: #f9fafb; padding: 10px 12px; }
    .field-label { font-size: 11px; font-weight: 700; color: #6b7280; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.03em; }
    .field-value { font-size: 13px; font-weight: 600; line-height: 1.45; }
    .long-text-block { grid-column: span 2; border: 1px solid #d1d5db; border-radius: 12px; background: #f9fafb; padding: 12px; break-inside: avoid; page-break-inside: avoid; }
    .long-text-block h4 { font-size: 12px; font-weight: 700; margin: 0 0 6px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.03em; }
    .long-text-block p { font-size: 12px; margin: 0; white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; line-height: 1.45; color: #111827; }
    .gantt-wrap { margin-top: 0; }
    .gantt-period { font-size: 12px; color: #6b7280; margin-bottom: 8px; }
    .gantt-grid { display: grid; gap: 8px; }
    .gantt-group { display: grid; gap: 6px; break-inside: avoid; page-break-inside: avoid; }
    .gantt-activities { display: grid; gap: 6px; }
    .gantt-activity { display: grid; gap: 4px; }
    .gantt-row-label { display: flex; gap: 8px; align-items: center; justify-content: space-between; font-size: 12px; }
    .gantt-name { min-width: 0; font-weight: 600; }
    .gantt-date { text-align: right; color: #374151; white-space: nowrap; }
    .gantt-track { position: relative; height: 12px; border-radius: 999px; background: #d1d5db; overflow: hidden; }
    .gantt-bar { position: absolute; top: 0; bottom: 0; border-radius: 999px; }
    .gantt-bar.milestone { background: #f59e0b; }
    .gantt-bar.activity { background: #06b6d4; }

    @media print {
      @page { margin: 12mm; size: auto; }
      body { margin: 0; font-size: 11px; }
      .header { margin-bottom: 10px; }
      .title { font-size: 20px; }
      .status { font-size: 13px; }
      .sap { font-size: 12px; margin-bottom: 12px; }
      .summary-grid { gap: 8px 10px; }
      .summary-section-header h3 { font-size: 14px; }
      .summary-section-header p,
      .field-label,
      .gantt-period,
      .gantt-row-label { font-size: 10px; }
      .field-value { font-size: 11px; }
      .long-text-block h4 { font-size: 10px; }
      .long-text-block p { font-size: 10px; }
      .gantt-track { height: 10px; }
    }

    @media print and (min-width: 1000px) {
      .sections { grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 12px; align-items: start; }
      .sections > .summary-section:last-child { grid-column: 1 / -1; }
    }

    @media print and (max-width: 999px) {
      .summary-grid { grid-template-columns: 1fr; }
      .long-text-block { grid-column: span 1; }
      .sections { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header class="header">
    <h1 class="title">${escapeHtml(title)}</h1>
    <div class="status">${escapeHtml(status)}</div>
  </header>
  <p class="sap">${escapeHtml(sapCodeLabel)}: ${escapeHtml(getSapCodeDisplay(project))}</p>

  <section class="sections">
    ${sectionsHtml}
    ${detailSectionHtml}
    ${renderGanttSection(schedule)}
  </section>
</body>
</html>`;
}

export function exportProjectView(project: ProjectRow, schedule: ScheduleExportData): void {
  const html = buildProjectSummaryHtml(project, schedule);
  const printWindow = window.open("", "_blank", "width=1024,height=768");

  if (!printWindow) {
    throw new Error("Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-up está ativo.");
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  const tryPrint = () => {
    printWindow.focus();
    printWindow.print();
  };

  if (printWindow.document.readyState === "complete") {
    tryPrint();
    return;
  }

  printWindow.addEventListener("load", tryPrint, { once: true });
}
