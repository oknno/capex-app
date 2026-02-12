import type { CSSProperties } from "react";

type Tone = "neutral" | "info" | "success" | "danger" | "warning";

const toneMap: Record<Tone, { bg: string; fg: string; bd: string }> = {
  neutral: { bg: "#f3f4f6", fg: "#374151", bd: "#e5e7eb" },
  info:    { bg: "#eef2ff", fg: "#3730a3", bd: "#c7d2fe" },
  success: { bg: "#ecfdf5", fg: "#065f46", bd: "#a7f3d0" },
  danger:  { bg: "#fef2f2", fg: "#991b1b", bd: "#fecaca" },
  warning: { bg: "#fffbeb", fg: "#92400e", bd: "#fde68a" },
};

export function Badge(props: { text: string; tone?: Tone; style?: CSSProperties }) {
  const t = toneMap[props.tone ?? "neutral"];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        border: `1px solid ${t.bd}`,
        background: t.bg,
        color: t.fg,
        fontSize: 12,
        fontWeight: 600,
        ...props.style,
      }}
    >
      {props.text}
    </span>
  );
}
