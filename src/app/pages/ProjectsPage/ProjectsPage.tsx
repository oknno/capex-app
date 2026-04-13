import { useEffect, useState } from "react";

import { getProjectById } from "../../../services/sharepoint/projectsApi";
import type { ProjectDraft, ProjectRow } from "../../../services/sharepoint/projectsApi";
import { createProject } from "../../../application/use-cases/createProject";
import { editProject } from "../../../application/use-cases/editProject";
import { sendProjectToApproval } from "../../../application/use-cases/sendToApproval";
import { moveProjectBackToDraft } from "../../../application/use-cases/backToDraft";
import { deleteDraftProjectAndRelated } from "../../../application/use-cases/deleteProject";
import { normalizeError } from "../../../application/errors/appError";
import { canBack, canDelete, canEdit, canSend, getCommandBarPolicies } from "../../../application/policies/projectActionPolicies";

import { ProjectWizardModal } from "./ProjectWizardModal";
import { Card } from "../../components/ui/Card";
import { CommandBar } from "./CommandBar";

import { useProjectsList } from "./hooks/useProjectsList";
import { ProjectsTableSection } from "./components/ProjectsTableSection";
import { ProjectSummarySection } from "./components/ProjectSummarySection";
import { projectsPageStyles as styles } from "./components/ProjectsPage.styles";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useToast } from "../../components/notifications/useToast";
import { Button } from "../../components/ui/Button";
import { exportProjectsCsv } from "./utils/exportProjectsCsv";

export function ProjectsPage(props: {
  onWantsRefreshHeader?: () => void;
  onRegisterRefresh?: (fn: () => void) => void;
  initialItems?: ProjectRow[];
  initialNextLink?: string;
  skipInitialLoad?: boolean;
}) {
  const { onRegisterRefresh, skipInitialLoad } = props;
  const list = useProjectsList(
    { searchTitle: "", status: "", unit: "", sortBy: "Id", sortDir: "desc" },
    {
      initialItems: props.initialItems,
      initialNextLink: props.initialNextLink,
      initialState: "idle"
    }
  );
  const loadFirstPage = list.loadFirstPage;
  const { notify } = useToast();
  const [wizard, setWizard] = useState<{ mode: "create" | "edit" | "view" | "duplicate"; initial?: ProjectRow } | null>(null);
  const [selectedFull, setSelectedFull] = useState<ProjectRow | null>(null);
  const [selectedFullState, setSelectedFullState] = useState<"idle" | "loading" | "error">("idle");
  const [confirmState, setConfirmState] = useState<{ title: string; message: string; onConfirm: () => Promise<void> | void; tone?: "danger" | "neutral"; confirmingText?: string } | null>(null);
  const [confirmingAction, setConfirmingAction] = useState(false);


  useEffect(() => {
    if (!skipInitialLoad) {
      void loadFirstPage();
    }
    onRegisterRefresh?.(loadFirstPage);
  }, [loadFirstPage, onRegisterRefresh, skipInitialLoad]);

  // Este efeito sincroniza seleção da lista com carregamento de detalhes remotos (SharePoint).
  useEffect(() => {
    if (!list.selectedId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    try {
      const id = await createProject(draft);
      await list.loadFirstPage();
      list.setSelectedId(id);
      notify("Projeto criado com sucesso.", "success");
      return id;
    } catch (e) {
      const appError = normalizeError(e, "Não foi possível criar o projeto. Tente novamente.");
      notify(appError.userMessage, "error");
      throw e;
    }
  }

  async function onEdit(draft: ProjectDraft): Promise<number> {
    if (!list.selected) throw new Error("Selecione um projeto.");
    try {
      await editProject(list.selected.Id, draft);
      await list.loadFirstPage();
      list.setSelectedId(list.selected.Id);
      notify("Alterações salvas.", "success");
      return list.selected.Id;
    } catch (e) {
      const appError = normalizeError(e, "Não foi possível salvar as alterações. Tente novamente.");
      notify(appError.userMessage, "error");
      throw e;
    }
  }

  function requestConfirm(config: { title: string; message: string; onConfirm: () => Promise<void> | void; tone?: "danger" | "neutral"; confirmingText?: string }) {
    setConfirmState(config);
  }

  async function onSendToApproval() {
    const selected = list.selected;
    const check = canSend(selected);
    if (!check.ok || !selected) {
      notify(check.reason ?? "Não foi possível enviar para aprovação.", "info");
      return;
    }

    requestConfirm({
      title: "Enviar para aprovação",
      message: `Enviar o projeto #${selected.Id} para Aprovação?`,
      confirmingText: "Enviando...",
      onConfirm: async () => {
        try {
          await sendProjectToApproval(selected);
          await list.loadFirstPage();
          list.setSelectedId(selected.Id);
          notify("Projeto enviado para aprovação.", "success");
        } catch (e) {
          const appError = normalizeError(e, "Erro ao enviar para aprovação.");
          notify(appError.userMessage, "error");
        }
      }
    });
  }

  async function onBackStatus() {
    const selected = list.selected;
    const check = canBack(selected);
    if (!check.ok || !selected) {
      notify(check.reason ?? "Não foi possível voltar o status para rascunho.", "info");
      return;
    }

    requestConfirm({
      title: "Voltar para rascunho",
      message: `Voltar o status do projeto #${selected.Id} para Rascunho?`,
      confirmingText: "Atualizando...",
      onConfirm: async () => {
        try {
          await moveProjectBackToDraft(selected);
          await list.loadFirstPage();
          list.setSelectedId(selected.Id);
          notify("Projeto retornou para rascunho.", "success");
        } catch (e) {
          const appError = normalizeError(e, "Erro ao voltar para rascunho.");
          notify(appError.userMessage, "error");
        }
      }
    });
  }

  async function onDelete() {
    const selected = list.selected;
    const check = canDelete(selected);
    if (!check.ok || !selected) {
      notify(check.reason ?? "Não foi possível excluir o projeto.", "error");
      return;
    }

    requestConfirm({
      title: "Excluir projeto",
      message: `Deseja realmente excluir o projeto #${selected.Id}? Esta ação também excluirá marcos, atividades e PEPs relacionados.`,
      tone: "danger",
      confirmingText: "Excluindo...",
      onConfirm: async () => {
        try {
          await deleteDraftProjectAndRelated(selected);
          list.setSelectedId(null);
          await list.loadFirstPage();
          notify("Projeto e estrutura relacionada excluídos com sucesso.", "success");
        } catch (e) {
          const appError = normalizeError(e, "Erro ao excluir projeto.");
          notify(appError.userMessage, "error");
        }
      }
    });
  }


  const commandPolicies = getCommandBarPolicies(list.selected);
  const editPolicy = canEdit(list.selected);
  const deletePolicy = canDelete(list.selected);
  const sendPolicy = canSend(list.selected);
  const backPolicy = canBack(list.selected);

  function onExport() {
    const hasExported = exportProjectsCsv(list.items);
    if (!hasExported) {
      notify("Nenhum projeto carregado para exportar.", "info");
      return;
    }
    notify("Lista de projetos exportada em CSV.", "success");
  }

  return (
    <div style={styles.pageWrap}>
      <CommandBar
        selectedId={list.selectedId}
        totalLoaded={list.items.length}
        canEdit={editPolicy.ok}
        canDelete={deletePolicy.ok}
        canSend={sendPolicy.ok}
        canBack={backPolicy.ok}
        editDisabledReason={editPolicy.reason}
        deleteDisabledReason={deletePolicy.reason}
        sendDisabledReason={sendPolicy.reason}
        backDisabledReason={backPolicy.reason}
        filters={list.filters}
        onChangeFilters={(patch) => list.setFilters((prev) => ({ ...prev, ...patch }))}
        onApply={list.loadFirstPage}
        onClear={list.clearFilters}
        onRefresh={list.loadFirstPage}
        onNew={() => setWizard({ mode: "create" })}
        onView={() => list.selected && setWizard({ mode: "view", initial: list.selected })}
        onEdit={() => {
          if (!list.selected) return;
          const check = commandPolicies.edit;
          if (!check.ok) {
            notify(check.reason ?? "Não foi possível editar o projeto.", "error");
            return;
          }
          setWizard({ mode: "edit", initial: list.selected });
        }}
        onDuplicate={() => {
          if (!list.selected) return;
          setWizard({ mode: "duplicate", initial: list.selected });
        }}
        onDelete={onDelete}
        onSendToApproval={onSendToApproval}
        onBackStatus={onBackStatus}
        onExport={onExport}
      />

      <div style={styles.grid}>
        <Card style={styles.listCard}>
          <ProjectsTableSection
            items={list.items}
            selectedId={list.selectedId}
            state={list.state}
            errorMsg={list.errorMsg}
            onSelect={list.setSelectedId}
          />
          <div style={styles.footerRow}>
            <div style={styles.helperText}>Itens carregados: <b>{list.items.length}</b></div>
            <Button onClick={list.loadMore} disabled={!list.nextLink || list.state === "loading"}>
              {list.nextLink ? (list.state === "loading" ? "Carregando..." : "Carregar mais") : "Fim"}
            </Button>
          </div>
        </Card>

        <Card style={styles.summaryCard}>
          <ProjectSummarySection
            selectedId={list.selectedId}
            selectedFull={selectedFull}
            selectedFullState={selectedFullState}
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

      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title ?? "Confirmar"}
        message={confirmState?.message ?? ""}
        tone={confirmState?.tone}
        onClose={() => setConfirmState(null)}
        confirming={confirmingAction}
        confirmingText={confirmState?.confirmingText}
        onConfirm={() => {
          if (!confirmState) return;
          setConfirmingAction(true);
          void Promise.resolve(confirmState.onConfirm()).finally(() => {
            setConfirmingAction(false);
            setConfirmState(null);
          });
        }}
      />
    </div>
  );
}
