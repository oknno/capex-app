import { useEffect, useMemo, useState } from "react";

import { getProjectById } from "../../../services/sharepoint/projectsApi";
import type { ProjectDraft, ProjectRow } from "../../../services/sharepoint/projectsApi";

import { getMilestonesByProject } from "../../../services/sharepoint/milestonesApi";

import { getActivitiesByMilestone } from "../../../services/sharepoint/activitiesApi";

import { getPepsByActivity } from "../../../services/sharepoint/pepsApi";
import type { PepRow } from "../../../services/sharepoint/pepsApi";

import { sendToApproval, backToDraft } from "../../../services/sharepoint/projectsWorkflow";
import {
  commitProjectStructure,
  CommitProjectStructureError
} from "../../../services/sharepoint/commitProjectStructure";

import {
  ONE_MILLION,
  calculateInvestmentLevel,
  requiresStructure,
  toIntOrUndefined,
  toUpperOrUndefined
} from "../../../domain/projects/project.calculations";

import type {
  ActivityDraftLocal,
  MilestoneDraftLocal,
  PepDraftLocal,
  WizardDraftState
} from "../../../domain/projects/project.validators";
import { validateProjectBasics, validateStructure } from "../../../domain/projects/project.validators";

type StepKey = "project" | "structure" | "peps" | "review";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function ProjectWizardModal(props: {
  mode: "create" | "edit" | "view";
  initial?: ProjectRow;
  onClose: () => void;

  // ✅ mantemos pra não quebrar seu fluxo externo
  // (no modo CREATE, o parent pode criar via API e devolver id)
  onSubmitProject: (draft: ProjectDraft) => Promise<number>;
}) {
  const readOnly = props.mode === "view";

  const [step, setStep] = useState<StepKey>("project");
  const [projectId, setProjectId] = useState<number | null>(props.initial?.Id ?? null);

  const [loadingHeader, setLoadingHeader] = useState(false);
  const [errHeader, setErrHeader] = useState<string>("");

  const [transitioning, setTransitioning] = useState(false);
  const [committing, setCommitting] = useState(false);

  // ✅ estado local (NADA de POST até o commit)
  const [state, setState] = useState<WizardDraftState>(() => ({
    project: {
      Title: props.initial?.Title ?? "",
      approvalYear: props.initial?.approvalYear,
      budgetBrl: props.initial?.budgetBrl,
      status: props.initial?.status ?? (props.mode === "create" ? "Rascunho" : props.initial?.status),
      investmentLevel: props.initial?.investmentLevel,
      fundingSource: props.initial?.fundingSource,
      company: props.initial?.company,
      center: props.initial?.center,
      unit: props.initial?.unit,
      location: props.initial?.location,
      depreciationCostCenter: props.initial?.depreciationCostCenter,
      category: props.initial?.category,
      investmentType: props.initial?.investmentType,
      assetType: props.initial?.assetType,
      projectFunction: props.initial?.projectFunction,
      projectLeader: props.initial?.projectLeader,
      projectUser: props.initial?.projectUser,
      startDate: props.initial?.startDate,
      endDate: props.initial?.endDate,
      businessNeed: props.initial?.businessNeed,
      proposedSolution: props.initial?.proposedSolution,
      kpiType: props.initial?.kpiType,
      kpiName: props.initial?.kpiName,
      kpiDescription: props.initial?.kpiDescription,
      kpiCurrent: props.initial?.kpiCurrent,
      kpiExpected: props.initial?.kpiExpected,
      roceGain: props.initial?.roceGain,
      roceGainDescription: props.initial?.roceGainDescription,
      roceLoss: props.initial?.roceLoss,
      roceLossDescription: props.initial?.roceLossDescription,
      roceClassification: props.initial?.roceClassification
    },
    milestones: [],
    activities: [],
    peps: []
  }));

  const needStructure = useMemo(() => requiresStructure(state.project.budgetBrl), [state.project.budgetBrl]);

  // ✅ Edit/View: carrega do BD e “hidrata” o estado local
  useEffect(() => {
    if (!props.initial?.Id) return;
    if (props.mode === "create") return;

    (async () => {
      setLoadingHeader(true);
      setErrHeader("");
      try {
        const full = await getProjectById(props.initial!.Id);

        setProjectId(full.Id);

        // project básico
        setState((prev) => ({
          ...prev,
          project: { ...prev.project, ...full }
        }));

        // hidrata estrutura/peps do BD (para edit/view)
        // Observação: isso não “edita” o BD — só traz para estado local e depois commit/update.
        const milestones = await getMilestonesByProject(full.Id);
        const msLocal: MilestoneDraftLocal[] = milestones.map((m) => ({
          tempId: `ms_${m.Id}`,
          Title: String(m.Title ?? "").toUpperCase()
        }));

        const actsLocal: ActivityDraftLocal[] = [];
        const pepsLocal: PepDraftLocal[] = [];

        for (const m of milestones) {
          const acts = await getActivitiesByMilestone(full.Id, m.Id);
          for (const a of acts) {
            const actTempId = `ac_${a.Id}`;
            actsLocal.push({
              tempId: actTempId,
              Title: String(a.Title ?? "").toUpperCase(),
              milestoneTempId: `ms_${m.Id}`
            });

            const pepList = (await getPepsByActivity(a.Id)) as PepRow[] | undefined;
            for (const p of pepList ?? []) {
              const amount = typeof p.amountBrl === "number" ? p.amountBrl : Number(p.amountBrl);
              pepsLocal.push({
                tempId: `pp_${p.Id}`,
                Title: String(p.Title ?? ""),
                year: Number(p.year ?? new Date().getFullYear()),
                amountBrl: Math.round(Number.isFinite(amount) ? amount : 0),
                activityTempId: actTempId
              });
            }
          }
        }

        setState((prev) => ({
          ...prev,
          milestones: msLocal,
          activities: actsLocal,
          peps: pepsLocal
        }));
      } catch (e: any) {
        setErrHeader(e?.message ? String(e.message) : "Erro ao carregar projeto do SharePoint.");
      } finally {
        setLoadingHeader(false);
      }
    })();
  }, [props.mode, props.initial?.Id]);

  function patchProject(patch: Partial<ProjectDraft>) {
    setState((s) => ({ ...s, project: { ...s.project, ...patch } }));
  }

  function summaryTotals() {
    const totalPeps = state.peps.reduce((acc, x) => acc + (Number(x.amountBrl) || 0), 0);
    return {
      milestones: state.milestones.length,
      activities: state.activities.length,
      peps: state.peps.length,
      totalPeps
    };
  }

  async function goNext() {
    if (readOnly) return;

    if (transitioning) return;
    setTransitioning(true);

    try {
      // validações por etapa
      if (step === "project") validateProjectBasics(normalizeProjectForCommit(state.project));
      if (step === "structure" && needStructure) validateStructure(state);
      if (step === "peps") validateStructure(state);

      if (step === "project") {
        setStep(needStructure ? "structure" : "peps");
      } else if (step === "structure") {
        setStep("peps");
      } else if (step === "peps") {
        setStep("review");
      }
    } finally {
      setTransitioning(false);
    }
  }

  function goBack() {
    if (step === "review") setStep("peps");
    else if (step === "peps") setStep(needStructure ? "structure" : "project");
    else if (step === "structure") setStep("project");
  }

  function normalizeProjectForCommit(p: ProjectDraft): ProjectDraft {
    const budget = toIntOrUndefined(p.budgetBrl);
    const normalized: ProjectDraft = {
      ...p,

      Title: toUpperOrUndefined(p.Title) ?? "",
      projectLeader: toUpperOrUndefined(p.projectLeader),
      projectUser: toUpperOrUndefined(p.projectUser),
      kpiName: toUpperOrUndefined(p.kpiName),

      budgetBrl: budget,
      investmentLevel: calculateInvestmentLevel(budget),

      // status controlado (mantém o que já vem do BD ou "Rascunho" no create)
      status: p.status ?? "Rascunho"
    };

    return normalized;
  }

  async function commitAll() {
    if (readOnly) return;
    if (committing) return;

    setCommitting(true);
    try {
      const normalizedProject = normalizeProjectForCommit(state.project);

      validateProjectBasics(normalizedProject);
      validateStructure({ ...state, project: normalizedProject });

      const ok = window.confirm("Confirmar COMMIT? Isso vai gravar projeto + estrutura + PEPs no SharePoint e enviar para Aprovação.");
      if (!ok) return;

      const result = await commitProjectStructure({
        projectId,
        normalizedProject,
        needStructure,
        milestones: state.milestones,
        activities: state.activities,
        peps: state.peps,
        createProject: props.onSubmitProject
      });

      setProjectId(result.projectId);

      const full = await getProjectById(result.projectId);
      await sendToApproval(full);

      alert("Commit concluído e enviado para Aprovação.");
      props.onClose();
    } catch (e: any) {
      if (e instanceof CommitProjectStructureError) {
        const rootMessage = e.causeError instanceof Error ? e.causeError.message : "Erro desconhecido durante commit.";
        const rollbackStatus = e.rollback.status === "complete" ? "completo" : "parcial";
        const failures = e.rollback.failures
          .map((f) => `- ${f.entity} #${f.id}: ${f.reason}`)
          .join("\n");

        const structuredMessage = [
          "Falha no commit do projeto.",
          `Causa: ${rootMessage}`,
          `Rollback: ${rollbackStatus} (${e.rollback.attempts - e.rollback.failures.length}/${e.rollback.attempts} reversões bem-sucedidas).`,
          failures ? `Falhas no rollback:
${failures}` : ""
        ]
          .filter(Boolean)
          .join("\n");

        alert(structuredMessage);
        return;
      }

      alert(e?.message ? String(e.message) : "Erro no commit.");
    } finally {
      setCommitting(false);
    }
  }

  // ===== UI =====

  const totals = summaryTotals();
  const stepLabel = (k: StepKey) => {
    if (k === "project") return "1. Projeto";
    if (k === "structure") return `2. Estrutura (${ONE_MILLION.toLocaleString("pt-BR")}+)`;
    if (k === "peps") return needStructure ? "3. PEPs" : "2. PEPs";
    return needStructure ? "4. Revisão" : "3. Revisão";
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={modalHeader}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>
              {props.mode === "create"
                ? "Novo Projeto"
                : props.mode === "view"
                ? `Visualizar Projeto #${props.initial?.Id ?? ""}`
                : `Editar Projeto #${props.initial?.Id ?? ""}`}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              {readOnly ? "Modo visualização: campos bloqueados." : "Preencha, revise e faça commit no final."}
            </div>
            {loadingHeader && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Carregando dados do BD…</div>}
            {errHeader && <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 4 }}>{errHeader}</div>}
          </div>

          <button className="btn" onClick={props.onClose}>Fechar</button>
        </div>

        <div style={tabsRow}>
          <Tab label={stepLabel("project")} active={step === "project"} onClick={() => setStep("project")} />
          {needStructure && (
            <Tab label={stepLabel("structure")} active={step === "structure"} onClick={() => setStep("structure")} />
          )}
          <Tab label={stepLabel("peps")} active={step === "peps"} onClick={() => setStep("peps")} />
          <Tab label={stepLabel("review")} active={step === "review"} onClick={() => setStep("review")} />
        </div>

        <div style={body}>
          {step === "project" && (
            <ProjectStep
              draft={state.project}
              readOnly={readOnly}
              onChange={(patch) => patchProject(patch)}
            />
          )}

          {step === "structure" && needStructure && (
            <StructureStep
              readOnly={readOnly}
              milestones={state.milestones}
              activities={state.activities}
              onChange={(next) => setState((s) => ({ ...s, ...next }))}
            />
          )}

          {step === "peps" && (
            <PepsLocalStep
              readOnly={readOnly}
              needStructure={needStructure}
              milestones={state.milestones}
              activities={state.activities}
              peps={state.peps}
              defaultYear={Number(state.project.approvalYear ?? new Date().getFullYear())}
              onChange={(nextPeps) => setState((s) => ({ ...s, peps: nextPeps }))}
            />
          )}

          {step === "review" && (
            <ReviewLocalStep
              mode={props.mode}
              readOnly={readOnly}
              projectId={projectId}
              needStructure={needStructure}
              totals={totals}
              onBackToDraft={async () => {
                if (!projectId) return;
                const ok = window.confirm("Voltar status para Rascunho?");
                if (!ok) return;
                const p = await getProjectById(projectId);
                await backToDraft(p);
                alert("Status alterado para Rascunho.");
              }}
              onCommit={commitAll}
            />
          )}
        </div>

        <div style={footer}>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            ✅ Agora: nada é salvo até o Commit final.
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={goBack} disabled={step === "project"}>Voltar</button>
            {!readOnly && step !== "review" && (
              <button className="btn primary" onClick={goNext} disabled={transitioning}>
                {transitioning ? "Validando..." : "Próximo"}
              </button>
            )}
            {!readOnly && step === "review" && (
              <button className="btn primary" onClick={commitAll} disabled={committing}>
                {committing ? "Commit..." : "Commit + Enviar p/ Aprovação"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Steps (LOCAL STATE)
========================= */

function ProjectStep(props: { draft: ProjectDraft; readOnly: boolean; onChange: (patch: Partial<ProjectDraft>) => void }) {
  const d = props.draft;

  return (
    <div style={{ display: "grid", gap: 12, padding: 14 }}>
      <SectionTitle title="Projeto" subtitle="Campos essenciais e governança (maiúsculo / inteiros / status controlado)." />

      <div style={grid2}>
        <FieldText
          label="Title * (MAIÚSCULO)"
          value={d.Title ?? ""}
          placeholder="Ex: MODERNIZAÇÃO LINHA..."
          disabled={props.readOnly}
          onChange={(v) => props.onChange({ Title: v.toUpperCase() })}
        />

        <FieldNumber
          label="budgetBrl (inteiro)"
          value={d.budgetBrl ?? ""}
          placeholder="Ex: 5000000"
          disabled={props.readOnly}
          onChange={(v) => props.onChange({ budgetBrl: v === "" ? undefined : Math.round(Number(v)) })}
        />

        <FieldNumber
          label="approvalYear"
          value={d.approvalYear ?? new Date().getFullYear()}
          placeholder="2026"
          disabled={props.readOnly}
          onChange={(v) => props.onChange({ approvalYear: v === "" ? undefined : Math.round(Number(v)) })}
        />

        <FieldText
          label="status (controle do sistema)"
          value={d.status ?? "Rascunho"}
          disabled={true}
          onChange={() => {}}
        />

        <FieldText
          label="fundingSource"
          value={d.fundingSource ?? ""}
          placeholder="Ex: BUDGET 2026"
          disabled={props.readOnly}
          onChange={(v) => props.onChange({ fundingSource: v })}
        />

        <FieldText
          label="projectLeader (MAIÚSCULO)"
          value={d.projectLeader ?? ""}
          placeholder="NOME SOBRENOME"
          disabled={props.readOnly}
          onChange={(v) => props.onChange({ projectLeader: v.toUpperCase() })}
        />

        <FieldText
          label="projectUser (MAIÚSCULO)"
          value={d.projectUser ?? ""}
          placeholder="NOME SOBRENOME"
          disabled={props.readOnly}
          onChange={(v) => props.onChange({ projectUser: v.toUpperCase() })}
        />

        <FieldText
          label="kpiName (MAIÚSCULO)"
          value={d.kpiName ?? ""}
          placeholder="EX: REDUÇÃO CONSUMO..."
          disabled={props.readOnly}
          onChange={(v) => props.onChange({ kpiName: v.toUpperCase() })}
        />
      </div>

      <div style={{ fontSize: 12, color: "#6b7280" }}>
        Regra 1M: &lt; 1.000.000 → só PEPs • ≥ 1.000.000 → estrutura completa.
      </div>
    </div>
  );
}

function StructureStep(props: {
  readOnly: boolean;
  milestones: MilestoneDraftLocal[];
  activities: ActivityDraftLocal[];
  onChange: (patch: Partial<{ milestones: MilestoneDraftLocal[]; activities: ActivityDraftLocal[] }>) => void;
}) {
  const [msTitle, setMsTitle] = useState("");
  const [acTitle, setAcTitle] = useState("");
  const [selectedMs, setSelectedMs] = useState<string>("");

  useEffect(() => {
    if (!selectedMs && props.milestones.length) setSelectedMs(props.milestones[0].tempId);
  }, [props.milestones.length]);

  return (
    <div style={{ padding: 14, display: "grid", gap: 14 }}>
      <SectionTitle title="Estrutura (Milestones + Activities)" subtitle="Obrigatório para projetos ≥ 1.000.000." />

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input value={msTitle} onChange={(e) => setMsTitle(e.target.value)} placeholder="Novo milestone..." style={inputStyle} />
          <button
            className="btn primary"
            disabled={props.readOnly || !msTitle.trim()}
            onClick={() => {
              const t = msTitle.trim().toUpperCase();
              const next = [...props.milestones, { tempId: uid("ms"), Title: t }];
              props.onChange({ milestones: next });
              setMsTitle("");
              if (!selectedMs) setSelectedMs(next[0].tempId);
            }}
          >
            Adicionar Milestone
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={selectedMs}
            onChange={(e) => setSelectedMs(e.target.value)}
            disabled={props.readOnly || props.milestones.length === 0}
            style={{ ...inputStyle, width: 260 }}
          >
            <option value="">Selecione milestone...</option>
            {props.milestones.map((m) => (
              <option key={m.tempId} value={m.tempId}>{m.Title}</option>
            ))}
          </select>

          <input value={acTitle} onChange={(e) => setAcTitle(e.target.value)} placeholder="Nova activity..." style={inputStyle} />

          <button
            className="btn primary"
            disabled={props.readOnly || !selectedMs || !acTitle.trim()}
            onClick={() => {
              const t = acTitle.trim().toUpperCase();
              const next = [...props.activities, { tempId: uid("ac"), Title: t, milestoneTempId: selectedMs }];
              props.onChange({ activities: next });
              setAcTitle("");
            }}
          >
            Adicionar Activity
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
        <div style={box}>
          <div style={boxHead}>Milestones ({props.milestones.length})</div>
          {!props.milestones.length ? <div style={empty}>Nenhum milestone.</div> : (
            props.milestones.map((m) => <div key={m.tempId} style={row}>{m.Title}</div>)
          )}
        </div>

        <div style={box}>
          <div style={boxHead}>Activities ({props.activities.length})</div>
          {!props.activities.length ? <div style={empty}>Nenhuma activity.</div> : (
            props.activities.map((a) => {
              const ms = props.milestones.find((m) => m.tempId === a.milestoneTempId);
              return <div key={a.tempId} style={row}><b>{a.Title}</b><div style={{ fontSize: 12, color: "#6b7280" }}>{ms?.Title ?? "(milestone?)"}</div></div>;
            })
          )}
        </div>
      </div>
    </div>
  );
}

function PepsLocalStep(props: {
  readOnly: boolean;
  needStructure: boolean;
  milestones: MilestoneDraftLocal[];
  activities: ActivityDraftLocal[];
  peps: PepDraftLocal[];
  defaultYear: number;
  onChange: (next: PepDraftLocal[]) => void;
}) {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(String(props.defaultYear));
  const [amount, setAmount] = useState("");

  const [selectedActivity, setSelectedActivity] = useState<string>("");

  useEffect(() => {
    if (!props.needStructure) return;
    if (!selectedActivity && props.activities.length) setSelectedActivity(props.activities[0].tempId);
  }, [props.needStructure, props.activities.length]);

  return (
    <div style={{ padding: 14, display: "grid", gap: 12 }}>
      <SectionTitle title="PEPs" subtitle={props.needStructure ? "Vincule PEPs a Activities." : "Projeto < 1M: apenas PEPs (sem estrutura visível)."} />

      {props.needStructure && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={selectedActivity}
            onChange={(e) => setSelectedActivity(e.target.value)}
            disabled={props.readOnly || props.activities.length === 0}
            style={{ ...inputStyle, width: 360 }}
          >
            <option value="">Selecione activity...</option>
            {props.activities.map((a) => {
              const ms = props.milestones.find((m) => m.tempId === a.milestoneTempId);
              return (
                <option key={a.tempId} value={a.tempId}>
                  {a.Title} — {ms?.Title ?? ""}
                </option>
              );
            })}
          </select>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do PEP..." style={{ ...inputStyle, width: 280 }} />
        <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Ano" style={{ ...inputStyle, width: 120 }} />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="amountBrl (inteiro)" style={{ ...inputStyle, width: 200 }} />

        <button
          className="btn primary"
          disabled={props.readOnly || !title.trim() || !year.trim() || !amount.trim() || (props.needStructure && !selectedActivity)}
          onClick={() => {
            const y = Number(year.trim());
            const amt = toIntOrUndefined(amount);
            if (!Number.isFinite(y)) return alert("Ano inválido.");
            if (!amt || amt <= 0) return alert("amountBrl inválido.");

            const pep: PepDraftLocal = {
              tempId: uid("pp"),
              Title: title.trim(),
              year: y,
              amountBrl: amt,
              activityTempId: props.needStructure ? selectedActivity : undefined
            };

            props.onChange([...props.peps, pep]);
            setTitle("");
            setAmount("");
          }}
        >
          Adicionar PEP
        </button>
      </div>

      <div style={box}>
        <div style={boxHead}>PEPs ({props.peps.length})</div>
        {!props.peps.length ? <div style={empty}>Nenhum PEP.</div> : (
          props.peps.map((p) => (
            <div key={p.tempId} style={row}>
              <b>{p.Title}</b> • {p.year} • {p.amountBrl.toLocaleString("pt-BR")}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ReviewLocalStep(props: {
  mode: "create" | "edit" | "view";
  readOnly: boolean;
  projectId: number | null;
  needStructure: boolean;
  totals: { milestones: number; activities: number; peps: number; totalPeps: number };
  onBackToDraft: () => Promise<void>;
  onCommit: () => Promise<void>;
}) {
  return (
    <div style={{ padding: 14, display: "grid", gap: 12 }}>
      <SectionTitle title="Revisão" subtitle="Conferência final antes do commit transacional." />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Badge label="Milestones" value={props.totals.milestones} />
        <Badge label="Activities" value={props.totals.activities} />
        <Badge label="PEPs" value={props.totals.peps} />
        <Badge label="Total PEPs (BRL)" value={props.totals.totalPeps.toLocaleString("pt-BR")} />
      </div>

      {props.projectId && (
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          Edit/View: ProjectId atual no SharePoint: <b>{props.projectId}</b>
        </div>
      )}

      {!props.readOnly && props.projectId && (
        <button className="btn" onClick={props.onBackToDraft}>
          Voltar para Rascunho (SharePoint)
        </button>
      )}

      {!props.readOnly && (
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          O commit cria/atualiza o projeto, cria estrutura e PEPs e envia para Aprovação.
        </div>
      )}
    </div>
  );
}

/* =========================
   UI helpers (mantém seu estilo)
========================= */

function Tab(props: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      className={"btn " + (props.active ? "primary" : "")}
      style={{ borderRadius: 999, padding: "8px 12px" }}
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
}

function Badge(props: { label: string; value: any }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 999, padding: "6px 10px", background: "#f9fafb", fontSize: 12 }}>
      {props.label}: <b>{props.value}</b>
    </div>
  );
}

function SectionTitle(props: { title: string; subtitle?: string }) {
  return (
    <div>
      <div style={{ fontWeight: 800, color: "#111827" }}>{props.title}</div>
      {props.subtitle && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{props.subtitle}</div>}
    </div>
  );
}

function FieldText(props: { label: string; value: any; placeholder?: string; disabled?: boolean; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, color: "#6b7280" }}>{props.label}</div>
      <input
        value={props.value ?? ""}
        placeholder={props.placeholder}
        disabled={props.disabled}
        onChange={(e) => props.onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}

function FieldNumber(props: { label: string; value: any; placeholder?: string; disabled?: boolean; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, color: "#6b7280" }}>{props.label}</div>
      <input
        value={String(props.value ?? "")}
        placeholder={props.placeholder}
        disabled={props.disabled}
        inputMode="numeric"
        onChange={(e) => props.onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(17,24,39,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 9999
};

const modal: React.CSSProperties = {
  width: "min(1100px, 100%)",
  background: "#fff",
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  overflow: "hidden",
  maxHeight: "92vh",
  display: "grid",
  gridTemplateRows: "auto auto 1fr auto"
};

const modalHeader: React.CSSProperties = {
  padding: 14,
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "space-between",
  gap: 12
};

const tabsRow: React.CSSProperties = {
  padding: 10,
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  gap: 8,
  flexWrap: "wrap"
};

const body: React.CSSProperties = {
  overflow: "auto"
};

const footer: React.CSSProperties = {
  padding: 14,
  borderTop: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center"
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 10px",
  borderRadius: 10,
  border: "1px solid #d1d5db"
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12
};

const box: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  overflow: "hidden"
};

const boxHead: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 12,
  fontWeight: 700,
  background: "#f9fafb",
  borderBottom: "1px solid #e5e7eb"
};

const row: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #f3f4f6"
};

const empty: React.CSSProperties = { padding: 12, color: "#6b7280" };