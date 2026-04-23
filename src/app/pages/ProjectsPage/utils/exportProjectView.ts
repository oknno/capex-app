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

function buildProjectSummaryHtml(project: ProjectRow): string {
  const title = String(project.Title ?? "-");
  const status = String(project.status ?? "Rascunho");
  const sapCodeLabel = projectFieldLabel("codigoSAP");
  const dateRange = `${fmtDate(project.startDate)}  →  ${fmtDate(project.endDate)}`;

  const fieldsHtml = [
    renderField(projectFieldLabel("budgetBrl"), fmtMoney(project.budgetBrl)),
    renderField(projectFieldLabel("projectLeader"), String(project.projectLeader ?? "-")),
    renderField("Início / Fim", dateRange),
    renderField(projectFieldLabel("unit"), String(project.unit ?? "-")),
    renderField(projectFieldLabel("fundingSource"), String(project.fundingSource ?? "-")),
    renderField("Programa", String(project.program ?? "-"))
  ].join("\n");

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
    .grid { border-top: 1px solid #d1d5db; padding-top: 12px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 16px; }
    .field-item { break-inside: avoid; }
    .field-label { font-size: 12px; color: #6b7280; margin-bottom: 2px; }
    .field-value { font-size: 14px; font-weight: 600; }
    .blocks { border-top: 1px solid #d1d5db; padding-top: 12px; margin-top: 12px; display: grid; gap: 12px; }
    .block h2 { font-size: 14px; margin: 0 0 6px; }
    .block p { font-size: 13px; margin: 0; white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; }

    @media print {
      body { margin: 12mm; }
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
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1024,height=768");

  if (!printWindow) {
    throw new Error("Não foi possível abrir a janela de impressão.");
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
