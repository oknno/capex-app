import { createProject as createProjectApi } from "../../services/sharepoint/projectsApi";
import type { ProjectDraft } from "../../services/sharepoint/projectsApi";

export type CreateProjectDeps = {
  createProject: (draft: ProjectDraft) => Promise<number>;
};

export async function createProject(draft: ProjectDraft, deps: CreateProjectDeps = { createProject: createProjectApi }): Promise<number> {
  return deps.createProject(draft);
}
