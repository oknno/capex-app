import { useEffect, useRef, useState, type CSSProperties } from "react";

import { Badge } from "../../../../components/ui/Badge";
import { Field } from "../../../../components/ui/Field";
import { Section } from "../../../../components/ui/Section";
import { uiTokens } from "../../../../components/ui/tokens";
import { wizardLayoutStyles } from "./wizardLayoutStyles";

type TabStatus = "completed" | "current" | "available" | "blocked";
type FieldValue = string | number | null | undefined;

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

export function SummaryBadge(props: { label: string; value: FieldValue }) {
  return <Badge text={`${props.label}: ${props.value}`} />;
}

export function SectionTitle(props: { title: string; subtitle?: string }) {
  return <Section title={props.title} subtitle={props.subtitle} />;
}

function FieldInput(props: { label: string; value: FieldValue; placeholder?: string; helperText?: string; disabled?: boolean; onChange: (v: string) => void; inputMode?: "numeric" | "text"; type?: "text" | "number" | "date"; min?: string; max?: string; maxLength?: number; step?: string }) {
  const resolvedPlaceholder = props.placeholder ?? (props.type === "date" ? "dd/mm/aaaa" : props.type === "number" ? "Digite um valor" : "Digite aqui");

  return (
    <Field label={props.label}>
      <>
        <input
          value={String(props.value ?? "")}
          placeholder={resolvedPlaceholder}
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
        {props.helperText ? <small style={styles.helperText}>{props.helperText}</small> : null}
      </>
    </Field>
  );
}

export function FieldText(props: { label: string; value: FieldValue; placeholder?: string; helperText?: string; disabled?: boolean; maxLength?: number; onChange: (v: string) => void }) {
  return <FieldInput {...props} />;
}

export function FieldNumber(props: { label: string; value: FieldValue; placeholder?: string; disabled?: boolean; min?: string; max?: string; onChange: (v: string) => void }) {
  return <FieldInput {...props} inputMode="numeric" type="number" step="1" />;
}

const styles: Record<string, CSSProperties> = {
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
  helperText: {
    color: uiTokens.colors.textMuted,
    fontSize: uiTokens.typography.xs
  }
};

export function FieldDate(props: { label: string; value: FieldValue; placeholder?: string; disabled?: boolean; min?: string; max?: string; onChange: (v: string) => void }) {
  return <FieldInput {...props} type="date" placeholder={props.placeholder ?? "dd/mm/aaaa"} />;
}

export function FieldSelect(props: { label: string; value: FieldValue; disabled?: boolean; options: Array<{ value: string; label: string; description?: string }>; placeholder?: string; onChange: (v: string) => void }) {
  return (
    <Field label={props.label}>
      <select value={String(props.value ?? "")} disabled={props.disabled} onChange={(e) => props.onChange(e.target.value)} style={styles.input}>
        <option value="">{props.placeholder ?? "Selecione..."}</option>
        {props.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </Field>
  );
}

export function FieldSelectWithOptionTooltip(props: { label: string; value: FieldValue; disabled?: boolean; options: Array<{ value: string; label: string; description?: string }>; placeholder?: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [hoveredDescription, setHoveredDescription] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedLabel = props.options.find((option) => option.value === String(props.value ?? ""))?.label;

  useEffect(() => {
    if (!open) setHoveredDescription(null);
  }, [open]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <Field label={props.label}>
      <div ref={rootRef} style={{ position: "relative" }}>
        <button type="button" disabled={props.disabled} onClick={() => setOpen((v) => !v)} style={{ ...styles.input, textAlign: "left", cursor: props.disabled ? "not-allowed" : "pointer" }}>
          {selectedLabel ?? props.placeholder ?? "Selecione..."}
        </button>
        {open && !props.disabled ? (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 20, background: uiTokens.colors.surface, border: `1px solid ${uiTokens.colors.border}`, borderRadius: 8, maxHeight: 220, overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <button type="button" onMouseEnter={() => setHoveredDescription(null)} onClick={() => { props.onChange(""); setOpen(false); }} style={optionButtonStyles}>
              {props.placeholder ?? "Selecione..."}
            </button>
            {props.options.map((option) => (
              <button key={option.value} type="button" onMouseEnter={() => setHoveredDescription(option.description ?? null)} onMouseLeave={() => setHoveredDescription(null)} onClick={() => { props.onChange(option.value); setOpen(false); }} style={optionButtonStyles}>
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
        {open && hoveredDescription ? <div style={tooltipStyles}>{hoveredDescription}</div> : null}
      </div>
    </Field>
  );
}

const optionButtonStyles: CSSProperties = { width: "100%", textAlign: "left", background: "transparent", border: "none", padding: "10px 12px", cursor: "pointer" };
const tooltipStyles: CSSProperties = { position: "absolute", top: "calc(100% + 8px)", left: "102%", width: "min(420px, 90vw)", background: "#2b2f36", color: "#f5f7fa", padding: "10px 12px", borderRadius: 8, zIndex: 30, boxShadow: "0 10px 20px rgba(0,0,0,0.25)", fontSize: 12, lineHeight: 1.35 };
