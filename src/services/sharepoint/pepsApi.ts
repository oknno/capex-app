import { spGetJson, spPostJson, spPatchJson, getDigest } from "./spHttp";
import { spConfig } from "./spConfig";

export type PepRow = {
  Id: number;
  Title: string;
  amountBrl?: number;
  year?: number;
  projectsIdId?: number;
  activitiesIdId?: number;
};

export type PepDraft = {
  Title: string;
  amountBrl?: number;
  year?: number;
  projectsIdId: number;
  activitiesIdId: number;
};

type ODataListResponse<T> = {
  value: T[];
};

function numOrUndef(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export async function getPepsByActivity(activityId: number): Promise<PepRow[]> {
  const siteUrl = spConfig.siteUrl;
  const listTitle = spConfig.pepsListTitle;

  const url =
    `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items` +
    `?$select=Id,Title,amountBrl,year,projectsIdId,activitiesIdId` +
    `&$filter=activitiesIdId eq ${activityId}` +
    `&$orderby=Id desc` +
    `&$top=500`;

  const data = await spGetJson<ODataListResponse<any>>(url);

  return (data.value ?? []).map((x: any) => ({
    Id: Number(x.Id),
    Title: String(x.Title ?? ""),
    amountBrl: x.amountBrl != null ? numOrUndef(x.amountBrl) : undefined,
    year: x.year != null ? numOrUndef(x.year) : undefined,
    projectsIdId: x.projectsIdId != null ? numOrUndef(x.projectsIdId) : undefined,
    activitiesIdId: x.activitiesIdId != null ? numOrUndef(x.activitiesIdId) : undefined
  }));
}

export async function createPep(draft: PepDraft): Promise<number> {
  const siteUrl = spConfig.siteUrl;
  const listTitle = spConfig.pepsListTitle;

  const url = `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items`;
  const digest = await getDigest();

  const body: any = {
    Title: draft.Title,
    amountBrl: draft.amountBrl,
    year: draft.year,
    projectsIdId: draft.projectsIdId,
    activitiesIdId: draft.activitiesIdId
  };

  const created = await spPostJson<any>(url, body, digest);
  return Number(created?.Id);
}

export async function updatePep(id: number, patch: Partial<PepDraft>): Promise<void> {
  const siteUrl = spConfig.siteUrl;
  const listTitle = spConfig.pepsListTitle;

  const url = `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items(${id})`;

  const body: any = {};
  if (patch.Title !== undefined) body.Title = String(patch.Title ?? "").trim();
  if (patch.amountBrl !== undefined) body.amountBrl = patch.amountBrl;
  if (patch.year !== undefined) body.year = patch.year;
  if (patch.projectsIdId !== undefined) body.projectsIdId = patch.projectsIdId;
  if (patch.activitiesIdId !== undefined) body.activitiesIdId = patch.activitiesIdId;

  const digest = await getDigest();
  await spPatchJson(url, body, digest);
}
