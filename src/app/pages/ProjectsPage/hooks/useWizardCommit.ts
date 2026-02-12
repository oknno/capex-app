import { useCallback, useRef, useState } from "react";

import { getProjectById, updateProject } from "../../../../services/sharepoint/projectsApi";
import type { ProjectDraft } from "../../../../services/sharepoint/projectsApi";
import { createMilestone, getMilestonesByProject } from "../../../../services/sharepoint/milestonesApi";
import type { MilestoneDraft } from "../../../../services/sharepoint/milestonesApi";
import { createActivity, getActivitiesByMilestone } from "../../../../services/sharepoint/activitiesApi";
import type { ActivityDraft } from "../../../../services/sharepoint/activitiesApi";
import { createPep } from "../../../../services/sharepoint/pepsApi";
import type { PepDraft } from "../../../../services/sharepoint/pepsApi";
import { sendToApproval } from "../../../../services/sharepoint/projectsWorkflow";
import type { WizardDraftState } from "../../../../domain/projects/project.validators";
import { validateProjectBasics, validateStructure } from "../../../../domain/projects/project.validators";

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
      if (!id) {
        id = await params.onSubmitProject(normalizedProject);
        params.setProjectId(id);
      } else {
        await updateProject(id, normalizedProject);
      }

      const milestoneIdMap = new Map<string, number>();
      const activityIdMap = new Map<string, number>();

      if (!params.needStructure) {
        await createMilestone({ Title: "SEM MARCOS (AUTO)", projectsIdId: id } as MilestoneDraft);
        const milestonesNow = await getMilestonesByProject(id);
        const createdMs = milestonesNow.find((m) => String(m.Title ?? "").toUpperCase().includes("SEM MARCOS"));
        if (!createdMs) throw new Error("Falha ao criar milestone técnico.");

        await createActivity({ Title: "PEP DIRETO (AUTO)", projectsIdId: id, milestonesIdId: createdMs.Id } as ActivityDraft);
        const actsNow = await getActivitiesByMilestone(id, createdMs.Id);
        const createdAc = actsNow.find((a) => String(a.Title ?? "").toUpperCase().includes("PEP DIRETO"));
        if (!createdAc) throw new Error("Falha ao criar activity técnica.");

        await Promise.all(
          params.state.peps.map((p) =>
            createPep({ Title: p.Title.trim(), year: p.year, amountBrl: Math.round(p.amountBrl), projectsIdId: id, activitiesIdId: createdAc.Id } as PepDraft),
          ),
        );
      } else {
        for (const m of params.state.milestones) {
          const draft: MilestoneDraft = { Title: m.Title.trim().toUpperCase(), projectsIdId: id };
          await createMilestone(draft);
          const msNow = await getMilestonesByProject(id);
          const created = msNow.find((x) => String(x.Title ?? "").toUpperCase() === draft.Title);
          if (!created) throw new Error(`Falha ao criar milestone: ${draft.Title}`);
          milestoneIdMap.set(m.tempId, created.Id);
        }

        for (const a of params.state.activities) {
          const milestoneId = milestoneIdMap.get(a.milestoneTempId);
          if (!milestoneId) throw new Error("Activity sem milestone válido (commit).");

          const draft: ActivityDraft = { Title: a.Title.trim().toUpperCase(), projectsIdId: id, milestonesIdId: milestoneId };
          await createActivity(draft);
          const actsNow = await getActivitiesByMilestone(id, milestoneId);
          const created = actsNow.find((x) => String(x.Title ?? "").toUpperCase() === draft.Title);
          if (!created) throw new Error(`Falha ao criar activity: ${draft.Title}`);
          activityIdMap.set(a.tempId, created.Id);
        }

        await Promise.all(
          params.state.peps.map((p) => {
            const activityId = activityIdMap.get(p.activityTempId ?? "");
            if (!activityId) throw new Error("PEP com Activity inválida (commit).");

            return createPep({
              Title: p.Title.trim(),
              year: p.year,
              amountBrl: Math.round(p.amountBrl),
              projectsIdId: id,
              activitiesIdId: activityId,
            } as PepDraft);
          }),
        );
      }

      const full = await getProjectById(id);
      await sendToApproval(full);

      alert("Commit concluído e enviado para Aprovação.");
      params.onClose();
    } catch (e: any) {
      alert(e?.message ? String(e.message) : "Erro no commit.");
    } finally {
      commitInFlightRef.current = false;
      setCommitting(false);
    }
  }, [committing, params]);

  return { committing, commitAll };
}
