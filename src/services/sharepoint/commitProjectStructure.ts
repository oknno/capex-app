import type { ProjectDraft } from "./projectsApi";
import { updateProject, deleteProject } from "./projectsApi";
import { createMilestone, deleteMilestone } from "./milestonesApi";
import { createActivity, deleteActivity } from "./activitiesApi";
import { createPep, deletePep } from "./pepsApi";

import type {
  ActivityDraftLocal,
  MilestoneDraftLocal,
  PepDraftLocal
} from "../../domain/projects/project.validators";

export type CommitJournal = {
  createdProjectId?: number;
  milestoneIds: number[];
  activityIds: number[];
  pepIds: number[];
};

export type RollbackIssue = {
  entity: "project" | "milestone" | "activity" | "pep";
  id: number;
  reason: string;
};

export type RollbackResult = {
  status: "complete" | "partial";
  attempts: number;
  failures: RollbackIssue[];
};

export class CommitProjectStructureError extends Error {
  readonly journal: CommitJournal;
  readonly rollback: RollbackResult;
  readonly causeError: unknown;

  constructor(message: string, args: { journal: CommitJournal; rollback: RollbackResult; cause: unknown }) {
    super(message);
    this.name = "CommitProjectStructureError";
    this.journal = args.journal;
    this.rollback = args.rollback;
    this.causeError = args.cause;
  }
}

type CommitProjectStructureArgs = {
  projectId: number | null;
  normalizedProject: ProjectDraft;
  needStructure: boolean;
  milestones: MilestoneDraftLocal[];
  activities: ActivityDraftLocal[];
  peps: PepDraftLocal[];
  createProject: (draft: ProjectDraft) => Promise<number>;
};

export async function commitProjectStructure(args: CommitProjectStructureArgs): Promise<{ projectId: number; journal: CommitJournal }> {
  const journal: CommitJournal = {
    milestoneIds: [],
    activityIds: [],
    pepIds: []
  };

  const rollbackIssues: RollbackIssue[] = [];
  const milestoneIdMap = new Map<string, number>();
  const activityIdMap = new Map<string, number>();

  let id = args.projectId;

  const rollback = async () => {
    const pepIds = [...journal.pepIds].reverse();
    const activityIds = [...journal.activityIds].reverse();
    const milestoneIds = [...journal.milestoneIds].reverse();

    for (const pepId of pepIds) {
      try {
        await deletePep(pepId);
      } catch (error: any) {
        rollbackIssues.push({ entity: "pep", id: pepId, reason: error?.message ? String(error.message) : "Unknown delete error" });
      }
    }

    for (const activityId of activityIds) {
      try {
        await deleteActivity(activityId);
      } catch (error: any) {
        rollbackIssues.push({ entity: "activity", id: activityId, reason: error?.message ? String(error.message) : "Unknown delete error" });
      }
    }

    for (const milestoneId of milestoneIds) {
      try {
        await deleteMilestone(milestoneId);
      } catch (error: any) {
        rollbackIssues.push({ entity: "milestone", id: milestoneId, reason: error?.message ? String(error.message) : "Unknown delete error" });
      }
    }

    if (journal.createdProjectId) {
      try {
        await deleteProject(journal.createdProjectId);
      } catch (error: any) {
        rollbackIssues.push({
          entity: "project",
          id: journal.createdProjectId,
          reason: error?.message ? String(error.message) : "Unknown delete error"
        });
      }
    }

    const attempts = pepIds.length + activityIds.length + milestoneIds.length + (journal.createdProjectId ? 1 : 0);
    return {
      status: rollbackIssues.length === 0 ? "complete" : "partial",
      attempts,
      failures: rollbackIssues
    } as RollbackResult;
  };

  try {
    if (!id) {
      id = await args.createProject(args.normalizedProject);
      journal.createdProjectId = id;
    } else {
      await updateProject(id, args.normalizedProject);
    }

    if (!args.needStructure) {
      const autoMilestoneId = await createMilestone({
        Title: "SEM MARCOS (AUTO)",
        projectsIdId: id
      });
      journal.milestoneIds.push(autoMilestoneId);

      const autoActivityId = await createActivity({
        Title: "PEP DIRETO (AUTO)",
        projectsIdId: id,
        milestonesIdId: autoMilestoneId
      });
      journal.activityIds.push(autoActivityId);

      for (const pep of args.peps) {
        const createdPepId = await createPep({
          Title: pep.Title.trim(),
          year: pep.year,
          amountBrl: Math.round(pep.amountBrl),
          projectsIdId: id,
          activitiesIdId: autoActivityId
        });
        journal.pepIds.push(createdPepId);
      }

      return { projectId: id, journal };
    }

    for (const milestone of args.milestones) {
      const milestoneId = await createMilestone({
        Title: milestone.Title.trim().toUpperCase(),
        projectsIdId: id
      });
      journal.milestoneIds.push(milestoneId);
      milestoneIdMap.set(milestone.tempId, milestoneId);
    }

    for (const activity of args.activities) {
      const milestoneId = milestoneIdMap.get(activity.milestoneTempId);
      if (!milestoneId) {
        throw new Error("Activity sem milestone válido (commit).");
      }

      const activityId = await createActivity({
        Title: activity.Title.trim().toUpperCase(),
        projectsIdId: id,
        milestonesIdId: milestoneId
      });

      journal.activityIds.push(activityId);
      activityIdMap.set(activity.tempId, activityId);
    }

    for (const pep of args.peps) {
      const activityTempId = pep.activityTempId;
      if (!activityTempId) {
        throw new Error("PEP sem Activity (commit).");
      }

      const activityId = activityIdMap.get(activityTempId);
      if (!activityId) {
        throw new Error("PEP com Activity inválida (commit).");
      }

      const pepId = await createPep({
        Title: pep.Title.trim(),
        year: pep.year,
        amountBrl: Math.round(pep.amountBrl),
        projectsIdId: id,
        activitiesIdId: activityId
      });
      journal.pepIds.push(pepId);
    }

    return { projectId: id, journal };
  } catch (error) {
    const rollbackResult = await rollback();
    throw new CommitProjectStructureError("Erro ao persistir estrutura do projeto.", {
      journal,
      rollback: rollbackResult,
      cause: error
    });
  }
}
