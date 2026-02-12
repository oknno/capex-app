import { updateProject as updateProjectApi } from "../../services/sharepoint/projectsApi";
import type { ProjectDraft } from "../../services/sharepoint/projectsApi";

export type EditProjectDeps = {
  updateProject: (id: number, draft: ProjectDraft) => Promise<void>;
};

export async function editProject(id: number, draft: ProjectDraft, deps: EditProjectDeps = { updateProject: updateProjectApi }): Promise<void> {
  await deps.updateProject(id, draft);
}
