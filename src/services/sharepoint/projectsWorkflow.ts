import type { ProjectRow } from "./projectsApi";
import { updateProject } from "./projectsApi";
import { canBackToDraft, canSendToApproval } from "../../domain/projects/projectStatusPolicies";

export type ApprovalResult = { newStatus: string };

function norm(s?: string) {
  return (s ?? "").trim().toLowerCase();
}

export function isLockedStatus(status?: string): boolean {
  const st = norm(status);
  return st === "em aprovação" || st === "em aprovacao" || st === "aprovado";
}

export async function sendToApproval(p: ProjectRow): Promise<ApprovalResult> {
  const check = canSendToApproval(p);
  if (!check.ok) {
    throw new Error(check.reason ?? "Não é possível enviar para aprovação.");
  }

  const title = (p.Title ?? "").trim();
  if (!title) throw new Error("Title vazio. Corrija antes de enviar para aprovação.");

  const newStatus = "Em Aprovação";
  await updateProject(p.Id, { status: newStatus });
  return { newStatus };
}

export async function backToDraft(p: ProjectRow): Promise<void> {
  const check = canBackToDraft(p);
  if (!check.ok) {
    throw new Error(check.reason ?? "Não é possível voltar para rascunho.");
  }

  const newStatus = "Rascunho";
  await updateProject(p.Id, { status: newStatus });
}
