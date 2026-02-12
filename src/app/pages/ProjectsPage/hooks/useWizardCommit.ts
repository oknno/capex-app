import { useCallback, useRef, useState } from "react";

import { getProjectById } from "../../../../services/sharepoint/projectsApi";
import type { ProjectDraft } from "../../../../services/sharepoint/projectsApi";
import { CommitProjectStructureError, commitProjectStructure } from "../../../../services/sharepoint/commitProjectStructure";
import { sendToApproval } from "../../../../services/sharepoint/projectsWorkflow";
import type { WizardDraftState } from "../../../../domain/projects/project.validators";
import { validateProjectBasics, validateStructure } from "../../../../domain/projects/project.validators";

function toErrorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Erro desconhecido";
}

function formatCommitError(error: CommitProjectStructureError): string {
  const rollbackDetails =
    error.rollback.failures.length === 0
      ? "Nenhuma falha durante rollback."
      : error.rollback.failures.map((failure) => `- ${failure.entity} #${failure.id}: ${failure.reason}`).join("\n");

  return [
    `${error.message}`,
    `Falha principal: ${toErrorText(error.causeError)}`,
    `Rollback: ${error.rollback.status} (${error.rollback.failures.length}/${error.rollback.attempts} falhas).`,
    rollbackDetails,
  ].join("\n");
}

export function useWizardCommit(params: {
  readOnly: boolean;
  needStructure: boolean;
  projectId: number | null;
  setProjectId: (id: number) => void;
  state: WizardDraftState;
  normalizeProjectForCommit: (draft: ProjectDraft) => ProjectDraft;
  onSubmitProject: (draft: ProjectDraft) => Promise<number>;
  onClose: () => void;
}) {
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

      if (!window.confirm("Confirmar COMMIT? Isso vai gravar projeto + estrutura + PEPs no SharePoint e enviar para Aprovação.")) return;

      let id = params.projectId;
      const commitResult = await commitProjectStructure({
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

      // Passo explícito: transição de status após persistir estrutura.
      const full = await getProjectById(id);
      await sendToApproval(full);

      alert("Commit concluído e enviado para Aprovação.");
      params.onClose();
    } catch (error: unknown) {
      if (error instanceof CommitProjectStructureError) {
        alert(formatCommitError(error));
      } else {
        alert(toErrorText(error));
      }
    } finally {
      commitInFlightRef.current = false;
      setCommitting(false);
    }
  }, [committing, params]);

  return { committing, commitAll };
}
