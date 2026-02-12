import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { uiTokens } from "./tokens";

type ButtonTone = "default" | "primary";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone; children: ReactNode; style?: CSSProperties }) {
  const tone = props.tone ?? "default";
  const palette = tone === "primary"
    ? { bg: uiTokens.colors.accent, fg: "#fff", bd: uiTokens.colors.accent }
    : { bg: uiTokens.colors.surface, fg: uiTokens.colors.textStrong, bd: "#d1d5db" };

  return (
    <button
      {...props}
      style={{
        appearance: "none",
        border: `1px solid ${palette.bd}`,
        background: palette.bg,
        color: palette.fg,
        padding: "8px 10px",
        borderRadius: uiTokens.radius.sm,
        cursor: "pointer",
        fontSize: uiTokens.typography.sm,
        ...props.style,
      }}
    >
      {props.children}
    </button>
  );
}
