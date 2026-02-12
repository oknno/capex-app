import { uiTokens } from "../../../components/ui/tokens";

export const projectsPageStyles = {
  pageWrap: {
    background: uiTokens.colors.appBackground,
    height: "100vh",
    padding: uiTokens.spacing.xl,
    overflow: "hidden",
    display: "grid",
    gridTemplateRows: "auto 1fr"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1.6fr 1fr",
    gap: uiTokens.spacing.md,
    marginTop: uiTokens.spacing.md,
    overflow: "hidden"
  },
  listCard: { display: "flex", flexDirection: "column", overflow: "hidden" },
  footerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  helperText: { fontSize: uiTokens.typography.xs, color: uiTokens.colors.textMuted },
  summaryCard: { overflow: "auto" },
} as const;
