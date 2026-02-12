import { canSendToApproval, sendToApproval as sendToApprovalWorkflow } from "../../services/sharepoint/projectsWorkflow";
import type { ProjectRow } from "../../services/sharepoint/projectsApi";

export type SendToApprovalDeps = {
  canSendToApproval: (project: ProjectRow | null) => { ok: boolean; reason?: string };
  sendToApproval: (project: ProjectRow) => Promise<{ newStatus: string }>;
};

export async function sendProjectToApproval(
  project: ProjectRow | null,
  deps: SendToApprovalDeps = { canSendToApproval, sendToApproval: sendToApprovalWorkflow }
): Promise<{ newStatus: string }> {
  const check = deps.canSendToApproval(project);
  if (!check.ok || !project) {
    throw new Error(check.reason ?? "Não é possível enviar para aprovação.");
  }

  return deps.sendToApproval(project);
}
