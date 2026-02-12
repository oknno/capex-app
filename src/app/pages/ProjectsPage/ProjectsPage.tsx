import { useEffect, useMemo, useState } from "react";
import { isLockedStatus, canSendToApproval, sendToApproval, canBackToDraft, backToDraft } from "../../../services/sharepoint/projectsWorkflow";
import { createProject, getProjectsPage, updateProject, getProjectById } from "../../../services/sharepoint/projectsApi";
import type { ProjectRow, ProjectDraft } from "../../../services/sharepoint/projectsApi";

import { getMilestonesByProject } from "../../../services/sharepoint/milestonesApi";
import type { MilestoneRow } from "../../../services/sharepoint/milestonesApi";

import { ProjectWizardModal } from "./ProjectWizardModal";

import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";

import { CommandBar } from "./CommandBar";
import type { ProjectsFilters } from "./CommandBar";

import { spConfig } from "../../../services/sharepoint/spConfig";
import { spGetJson } from "../../../services/sharepoint/spHttp";

type LoadState = "idle" | "loading" | "error";

type ActivityRowLite = {
  Id: number;
  Title: string;
  startDate?: string;
  endDate?: string;
  milestonesIdId?: number;
  projectsIdId?: number;
};

const PAGE_SIZE = 15;

export function ProjectsPage(props: { onWantsRefreshHeader?: () => void; onRegisterRefresh?: (fn: () => void) => void }) {
  // ===== Projects =====
  const [items, setItems] = useState<ProjectRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [nextLink, setNextLink] = useState<string | undefined>(undefined);
  const [state, setState] = useState<LoadState>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [wizard, setWizard] = useState<{ mode: "create" | "edit" | "view"; initial?: ProjectRow } | null>(null);

  const selected = useMemo(() => items.find((x) => x.Id === selectedId) ?? null, [items, selectedId]);
  const backCheck = canBackToDraft(selected);

  // ===== Filters / Sort =====
  const [filters, setFilters] = useState<ProjectsFilters>({
    searchTitle: "",
    status: "",
    unit: "",
    sortBy: "Id",
    sortDir: "desc"
  });

  // ===== Summary: details (fetch full) =====
  const [selectedFull, setSelectedFull] = useState<ProjectRow | null>(null);
  const [selectedFullState, setSelectedFullState] = useState<LoadState>("idle");

  // ===== Gantt data =====
  const [milestones, setMilestones] = useState<MilestoneRow[]>([]);
  const [activities, setActivities] = useState<ActivityRowLite[]>([]);
  const [activitiesState, setActivitiesState] = useState<LoadState>("idle");

  // ===== Load Projects =====
  async function loadFirstPage() {
    setState("loading");
    setErrorMsg("");
    setSelectedId(null);

    try {
      const res = await getProjectsPage({
        top: PAGE_SIZE,
        searchTitle: filters.searchTitle,
        statusEquals: filters.status || undefined,
        unitEquals: filters.unit || undefined,
        orderBy: filters.sortBy,
        orderDir: filters.sortDir
      });

      setItems(res.items);
      setNextLink(res.nextLink);
      setState("idle");
    } catch (e: any) {
      setState("error");
      setErrorMsg(e?.message ? String(e.message) : "Erro ao carregar Projects.");
      console.error(e);
    }
  }

  async function loadMore() {
    if (!nextLink) return;

    setState("loading");
    setErrorMsg("");

    try {
      const res = await getProjectsPage({ nextLink });
      setItems((prev) => prev.concat(res.items));
      setNextLink(res.nextLink);
      setState("idle");
    } catch (e: any) {
      setState("error");
      setErrorMsg(e?.message ? String(e.message) : "Erro ao carregar mais Projects.");
      console.error(e);
    }
  }

  useEffect(() => {
    loadFirstPage();
    props.onRegisterRefresh?.(loadFirstPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== CRUD Projects =====
  async function onCreate(draft: ProjectDraft): Promise<number> {
    const id = await createProject(draft);
    await loadFirstPage();
    setSelectedId(id);
    return id;
  }

  async function onEdit(draft: ProjectDraft): Promise<number> {
    if (!selected) throw new Error("Selecione um projeto.");
    await updateProject(selected.Id, draft);
    await loadFirstPage();
    setSelectedId(selected.Id);
    return selected.Id;
  }

  async function onSendToApproval() {
    if (!selected) return;

    const check = canSendToApproval(selected);
    if (!check.ok) {
      alert(check.reason ?? "Não é possível enviar para aprovação.");
      return;
    }

    // ✅ confirmação
    const ok = window.confirm(`Enviar o projeto #${selected.Id} para Aprovação?`);
    if (!ok) return;

    try {
      await sendToApproval(selected);
      await loadFirstPage();
      setSelectedId(selected.Id);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ? String(e.message) : "Erro ao enviar para aprovação.");
    }
  }

  async function onBackStatus() {
    if (!selected) return;

    if (!backCheck.ok) {
      alert(backCheck.reason);
      return;
    }

    // ✅ confirmação
    const ok = window.confirm(`Voltar o status do projeto #${selected.Id} para Rascunho?`);
    if (!ok) return;

    await backToDraft(selected);
    await loadFirstPage();
    setSelectedId(selected.Id);
  }

  // ===== Summary / Full project fetch =====
  useEffect(() => {
    if (!selectedId) {
      setSelectedFull(null);
      setSelectedFullState("idle");
      return;
    }

    (async () => {
      setSelectedFullState("loading");
      try {
        const p = await getProjectById(selectedId);
        setSelectedFull(p);
        setSelectedFullState("idle");
      } catch (e) {
        console.error(e);
        setSelectedFull(null);
        setSelectedFullState("error");
      }
    })();
  }, [selectedId]);

  // ===== Activities + Milestones for Gantt =====
  async function loadTimeline(projectId: number) {
    setActivitiesState("loading");
    try {
      // milestones
      const ms = await getMilestonesByProject(projectId);
      setMilestones(ms ?? []);

      // activities
      const siteUrl = spConfig.siteUrl;
      const listTitle = spConfig.activitiesListTitle;

      const select = "Id,Title,startDate,endDate,milestonesIdId,projectsIdId";
      const filter = `projectsIdId eq ${projectId}`;
      const url =
        `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items` +
        `?$select=${encodeURIComponent(select)}` +
        `&$filter=${encodeURIComponent(filter)}` +
        `&$orderby=${encodeURIComponent("startDate asc")}` +
        `&$top=500`;

      const data = await spGetJson<any>(url);

      const rows = (data?.value ?? []) as any[];
      const mapped: ActivityRowLite[] = rows.map((r) => ({
        Id: Number(r.Id),
        Title: String(r.Title ?? ""),
        startDate: r.startDate ? String(r.startDate) : undefined,
        endDate: r.endDate ? String(r.endDate) : undefined,
        milestonesIdId: r.milestonesIdId != null ? Number(r.milestonesIdId) : undefined,
        projectsIdId: r.projectsIdId != null ? Number(r.projectsIdId) : undefined
      }));

      setActivities(mapped);
      setActivitiesState("idle");
    } catch (e) {
      console.error(e);
      setMilestones([]);
      setActivities([]);
      setActivitiesState("error");
    }
  }

  useEffect(() => {
    if (!selectedId) {
      setMilestones([]);
      setActivities([]);
      setActivitiesState("idle");
      return;
    }
    loadTimeline(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // ===== UI sizing: internal scroll =====
  // Ajuste fino: dentro do SharePoint, 100vh funciona melhor que crescer infinito.
  const pageWrapStyle: React.CSSProperties = {
    background: "#f8fafc",
    height: "100vh",
    padding: 16,
    overflow: "hidden", // ✅ evita crescer infinito
    display: "grid",
    gridTemplateRows: "auto 1fr"
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1.6fr 1fr",
    gap: 12,
    marginTop: 12,
    overflow: "hidden"
  };

  return (
    <div style={pageWrapStyle}>
      <CommandBar
        selectedId={selectedId}
        selectedStatus={selected?.status}
        totalLoaded={items.length}
        filters={filters}
        onChangeFilters={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
        onApply={loadFirstPage}
        onClear={() =>
          setFilters({
            searchTitle: "",
            status: "",
            unit: "",
            sortBy: "Id",
            sortDir: "desc"
          })
        }
        onRefresh={loadFirstPage}
        onNew={() => setWizard({ mode: "create" })}
        onView={() => {
          if (!selected) return;
          setWizard({ mode: "view", initial: selected });
        }}
        onEdit={() => {
          if (!selected) return;
          if (isLockedStatus(selected.status)) {
            alert("Projeto travado (Em Aprovação / Aprovado).");
            return;
          }
          setWizard({ mode: "edit", initial: selected });
        }}
        onDelete={() => alert("Excluir já está funcionando no seu projeto — mantendo aqui como placeholder.")}
        onSendToApproval={onSendToApproval}
        onBackStatus={onBackStatus}
        onExport={() => alert("Exportar já está funcionando no seu projeto — mantendo aqui como placeholder.")}
      />

      <div style={gridStyle}>
        {/* LEFT: LISTA (com scroll interno) */}
        <Card style={{ display: "flex", flexDirection: "column", overflow: "hidden" } as any}>
          {state === "error" && (
            <div
              style={{
                padding: 10,
                borderRadius: 10,
                border: "1px solid #f5c2c7",
                background: "#f8d7da",
                color: "#842029",
                marginBottom: 10
              }}
            >
              <b>Erro:</b> {errorMsg}
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>
                Dica: confirme <code>spConfig.ts</code> (siteUrl e nome da lista).
              </div>
            </div>
          )}

          {/* header da tabela */}
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 220px 160px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <CellHeader>ID</CellHeader>
              <CellHeader>Title</CellHeader>
              <CellHeader>Unidade</CellHeader>
              <CellHeader>Status</CellHeader>
            </div>

            {/* ✅ corpo com scroll interno */}
            <div style={{ maxHeight: "calc(100vh - 260px)", overflowY: "auto" }}>
              {items.map((p) => {
                const active = p.Id === selectedId;
                return (
                  <div
                    key={p.Id}
                    onClick={() => setSelectedId(p.Id)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "90px 1fr 220px 160px",
                      cursor: "pointer",
                      background: active ? "#eef2ff" : "#fff",
                      borderBottom: "1px solid #f3f4f6"
                    }}
                  >
                    <Cell>{p.Id}</Cell>
                    <Cell>{p.Title}</Cell>
                    <Cell>{p.unit ?? "-"}</Cell>
                    <Cell>{p.status ?? "-"}</Cell>
                  </div>
                );
              })}

              {!items.length && state !== "loading" && <div style={{ padding: 12, color: "#6b7280" }}>Nenhum item encontrado.</div>}
            </div>
          </div>

          {/* footer (fixo) */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Itens carregados: <b>{items.length}</b>
            </div>
            <button className="btn" onClick={loadMore} disabled={!nextLink || state === "loading"}>
              {nextLink ? (state === "loading" ? "Carregando..." : "Carregar mais") : "Fim"}
            </button>
          </div>
        </Card>

        {/* RIGHT: RESUMO + GANTT */}
        <Card style={{ overflow: "auto" } as any}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 800, color: "#111827" }}>Resumo</div>
            <button className="btn" onClick={loadFirstPage}>
              Atualizar
            </button>
          </div>

          {!selectedId && <div style={{ color: "#6b7280" }}>Selecione um projeto para ver o resumo e o Gantt.</div>}

          {selectedId && selectedFullState === "loading" && <div style={{ color: "#6b7280" }}>Carregando detalhes...</div>}
          {selectedId && selectedFullState === "error" && <div style={{ color: "#b91c1c" }}>Erro ao carregar detalhes.</div>}

          {selectedFull && (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ fontWeight: 800, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {selectedFull.Title}
                </div>
                <StatusBadge status={String(selectedFull.status ?? "Rascunho")} />
              </div>

              {/* ✅ campos mais úteis */}
              <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 10, display: "grid", gap: 8 }}>
                <Field label="Orçamento (BRL)" value={fmtMoney(selectedFull.budgetBrl)} />
                <Field label="Responsável" value={String(selectedFull.projectLeader ?? "-")} />
                <Field label="Início / Fim" value={`${fmtDate(selectedFull.startDate)}  →  ${fmtDate(selectedFull.endDate)}`} />
                <Field label="Unidade" value={String(selectedFull.unit ?? "-")} />
                <Field label="Origem" value={String(selectedFull.fundingSource ?? "-")} />
              </div>

              <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 10, display: "grid", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>Business Need</div>
                  <div style={{ fontSize: 13, color: "#374151", whiteSpace: "pre-wrap" }}>
                    {truncateText(selectedFull.businessNeed ?? "-", 380)}
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>Proposed Solution</div>
                  <div style={{ fontSize: 13, color: "#374151", whiteSpace: "pre-wrap" }}>
                    {truncateText(selectedFull.proposedSolution ?? "-", 380)}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 10 }}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Gantt (Marcos → Atividades)</div>

                {activitiesState === "loading" && <div style={{ color: "#6b7280" }}>Carregando timeline...</div>}
                {activitiesState === "error" && <div style={{ color: "#b91c1c" }}>Erro ao carregar timeline.</div>}
                {activitiesState === "idle" && activities.length === 0 && <div style={{ color: "#6b7280" }}>Sem atividades para este projeto.</div>}

                {activitiesState === "idle" && activities.length > 0 && (
                  <GanttByMilestone activities={activities} milestones={milestones} />
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Wizard */}
      {wizard && (
        <ProjectWizardModal
          mode={wizard.mode}
          initial={wizard.initial}
          onClose={() => setWizard(null)}
          onSubmitProject={wizard.mode === "edit" ? onEdit : onCreate}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.trim().toLowerCase();
  let tone: "neutral" | "info" | "success" | "danger" | "warning" = "neutral";

  if (s.includes("em aprova")) tone = "info";
  else if (s.includes("aprovado")) tone = "success";
  else if (s.includes("reprov")) tone = "danger";
  else if (s.includes("rascun")) tone = "neutral";
  else tone = "warning";

  return <Badge text={status} tone={tone} />;
}

function GanttByMilestone(props: { activities: ActivityRowLite[]; milestones: MilestoneRow[] }) {
  const msMap = new Map<number, string>();
  for (const m of props.milestones ?? []) msMap.set(m.Id, m.Title ?? `Milestone #${m.Id}`);

  // normaliza datas válidas
  const rows = props.activities
    .map((a) => ({
      ...a,
      _s: a.startDate ? new Date(a.startDate) : null,
      _e: a.endDate ? new Date(a.endDate) : null
    }))
    .filter((a) => a._s && a._e && !Number.isNaN(a._s.getTime()) && !Number.isNaN(a._e.getTime()))
    .map((a) => ({
      id: a.Id,
      title: a.Title,
      s: a._s as Date,
      e: a._e as Date,
      milestoneId: a.milestonesIdId ?? -1
    }));

  if (!rows.length) return <div style={{ color: "#6b7280" }}>Atividades sem datas (startDate/endDate) não entram no Gantt.</div>;

  const min = new Date(Math.min(...rows.map((r) => r.s.getTime())));
  const max = new Date(Math.max(...rows.map((r) => r.e.getTime())));
  const span = Math.max(1, max.getTime() - min.getTime());

  // agrupa por milestone
  const groups = new Map<number, typeof rows>();
  for (const r of rows) {
    const key = r.milestoneId;
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }

  const orderedKeys = Array.from(groups.keys()).sort((a, b) => a - b);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {orderedKeys.slice(0, 8).map((mid) => {
        const title = mid === -1 ? "Sem Marco" : (msMap.get(mid) ?? `Milestone #${mid}`);
        const acts = groups.get(mid) ?? [];

        return (
          <div key={mid} style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "8px 10px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontWeight: 800 }}>
              {title} <span style={{ fontWeight: 600, color: "#6b7280" }}>({acts.length})</span>
            </div>

            <div style={{ padding: 10, display: "grid", gap: 10 }}>
              {acts.slice(0, 12).map((r) => {
                const left = ((r.s.getTime() - min.getTime()) / span) * 100;
                const width = ((r.e.getTime() - r.s.getTime()) / span) * 100;

                return (
                  <div key={r.id} style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 10, alignItems: "center" }}>
                    <div style={{ fontSize: 12, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.title}
                    </div>
                    <div style={{ position: "relative", height: 16, background: "#eef2ff", borderRadius: 999 }}>
                      <div
                        style={{
                          position: "absolute",
                          left: `${left}%`,
                          width: `${Math.max(2, width)}%`,
                          height: "100%",
                          borderRadius: 999,
                          background: "#1f2937"
                        }}
                        title={`${r.s.toLocaleDateString("pt-BR")} → ${r.e.toLocaleDateString("pt-BR")}`}
                      />
                    </div>
                  </div>
                );
              })}

              {acts.length > 12 && <div style={{ fontSize: 12, color: "#6b7280" }}>Mostrando 12 de {acts.length} (leve).</div>}
            </div>
          </div>
        );
      })}

      {orderedKeys.length > 8 && <div style={{ fontSize: 12, color: "#6b7280" }}>Mostrando 8 marcos (leve).</div>}
    </div>
  );
}

function CellHeader({ children }: { children: any }) {
  return <div style={{ padding: "10px 10px", fontSize: 12, fontWeight: 700, color: "#374151" }}>{children}</div>;
}
function Cell({ children }: { children: any }) {
  return (
    <div style={{ padding: "10px 10px", fontSize: 13, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
      {children}
    </div>
  );
}
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 10, alignItems: "center" }}>
      <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 13, color: "#111827" }}>{value}</div>
    </div>
  );
}

function fmtMoney(v?: number) {
  if (v == null || !Number.isFinite(Number(v))) return "-";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtDate(v?: string) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR");
}
function truncateText(s: string, max: number) {
  const t = String(s ?? "");
  if (t.length <= max) return t;
  return t.slice(0, max) + "…";
}
