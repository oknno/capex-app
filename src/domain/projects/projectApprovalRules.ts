export type ApprovalSnapshot = {
  projectId: number;
  projectTitle?: string;
  projectStatus?: string;

  milestonesCount: number;
  activitiesCount: number;
  pepsCount: number;

  totalProjectBrl: number;

  approvalYear?: number;
  unit?: string;
};

export type RuleResult = {
  id: string;
  label: string;
  level: "error" | "warn" | "ok";
  message?: string;
};

function norm(s?: string) {
  return (s ?? "").trim().toLowerCase();
}

export function evaluateApprovalRules(s: ApprovalSnapshot): RuleResult[] {
  const out: RuleResult[] = [];

  // Title
  if (!s.projectTitle || !s.projectTitle.trim()) {
    out.push({ id: "title", label: "Projeto com Title preenchido", level: "error", message: "Preencha o Title do projeto." });
  } else {
    out.push({ id: "title", label: "Projeto com Title preenchido", level: "ok" });
  }

  // Status permitido
  const st = norm(s.projectStatus);
  const canSend = !st || st === "rascunho" || st === "reprovado";
  if (!canSend) {
    out.push({ id: "status", label: "Status permite envio", level: "error", message: `Status atual (“${s.projectStatus ?? "-"}”) não permite envio.` });
  } else {
    out.push({ id: "status", label: "Status permite envio", level: "ok" });
  }

  // Estrutura mínima
  out.push(
    s.milestonesCount > 0
      ? { id: "milestones", label: "Pelo menos 1 Milestone", level: "ok" }
      : { id: "milestones", label: "Pelo menos 1 Milestone", level: "error", message: "Cadastre ao menos 1 Milestone." }
  );

  out.push(
    s.activitiesCount > 0
      ? { id: "activities", label: "Pelo menos 1 Activity", level: "ok" }
      : { id: "activities", label: "Pelo menos 1 Activity", level: "error", message: "Cadastre ao menos 1 Activity." }
  );

  out.push(
    s.pepsCount > 0
      ? { id: "peps", label: "Pelo menos 1 PEP", level: "ok" }
      : { id: "peps", label: "Pelo menos 1 PEP", level: "error", message: "Cadastre ao menos 1 PEP." }
  );

  // Total
  if (!Number.isFinite(s.totalProjectBrl) || s.totalProjectBrl <= 0) {
    out.push({ id: "total", label: "Total do Projeto > 0", level: "error", message: "Total inválido/zero. Verifique valores dos PEPs." });
  } else {
    out.push({ id: "total", label: "Total do Projeto > 0", level: "ok" });
  }

  // Soft: unit (não bloqueia por enquanto)
  if (!s.unit || !s.unit.trim()) {
    out.push({ id: "unit", label: "Unidade preenchida (unit)", level: "warn", message: "Recomendado preencher a unidade (unit)." });
  } else {
    out.push({ id: "unit", label: "Unidade preenchida (unit)", level: "ok" });
  }

  return out;
}

export function summarizeRules(results: RuleResult[]) {
  const errors = results.filter((r) => r.level === "error");
  const warns  = results.filter((r) => r.level === "warn");
  const oks    = results.filter((r) => r.level === "ok");

  return { ok: errors.length === 0, errors, warns, oks };
}
