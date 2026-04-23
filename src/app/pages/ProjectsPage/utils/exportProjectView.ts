import type { ProjectRow } from "../../../../services/sharepoint/projectsApi";
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
    <section class="block">
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(text)}</p>
    </section>
  `;
}

const MONEY_FIELDS: Array<keyof ProjectRow> = ["budgetBrl", "roceGain", "roceLoss"];
const DATE_FIELDS: Array<keyof ProjectRow> = ["startDate", "endDate"];

const PRINT_FIELDS_ORDER: Array<keyof ProjectRow> = [
  "budgetBrl",
  "projectLeader",
  "approvalYear",
  "investmentLevel",
  "fundingSource",
  "program",
  "company",
  "center",
  "unit",
  "location",
  "depreciationCostCenter",
  "category",
  "investmentType",
  "assetType",
  "projectFunction",
  "projectUser",
  "sourceProjectCode",
  "hasRoce",
  "startDate",
  "endDate",
  "kpiType",
  "kpiName",
  "kpiDescription",
  "kpiCurrent",
  "kpiExpected",
  "roceGain",
  "roceGainDescription",
  "roceLoss",
  "roceLossDescription",
  "roceClassification"
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

function buildProjectSummaryHtml(project: ProjectRow): string {
  const title = String(project.Title ?? "-");
  const status = String(project.status ?? "Rascunho");
  const sapCodeLabel = projectFieldLabel("codigoSAP");

  const fieldsHtml = PRINT_FIELDS_ORDER
    .map((field) => renderField(projectFieldLabel(field), formatFieldValue(project, field)))
    .join("\n");

  const businessNeed = truncateText(String(project.businessNeed ?? "-"), 10000);
  const proposedSolution = truncateText(String(project.proposedSolution ?? "-"), 10000);

  const longBlocksHtml = [
    renderLongTextBlock(projectFieldLabel("businessNeed"), businessNeed),
    renderLongTextBlock(projectFieldLabel("proposedSolution"), proposedSolution)
  ].join("\n");

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Resumo do Projeto #${project.Id}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 24px; }
    .header { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 12px; }
    .title { font-size: 24px; font-weight: 700; margin: 0; }
    .status { font-size: 14px; font-weight: 700; }
    .sap { font-size: 14px; font-weight: 600; margin: 0 0 14px; }
    .grid { border-top: 1px solid #d1d5db; padding-top: 12px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 16px; align-items: start; }
    .field-item { break-inside: avoid; page-break-inside: avoid; }
    .field-label { font-size: 12px; color: #6b7280; margin-bottom: 2px; }
    .field-value { font-size: 14px; font-weight: 600; }
    .blocks { border-top: 1px solid #d1d5db; padding-top: 12px; margin-top: 12px; display: grid; gap: 12px; }
    .block { break-inside: avoid; page-break-inside: avoid; }
    .block h2 { font-size: 14px; margin: 0 0 6px; }
    .block p { font-size: 13px; margin: 0; white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; }

    @media print {
      body { margin: 12mm; }
      .grid,
      .blocks { page-break-inside: auto; }
    }
  </style>
</head>
<body>
  <header class="header">
    <h1 class="title">${escapeHtml(title)}</h1>
    <div class="status">${escapeHtml(status)}</div>
  </header>
  <p class="sap">${escapeHtml(sapCodeLabel)}: ${escapeHtml(getSapCodeDisplay(project))}</p>

  <section class="grid">
    ${fieldsHtml}
  </section>

  <section class="blocks">
    ${longBlocksHtml}
  </section>
</body>
</html>`;
}

export function exportProjectView(project: ProjectRow): void {
  const html = buildProjectSummaryHtml(project);
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
