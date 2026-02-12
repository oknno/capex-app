// src/services/sharepoint/projectsApi.ts
import { spConfig } from "./spConfig";
import { spGetJson, spPostJson, spPatchJson, getDigest } from "./spHttp";

/**
 * Linha mínima para a listagem.
 * (mantenha enxuto para performance)
 */
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

  roceGain?: number;
  roceGainDescription?: string;
  roceLoss?: number;
  roceLossDescription?: string;
  roceClassification?: string;
};

export type ProjectDraft = {
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

  roceGain?: number;
  roceGainDescription?: string;
  roceLoss?: number;
  roceLossDescription?: string;
  roceClassification?: string;
};

export type ProjectPatch = Partial<ProjectDraft>;
export type ProjectUpdate = Partial<ProjectDraft>;

export type SortBy = "Title" | "Id" | "approvalYear";
export type SortDir = "asc" | "desc";

function pickNextLink(data: any): string | undefined {
  return (
    (data?.["odata.nextLink"] as string | undefined) ??
    (data?.["@odata.nextLink"] as string | undefined) ??
    (data?.__next as string | undefined) ??
    (data?.d?.__next as string | undefined)
  );
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
  // 1) paginação nativa
  if (args.nextLink) {
    const data = await spGetJson<any>(args.nextLink);
    const items = (data?.value ?? data?.d?.results ?? []) as any[];
    const nextLink = pickNextLink(data);
    return { items: items.map(mapProjectRow), nextLink };
  }

  // 2) monta query
  const siteUrl = spConfig.siteUrl;
  const listTitle = spConfig.projectsListTitle;

  const top = args.top ?? 20;
  const select =
  "Id,Title,approvalYear,budgetBrl,status,investmentLevel,fundingSource,company,center,unit,location," +
  "depreciationCostCenter,category,investmentType,assetType,projectFunction,projectLeader,projectUser," +
  "startDate,endDate,businessNeed,proposedSolution,kpiType,kpiName,kpiDescription,kpiCurrent,kpiExpected," +
  "roceGain,roceGainDescription,roceLoss,roceLossDescription,roceClassification";
  const orderBy = args.orderBy ?? "Id";
  const orderDir = args.orderDir ?? "desc";

  // paginação estável: inclui Id como tie-breaker
  const orderExpr =
    orderBy === "Id" ? `Id ${orderDir}` : `${orderBy} ${orderDir},Id ${orderDir}`;

  const filters: string[] = [];

  if (args.searchTitle && args.searchTitle.trim()) {
    const s = escapeODataString(args.searchTitle.trim());
    filters.push(`startswith(Title,'${s}')`);
  }

  if (args.statusEquals && args.statusEquals.trim()) {
    const s = escapeODataString(args.statusEquals.trim());
    filters.push(`status eq '${s}'`);
  }

  if (args.unitEquals && args.unitEquals.trim()) {
    const s = escapeODataString(args.unitEquals.trim());
    filters.push(`unit eq '${s}'`);
  }

  const filterPart = filters.length ? `&$filter=${filters.join(" and ")}` : "";

  const url =
    `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items` +
    `?$select=${select}` +
    `&$orderby=${orderExpr}` +
    `&$top=${top}` +
    filterPart;

  const data = await spGetJson<any>(url);
  const items = (data?.value ?? data?.d?.results ?? []) as any[];
  const nextLink = pickNextLink(data);

  return { items: items.map(mapProjectRow), nextLink };
}

export async function getProjectById(id: number): Promise<ProjectRow> {
  const siteUrl = spConfig.siteUrl;
  const listTitle = spConfig.projectsListTitle;

  // FULL SELECT (para o formulário puxar todos os campos no Edit/View)
  const select =
    "Id,Title,approvalYear,budgetBrl,status,investmentLevel,fundingSource,company,center,unit,location," +
    "depreciationCostCenter,category,investmentType,assetType,projectFunction,projectLeader,projectUser," +
    "startDate,endDate,businessNeed,proposedSolution,kpiType,kpiName,kpiDescription,kpiCurrent,kpiExpected," +
    "roceGain,roceGainDescription,roceLoss,roceLossDescription,roceClassification";

  const url =
    `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items(${id})` +
    `?$select=${select}`;

  const data = await spGetJson<any>(url);
  return mapProjectRow(data);
}


export async function createProject(draft: ProjectDraft): Promise<number> {
  const siteUrl = spConfig.siteUrl;
  const listTitle = spConfig.projectsListTitle;

  const url = `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items`;
  const digest = await getDigest();

  const body: any = {
  Title: draft.Title,

  approvalYear: draft.approvalYear,
  budgetBrl: draft.budgetBrl,

  status: draft.status,
  investmentLevel: draft.investmentLevel,
  fundingSource: draft.fundingSource,

  company: draft.company,
  center: draft.center,
  unit: draft.unit,
  location: draft.location,

  depreciationCostCenter: draft.depreciationCostCenter,

  category: draft.category,
  investmentType: draft.investmentType,
  assetType: draft.assetType,

  projectFunction: draft.projectFunction,
  projectLeader: draft.projectLeader,
  projectUser: draft.projectUser,

  startDate: draft.startDate,
  endDate: draft.endDate,

  businessNeed: draft.businessNeed,
  proposedSolution: draft.proposedSolution,

  kpiType: draft.kpiType,
  kpiName: draft.kpiName,
  kpiDescription: draft.kpiDescription,
  kpiCurrent: draft.kpiCurrent,
  kpiExpected: draft.kpiExpected,

  roceGain: draft.roceGain,
  roceGainDescription: draft.roceGainDescription,
  roceLoss: draft.roceLoss,
  roceLossDescription: draft.roceLossDescription,
  roceClassification: draft.roceClassification
};

  const created = await spPostJson<any>(url, body, digest);
  return Number(created?.Id);
}

export async function updateProject(id: number, patch: ProjectUpdate): Promise<void> {
  const siteUrl = spConfig.siteUrl;
  const listTitle = spConfig.projectsListTitle;

  const url = `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items(${id})`;
  const digest = await getDigest();

  const body: any = {
  ...(patch.Title !== undefined ? { Title: patch.Title } : {}),

  ...(patch.approvalYear !== undefined ? { approvalYear: patch.approvalYear } : {}),
  ...(patch.budgetBrl !== undefined ? { budgetBrl: patch.budgetBrl } : {}),

  ...(patch.status !== undefined ? { status: patch.status } : {}),
  ...(patch.investmentLevel !== undefined ? { investmentLevel: patch.investmentLevel } : {}),
  ...(patch.fundingSource !== undefined ? { fundingSource: patch.fundingSource } : {}),

  ...(patch.company !== undefined ? { company: patch.company } : {}),
  ...(patch.center !== undefined ? { center: patch.center } : {}),
  ...(patch.unit !== undefined ? { unit: patch.unit } : {}),
  ...(patch.location !== undefined ? { location: patch.location } : {}),

  ...(patch.depreciationCostCenter !== undefined ? { depreciationCostCenter: patch.depreciationCostCenter } : {}),

  ...(patch.category !== undefined ? { category: patch.category } : {}),
  ...(patch.investmentType !== undefined ? { investmentType: patch.investmentType } : {}),
  ...(patch.assetType !== undefined ? { assetType: patch.assetType } : {}),

  ...(patch.projectFunction !== undefined ? { projectFunction: patch.projectFunction } : {}),
  ...(patch.projectLeader !== undefined ? { projectLeader: patch.projectLeader } : {}),
  ...(patch.projectUser !== undefined ? { projectUser: patch.projectUser } : {}),

  ...(patch.startDate !== undefined ? { startDate: patch.startDate } : {}),
  ...(patch.endDate !== undefined ? { endDate: patch.endDate } : {}),

  ...(patch.businessNeed !== undefined ? { businessNeed: patch.businessNeed } : {}),
  ...(patch.proposedSolution !== undefined ? { proposedSolution: patch.proposedSolution } : {}),

  ...(patch.kpiType !== undefined ? { kpiType: patch.kpiType } : {}),
  ...(patch.kpiName !== undefined ? { kpiName: patch.kpiName } : {}),
  ...(patch.kpiDescription !== undefined ? { kpiDescription: patch.kpiDescription } : {}),
  ...(patch.kpiCurrent !== undefined ? { kpiCurrent: patch.kpiCurrent } : {}),
  ...(patch.kpiExpected !== undefined ? { kpiExpected: patch.kpiExpected } : {}),

  ...(patch.roceGain !== undefined ? { roceGain: patch.roceGain } : {}),
  ...(patch.roceGainDescription !== undefined ? { roceGainDescription: patch.roceGainDescription } : {}),
  ...(patch.roceLoss !== undefined ? { roceLoss: patch.roceLoss } : {}),
  ...(patch.roceLossDescription !== undefined ? { roceLossDescription: patch.roceLossDescription } : {}),
  ...(patch.roceClassification !== undefined ? { roceClassification: patch.roceClassification } : {})
};

  await spPatchJson<any>(url, body, digest);
}

/** Escapa aspas simples para OData */
function escapeODataString(v: string) {
  return v.replace(/'/g, "''");
}

function mapProjectRow(x: any): ProjectRow {
  return {
    Id: Number(x?.Id),
    Title: String(x?.Title ?? ""),

    approvalYear: x?.approvalYear != null ? Number(x.approvalYear) : undefined,
    budgetBrl: x?.budgetBrl != null ? Number(x.budgetBrl) : undefined,

    status: x?.status != null ? String(x.status) : undefined,
    investmentLevel: x?.investmentLevel != null ? String(x.investmentLevel) : undefined,
    fundingSource: x?.fundingSource != null ? String(x.fundingSource) : undefined,

    company: x?.company != null ? String(x.company) : undefined,
    center: x?.center != null ? String(x.center) : undefined,
    unit: x?.unit != null ? String(x.unit) : undefined,
    location: x?.location != null ? String(x.location) : undefined,

    depreciationCostCenter: x?.depreciationCostCenter != null ? String(x.depreciationCostCenter) : undefined,

    category: x?.category != null ? String(x.category) : undefined,
    investmentType: x?.investmentType != null ? String(x.investmentType) : undefined,
    assetType: x?.assetType != null ? String(x.assetType) : undefined,

    projectFunction: x?.projectFunction != null ? String(x.projectFunction) : undefined,
    projectLeader: x?.projectLeader != null ? String(x.projectLeader) : undefined,
    projectUser: x?.projectUser != null ? String(x.projectUser) : undefined,

    startDate: x?.startDate != null ? String(x.startDate) : undefined,
    endDate: x?.endDate != null ? String(x.endDate) : undefined,

    businessNeed: x?.businessNeed != null ? String(x.businessNeed) : undefined,
    proposedSolution: x?.proposedSolution != null ? String(x.proposedSolution) : undefined,

    kpiType: x?.kpiType != null ? String(x.kpiType) : undefined,
    kpiName: x?.kpiName != null ? String(x.kpiName) : undefined,
    kpiDescription: x?.kpiDescription != null ? String(x.kpiDescription) : undefined,
    kpiCurrent: x?.kpiCurrent != null ? String(x.kpiCurrent) : undefined,
    kpiExpected: x?.kpiExpected != null ? String(x.kpiExpected) : undefined,

    roceGain: x?.roceGain != null ? Number(x.roceGain) : undefined,
    roceGainDescription: x?.roceGainDescription != null ? String(x.roceGainDescription) : undefined,
    roceLoss: x?.roceLoss != null ? Number(x.roceLoss) : undefined,
    roceLossDescription: x?.roceLossDescription != null ? String(x.roceLossDescription) : undefined,
    roceClassification: x?.roceClassification != null ? String(x.roceClassification) : undefined
  };
}


export async function deleteProject(id: number): Promise<void> {
  const siteUrl = spConfig.siteUrl;
  const listTitle = spConfig.projectsListTitle;

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

