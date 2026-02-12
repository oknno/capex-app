// src/domain/rules/projectApprovalRules.ts
import type { RuleResult } from "./types";

export type ApprovalSnapshot = {
  milestonesCount: number;
  activitiesCount: number;
  pepsCount: number;
  totalProjectBrl: number;
};

export function runProjectApprovalRules(s: ApprovalSnapshot): RuleResult[] {
  const out: RuleResult[] = [];

  // R1 - Marcos
  if (s.milestonesCount <= 0) {
    out.push({
      id: "milestones.required",
      level: "error",
      title: "Sem Marcos",
      message: "Cadastre pelo menos 1 Milestone antes de enviar para aprovação."
    });
  } else {
    out.push({ id: "milestones.ok", level: "ok", title: "Marcos ok" });
  }

  // R2 - Atividades
  if (s.activitiesCount <= 0) {
    out.push({
      id: "activities.required",
      level: "error",
      title: "Sem Atividades",
      message: "Cadastre pelo menos 1 Activity antes de enviar para aprovação."
    });
  } else {
    out.push({ id: "activities.ok", level: "ok", title: "Atividades ok" });
  }

  // R3 - PEPs
  if (s.pepsCount <= 0) {
    out.push({
      id: "peps.required",
      level: "error",
      title: "Sem PEPs",
      message: "Cadastre pelo menos 1 PEP antes de enviar para aprovação."
    });
  } else {
    out.push({ id: "peps.ok", level: "ok", title: "PEPs ok" });
  }

  // R4 - Total
  if (!Number.isFinite(s.totalProjectBrl) || s.totalProjectBrl <= 0) {
    out.push({
      id: "total.invalid",
      level: "error",
      title: "Total do projeto inválido",
      message: "O total consolidado de PEPs está zero ou inválido."
    });
  } else {
    out.push({ id: "total.ok", level: "ok", title: "Total do projeto ok" });
  }

  return out;
}
