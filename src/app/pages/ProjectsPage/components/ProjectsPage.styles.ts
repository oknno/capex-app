export const projectsPageStyles = {
  pageWrap: {
    background: "#f8fafc",
    height: "100vh",
    padding: 16,
    overflow: "hidden",
    display: "grid",
    gridTemplateRows: "auto 1fr"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1.6fr 1fr",
    gap: 12,
    marginTop: 12,
    overflow: "hidden"
  },
  listCard: { display: "flex", flexDirection: "column", overflow: "hidden" },
  footerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  helperText: { fontSize: 12, color: "#6b7280" },
  summaryCard: { overflow: "auto" },
  summaryHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }
} as const;
