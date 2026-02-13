import { useCallback, useEffect, useMemo, useState } from "react";

import { getProjectById } from "../../../services/sharepoint/projectsApi";
import type { ProjectDraft, ProjectRow } from "../../../services/sharepoint/projectsApi";

import { getMilestonesByProject } from "../../../services/sharepoint/milestonesApi";

import { getActivitiesBatchByProject } from "../../../services/sharepoint/activitiesApi";

import { getPepsBatchByProject } from "../../../services/sharepoint/pepsApi";

import {
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
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useToast } from "../../components/notifications/useToast";
import { Button } from "../../components/ui/Button";
import { StateMessage } from "../../components/ui/StateMessage";
import { uiTokens } from "../../components/ui/tokens";
import { moveProjectBackToDraft } from "../../../application/use-cases/backToDraft";
import { normalizeError } from "../../../application/errors/appError";

type StepKey = "project" | "execution" | "review";
type PendingItem = { id: string; section: Exclude<StepKey, "review">; message: string };

export function ProjectWizardModal(props: {
  mode: "create" | "edit" | "view";
  initial?: ProjectRow;
  onClose: () => void;
  onSubmitProject: (draft: ProjectDraft) => Promise<number>;
}) {
  const readOnly = props.mode === "view";
  const { notify } = useToast();
  const [step, setStep] = useState<StepKey>("project");
  const [projectId, setProjectId] = useState<number | null>(props.initial?.Id ?? null);
  const [loadingHeader, setLoadingHeader] = useState(false);
  const [errHeader, setErrHeader] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const [confirmState, setConfirmState] = useState<{ message: string; title: string; resolve: (ok: boolean) => void } | null>(null);

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
      kpiCurrent: props.initial?.kpiCurrent ?? "0",
      kpiExpected: props.initial?.kpiExpected ?? "0",
      roce: props.initial?.roce,
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
  const effectivePeps = useMemo(() => {
    if (!needStructure) return state.peps;
    const defaultYear = Number(state.project.approvalYear ?? new Date().getFullYear());
    return state.activities
      .filter((activity) => Boolean(activity.pepElement) && Number(activity.amountBrl ?? 0) > 0)
      .map((activity) => ({
        tempId: `auto_${activity.tempId}`,
        Title: String(activity.pepElement ?? "").trim(),
        year: defaultYear,
        amountBrl: Number(activity.amountBrl ?? 0),
        activityTempId: activity.tempId
      }));
  }, [needStructure, state.activities, state.peps, state.project.approvalYear]);

  const draftState = useMemo(() => ({ ...state, peps: effectivePeps }), [effectivePeps, state]);

  useEffect(() => {
    if (!props.initial?.Id || props.mode === "create") return;

    (async () => {
      setLoadingHeader(true);
      setErrHeader("");
      try {
        const full = await getProjectById(props.initial!.Id);
        setProjectId(full.Id);
        const { Id: _ignoredId, ...fullProjectDraft } = full;
        setState((prev) => ({ ...prev, project: { ...prev.project, ...fullProjectDraft } }));

        const loadStartedAt = performance.now();
        const [milestones, activities, peps] = await Promise.all([
          getMilestonesByProject(full.Id),
          getActivitiesBatchByProject(full.Id, { pageSize: 500, maxPages: 20 }),
          getPepsBatchByProject(full.Id, { pageSize: 500, maxPages: 20 })
        ]);

        const milestoneMap = new Map<number, ActivityDraftLocal[]>();
        const activityMap = new Map<number, PepDraftLocal[]>();

        const msLocal: MilestoneDraftLocal[] = milestones.map((m) => ({ tempId: `ms_${m.Id}`, Title: String(m.Title ?? "").toUpperCase() }));

        for (const a of activities) {
          const activity: ActivityDraftLocal = {
            tempId: `ac_${a.Id}`,
            Title: String(a.Title ?? "").toUpperCase(),
            milestoneTempId: `ms_${a.milestonesIdId}`,
            startDate: a.startDate ? String(a.startDate).slice(0, 10) : undefined,
            endDate: a.endDate ? String(a.endDate).slice(0, 10) : undefined,
            supplier: a.supplier ? String(a.supplier) : undefined,
            activityDescription: a.activityDescription ? String(a.activityDescription) : undefined,
            amountBrl: undefined,
            pepElement: undefined
          };
          const key = Number(a.milestonesIdId ?? -1);
          const group = milestoneMap.get(key) ?? [];
          group.push(activity);
          milestoneMap.set(key, group);
        }

        for (const p of peps) {
          const amount = typeof p.amountBrl === "number" ? p.amountBrl : Number(p.amountBrl);
          const pep: PepDraftLocal = {
            tempId: `pp_${p.Id}`,
            Title: String(p.Title ?? ""),
            year: Number(p.year ?? new Date().getFullYear()),
            amountBrl: Math.round(Number.isFinite(amount) ? amount : 0),
            activityTempId: `ac_${p.activitiesIdId}`
          };
          const key = Number(p.activitiesIdId ?? -1);
          const group = activityMap.get(key) ?? [];
          group.push(pep);
          activityMap.set(key, group);
        }

        const actsLocal: ActivityDraftLocal[] = milestones.flatMap((m) => (milestoneMap.get(m.Id) ?? []).map((activity) => {
          const activityId = Number(activity.tempId.replace("ac_", ""));
          const linkedPeps = activityMap.get(activityId) ?? [];
          const firstPep = linkedPeps[0];
          return {
            ...activity,
            amountBrl: firstPep ? Number(firstPep.amountBrl) : activity.amountBrl,
            pepElement: firstPep?.Title ?? activity.pepElement
          };
        }));
        const pepsLocal: PepDraftLocal[] = actsLocal.flatMap((a) => {
          const activityId = Number(a.tempId.replace("ac_", ""));
          return activityMap.get(activityId) ?? [];
        });

        const loadFinishedAt = performance.now();
        const estimatedSequentialRoundTrips = 2 + milestones.length + activities.length;
        const optimizedRoundTrips = 3;
        console.info("[ProjectWizardModal] Carregamento de estrutura concluído", {
          projectId: full.Id,
          totalMilestones: milestones.length,
          totalActivities: activities.length,
          totalPeps: peps.length,
          durationMs: Math.round(loadFinishedAt - loadStartedAt),
          roundTripsBefore: estimatedSequentialRoundTrips,
          roundTripsAfter: optimizedRoundTrips,
          milestoneMapSize: milestoneMap.size,
          activityMapSize: activityMap.size
        });

        setState((prev) => ({ ...prev, milestones: msLocal, activities: actsLocal, peps: pepsLocal }));
      } catch (e: unknown) {
        const appError = normalizeError(e, "Erro ao carregar projeto do SharePoint.");
        setErrHeader(appError.userMessage);
      } finally {
        setLoadingHeader(false);
      }
    })();
  }, [props.mode, props.initial?.Id]);

  function patchProject(patch: Partial<ProjectDraft>) {
    setState((s) => ({ ...s, project: { ...s.project, ...patch } }));
  }

  const normalizeProjectForCommit = useCallback((p: ProjectDraft): ProjectDraft => {
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
  }, []);

  const askConfirm = (message: string) =>
    new Promise<boolean>((resolve) => {
      setConfirmState({ title: "Confirmação", message, resolve });
    });

  const { committing, commitAll } = useWizardCommit({
    readOnly,
    needStructure,
    projectId,
    setProjectId: (id) => setProjectId(id),
    state: draftState,
    normalizeProjectForCommit,
    onSubmitProject: props.onSubmitProject,
    onClose: props.onClose,
    askConfirm,
    notify
  });


  const stepOrder = useMemo<StepKey[]>(() => ["project", "execution", "review"], []);

  const projectRequiredFields = useMemo(
    () => [
      { key: "Title", label: "Título", filled: String(state.project.Title ?? "").trim().length > 0 },
      { key: "approvalYear", label: "Ano de aprovação", filled: Boolean(state.project.approvalYear) },
      { key: "budgetBrl", label: "Orçamento", filled: Number(state.project.budgetBrl ?? 0) > 0 },
      { key: "startDate", label: "Data de início", filled: Boolean(state.project.startDate) },
      { key: "endDate", label: "Data de término", filled: Boolean(state.project.endDate) },
      { key: "projectLeader", label: "Líder do projeto", filled: String(state.project.projectLeader ?? "").trim().length > 0 },
      { key: "projectUser", label: "Usuário do projeto", filled: String(state.project.projectUser ?? "").trim().length > 0 },
      { key: "businessNeed", label: "Necessidade de negócio", filled: String(state.project.businessNeed ?? "").trim().length > 0 },
      { key: "proposedSolution", label: "Solução proposta", filled: String(state.project.proposedSolution ?? "").trim().length > 0 },
      { key: "investmentType", label: "Tipo de investimento", filled: String(state.project.investmentType ?? "").trim().length > 0 }
    ],
    [state.project]
  );


  const pendingItems = useMemo<PendingItem[]>(() => {
    const pendings: PendingItem[] = [];

    try {
      validateProjectBasics(normalizeProjectForCommit(state.project));
    } catch (error: unknown) {
      pendings.push({
        id: "project-validation",
        section: "project",
        message: error instanceof Error && error.message ? error.message : "Existem campos pendentes em Projeto."
      });
    }

    const missingProjectFields = projectRequiredFields.filter((field) => !field.filled);
    if (missingProjectFields.length > 0) {
      pendings.push({
        id: "project-required-fields",
        section: "project",
        message: `Campos essenciais não preenchidos: ${missingProjectFields.map((field) => field.label).join(", ")}.`
      });
    }

    try {
      validateStructure(draftState);
    } catch (error: unknown) {
      const message = error instanceof Error && error.message ? error.message : "Existem pendências em Estrutura/PEPs.";
      pendings.push({ id: "structure-validation", section: "execution", message });
    }

    if (effectivePeps.length === 0) {
      pendings.push({ id: "pep-empty", section: "execution", message: "Cadastre ao menos 1 PEP para avançar." });
    }

    if (needStructure) {
      if (state.milestones.length === 0) pendings.push({ id: "structure-milestone", section: "execution", message: "Inclua ao menos 1 milestone." });
      if (state.activities.length === 0) pendings.push({ id: "structure-activity", section: "execution", message: "Inclua ao menos 1 activity." });
    }

    return pendings;
  }, [draftState, effectivePeps.length, needStructure, normalizeProjectForCommit, projectRequiredFields, state.activities.length, state.milestones.length, state.project]);


  const currentStepIndex = stepOrder.indexOf(step);

  function validateCurrentStep(currentStep: StepKey) {
    if (currentStep === "project") validateProjectBasics(normalizeProjectForCommit(state.project));
    if (currentStep === "execution") validateStructure(draftState);
  }

  async function tryStepChange(nextStep: StepKey, trigger: "tab" | "button") {
    if (readOnly || transitioning || nextStep === step) return;

    const nextIndex = stepOrder.indexOf(nextStep);
    if (nextIndex < 0) return;

    const canNavigateBack = nextIndex < currentStepIndex;
    const canNavigateForward = nextIndex === currentStepIndex + 1;
    if (!canNavigateBack && !canNavigateForward) return;

    if (canNavigateBack) {
      setStep(nextStep);
      return;
    }

    setTransitioning(true);
    try {
      validateCurrentStep(step);
      setStep(nextStep);
    } catch (e: unknown) {
      const message = e instanceof Error && e.message ? e.message : "Há pendências nesta etapa.";
      const context = trigger === "tab" ? "Corrija as pendências antes de avançar pela barra de etapas." : "Corrija as pendências antes de avançar.";
      notify(`${message} ${context}`, "error");
    } finally {
      setTransitioning(false);
    }
  }

  async function goNext() {
    const nextStep = stepOrder[currentStepIndex + 1];
    if (!nextStep) return;
    await tryStepChange(nextStep, "button");
  }

  function goBack() {
    const previousStep = stepOrder[currentStepIndex - 1];
    if (!previousStep) return;
    setStep(previousStep);
  }

  const stepLabel = (k: StepKey) => {
    if (k === "project") return "Toda a informação do projeto";
    if (k === "execution") return "PEPs acima ou abaixo de 1000000";
    return "Resumo para validar";
  };

  const footerAlert = useMemo(() => {
    if (readOnly) return { state: "empty" as const, message: "Visualização apenas." };
    if (step !== "review") return { state: "empty" as const, message: "Rascunho não enviado ainda." };
    if (pendingItems.length > 0) return { state: "error" as const, message: "Revise pendências antes de enviar." };
    return { state: "success" as const, message: "Pronto para enviar para aprovação." };
  }, [pendingItems.length, readOnly, step]);

  const nextCtaLabel = useMemo(() => {
    const nextStep = stepOrder[currentStepIndex + 1];
    if (!nextStep) return "Continuar";
    if (nextStep === "execution") return "Avançar para PEPs / KEY Projects";
    return "Revisar e enviar para aprovação";
  }, [currentStepIndex, stepOrder]);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: uiTokens.colors.textStrong }}>{props.mode === "create" ? "Novo Projeto" : props.mode === "view" ? `Visualizar Projeto #${props.initial?.Id ?? ""}` : `Editar Projeto #${props.initial?.Id ?? ""}`}</div>
            <div style={{ fontSize: 12, color: uiTokens.colors.textMuted, marginTop: 2 }}>{readOnly ? "Modo visualização: campos bloqueados." : "Preencha, revise e faça commit no final."}</div>
            {loadingHeader && <div style={{ marginTop: 4 }}><StateMessage state="loading" message="Carregando dados do BD…" /></div>}
            {errHeader && <div style={{ marginTop: 4 }}><StateMessage state="error" message={errHeader} /></div>}
          </div>
          <Button onClick={props.onClose}>Fechar</Button>
        </div>

        <div style={styles.tabsRow}>
          {stepOrder.map((stepKey, index) => {
            const isCurrent = stepKey === step;
            const status = isCurrent ? "current" : index < currentStepIndex ? "completed" : index === currentStepIndex + 1 ? "available" : "blocked";
            return (
              <Tab
                key={stepKey}
                label={stepLabel(stepKey)}
                indexLabel={String(index + 1)}
                status={status}
                onClick={() => {
                  void tryStepChange(stepKey, "tab");
                }}
              />
            );
          })}
          {!readOnly && <span style={{ marginLeft: 8, fontSize: 12, color: uiTokens.colors.textMuted }}>Dica: use principalmente os botões Próximo/Voltar.</span>}
        </div>


        <div style={styles.body}>
          {step === "project" && <ProjectStep draft={state.project} readOnly={readOnly} onChange={patchProject} />}
          {step === "execution" && (
            <div style={{ display: "grid", gap: 12 }}>
              {needStructure && <StructureStep readOnly={readOnly} projectStartDate={state.project.startDate} projectEndDate={state.project.endDate} milestones={state.milestones} activities={state.activities} onValidationError={(message) => notify(message, "error")} onChange={(next) => setState((s) => ({ ...s, ...next }))} />}
              {!needStructure && <PepStep readOnly={readOnly} needStructure={needStructure} milestones={state.milestones} activities={state.activities} peps={state.peps} defaultYear={Number(state.project.approvalYear ?? new Date().getFullYear())} onValidationError={(message) => notify(message, "error")} onChange={(nextPeps) => setState((s) => ({ ...s, peps: nextPeps }))} />}
            </div>
          )}
          {step === "review" && (
            <>
              {pendingItems.length > 0 && (
                <div style={{ margin: "14px 16px 0", border: `1px solid ${uiTokens.colors.border}`, borderRadius: 8, padding: 12, background: uiTokens.colors.surfaceMuted }}>
                  <div style={{ fontWeight: 700, color: uiTokens.colors.textStrong, marginBottom: 8 }}>Pendências para envio</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {pendingItems.map((pending) => (
                      <div key={pending.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, color: uiTokens.colors.textStrong }}>{pending.message}</span>
                        <Button onClick={() => {
                          void tryStepChange(pending.section, "tab");
                        }}>
                          Ir para seção
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <ReviewStep readOnly={readOnly} projectId={projectId} state={draftState} needStructure={needStructure} onBackToDraft={async () => {
                if (!projectId) return;
                const confirmed = await askConfirm("Voltar status para Rascunho?");
                if (!confirmed) return;
                try {
                  const p = await getProjectById(projectId);
                  await moveProjectBackToDraft(p);
                  notify("Status alterado para Rascunho.", "success");
                } catch (e: unknown) {
                  const appError = normalizeError(e, "Não foi possível voltar para rascunho.");
                  notify(appError.technicalDetails ? `${appError.userMessage} (${appError.technicalDetails})` : appError.userMessage, "error");
                }
              }} />
            </>
          )}
        </div>

        <div style={styles.footer}>
          <StateMessage state={footerAlert.state} message={footerAlert.message} />
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={goBack} disabled={step === "project"}>Voltar</Button>
            {!readOnly && step !== "review" && <Button tone="primary" onClick={goNext} disabled={transitioning}>{transitioning ? "Validando..." : nextCtaLabel}</Button>}
            {!readOnly && step === "review" && <Button tone="primary" onClick={commitAll} disabled={committing}>{committing ? "Enviando..." : "Confirmar envio para aprovação"}</Button>}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title ?? "Confirmar"}
        message={confirmState?.message ?? ""}
        onClose={() => {
          confirmState?.resolve(false);
          setConfirmState(null);
        }}
        onConfirm={() => {
          confirmState?.resolve(true);
          setConfirmState(null);
        }}
      />
    </div>
  );
}
