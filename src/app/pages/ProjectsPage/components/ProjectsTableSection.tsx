import type { CSSProperties, ReactNode } from "react";

import type { ProjectRow } from "../../../../services/sharepoint/projectsApi";
import { StateMessage } from "../../../components/ui/StateMessage";
import { uiTokens } from "../../../components/ui/tokens";
import { projectFieldLabel } from "../fieldLabels";

const styles: Record<string, CSSProperties> = {
  tableWrap: { border: `1px solid ${uiTokens.colors.border}`, borderRadius: uiTokens.radius.md, overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 },
  scroller: { overflowX: "auto", overflowY: "hidden", flex: 1, minHeight: 0 },
  headerRow: { display: "grid", gridTemplateColumns: "70px 260px 260px 150px 260px", minWidth: 1000, background: uiTokens.colors.surfaceMuted, borderBottom: `1px solid ${uiTokens.colors.border}` },
  body: { overflowY: "auto", minWidth: 1000, minHeight: 0, flex: 1 },
  row: { display: "grid", gridTemplateColumns: "70px 260px 260px 150px 260px", minWidth: 1000, cursor: "pointer", borderBottom: `1px solid ${uiTokens.colors.borderMuted}` },
};

export function ProjectsTableSection(props: {
  items: ProjectRow[];
  selectedId: number | null;
  state: "idle" | "loading" | "error";
  errorMsg: string;
  onSelect: (id: number) => void;
}) {
  return (
    <>
      {props.state === "error" && <StateMessage state="error" message={`Erro: ${props.errorMsg}`} />}
      <div style={{ marginTop: 10 }} />

      <div style={styles.tableWrap}>
        <div style={styles.scroller}>
        <div style={styles.headerRow}>
          <CellHeader>ID</CellHeader>
          <CellHeader>{projectFieldLabel("Title")}</CellHeader>
          <CellHeader>Unidade</CellHeader>
          <CellHeader>Status</CellHeader>
          <CellHeader>Solicitante</CellHeader>
        </div>

        <div style={styles.body}>
          {props.items.map((project) => {
            const active = project.Id === props.selectedId;
            return (
              <div key={project.Id} onClick={() => props.onSelect(project.Id)} style={{ ...styles.row, background: active ? uiTokens.colors.accentSoft : uiTokens.colors.surface }}>
                <Cell>{project.Id}</Cell>
                <Cell title={project.Title}>{project.Title}</Cell>
                <Cell title={project.unit ?? "-"}>{project.unit ?? "-"}</Cell>
                <Cell title={project.status ?? "-"}>{project.status ?? "-"}</Cell>
                <Cell title={project.authorName ?? "-"}>{project.authorName ?? "-"}</Cell>
              </div>
            );
          })}

          {!props.items.length && props.state !== "loading" && <div style={{ padding: 12 }}><StateMessage state="empty" message="Nenhum item encontrado." /></div>}
          {props.state === "loading" && <div style={{ padding: 12 }}><StateMessage state="loading" message="Carregando lista..." /></div>}
        </div>
        </div>
      </div>
    </>
  );
}

function CellHeader({ children }: { children: ReactNode }) {
  return <div style={{ padding: "10px 10px", fontSize: 12, fontWeight: 700, color: uiTokens.colors.text }}>{children}</div>;
}

function Cell({ children, title }: { children: ReactNode; title?: string }) {
  return <div title={title} style={{ padding: "10px 10px", fontSize: 13, color: uiTokens.colors.textStrong, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{children}</div>;
}
