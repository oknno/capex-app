import { useCallback, useRef, useState } from "react";

import { getProjectById } from "../../../../services/sharepoint/projectsApi";
import type { ProjectDraft } from "../../../../services/sharepoint/projectsApi";
import { CommitProjectStructureError, commitProjectStructure } from "../../../../services/sharepoint/commitProjectStructure";
import { sendProjectToApproval } from "../../../../application/use-cases/sendToApproval";
import type { WizardDraftState } from "../../../../domain/projects/project.validators";
import { validateProjectBasics, validateStructure } from "../../../../domain/projects/project.validators";
import { normalizeError } from "../../../../application/errors/appError";

function formatCommitError(error: CommitProjectStructureError): string {
  const rollbackDetails =
    error.rollback.failures.length === 0
      ? "Nenhuma falha durante rollback."
      : error.rollback.failures.map((failure) => `- ${failure.entity} #${failure.id}: ${failure.reason}`).join("\n");

  return [
    `${error.message}`,
    `Falha principal: ${error.causeError instanceof Error ? error.causeError.message : "Erro desconhecido"}`,
    `Rollback: ${error.rollback.status} (${error.rollback.failures.length}/${error.rollback.attempts} falhas).`,
    rollbackDetails,
  ].join("\n");
}

type UseWizardCommitDeps = {
  getProjectById: typeof getProjectById;
  commitProjectStructure: typeof commitProjectStructure;
  sendProjectToApproval: typeof sendProjectToApproval;
};

export function useWizardCommit(params: {
  readOnly: boolean;
  needStructure: boolean;
  projectId: number | null;
  setProjectId: (id: number) => void;
  state: WizardDraftState;
  normalizeProjectForCommit: (draft: ProjectDraft) => ProjectDraft;
  onSubmitProject: (draft: ProjectDraft) => Promise<number>;
  onClose: () => void;
  askConfirm: (message: string) => Promise<boolean>;
  notify: (message: string, tone?: "success" | "error" | "info") => void;
}, deps: UseWizardCommitDeps = { getProjectById, commitProjectStructure, sendProjectToApproval }) {
  const [committing, setCommitting] = useState(false);
  const commitInFlightRef = useRef(false);

  const commitAll = useCallback(async () => {
    if (params.readOnly || committing || commitInFlightRef.current) return;

    commitInFlightRef.current = true;
    setCommitting(true);
    try {
      const normalizedProject = params.normalizeProjectForCommit(params.state.project);
      validateProjectBasics(normalizedProject);
      validateStructure({ ...params.state, project: normalizedProject });

      const structureSummary = params.needStructure
        ? `${params.state.milestones.length} marcos e ${params.state.activities.length} atividades`
        : "não obrigatória para este projeto";
      const confirmationMessage = [
        "Confirma o envio final deste projeto?",
        `• Status após envio: Em Aprovação`,
        `• Estrutura: ${structureSummary}`,
        `• PEPs: ${params.state.peps.length} registro(s) serão persistidos`,
        "• Envio: projeto, estrutura e PEPs serão gravados no SharePoint e encaminhados para Aprovação"
      ].join("\n");

      const confirmed = await params.askConfirm(confirmationMessage);
      if (!confirmed) return;

      let id = params.projectId;
      const commitResult = await deps.commitProjectStructure({
        projectId: id,
        normalizedProject,
        needStructure: params.needStructure,
        milestones: params.state.milestones,
        activities: params.state.activities,
        peps: params.state.peps,
        createProject: params.onSubmitProject,
      });

      id = commitResult.projectId;
      params.setProjectId(id);

      const full = await deps.getProjectById(id);
      await deps.sendProjectToApproval(full);

      params.notify("Commit concluído e enviado para Aprovação.", "success");
      params.onClose();
    } catch (error: unknown) {
      if (error instanceof CommitProjectStructureError) {
        params.notify(formatCommitError(error), "error");
      } else {
        const appError = normalizeError(error, "Não foi possível concluir o commit.");
        params.notify(appError.technicalDetails ? `${appError.userMessage} (${appError.technicalDetails})` : appError.userMessage, "error");
      }
    } finally {
      commitInFlightRef.current = false;
      setCommitting(false);
    }
  }, [committing, deps, params]);

  return { committing, commitAll };
}
