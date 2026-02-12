import type { CSSProperties } from "react";

export function Tab(props: { label: string; active: boolean; onClick: () => void }) {
  return <button className={`btn ${props.active ? "primary" : ""}`} style={styles.tab} onClick={props.onClick}>{props.label}</button>;
}

export function SummaryBadge(props: { label: string; value: any }) {
  return <div style={styles.badge}>{props.label}: <b>{props.value}</b></div>;
}

export function SectionTitle(props: { title: string; subtitle?: string }) {
  return <div><div style={styles.title}>{props.title}</div>{props.subtitle && <div style={styles.subtitle}>{props.subtitle}</div>}</div>;
}

export function FieldText(props: { label: string; value: any; placeholder?: string; disabled?: boolean; onChange: (v: string) => void }) {
  return <div style={styles.field}><div style={styles.fieldLabel}>{props.label}</div><input value={props.value ?? ""} placeholder={props.placeholder} disabled={props.disabled} onChange={(e) => props.onChange(e.target.value)} style={styles.input} /></div>;
}

export function FieldNumber(props: { label: string; value: any; placeholder?: string; disabled?: boolean; onChange: (v: string) => void }) {
  return <div style={styles.field}><div style={styles.fieldLabel}>{props.label}</div><input value={String(props.value ?? "")} placeholder={props.placeholder} disabled={props.disabled} inputMode="numeric" onChange={(e) => props.onChange(e.target.value)} style={styles.input} /></div>;
}

export const wizardLayoutStyles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(17,24,39,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 9999 } as CSSProperties,
  modal: { width: "min(1100px, 100%)", background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden", maxHeight: "92vh", display: "grid", gridTemplateRows: "auto auto 1fr auto" } as CSSProperties,
  modalHeader: { padding: 14, borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", gap: 12 } as CSSProperties,
  tabsRow: { padding: 10, borderBottom: "1px solid #e5e7eb", display: "flex", gap: 8, flexWrap: "wrap" } as CSSProperties,
  body: { overflow: "auto" } as CSSProperties,
  footer: { padding: 14, borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" } as CSSProperties,
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } as CSSProperties,
  box: { border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" } as CSSProperties,
  boxHead: { padding: "10px 12px", fontSize: 12, fontWeight: 700, background: "#f9fafb", borderBottom: "1px solid #e5e7eb" } as CSSProperties,
  row: { padding: "10px 12px", borderBottom: "1px solid #f3f4f6" } as CSSProperties,
  empty: { padding: 12, color: "#6b7280" } as CSSProperties,
  input: { width: "100%", padding: "9px 10px", borderRadius: 10, border: "1px solid #d1d5db" } as CSSProperties
};

const styles = {
  tab: { borderRadius: 999, padding: "8px 12px" },
  badge: { border: "1px solid #e5e7eb", borderRadius: 999, padding: "6px 10px", background: "#f9fafb", fontSize: 12 },
  title: { fontWeight: 800, color: "#111827" },
  subtitle: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  field: { display: "grid", gap: 6 },
  fieldLabel: { fontSize: 12, color: "#6b7280" },
  input: wizardLayoutStyles.input
} as const;
