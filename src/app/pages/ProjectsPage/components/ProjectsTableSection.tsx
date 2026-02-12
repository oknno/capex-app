import type { ReactNode } from "react";
import type { ProjectRow } from "../../../../services/sharepoint/projectsApi";
import { StateMessage } from "../../../components/ui/StateMessage";
import { uiTokens } from "../../../components/ui/tokens";

const styles = {
  tableWrap: { border: `1px solid ${uiTokens.colors.border}`, borderRadius: uiTokens.radius.md, overflow: "hidden" },
  headerRow: { display: "grid", gridTemplateColumns: "90px 1fr 220px 160px", background: uiTokens.colors.surfaceMuted, borderBottom: `1px solid ${uiTokens.colors.border}` },
  body: { maxHeight: "calc(100vh - 260px)", overflowY: "auto" },
  row: { display: "grid", gridTemplateColumns: "90px 1fr 220px 160px", cursor: "pointer", borderBottom: `1px solid ${uiTokens.colors.borderMuted}` },
} as const;

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

      <div style={styles.tableWrap as any}>
        <div style={styles.headerRow as any}>
          <CellHeader>ID</CellHeader>
          <CellHeader>Title</CellHeader>
          <CellHeader>Unidade</CellHeader>
          <CellHeader>Status</CellHeader>
        </div>

        <div style={styles.body as any}>
          {props.items.map((p) => {
            const active = p.Id === props.selectedId;
            return (
              <div key={p.Id} onClick={() => props.onSelect(p.Id)} style={{ ...styles.row, background: active ? uiTokens.colors.accentSoft : uiTokens.colors.surface } as any}>
                <Cell>{p.Id}</Cell>
                <Cell>{p.Title}</Cell>
                <Cell>{p.unit ?? "-"}</Cell>
                <Cell>{p.status ?? "-"}</Cell>
              </div>
            );
          })}

          {!props.items.length && props.state !== "loading" && <div style={{ padding: 12 }}><StateMessage state="empty" message="Nenhum item encontrado." /></div>}
          {props.state === "loading" && <div style={{ padding: 12 }}><StateMessage state="loading" message="Carregando lista..." /></div>}
        </div>
      </div>
    </>
  );
}

function CellHeader({ children }: { children: ReactNode }) {
  return <div style={{ padding: "10px 10px", fontSize: 12, fontWeight: 700, color: uiTokens.colors.text }}>{children}</div>;
}

function Cell({ children }: { children: ReactNode }) {
  return <div style={{ padding: "10px 10px", fontSize: 13, color: uiTokens.colors.textStrong, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{children}</div>;
}
