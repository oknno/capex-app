import { useEffect, useState } from "react";

import { isLockedStatus, canSendToApproval, sendToApproval, canBackToDraft, backToDraft } from "../../../services/sharepoint/projectsWorkflow";
import { createProject, updateProject, getProjectById } from "../../../services/sharepoint/projectsApi";
import type { ProjectDraft, ProjectRow } from "../../../services/sharepoint/projectsApi";

import { ProjectWizardModal } from "./ProjectWizardModal";
import { Card } from "../../components/ui/Card";
import { CommandBar } from "./CommandBar";

import { useProjectsList } from "./hooks/useProjectsList";
import { useProjectTimeline } from "./hooks/useProjectTimeline";
import { ProjectsTableSection } from "./components/ProjectsTableSection";
import { ProjectSummarySection } from "./components/ProjectSummarySection";
import { projectsPageStyles as styles } from "./components/ProjectsPage.styles";

export function ProjectsPage(props: { onWantsRefreshHeader?: () => void; onRegisterRefresh?: (fn: () => void) => void }) {
  const list = useProjectsList({ searchTitle: "", status: "", unit: "", sortBy: "Id", sortDir: "desc" });
  const [wizard, setWizard] = useState<{ mode: "create" | "edit" | "view"; initial?: ProjectRow } | null>(null);
  const [selectedFull, setSelectedFull] = useState<ProjectRow | null>(null);
  const [selectedFullState, setSelectedFullState] = useState<"idle" | "loading" | "error">("idle");

  const backCheck = canBackToDraft(list.selected);
  const timeline = useProjectTimeline(list.selectedId);

  useEffect(() => {
    list.loadFirstPage();
    props.onRegisterRefresh?.(list.loadFirstPage);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!list.selectedId) {
      setSelectedFull(null);
      setSelectedFullState("idle");
      return;
    }

    const selectedId = list.selectedId;
    (async () => {
      setSelectedFullState("loading");
      try {
        setSelectedFull(await getProjectById(selectedId));
        setSelectedFullState("idle");
      } catch (e) {
        console.error(e);
        setSelectedFull(null);
        setSelectedFullState("error");
      }
    })();
  }, [list.selectedId]);

  async function onCreate(draft: ProjectDraft): Promise<number> {
    const id = await createProject(draft);
    await list.loadFirstPage();
    list.setSelectedId(id);
    return id;
  }

  async function onEdit(draft: ProjectDraft): Promise<number> {
    if (!list.selected) throw new Error("Selecione um projeto.");
    await updateProject(list.selected.Id, draft);
    await list.loadFirstPage();
    list.setSelectedId(list.selected.Id);
    return list.selected.Id;
  }

  async function onSendToApproval() {
    if (!list.selected) return;
    const check = canSendToApproval(list.selected);
    if (!check.ok) return alert(check.reason ?? "Não é possível enviar para aprovação.");
    if (!window.confirm(`Enviar o projeto #${list.selected.Id} para Aprovação?`)) return;

    try {
      await sendToApproval(list.selected);
      await list.loadFirstPage();
      list.setSelectedId(list.selected.Id);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ? String(e.message) : "Erro ao enviar para aprovação.");
    }
  }

  async function onBackStatus() {
    if (!list.selected) return;
    if (!backCheck.ok) return alert(backCheck.reason);
    if (!window.confirm(`Voltar o status do projeto #${list.selected.Id} para Rascunho?`)) return;

    await backToDraft(list.selected);
    await list.loadFirstPage();
    list.setSelectedId(list.selected.Id);
  }

  return (
    <div style={styles.pageWrap as any}>
      <CommandBar
        selectedId={list.selectedId}
        selectedStatus={list.selected?.status}
        totalLoaded={list.items.length}
        filters={list.filters}
        onChangeFilters={(patch) => list.setFilters((prev) => ({ ...prev, ...patch }))}
        onApply={list.loadFirstPage}
        onClear={list.clearFilters}
        onRefresh={list.loadFirstPage}
        onNew={() => setWizard({ mode: "create" })}
        onView={() => list.selected && setWizard({ mode: "view", initial: list.selected })}
        onEdit={() => {
          if (!list.selected) return;
          if (isLockedStatus(list.selected.status)) return alert("Projeto travado (Em Aprovação / Aprovado).");
          setWizard({ mode: "edit", initial: list.selected });
        }}
        onDelete={() => alert("Excluir já está funcionando no seu projeto — mantendo aqui como placeholder.")}
        onSendToApproval={onSendToApproval}
        onBackStatus={onBackStatus}
        onExport={() => alert("Exportar já está funcionando no seu projeto — mantendo aqui como placeholder.")}
      />

      <div style={styles.grid as any}>
        <Card style={styles.listCard as any}>
          <ProjectsTableSection
            items={list.items}
            selectedId={list.selectedId}
            state={list.state}
            errorMsg={list.errorMsg}
            onSelect={list.setSelectedId}
          />
          <div style={styles.footerRow as any}>
            <div style={styles.helperText as any}>Itens carregados: <b>{list.items.length}</b></div>
            <button className="btn" onClick={list.loadMore} disabled={!list.nextLink || list.state === "loading"}>
              {list.nextLink ? (list.state === "loading" ? "Carregando..." : "Carregar mais") : "Fim"}
            </button>
          </div>
        </Card>

        <Card style={styles.summaryCard as any}>
          <ProjectSummarySection
            selectedId={list.selectedId}
            selectedFull={selectedFull}
            selectedFullState={selectedFullState}
            onRefresh={list.loadFirstPage}
            activitiesState={timeline.activitiesState}
            milestones={timeline.milestones}
            activities={timeline.activities}
          />
        </Card>
      </div>

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
