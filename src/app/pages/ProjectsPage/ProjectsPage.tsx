import { useEffect, useState } from "react";

import { isLockedStatus } from "../../../services/sharepoint/projectsWorkflow";
import { getProjectById } from "../../../services/sharepoint/projectsApi";
import type { ProjectDraft, ProjectRow } from "../../../services/sharepoint/projectsApi";
import { createProject } from "../../../application/use-cases/createProject";
import { editProject } from "../../../application/use-cases/editProject";
import { sendProjectToApproval } from "../../../application/use-cases/sendToApproval";
import { moveProjectBackToDraft } from "../../../application/use-cases/backToDraft";
import { canDeleteProject, deleteDraftProjectAndRelated } from "../../../application/use-cases/deleteProject";
import { normalizeError } from "../../../application/errors/appError";

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

const PROJECTS_EXPORT_COLUMNS: Array<{ header: string; getValue: (project: ProjectRow) => string | number | undefined }> = [
  { header: "ID", getValue: (project) => project.Id },
  { header: "Código SAP", getValue: (project) => project.sourceProjectCode },
  { header: "Projeto", getValue: (project) => project.Title },
  { header: "budgetBrl", getValue: (project) => project.budgetBrl },
  { header: "Unidade", getValue: (project) => project.unit },
  { header: "Status", getValue: (project) => project.status }
];

function csvEscape(value: string | number | undefined): string {
  if (value == null) return "";
  const normalized = String(value).replace(/\r?\n|\r/g, " ").trim();
  return `"${normalized.replace(/"/g, '""')}"`;
}

function exportProjectsCsv(items: ProjectRow[]): boolean {
  if (!items.length) return false;

  const lines = [
    PROJECTS_EXPORT_COLUMNS.map((column) => csvEscape(column.header)).join(";"),
    ...items.map((project) =>
      PROJECTS_EXPORT_COLUMNS.map((column) => csvEscape(column.getValue(project))).join(";")
    )
  ];

  const csv = `\ufeff${lines.join("\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateSuffix = new Date().toISOString().slice(0, 10);

  link.href = href;
  link.download = `projetos-${dateSuffix}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
  return true;
}

export function ProjectsPage(props: { onWantsRefreshHeader?: () => void; onRegisterRefresh?: (fn: () => void) => void }) {
  const list = useProjectsList({ searchTitle: "", status: "", unit: "", sortBy: "Id", sortDir: "desc" });
  const { notify } = useToast();
  const [wizard, setWizard] = useState<{ mode: "create" | "edit" | "view"; initial?: ProjectRow } | null>(null);
  const [selectedFull, setSelectedFull] = useState<ProjectRow | null>(null);
  const [selectedFullState, setSelectedFullState] = useState<"idle" | "loading" | "error">("idle");
  const [confirmState, setConfirmState] = useState<{ title: string; message: string; onConfirm: () => void; tone?: "danger" | "neutral" } | null>(null);


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
    notify("Projeto criado com sucesso.", "success");
    return id;
  }

  async function onEdit(draft: ProjectDraft): Promise<number> {
    if (!list.selected) throw new Error("Selecione um projeto.");
    await editProject(list.selected.Id, draft);
    await list.loadFirstPage();
    list.setSelectedId(list.selected.Id);
    notify("Projeto atualizado com sucesso.", "success");
    return list.selected.Id;
  }

  function requestConfirm(config: { title: string; message: string; onConfirm: () => void; tone?: "danger" | "neutral" }) {
    setConfirmState(config);
  }

  async function onSendToApproval() {
    const selected = list.selected;
    if (!selected) return;

    requestConfirm({
      title: "Enviar para aprovação",
      message: `Enviar o projeto #${selected.Id} para Aprovação?`,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await sendProjectToApproval(selected);
          await list.loadFirstPage();
          list.setSelectedId(selected.Id);
          notify("Projeto enviado para aprovação.", "success");
        } catch (e) {
          const appError = normalizeError(e, "Erro ao enviar para aprovação.");
          notify(appError.technicalDetails ? `${appError.userMessage} (${appError.technicalDetails})` : appError.userMessage, "error");
        }
      }
    });
  }

  async function onBackStatus() {
    const selected = list.selected;
    if (!selected) return;

    requestConfirm({
      title: "Voltar para rascunho",
      message: `Voltar o status do projeto #${selected.Id} para Rascunho?`,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await moveProjectBackToDraft(selected);
          await list.loadFirstPage();
          list.setSelectedId(selected.Id);
          notify("Projeto retornou para rascunho.", "success");
        } catch (e) {
          const appError = normalizeError(e, "Erro ao voltar para rascunho.");
          notify(appError.technicalDetails ? `${appError.userMessage} (${appError.technicalDetails})` : appError.userMessage, "error");
        }
      }
    });
  }

  async function onDelete() {
    const selected = list.selected;
    const check = canDeleteProject(selected);
    if (!check.ok || !selected) {
      notify(check.reason ?? "Não foi possível excluir o projeto.", "info");
      return;
    }

    requestConfirm({
      title: "Excluir projeto",
      message: `Deseja realmente excluir o projeto #${selected.Id}? Esta ação também excluirá marcos, atividades e PEPs relacionados.`,
      tone: "danger",
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await deleteDraftProjectAndRelated(selected);
          list.setSelectedId(null);
          await list.loadFirstPage();
          notify("Projeto e estrutura relacionada excluídos com sucesso.", "success");
        } catch (e) {
          const appError = normalizeError(e, "Erro ao excluir projeto.");
          notify(appError.technicalDetails ? `${appError.userMessage} (${appError.technicalDetails})` : appError.userMessage, "error");
        }
      }
    });
  }

  function onExport() {
    const hasExported = exportProjectsCsv(list.items);
    if (!hasExported) {
      notify("Nenhum projeto carregado para exportar.", "info");
      return;
    }
    notify("Lista de projetos exportada em CSV.", "success");
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
          if (isLockedStatus(list.selected.status)) {
            notify("Projeto travado (Em Aprovação / Aprovado).", "info");
            return;
          }
          setWizard({ mode: "edit", initial: list.selected });
        }}
        onDelete={onDelete}
        onSendToApproval={onSendToApproval}
        onBackStatus={onBackStatus}
        onExport={onExport}
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
            <Button onClick={list.loadMore} disabled={!list.nextLink || list.state === "loading"}>
              {list.nextLink ? (list.state === "loading" ? "Carregando..." : "Carregar mais") : "Fim"}
            </Button>
          </div>
        </Card>

        <Card style={styles.summaryCard as any}>
          <ProjectSummarySection
            selectedId={list.selectedId}
            selectedFull={selectedFull}
            selectedFullState={selectedFullState}
            onRefresh={list.loadFirstPage}
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
        onConfirm={() => confirmState?.onConfirm()}
      />
    </div>
  );
}
