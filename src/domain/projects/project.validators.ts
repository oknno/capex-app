import type { ProjectDraft } from "../../services/sharepoint/projectsApi";
import { requiresStructure, toIntOrUndefined } from "./project.calculations";

export type WizardDraftState = {
  project: ProjectDraft;
  milestones: MilestoneDraftLocal[];
  activities: ActivityDraftLocal[];
  peps: PepDraftLocal[];
};

export type MilestoneDraftLocal = { tempId: string; Title: string };
export type ActivityDraftLocal = {
  tempId: string;
  Title: string;
  milestoneTempId: string;
  startDate?: string;
  endDate?: string;
  supplier?: string;
  activityDescription?: string;
};
export type PepDraftLocal = { tempId: string; Title: string; year: number; amountBrl: number; activityTempId?: string };

export function validateProjectBasics(p: ProjectDraft) {
  if (!String(p.Title ?? "").trim()) throw new Error("Title é obrigatório.");
  const b = toIntOrUndefined(p.budgetBrl);
  if (b === undefined || b <= 0) throw new Error("budgetBrl deve ser um inteiro > 0.");
}

export function validateStructure(state: WizardDraftState) {
  const p = state.project;
  const need = requiresStructure(p.budgetBrl);

  if (state.peps.length === 0) throw new Error("Cadastre ao menos 1 PEP.");

  const totalPeps = state.peps.reduce((acc, x) => acc + (Number(x.amountBrl) || 0), 0);
  const budget = Number(p.budgetBrl ?? 0);
  if (!Number.isFinite(totalPeps) || totalPeps <= 0) throw new Error("Total de PEPs inválido.");
  if (!Number.isFinite(budget) || budget <= 0) throw new Error("Orçamento inválido.");
  if (totalPeps !== budget) throw new Error(`Soma dos PEPs (${totalPeps}) deve ser igual ao budgetBrl (${budget}).`);

  if (!need) return;

  if (state.milestones.length === 0) throw new Error("Projetos ≥ 1M exigem Milestones.");
  if (state.activities.length === 0) throw new Error("Projetos ≥ 1M exigem Activities.");

  // garantia mínima: toda activity aponta pra milestone existente
  const milestoneSet = new Set(state.milestones.map((m) => m.tempId));
  for (const a of state.activities) {
    if (!milestoneSet.has(a.milestoneTempId)) {
      throw new Error("Activity com milestone inválido (consistência interna).");
    }
  }
}
