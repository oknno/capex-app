import { spConfig } from "./spConfig";
import { spGetJson, getDigest, spPostJson } from "./spHttp";

export type ActivityRow = {
  Id: number;
  Title: string;

  projectsIdId?: number;
  milestonesIdId?: number;

  startDate?: string; // ISO
  endDate?: string;   // ISO
  supplier?: string;
  activityDescription?: string;
};

export type ActivityDraft = {
  Title: string;
  projectsIdId: number;
  milestonesIdId: number;

  startDate?: string; // ISO
  endDate?: string;   // ISO
  supplier?: string;
  activityDescription?: string;
};

type ODataList<T> = {
  value: T[];
  ["@odata.nextLink"]?: string;
};

function enc(s: string) {
  return encodeURIComponent(s);
}

function listBaseUrl(listTitle: string) {
  return `${spConfig.siteUrl}/_api/web/lists/getbytitle('${enc(listTitle)}')`;
}

export async function getActivitiesByMilestone(projectId: number, milestoneId: number): Promise<ActivityRow[]> {
  const url =
    `${listBaseUrl(spConfig.activitiesListTitle)}/items` +
    `?$select=Id,Title,projectsIdId,milestonesIdId,startDate,endDate,supplier,activityDescription` +
    `&$filter=projectsIdId eq ${projectId} and milestonesIdId eq ${milestoneId}` +
    `&$orderby=Id desc` +
    `&$top=200`;

  const data = await spGetJson<ODataList<ActivityRow>>(url);
  return data.value ?? [];
}

export async function createActivity(draft: ActivityDraft): Promise<number> {
  const siteUrl = spConfig.siteUrl;
  const listTitle = spConfig.activitiesListTitle;

  const url = `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items`;
  const digest = await getDigest();

  const body: any = {
    Title: draft.Title,
    startDate: draft.startDate,
    endDate: draft.endDate,
    supplier: draft.supplier,
    activityDescription: draft.activityDescription,
    milestonesIdId: draft.milestonesIdId,
    projectsIdId: draft.projectsIdId
  };

  const created = await spPostJson<any>(url, body, digest);
  return Number(created?.Id);
}

export async function deleteActivity(id: number): Promise<void> {
  const siteUrl = spConfig.siteUrl;
  const listTitle = spConfig.activitiesListTitle;

  const url = `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items(${id})`;
  const digest = await getDigest();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json;odata=nometadata",
      "X-RequestDigest": digest,
      "IF-MATCH": "*",
      "X-HTTP-Method": "DELETE"
    }
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`DELETE ${res.status}: ${txt}`);
  }
}
