import { spConfig } from "./spConfig";
import { spGetJson, spPostJson, spPatchJson, getDigest } from "./spHttp";

export type ProjectRow = {
  Id: number;
  Title: string;
  approvalYear?: number;
  budgetBrl?: number;
  status?: string;
  investmentLevel?: string;
  fundingSource?: string;
  company?: string;
  center?: string;
  unit?: string;
  location?: string;
  depreciationCostCenter?: string;
  category?: string;
  investmentType?: string;
  assetType?: string;
  projectFunction?: string;
  projectLeader?: string;
  projectUser?: string;
  startDate?: string;
  endDate?: string;
  businessNeed?: string;
  proposedSolution?: string;
  kpiType?: string;
  kpiName?: string;
  kpiDescription?: string;
  kpiCurrent?: string;
  kpiExpected?: string;
  roce?: number;
  roceGain?: number;
  roceGainDescription?: string;
  roceLoss?: number;
  roceLossDescription?: string;
  roceClassification?: string;
};

export type ProjectDraft = Omit<ProjectRow, "Id">;

export type ProjectPatch = Partial<ProjectDraft>;
export type ProjectUpdate = Partial<ProjectDraft>;

export type SortBy = "Title" | "Id" | "approvalYear";
export type SortDir = "asc" | "desc";

type SpRecord = Record<string, unknown>;
type SpListResponse = {
  value?: unknown;
  d?: { results?: unknown; __next?: unknown };
  ["@odata.nextLink"]?: unknown;
  ["odata.nextLink"]?: unknown;
  __next?: unknown;
};

const PROJECT_SELECT_BASE =
  "Id,Title,approvalYear,budgetBrl,status,investmentLevel,fundingSource,company,center,unit,location," +
  "depreciationCostCenter,category,investmentType,assetType,projectFunction,projectLeader,projectUser," +
  "startDate,endDate,businessNeed,proposedSolution,kpiType,kpiName,kpiDescription,kpiCurrent,kpiExpected," +
  "roceGain,roceGainDescription,roceLoss,roceLossDescription,roceClassification";

const PROJECT_SELECT_WITH_ROCE = `${PROJECT_SELECT_BASE},roce`;

function asRecord(value: unknown): SpRecord {
  return value && typeof value === "object" ? (value as SpRecord) : {};
}

function readItems(data: SpListResponse): SpRecord[] {
  const direct = Array.isArray(data.value) ? data.value : undefined;
  if (direct) return direct.map(asRecord);

  const legacy = Array.isArray(data.d?.results) ? data.d.results : undefined;
  return legacy ? legacy.map(asRecord) : [];
}

function readString(source: SpRecord, key: keyof ProjectDraft | "Id"): string | undefined {
  const value = source[key];
  return value == null ? undefined : String(value);
}

function readNumber(source: SpRecord, key: keyof ProjectDraft | "Id"): number | undefined {
  const value = source[key];
  if (value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function pickNextLink(data: SpListResponse): string | undefined {
  const link = data["odata.nextLink"] ?? data["@odata.nextLink"] ?? data.__next ?? data.d?.__next;
  return typeof link === "string" && link.length > 0 ? link : undefined;
}

function buildProjectPayload(source: ProjectUpdate): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  (Object.keys(source) as Array<keyof ProjectUpdate>).forEach((key) => {
    const value = source[key];
    if (value !== undefined) payload[key] = value;
  });
  return payload;
}

export async function getProjectsPage(args: {
  top?: number;
  nextLink?: string;
  searchTitle?: string;
  statusEquals?: string;
  unitEquals?: string;
  orderBy?: SortBy;
  orderDir?: SortDir;
}): Promise<{ items: ProjectRow[]; nextLink?: string }> {
  if (args.nextLink) {
    const data = await spGetJson<SpListResponse>(args.nextLink);
    return { items: readItems(data).map(mapProjectRow), nextLink: pickNextLink(data) };
  }

  const top = args.top ?? 20;
  const orderBy = args.orderBy ?? "Id";
  const orderDir = args.orderDir ?? "desc";
  const orderExpr = orderBy === "Id" ? `Id ${orderDir}` : `${orderBy} ${orderDir},Id ${orderDir}`;

  const filters: string[] = [];
  if (args.searchTitle?.trim()) filters.push(`startswith(Title,'${escapeODataString(args.searchTitle.trim())}')`);
  if (args.statusEquals?.trim()) filters.push(`status eq '${escapeODataString(args.statusEquals.trim())}'`);
  if (args.unitEquals?.trim()) filters.push(`unit eq '${escapeODataString(args.unitEquals.trim())}'`);

  const data = await fetchProjectsPage({
    top,
    orderExpr,
    filters: filters.length ? filters.join(" and ") : undefined
  });
  return { items: readItems(data).map(mapProjectRow), nextLink: pickNextLink(data) };
}

export async function getProjectById(id: number): Promise<ProjectRow> {
  const data = await fetchProjectById(id);
  return mapProjectRow(data);
}

export async function createProject(draft: ProjectDraft): Promise<number> {
  const url = `${spConfig.siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(spConfig.projectsListTitle)}')/items`;
  const digest = await getDigest();

  const created = await spPostJson<{ Id?: unknown }>(url, buildProjectPayload(draft), digest);
  return Number(created.Id);
}

export async function updateProject(id: number, patch: ProjectUpdate): Promise<void> {
  const url = `${spConfig.siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(spConfig.projectsListTitle)}')/items(${id})`;
  const digest = await getDigest();
  await spPatchJson(url, buildProjectPayload(patch), digest);
}

function escapeODataString(v: string) {
  return v.replace(/'/g, "''");
}

async function fetchProjectsPage(args: {
  top: number;
  orderExpr: string;
  filters?: string;
}): Promise<SpListResponse> {
  try {
    return await spGetJson<SpListResponse>(buildProjectsPageUrl(args, PROJECT_SELECT_WITH_ROCE));
  } catch (error: unknown) {
    if (!isMissingFieldError(error, "roce")) throw error;
    return spGetJson<SpListResponse>(buildProjectsPageUrl(args, PROJECT_SELECT_BASE));
  }
}

function buildProjectsPageUrl(
  args: { top: number; orderExpr: string; filters?: string },
  select: string
): string {
  return (
    `${spConfig.siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(spConfig.projectsListTitle)}')/items` +
    `?$select=${select}&$orderby=${args.orderExpr}&$top=${args.top}` +
    (args.filters ? `&$filter=${args.filters}` : "")
  );
}

async function fetchProjectById(id: number): Promise<SpRecord> {
  try {
    return await spGetJson<SpRecord>(buildProjectByIdUrl(id, PROJECT_SELECT_WITH_ROCE));
  } catch (error: unknown) {
    if (!isMissingFieldError(error, "roce")) throw error;
    return spGetJson<SpRecord>(buildProjectByIdUrl(id, PROJECT_SELECT_BASE));
  }
}

function buildProjectByIdUrl(id: number, select: string): string {
  return (
    `${spConfig.siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(spConfig.projectsListTitle)}')/items(${id})` +
    `?$select=${select}`
  );
}

function isMissingFieldError(error: unknown, fieldName: string): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  const missingFieldMarkers = ["does not exist", "não existe", "nao existe"];
  return missingFieldMarkers.some((marker) => msg.includes(marker)) && msg.includes(fieldName.toLowerCase());
}

function mapProjectRow(x: SpRecord): ProjectRow {
  return {
    Id: readNumber(x, "Id") ?? 0,
    Title: readString(x, "Title") ?? "",
    approvalYear: readNumber(x, "approvalYear"),
    budgetBrl: readNumber(x, "budgetBrl"),
    status: readString(x, "status"),
    investmentLevel: readString(x, "investmentLevel"),
    fundingSource: readString(x, "fundingSource"),
    company: readString(x, "company"),
    center: readString(x, "center"),
    unit: readString(x, "unit"),
    location: readString(x, "location"),
    depreciationCostCenter: readString(x, "depreciationCostCenter"),
    category: readString(x, "category"),
    investmentType: readString(x, "investmentType"),
    assetType: readString(x, "assetType"),
    projectFunction: readString(x, "projectFunction"),
    projectLeader: readString(x, "projectLeader"),
    projectUser: readString(x, "projectUser"),
    startDate: readString(x, "startDate"),
    endDate: readString(x, "endDate"),
    businessNeed: readString(x, "businessNeed"),
    proposedSolution: readString(x, "proposedSolution"),
    kpiType: readString(x, "kpiType"),
    kpiName: readString(x, "kpiName"),
    kpiDescription: readString(x, "kpiDescription"),
    kpiCurrent: readString(x, "kpiCurrent"),
    kpiExpected: readString(x, "kpiExpected"),
    roce: readNumber(x, "roce"),
    roceGain: readNumber(x, "roceGain"),
    roceGainDescription: readString(x, "roceGainDescription"),
    roceLoss: readNumber(x, "roceLoss"),
    roceLossDescription: readString(x, "roceLossDescription"),
    roceClassification: readString(x, "roceClassification")
  };
}

export async function deleteProject(id: number): Promise<void> {
  const url = `${spConfig.siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(spConfig.projectsListTitle)}')/items(${id})`;
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
