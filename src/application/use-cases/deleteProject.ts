import { deleteProject } from "../../services/sharepoint/projectsApi";
import { getMilestonesByProject, deleteMilestone } from "../../services/sharepoint/milestonesApi";
import { getActivitiesBatchByProject, deleteActivity } from "../../services/sharepoint/activitiesApi";
import { getPepsBatchByProject, deletePep } from "../../services/sharepoint/pepsApi";
import type { ProjectView } from "../contracts/project";

function normalizeStatus(status?: string): string {
  return (status ?? "").trim().toLowerCase();
}

export function canDeleteProject(project: ProjectView | null): { ok: boolean; reason?: string } {
  if (!project) return { ok: false, reason: "Selecione um projeto." };

  const status = normalizeStatus(project.status);
  if (!status || status === "rascunho") return { ok: true };

  return { ok: false, reason: "Somente projetos em rascunho podem ser excluídos." };
}

export async function deleteDraftProjectAndRelated(project: ProjectView | null): Promise<void> {
  const check = canDeleteProject(project);
  if (!check.ok || !project) {
    throw new Error(check.reason ?? "Não foi possível excluir o projeto.");
  }

  const [milestones, activities, peps] = await Promise.all([
    getMilestonesByProject(project.Id),
    getActivitiesBatchByProject(project.Id),
    getPepsBatchByProject(project.Id)
  ]);

  for (const pep of peps) {
    await deletePep(pep.Id);
  }

  for (const activity of activities) {
    await deleteActivity(activity.Id);
  }

  for (const milestone of milestones) {
    await deleteMilestone(milestone.Id);
  }

  await deleteProject(project.Id);
}
