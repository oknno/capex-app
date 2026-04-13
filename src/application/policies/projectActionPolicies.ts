import {
  canBackToDraft,
  canDeleteProject,
  canEditProject,
  canSendToApproval,
} from "../../domain/projects/projectStatusPolicies.ts";

type ProjectWithStatus = {
  status?: string | null;
};

type PolicyResult = {
  ok: boolean;
  reason?: string;
};

export const projectActionMessages = {
  editDenied: "Não foi possível editar o projeto.",
  deleteDenied: "Não foi possível excluir o projeto.",
  sendDenied: "Não foi possível enviar para aprovação.",
  backDenied: "Não foi possível voltar o status para rascunho.",
};

function withFallback(result: PolicyResult, fallbackMessage: string): PolicyResult {
  if (result.ok) return result;
  return { ok: false, reason: result.reason ?? fallbackMessage };
}

export function canEdit(project: ProjectWithStatus | null): PolicyResult {
  return withFallback(canEditProject(project), projectActionMessages.editDenied);
}

export function canDelete(project: ProjectWithStatus | null): PolicyResult {
  return withFallback(canDeleteProject(project), projectActionMessages.deleteDenied);
}

export function canSend(project: ProjectWithStatus | null): PolicyResult {
  return withFallback(canSendToApproval(project), projectActionMessages.sendDenied);
}

export function canBack(project: ProjectWithStatus | null): PolicyResult {
  return withFallback(canBackToDraft(project), projectActionMessages.backDenied);
}
