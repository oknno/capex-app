import type { CSSProperties } from "react";

import { Badge } from "../../../../components/ui/Badge";
import { Button } from "../../../../components/ui/Button";
import { Field } from "../../../../components/ui/Field";
import { Section } from "../../../../components/ui/Section";
import { uiTokens } from "../../../../components/ui/tokens";

export function Tab(props: { label: string; active: boolean; onClick: () => void }) {
  return <Button tone={props.active ? "primary" : "default"} style={styles.tab} onClick={props.onClick}>{props.label}</Button>;
}

export function SummaryBadge(props: { label: string; value: any }) {
  return <Badge text={`${props.label}: ${props.value}`} />;
}

export function SectionTitle(props: { title: string; subtitle?: string }) {
  return <Section title={props.title} subtitle={props.subtitle} />;
}

function FieldInput(props: { label: string; value: any; placeholder?: string; disabled?: boolean; onChange: (v: string) => void; inputMode?: "numeric" | "text" }) {
  return (
    <Field label={props.label}>
      <input
        value={String(props.value ?? "")}
        placeholder={props.placeholder}
        disabled={props.disabled}
        inputMode={props.inputMode}
        onChange={(e) => props.onChange(e.target.value)}
        style={styles.input}
      />
    </Field>
  );
}

export function FieldText(props: { label: string; value: any; placeholder?: string; disabled?: boolean; onChange: (v: string) => void }) {
  return <FieldInput {...props} />;
}

export function FieldNumber(props: { label: string; value: any; placeholder?: string; disabled?: boolean; onChange: (v: string) => void }) {
  return <FieldInput {...props} inputMode="numeric" />;
}

export const wizardLayoutStyles = {
  overlay: { position: "fixed", inset: 0, background: uiTokens.colors.overlay, display: "flex", alignItems: "center", justifyContent: "center", padding: uiTokens.spacing.xl, zIndex: 9999 } as CSSProperties,
  modal: { width: "min(1100px, 100%)", background: uiTokens.colors.surface, borderRadius: uiTokens.radius.lg, border: `1px solid ${uiTokens.colors.border}`, overflow: "hidden", maxHeight: "92vh", display: "grid", gridTemplateRows: "auto auto 1fr auto" } as CSSProperties,
  modalHeader: { padding: uiTokens.spacing.lg, borderBottom: `1px solid ${uiTokens.colors.border}`, display: "flex", justifyContent: "space-between", gap: uiTokens.spacing.md } as CSSProperties,
  tabsRow: { padding: 10, borderBottom: `1px solid ${uiTokens.colors.border}`, display: "flex", gap: uiTokens.spacing.sm, flexWrap: "wrap" } as CSSProperties,
  body: { overflow: "auto" } as CSSProperties,
  footer: { padding: uiTokens.spacing.lg, borderTop: `1px solid ${uiTokens.colors.border}`, display: "flex", justifyContent: "space-between", gap: uiTokens.spacing.md, alignItems: "center" } as CSSProperties,
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: uiTokens.spacing.md } as CSSProperties,
  box: { border: `1px solid ${uiTokens.colors.border}`, borderRadius: uiTokens.radius.md, overflow: "hidden" } as CSSProperties,
  boxHead: { padding: "10px 12px", fontSize: uiTokens.typography.xs, fontWeight: uiTokens.typography.labelWeight, background: uiTokens.colors.surfaceMuted, borderBottom: `1px solid ${uiTokens.colors.border}` } as CSSProperties,
  row: { padding: "10px 12px", borderBottom: `1px solid ${uiTokens.colors.borderMuted}` } as CSSProperties,
  empty: { padding: uiTokens.spacing.md, color: uiTokens.colors.textMuted } as CSSProperties,
  input: { width: "100%", padding: "9px 10px", borderRadius: uiTokens.radius.sm, border: "1px solid #d1d5db" } as CSSProperties
};

const styles = {
  tab: { borderRadius: uiTokens.radius.pill, padding: "8px 12px" },
  input: wizardLayoutStyles.input,
} as const;
