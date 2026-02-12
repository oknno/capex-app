import type { CSSProperties, ReactNode } from "react";

export function Card(props: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 12,
        ...props.style,
      }}
    >
      {props.children}
    </div>
  );
}
