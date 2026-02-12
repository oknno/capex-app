import { getMilestonesByProject } from "../../services/sharepoint/milestonesApi";
import type { MilestoneRow } from "../../services/sharepoint/milestonesApi";
import { getActivitiesBatchByProject } from "../../services/sharepoint/activitiesApi";

export type ActivityRowLite = {
  Id: number;
  Title: string;
  startDate?: string;
  endDate?: string;
  milestonesIdId?: number;
  projectsIdId?: number;
};

export type LoadProjectTimelineDeps = {
  getMilestonesByProject: (projectId: number) => Promise<MilestoneRow[]>;
  getActivitiesBatchByProject: (projectId: number, options?: { pageSize?: number; maxPages?: number }) => Promise<ActivityRowLite[]>;
};

export async function loadProjectTimeline(
  projectId: number,
  deps: LoadProjectTimelineDeps = { getMilestonesByProject, getActivitiesBatchByProject }
): Promise<{ milestones: MilestoneRow[]; activities: ActivityRowLite[] }> {
  const [milestones, activities] = await Promise.all([
    deps.getMilestonesByProject(projectId),
    deps.getActivitiesBatchByProject(projectId, { pageSize: 500, maxPages: 20 })
  ]);

  return { milestones: milestones ?? [], activities: activities ?? [] };
}
