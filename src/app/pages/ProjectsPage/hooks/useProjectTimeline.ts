import { useCallback, useEffect, useState } from "react";

import { getMilestonesByProject } from "../../../../services/sharepoint/milestonesApi";
import type { MilestoneRow } from "../../../../services/sharepoint/milestonesApi";
import { spConfig } from "../../../../services/sharepoint/spConfig";
import { spGetJson } from "../../../../services/sharepoint/spHttp";
import type { LoadState } from "./useProjectsList";

export type ActivityRowLite = {
  Id: number;
  Title: string;
  startDate?: string;
  endDate?: string;
  milestonesIdId?: number;
  projectsIdId?: number;
};

export function useProjectTimeline(selectedId: number | null) {
  const [milestones, setMilestones] = useState<MilestoneRow[]>([]);
  const [activities, setActivities] = useState<ActivityRowLite[]>([]);
  const [activitiesState, setActivitiesState] = useState<LoadState>("idle");

  const loadTimeline = useCallback(async (projectId: number) => {
    setActivitiesState("loading");
    try {
      const ms = await getMilestonesByProject(projectId);
      setMilestones(ms ?? []);

      const select = "Id,Title,startDate,endDate,milestonesIdId,projectsIdId";
      const filter = `projectsIdId eq ${projectId}`;
      const url =
        `${spConfig.siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(spConfig.activitiesListTitle)}')/items` +
        `?$select=${encodeURIComponent(select)}` +
        `&$filter=${encodeURIComponent(filter)}` +
        `&$orderby=${encodeURIComponent("startDate asc")}` +
        `&$top=500`;

      const data = await spGetJson<any>(url);
      const rows = (data?.value ?? []) as any[];

      setActivities(
        rows.map((r) => ({
          Id: Number(r.Id),
          Title: String(r.Title ?? ""),
          startDate: r.startDate ? String(r.startDate) : undefined,
          endDate: r.endDate ? String(r.endDate) : undefined,
          milestonesIdId: r.milestonesIdId != null ? Number(r.milestonesIdId) : undefined,
          projectsIdId: r.projectsIdId != null ? Number(r.projectsIdId) : undefined
        }))
      );
      setActivitiesState("idle");
    } catch (e) {
      console.error(e);
      setMilestones([]);
      setActivities([]);
      setActivitiesState("error");
    }
  }, []);

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
