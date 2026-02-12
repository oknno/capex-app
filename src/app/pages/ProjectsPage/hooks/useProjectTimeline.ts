import { useCallback, useEffect, useState } from "react";

import type { MilestoneRow } from "../../../../services/sharepoint/milestonesApi";
import { loadProjectTimeline } from "../../../../application/use-cases/loadProjectTimeline";
import type { LoadProjectTimelineDeps } from "../../../../application/use-cases/loadProjectTimeline";
import type { LoadState } from "./useProjectsList";

export type ActivityRowLite = {
  Id: number;
  Title: string;
  startDate?: string;
  endDate?: string;
  milestonesIdId?: number;
  projectsIdId?: number;
};

export function useProjectTimeline(selectedId: number | null, deps?: LoadProjectTimelineDeps) {
  const [milestones, setMilestones] = useState<MilestoneRow[]>([]);
  const [activities, setActivities] = useState<ActivityRowLite[]>([]);
  const [activitiesState, setActivitiesState] = useState<LoadState>("idle");

  const loadTimeline = useCallback(async (projectId: number) => {
    setActivitiesState("loading");
    try {
      const timeline = await loadProjectTimeline(projectId, deps);
      setMilestones(timeline.milestones);
      setActivities(timeline.activities as ActivityRowLite[]);
      setActivitiesState("idle");
    } catch (e) {
      console.error(e);
      setMilestones([]);
      setActivities([]);
      setActivitiesState("error");
    }
  }, [deps]);

  useEffect(() => {
    if (!selectedId) {
      setMilestones([]);
      setActivities([]);
      setActivitiesState("idle");
      return;
    }

    loadTimeline(selectedId);
  }, [loadTimeline, selectedId]);

  return { milestones, activities, activitiesState, loadTimeline };
}
