import type { CSSProperties } from "react";

import { Badge } from "../../../../components/ui/Badge";
import { Field } from "../../../../components/ui/Field";
import { Section } from "../../../../components/ui/Section";
import { uiTokens } from "../../../../components/ui/tokens";

type TabStatus = "completed" | "current" | "available" | "blocked";

export function Tab(props: { label: string; indexLabel: string; status: TabStatus; onClick: () => void }) {
  const disabled = props.status === "blocked";
  const indicator = props.status === "completed" ? "✓" : props.indexLabel;

  return (
    <button
      type="button"
      style={{
        ...styles.tab,
        ...(props.status === "current" ? styles.tabCurrent : {}),
        ...(disabled ? styles.tabBlocked : {})
      }}
      onClick={props.onClick}
      disabled={disabled}
      aria-current={props.status === "current" ? "step" : undefined}
    >
      <span
        style={{
          ...styles.tabDot,
          ...(props.status === "completed" ? styles.tabDotCompleted : {}),
          ...(props.status === "current" ? styles.tabDotCurrent : {})
        }}
      >
        {indicator}
      </span>
      <span>{props.label}</span>
    </button>
  );
}

export function SummaryBadge(props: { label: string; value: any }) {
  return <Badge text={`${props.label}: ${props.value}`} />;
}

export function SectionTitle(props: { title: string; subtitle?: string }) {
  return <Section title={props.title} subtitle={props.subtitle} />;
}

function FieldInput(props: { label: string; value: any; placeholder?: string; disabled?: boolean; onChange: (v: string) => void; inputMode?: "numeric" | "text"; type?: "text" | "number" | "date"; min?: string; max?: string; maxLength?: number; step?: string }) {
  return (
    <Field label={props.label}>
      <input
        value={String(props.value ?? "")}
        placeholder={props.placeholder}
        disabled={props.disabled}
        inputMode={props.inputMode}
        type={props.type ?? "text"}
        min={props.min}
        max={props.max}
        maxLength={props.maxLength}
        step={props.step}
        onChange={(e) => props.onChange(e.target.value)}
        style={styles.input}
      />
    </Field>
  );
}

export function FieldText(props: { label: string; value: any; placeholder?: string; disabled?: boolean; maxLength?: number; onChange: (v: string) => void }) {
  return <FieldInput {...props} />;
}

export function FieldNumber(props: { label: string; value: any; placeholder?: string; disabled?: boolean; min?: string; max?: string; onChange: (v: string) => void }) {
  return <FieldInput {...props} inputMode="numeric" type="number" step="1" />;
}

export const wizardLayoutStyles = {
  overlay: { position: "fixed", inset: 0, background: uiTokens.colors.overlay, display: "flex", alignItems: "center", justifyContent: "center", padding: uiTokens.spacing.xl, zIndex: 9999 } as CSSProperties,
  modal: { width: "min(1100px, 100%)", background: uiTokens.colors.surface, borderRadius: uiTokens.radius.lg, border: `1px solid ${uiTokens.colors.border}`, overflow: "hidden", maxHeight: "92vh", display: "grid", gridTemplateRows: "auto auto 1fr auto" } as CSSProperties,
  modalHeader: { padding: uiTokens.spacing.lg, borderBottom: `1px solid ${uiTokens.colors.border}`, display: "flex", justifyContent: "space-between", gap: uiTokens.spacing.md } as CSSProperties,
  tabsRow: { padding: 10, borderBottom: `1px solid ${uiTokens.colors.border}`, display: "flex", gap: uiTokens.spacing.sm, flexWrap: "wrap" } as CSSProperties,
  body: { overflow: "auto" } as CSSProperties,
  footer: { padding: uiTokens.spacing.lg, borderTop: `1px solid ${uiTokens.colors.border}`, display: "flex", justifyContent: "space-between", gap: uiTokens.spacing.md, alignItems: "center" } as CSSProperties,
  sectionStack: { display: "grid", gap: uiTokens.spacing.lg } as CSSProperties,
  card: {
    display: "grid",
    gap: uiTokens.spacing.md,
    padding: uiTokens.spacing.lg,
    borderRadius: uiTokens.radius.md,
    border: `1px solid ${uiTokens.colors.borderMuted}`,
    background: uiTokens.colors.surfaceMuted
  } as CSSProperties,
  cardSubtle: {
    display: "grid",
    gap: uiTokens.spacing.md,
    padding: uiTokens.spacing.md,
    borderRadius: uiTokens.radius.md,
    border: `1px solid ${uiTokens.colors.borderMuted}`,
    background: uiTokens.colors.surface
  } as CSSProperties,
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: uiTokens.spacing.md } as CSSProperties,
  grid2Relaxed: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: uiTokens.spacing.lg } as CSSProperties,
  box: { border: `1px solid ${uiTokens.colors.border}`, borderRadius: uiTokens.radius.md, overflow: "hidden" } as CSSProperties,
  boxHead: { padding: "10px 12px", fontSize: uiTokens.typography.xs, fontWeight: uiTokens.typography.labelWeight, background: uiTokens.colors.surfaceMuted, borderBottom: `1px solid ${uiTokens.colors.border}` } as CSSProperties,
  row: { padding: "10px 12px", borderBottom: `1px solid ${uiTokens.colors.borderMuted}` } as CSSProperties,
  empty: { padding: uiTokens.spacing.md, color: uiTokens.colors.textMuted } as CSSProperties,
  input: { width: "100%", padding: "9px 10px", borderRadius: uiTokens.radius.sm, border: "1px solid #d1d5db" } as CSSProperties,
  textareaReadable: { width: "100%", minHeight: 80 } as CSSProperties
};

const styles = {
  tab: {
    borderRadius: uiTokens.radius.pill,
    padding: "6px 10px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: `1px solid ${uiTokens.colors.border}`,
    background: uiTokens.colors.surface,
    color: uiTokens.colors.textMuted,
    cursor: "pointer",
    fontWeight: 600
  },
  tabCurrent: {
    color: uiTokens.colors.textStrong,
    borderColor: uiTokens.colors.accent,
    background: uiTokens.colors.accentSoft
  },
  tabBlocked: {
    opacity: 0.55,
    cursor: "not-allowed"
  },
  tabDot: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    border: `1px solid ${uiTokens.colors.border}`,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    color: uiTokens.colors.textMuted,
    background: uiTokens.colors.surfaceMuted
  },
  tabDotCompleted: {
    borderColor: uiTokens.stateTones.success.fg,
    background: uiTokens.stateTones.success.fg,
    color: uiTokens.colors.surface
  },
  tabDotCurrent: {
    borderColor: uiTokens.colors.accent,
    color: uiTokens.colors.accent,
    background: uiTokens.colors.surface
  },
  input: wizardLayoutStyles.input,
} as const;


export function FieldDate(props: { label: string; value: any; disabled?: boolean; min?: string; max?: string; onChange: (v: string) => void }) {
  return <FieldInput {...props} type="date" />;
}

export function FieldSelect(props: { label: string; value: any; disabled?: boolean; options: Array<{ value: string; label: string }>; placeholder?: string; onChange: (v: string) => void }) {
  return (
    <Field label={props.label}>
      <select value={String(props.value ?? "")} disabled={props.disabled} onChange={(e) => props.onChange(e.target.value)} style={styles.input}>
        <option value="">{props.placeholder ?? "Selecione..."}</option>
        {props.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </Field>
  );
}
