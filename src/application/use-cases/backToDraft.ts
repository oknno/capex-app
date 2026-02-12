import { canBackToDraft, backToDraft as backToDraftWorkflow } from "../../services/sharepoint/projectsWorkflow";
import type { ProjectRow } from "../../services/sharepoint/projectsApi";

export type BackToDraftDeps = {
  canBackToDraft: (project: ProjectRow | null) => { ok: boolean; reason?: string };
  backToDraft: (project: ProjectRow) => Promise<void>;
};

export async function moveProjectBackToDraft(
  project: ProjectRow | null,
  deps: BackToDraftDeps = { canBackToDraft, backToDraft: backToDraftWorkflow }
): Promise<void> {
  const check = deps.canBackToDraft(project);
  if (!check.ok || !project) {
    throw new Error(check.reason ?? "Não é possível voltar para rascunho.");
  }

  await deps.backToDraft(project);
}
