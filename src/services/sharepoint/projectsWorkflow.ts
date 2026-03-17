import type { ProjectRow } from "./projectsApi";
import { updateProject } from "./projectsApi";

export type ApprovalResult = { newStatus: string };

function norm(s?: string) {
  return (s ?? "").trim().toLowerCase();
}

export function isLockedStatus(status?: string): boolean {
  const st = norm(status);
  return st === "em aprovação" || st === "em aprovacao" || st === "aprovado";
}

export function canSendToApproval(p: ProjectRow | null): { ok: boolean; reason?: string } {
  if (!p) return { ok: false, reason: "Selecione um projeto." };

  const st = norm(p.status);
  if (st === "rascunho") return { ok: true };

  if (!st)
    return { ok: false, reason: "Projeto sem status. Apenas projetos em rascunho podem ser enviados para aprovação." };

  if (st === "em aprovação" || st === "em aprovacao")
    return { ok: false, reason: "Projeto já está em aprovação." };

  if (st === "aprovado")
    return { ok: false, reason: "Projeto já está aprovado." };

  if (st === "reprovado")
    return { ok: false, reason: "Projeto reprovado não pode ser reenviado automaticamente. Volte para rascunho antes de enviar." };

  return { ok: false, reason: `Status atual (“${p.status}”) não permite envio automático.` };
}

export function canBackToDraft(p: ProjectRow | null): { ok: boolean; reason?: string } {
  if (!p) return { ok: false, reason: "Selecione um projeto." };

  const st = norm(p.status);
  if (!st) return { ok: false, reason: "Status vazio." };
  if (st === "rascunho") return { ok: false, reason: "Projeto já está em rascunho." };
  if (st === "aprovado") return { ok: false, reason: "Projeto aprovado não deve voltar para rascunho." };

  // Em aprovação / Reprovado / outros -> pode voltar
  return { ok: true };
}

export async function sendToApproval(p: ProjectRow): Promise<ApprovalResult> {
  const title = (p.Title ?? "").trim();
  if (!title) throw new Error("Title vazio. Corrija antes de enviar para aprovação.");

  const newStatus = "Em Aprovação";
  await updateProject(p.Id, { status: newStatus });
  return { newStatus };
}

export async function backToDraft(p: ProjectRow): Promise<void> {
  const newStatus = "Rascunho";
  await updateProject(p.Id, { status: newStatus });
}
