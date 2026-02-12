import { spConfig } from "./spConfig";
import { spGetJson, getDigest, spPostJson } from "./spHttp";

export type MilestoneRow = {
  Id: number;
  Title: string;
  projectsIdId?: number;
};

export type MilestoneDraft = {
  Title: string;
  projectsIdId: number;
};

type PagedResponse<T> = {
  value: T[];
  ["@odata.nextLink"]?: string;
};

function enc(s: string) {
  return encodeURIComponent(s);
}

function listBaseUrl(listTitle: string) {
  return `${spConfig.siteUrl}/_api/web/lists/getbytitle('${enc(listTitle)}')`;
}

export async function getMilestonesByProject(projectId: number): Promise<MilestoneRow[]> {
  const url =
    `${listBaseUrl(spConfig.milestonesListTitle)}/items` +
    `?$select=Id,Title,projectsIdId` +
    `&$filter=projectsIdId eq ${projectId}` +
    `&$orderby=Id desc` +
    `&$top=200`;

  const data = await spGetJson<PagedResponse<MilestoneRow>>(url);
  return data.value ?? [];
}

export async function createMilestone(draft: MilestoneDraft): Promise<number> {
  const siteUrl = spConfig.siteUrl;
  const listTitle = spConfig.milestonesListTitle;

  const url = `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items`;
  const digest = await getDigest();

  const body: any = {
    Title: draft.Title,
    projectsIdId: draft.projectsIdId
  };

  const created = await spPostJson<any>(url, body, digest);
  return Number(created?.Id);
}
