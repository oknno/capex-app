import type { ReactNode } from "react";
import type { ProjectRow } from "../../../../services/sharepoint/projectsApi";

const styles = {
  errorBox: {
    padding: 10,
    borderRadius: 10,
    border: "1px solid #f5c2c7",
    background: "#f8d7da",
    color: "#842029",
    marginBottom: 10
  },
  tableWrap: { border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" },
  headerRow: { display: "grid", gridTemplateColumns: "90px 1fr 220px 160px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb" },
  body: { maxHeight: "calc(100vh - 260px)", overflowY: "auto" },
  row: { display: "grid", gridTemplateColumns: "90px 1fr 220px 160px", cursor: "pointer", borderBottom: "1px solid #f3f4f6" },
  noData: { padding: 12, color: "#6b7280" }
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
      {props.state === "error" && (
        <div style={styles.errorBox as any}>
          <b>Erro:</b> {props.errorMsg}
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>
            Dica: confirme <code>spConfig.ts</code> (siteUrl e nome da lista).
          </div>
        </div>
      )}

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
              <div key={p.Id} onClick={() => props.onSelect(p.Id)} style={{ ...styles.row, background: active ? "#eef2ff" : "#fff" } as any}>
                <Cell>{p.Id}</Cell>
                <Cell>{p.Title}</Cell>
                <Cell>{p.unit ?? "-"}</Cell>
                <Cell>{p.status ?? "-"}</Cell>
              </div>
            );
          })}

          {!props.items.length && props.state !== "loading" && <div style={styles.noData as any}>Nenhum item encontrado.</div>}
        </div>
      </div>
    </>
  );
}

function CellHeader({ children }: { children: ReactNode }) {
  return <div style={{ padding: "10px 10px", fontSize: 12, fontWeight: 700, color: "#374151" }}>{children}</div>;
}

function Cell({ children }: { children: ReactNode }) {
  return <div style={{ padding: "10px 10px", fontSize: 13, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{children}</div>;
}
