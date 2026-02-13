import { spConfig } from "./spConfig";
import { spGetJson, spPostJson, spPatchJson, getDigest } from "./spHttp";
import { getListFieldsCached } from "./listSchemaCache";

export type ProjectRow = {
  Id: number;
  Title: string;
  approvalYear?: number;
  budgetBrl?: number;
  status?: string;
  investmentLevel?: string;
  fundingSource?: string;
  program?: string;
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

const PROJECT_FIELDS: Array<keyof ProjectRow> = [
  "Id",
  "Title",
  "approvalYear",
  "budgetBrl",
  "status",
  "investmentLevel",
  "fundingSource",
  "program",
  "company",
  "center",
  "unit",
  "location",
  "depreciationCostCenter",
  "category",
  "investmentType",
  "assetType",
  "projectFunction",
  "projectLeader",
  "projectUser",
  "startDate",
  "endDate",
  "businessNeed",
  "proposedSolution",
  "kpiType",
  "kpiName",
  "kpiDescription",
  "kpiCurrent",
  "kpiExpected",
  "roce",
  "roceGain",
  "roceGainDescription",
  "roceLoss",
  "roceLossDescription",
  "roceClassification"
];

const PROJECT_DEFAULT_SELECT = PROJECT_FIELDS.join(",");
const PROJECT_READ_MANDATORY_FIELDS = new Set(["Id", "Title"]);
const FALLBACK_UNSUPPORTED_FIELDS = new Set(["roce"]);
const BLOCKED_PROJECT_PAYLOAD_KEYS = new Set(["Id"]);
let projectsFieldNamesPromise: Promise<Set<string> | null> | null = null;

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

function readDateString(source: SpRecord, key: keyof ProjectDraft | "Id"): string | undefined {
  const value = readString(source, key);
  if (!value) return undefined;
  return value.includes("T") ? value.slice(0, 10) : value;
}

function pickNextLink(data: SpListResponse): string | undefined {
  const link = data["odata.nextLink"] ?? data["@odata.nextLink"] ?? data.__next ?? data.d?.__next;
  return typeof link === "string" && link.length > 0 ? link : undefined;
}

function buildRawProjectPayload(source: ProjectUpdate): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  (Object.keys(source) as Array<keyof ProjectUpdate>).forEach((key) => {
    if (BLOCKED_PROJECT_PAYLOAD_KEYS.has(String(key))) return;
    const value = source[key];
    if (value !== undefined) payload[key] = value;
  });
  return payload;
}

async function getProjectsFieldNames(): Promise<Set<string> | null> {
  if (!projectsFieldNamesPromise) {
    projectsFieldNamesPromise = getListFieldsCached(spConfig.projectsListTitle)
      .then((fields) => new Set(fields.map((field) => field.InternalName)))
      .catch(() => null);
  }
  return projectsFieldNamesPromise;
}

async function getProjectsSelectClause(): Promise<string> {
  const schemaFieldNames = await getProjectsFieldNames();
  if (!schemaFieldNames) return PROJECT_DEFAULT_SELECT;

  const available = PROJECT_FIELDS.filter((field) =>
    PROJECT_READ_MANDATORY_FIELDS.has(field) || schemaFieldNames.has(field)
  );

  if (available.length === 0) return "Id,Title";
  return available.join(",");
}

async function buildProjectPayload(source: ProjectUpdate): Promise<Record<string, unknown>> {
  const payload = buildRawProjectPayload(source);
  const schemaFieldNames = await getProjectsFieldNames();

  if (!schemaFieldNames) {
    for (const unsupportedField of FALLBACK_UNSUPPORTED_FIELDS) {
      delete payload[unsupportedField];
    }
    return payload;
  }

  for (const key of Object.keys(payload)) {
    if (!schemaFieldNames.has(key)) delete payload[key];
  }

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
  const payload = await buildProjectPayload(draft);

  const created = await spPostJson<{ Id?: unknown }>(url, payload, digest);
  return Number(created.Id);
}

export async function updateProject(id: number, patch: ProjectUpdate): Promise<void> {
  const url = `${spConfig.siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(spConfig.projectsListTitle)}')/items(${id})`;
  const digest = await getDigest();
  const payload = await buildProjectPayload(patch);
  await spPatchJson(url, payload, digest);
}

function escapeODataString(v: string) {
  return v.replace(/'/g, "''");
}

async function fetchProjectsPage(args: {
  top: number;
  orderExpr: string;
  filters?: string;
}): Promise<SpListResponse> {
  const selectClause = await getProjectsSelectClause();
  return spGetJson<SpListResponse>(buildProjectsPageUrl(args, selectClause));
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
  const selectClause = await getProjectsSelectClause();
  return spGetJson<SpRecord>(buildProjectByIdUrl(id, selectClause));
}

function buildProjectByIdUrl(id: number, select: string): string {
  return (
    `${spConfig.siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(spConfig.projectsListTitle)}')/items(${id})` +
    `?$select=${select}`
  );
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
    program: readString(x, "program"),
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
    startDate: readDateString(x, "startDate"),
    endDate: readDateString(x, "endDate"),
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
