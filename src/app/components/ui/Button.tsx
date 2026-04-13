import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { uiTokens } from "./tokens";

type ButtonTone = "default" | "primary";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone; children: ReactNode; style?: CSSProperties }) {
  const tone = props.tone ?? "default";
  const palette = tone === "primary"
    ? { bg: uiTokens.colors.accent, fg: uiTokens.colors.textOnAccent, bd: uiTokens.colors.accent }
    : { bg: uiTokens.colors.surface, fg: uiTokens.colors.textStrong, bd: uiTokens.colors.borderStrong };

  return (
    <button
      {...props}
      style={{
        appearance: "none",
        border: `1px solid ${palette.bd}`,
        background: palette.bg,
        color: palette.fg,
        padding: `${uiTokens.spacing.sm}px ${uiTokens.spacing.md - uiTokens.spacing.xxs}px`,
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
