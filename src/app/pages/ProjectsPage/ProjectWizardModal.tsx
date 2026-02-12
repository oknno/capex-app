import { useEffect, useMemo, useState } from "react";

import { getProjectById } from "../../../services/sharepoint/projectsApi";
import type { ProjectDraft, ProjectRow } from "../../../services/sharepoint/projectsApi";

import { getMilestonesByProject } from "../../../services/sharepoint/milestonesApi";

import { getActivitiesByMilestone } from "../../../services/sharepoint/activitiesApi";

import { getPepsByActivity } from "../../../services/sharepoint/pepsApi";
import type { PepRow } from "../../../services/sharepoint/pepsApi";

import { backToDraft } from "../../../services/sharepoint/projectsWorkflow";

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

import { useWizardCommit } from "./hooks/useWizardCommit";
import { ProjectStep } from "./components/wizard/ProjectStep";
import { StructureStep } from "./components/wizard/StructureStep";
import { PepStep } from "./components/wizard/PepStep";
import { ReviewStep } from "./components/wizard/ReviewStep";
import { Tab, wizardLayoutStyles as styles } from "./components/wizard/WizardUi";

type StepKey = "project" | "structure" | "peps" | "review";

export function ProjectWizardModal(props: {
  mode: "create" | "edit" | "view";
  initial?: ProjectRow;
  onClose: () => void;
  onSubmitProject: (draft: ProjectDraft) => Promise<number>;
}) {
  const readOnly = props.mode === "view";
  const [step, setStep] = useState<StepKey>("project");
  const [projectId, setProjectId] = useState<number | null>(props.initial?.Id ?? null);
  const [loadingHeader, setLoadingHeader] = useState(false);
  const [errHeader, setErrHeader] = useState("");
  const [transitioning, setTransitioning] = useState(false);

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

  useEffect(() => {
    if (!props.initial?.Id || props.mode === "create") return;

    (async () => {
      setLoadingHeader(true);
      setErrHeader("");
      try {
        const full = await getProjectById(props.initial!.Id);
        setProjectId(full.Id);
        setState((prev) => ({ ...prev, project: { ...prev.project, ...full } }));

        const milestones = await getMilestonesByProject(full.Id);
        const msLocal: MilestoneDraftLocal[] = milestones.map((m) => ({ tempId: `ms_${m.Id}`, Title: String(m.Title ?? "").toUpperCase() }));
        const actsLocal: ActivityDraftLocal[] = [];
        const pepsLocal: PepDraftLocal[] = [];

        for (const m of milestones) {
          const acts = await getActivitiesByMilestone(full.Id, m.Id);
          for (const a of acts) {
            const actTempId = `ac_${a.Id}`;
            actsLocal.push({ tempId: actTempId, Title: String(a.Title ?? "").toUpperCase(), milestoneTempId: `ms_${m.Id}` });

            const pepList = (await getPepsByActivity(a.Id)) as PepRow[] | undefined;
            for (const p of pepList ?? []) {
              const amount = typeof p.amountBrl === "number" ? p.amountBrl : Number(p.amountBrl);
              pepsLocal.push({ tempId: `pp_${p.Id}`, Title: String(p.Title ?? ""), year: Number(p.year ?? new Date().getFullYear()), amountBrl: Math.round(Number.isFinite(amount) ? amount : 0), activityTempId: actTempId });
            }
          }
        }

        setState((prev) => ({ ...prev, milestones: msLocal, activities: actsLocal, peps: pepsLocal }));
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

  function normalizeProjectForCommit(p: ProjectDraft): ProjectDraft {
    const budget = toIntOrUndefined(p.budgetBrl);
    return {
      ...p,
      Title: toUpperOrUndefined(p.Title) ?? "",
      projectLeader: toUpperOrUndefined(p.projectLeader),
      projectUser: toUpperOrUndefined(p.projectUser),
      kpiName: toUpperOrUndefined(p.kpiName),
      budgetBrl: budget,
      investmentLevel: calculateInvestmentLevel(budget),
      status: p.status ?? "Rascunho"
    };
  }

  const { committing, commitAll } = useWizardCommit({
    readOnly,
    needStructure,
    projectId,
    setProjectId: (id) => setProjectId(id),
    state,
    normalizeProjectForCommit,
    onSubmitProject: props.onSubmitProject,
    onClose: props.onClose
  });

  const totals = {
    milestones: state.milestones.length,
    activities: state.activities.length,
    peps: state.peps.length,
    totalPeps: state.peps.reduce((acc, x) => acc + (Number(x.amountBrl) || 0), 0)
  };

  async function goNext() {
    if (readOnly || transitioning) return;
    setTransitioning(true);
    try {
      if (step === "project") validateProjectBasics(normalizeProjectForCommit(state.project));
      if (step === "structure" && needStructure) validateStructure(state);
      if (step === "peps") validateStructure(state);

      if (step === "project") setStep(needStructure ? "structure" : "peps");
      else if (step === "structure") setStep("peps");
      else if (step === "peps") setStep("review");
    } finally {
      setTransitioning(false);
    }
  }

  function goBack() {
    if (step === "review") setStep("peps");
    else if (step === "peps") setStep(needStructure ? "structure" : "project");
    else if (step === "structure") setStep("project");
  }

  const stepLabel = (k: StepKey) => {
    if (k === "project") return "1. Projeto";
    if (k === "structure") return `2. Estrutura (${ONE_MILLION.toLocaleString("pt-BR")}+)`;
    if (k === "peps") return needStructure ? "3. PEPs" : "2. PEPs";
    return needStructure ? "4. Revisão" : "3. Revisão";
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{props.mode === "create" ? "Novo Projeto" : props.mode === "view" ? `Visualizar Projeto #${props.initial?.Id ?? ""}` : `Editar Projeto #${props.initial?.Id ?? ""}`}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{readOnly ? "Modo visualização: campos bloqueados." : "Preencha, revise e faça commit no final."}</div>
            {loadingHeader && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Carregando dados do BD…</div>}
            {errHeader && <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 4 }}>{errHeader}</div>}
          </div>
          <button className="btn" onClick={props.onClose}>Fechar</button>
        </div>

        <div style={styles.tabsRow}>
          <Tab label={stepLabel("project")} active={step === "project"} onClick={() => setStep("project")} />
          {needStructure && <Tab label={stepLabel("structure")} active={step === "structure"} onClick={() => setStep("structure")} />}
          <Tab label={stepLabel("peps")} active={step === "peps"} onClick={() => setStep("peps")} />
          <Tab label={stepLabel("review")} active={step === "review"} onClick={() => setStep("review")} />
        </div>

        <div style={styles.body}>
          {step === "project" && <ProjectStep draft={state.project} readOnly={readOnly} onChange={patchProject} />}
          {step === "structure" && needStructure && <StructureStep readOnly={readOnly} milestones={state.milestones} activities={state.activities} onChange={(next) => setState((s) => ({ ...s, ...next }))} />}
          {step === "peps" && <PepStep readOnly={readOnly} needStructure={needStructure} milestones={state.milestones} activities={state.activities} peps={state.peps} defaultYear={Number(state.project.approvalYear ?? new Date().getFullYear())} onChange={(nextPeps) => setState((s) => ({ ...s, peps: nextPeps }))} />}
          {step === "review" && <ReviewStep readOnly={readOnly} projectId={projectId} totals={totals} onBackToDraft={async () => {
            if (!projectId) return;
            if (!window.confirm("Voltar status para Rascunho?")) return;
            const p = await getProjectById(projectId);
            await backToDraft(p);
            alert("Status alterado para Rascunho.");
          }} />}
        </div>

        <div style={styles.footer}>
          <div style={{ fontSize: 12, color: "#6b7280" }}>✅ Agora: nada é salvo até o Commit final.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={goBack} disabled={step === "project"}>Voltar</button>
            {!readOnly && step !== "review" && <button className="btn primary" onClick={goNext} disabled={transitioning}>{transitioning ? "Validando..." : "Próximo"}</button>}
            {!readOnly && step === "review" && <button className="btn primary" onClick={commitAll} disabled={committing}>{committing ? "Commit..." : "Commit + Enviar p/ Aprovação"}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
