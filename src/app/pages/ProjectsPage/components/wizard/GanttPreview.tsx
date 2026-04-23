import { useMemo } from "react";

import type { ActivityDraftLocal, MilestoneDraftLocal } from "../../../../../domain/projects/project.validators";
import { StateMessage } from "../../../../components/ui/StateMessage";
import { uiTokens } from "../../../../components/ui/tokens";

export type GanttItem = {
  milestoneTitle: string;
  activityTitle: string;
  startDate: string;
  endDate: string;
};

export type GanttBounds = {
  min: number;
  max: number;
};

type MilestoneGroup = {
  milestoneName: string;
  startDateMin: string;
  endDateMax: string;
  activities: GanttItem[];
};

function toDateLabel(value?: string) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

function getBarPosition(startDate: string, endDate: string, bounds: GanttBounds) {
  const total = Math.max(bounds.max - bounds.min, 1);
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T00:00:00`).getTime();
  const left = ((start - bounds.min) / total) * 100;
  const width = (Math.max(end - start, 86400000) / total) * 100;

  return {
    left,
    width: Math.min(width, 100 - left)
  };
}

function groupByMilestone(items: GanttItem[]) {
  return Object.values(
    items.reduce<Record<string, MilestoneGroup>>((acc, item) => {
      const current = acc[item.milestoneTitle];
      if (!current) {
        acc[item.milestoneTitle] = {
          milestoneName: item.milestoneTitle,
          startDateMin: item.startDate,
          endDateMax: item.endDate,
          activities: [item]
        };
        return acc;
      }

      acc[item.milestoneTitle] = {
        ...current,
        startDateMin: item.startDate < current.startDateMin ? item.startDate : current.startDateMin,
        endDateMax: item.endDate > current.endDateMax ? item.endDate : current.endDateMax,
        activities: [...current.activities, item]
      };
      return acc;
    }, {})
  );
}

export function GanttPreview(props: {
  milestones: MilestoneDraftLocal[];
  activities: ActivityDraftLocal[];
  emptyMessage?: string;
}) {
  const ganttItems = useMemo<GanttItem[]>(() => props.activities
    .filter((activity) => activity.startDate && activity.endDate)
    .map((activity) => ({
      milestoneTitle: props.milestones.find((milestone) => milestone.tempId === activity.milestoneTempId)?.Title ?? "MARCO",
      activityTitle: activity.Title || "ATIVIDADE",
      startDate: activity.startDate as string,
      endDate: activity.endDate as string
    })), [props.activities, props.milestones]);

  const ganttBounds = useMemo<GanttBounds | null>(() => {
    if (ganttItems.length === 0) return null;
    const starts = ganttItems.map((item) => new Date(`${item.startDate}T00:00:00`).getTime());
    const ends = ganttItems.map((item) => new Date(`${item.endDate}T00:00:00`).getTime());

    return {
      min: Math.min(...starts),
      max: Math.max(...ends)
    };
  }, [ganttItems]);

  const milestoneGroups = useMemo(() => groupByMilestone(ganttItems), [ganttItems]);

  if (!ganttBounds || ganttItems.length === 0) {
    return <StateMessage state="empty" message={props.emptyMessage ?? "Sem atividades com início e término para exibir cronograma."} />;
  }

  const ganttRangeLabel = `${new Date(ganttBounds.min).toLocaleDateString("pt-BR")} - ${new Date(ganttBounds.max).toLocaleDateString("pt-BR")}`;

  return (
    <div style={{ display: "grid", gap: uiTokens.spacing.sm }}>
      <div style={{ fontSize: 12, color: uiTokens.colors.textMuted }}>
        Período do cronograma: {ganttRangeLabel}
      </div>
      {milestoneGroups.map((milestoneGroup) => {
        const milestoneBar = getBarPosition(milestoneGroup.startDateMin, milestoneGroup.endDateMax, ganttBounds);
        return (
          <div key={`${milestoneGroup.milestoneName}_${milestoneGroup.startDateMin}_${milestoneGroup.endDateMax}`} style={{ display: "grid", gap: uiTokens.spacing.xs }}>
            <div style={{ display: "flex", alignItems: "center", gap: uiTokens.spacing.xs, fontSize: 12, color: uiTokens.colors.text, marginBottom: 2 }}>
              <span style={{ minWidth: 0, flex: 1 }}>{milestoneGroup.milestoneName}</span>
              <span style={{ marginLeft: "auto", textAlign: "right" }}>{toDateLabel(milestoneGroup.startDateMin)} - {toDateLabel(milestoneGroup.endDateMax)}</span>
            </div>
            <div style={{ position: "relative", height: 14, borderRadius: 999, background: uiTokens.colors.border, overflow: "hidden" }}>
              <div style={{ position: "absolute", left: `${milestoneBar.left}%`, width: `${milestoneBar.width}%`, top: 0, bottom: 0, background: uiTokens.colors.accentWarning, borderRadius: 999 }} />
            </div>
            <div style={{ display: "grid", gap: uiTokens.spacing.xs }}>
              {milestoneGroup.activities.map((item) => {
                const activityBar = getBarPosition(item.startDate, item.endDate, ganttBounds);

                return (
                  <div key={`${item.milestoneTitle}_${item.activityTitle}_${item.startDate}_${item.endDate}`}>
                    <div style={{ display: "flex", alignItems: "center", gap: uiTokens.spacing.xs, fontSize: 12, color: uiTokens.colors.text, marginBottom: 4 }}>
                      <span style={{ minWidth: 0, flex: 1 }}>{item.activityTitle}</span>
                      <span style={{ marginLeft: "auto", textAlign: "right" }}>{toDateLabel(item.startDate)} - {toDateLabel(item.endDate)}</span>
                    </div>
                    <div style={{ position: "relative", height: 14, borderRadius: 999, background: uiTokens.colors.border, overflow: "hidden" }}>
                      <div style={{ position: "absolute", left: `${activityBar.left}%`, width: `${activityBar.width}%`, top: 0, bottom: 0, background: uiTokens.colors.accentAlt, borderRadius: 999 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
