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

const DAY_IN_MS = 86400000;

function getDurationInDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T00:00:00`).getTime();
  const diff = end - start;

  if (Number.isNaN(start) || Number.isNaN(end) || diff < 0) {
    return null;
  }

  return Math.floor(diff / DAY_IN_MS) + 1;
}

function toScheduleLabel(startDate: string, endDate: string) {
  const duration = getDurationInDays(startDate, endDate);

  if (!duration) {
    return {
      label: `${toDateLabel(startDate)} a ${toDateLabel(endDate)} · duração inválida`,
      isInvalid: true,
    };
  }

  const dateLabel = startDate === endDate
    ? toDateLabel(startDate)
    : `${toDateLabel(startDate)} a ${toDateLabel(endDate)}`;

  return {
    label: `${dateLabel} · ${duration} ${duration === 1 ? "dia" : "dias"}`,
    isInvalid: false,
  };
}

function getBarPosition(startDate: string, endDate: string, bounds: GanttBounds) {
  const total = Math.max(bounds.max - bounds.min, 1);
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T00:00:00`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return { left: 0, width: 100 };
  }
  const left = ((start - bounds.min) / total) * 100;
  const width = (Math.max(end - start, DAY_IN_MS) / total) * 100;

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
      activityTitle: activity.Title || activity.placeholder || "ATIVIDADE",
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
        const milestoneSchedule = toScheduleLabel(milestoneGroup.startDateMin, milestoneGroup.endDateMax);
        return (
          <div key={`${milestoneGroup.milestoneName}_${milestoneGroup.startDateMin}_${milestoneGroup.endDateMax}`} style={{ display: "grid", gap: uiTokens.spacing.xs }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: uiTokens.spacing.xs, fontSize: 12, color: uiTokens.colors.text, marginBottom: 4 }}>
                <span style={{ minWidth: 0, flex: 1, fontWeight: uiTokens.typography.titleWeight }}><strong>[MARCO]</strong> {milestoneGroup.milestoneName}</span>
                <span style={{ marginLeft: "auto", textAlign: "right", color: milestoneSchedule.isInvalid ? uiTokens.colors.danger : uiTokens.colors.textMuted }}>
                  {milestoneSchedule.label}
                </span>
              </div>
              <div style={{ position: "relative", height: 16, borderRadius: 999, background: uiTokens.colors.borderMuted, overflow: "hidden" }}>
                <div style={{ position: "absolute", left: `${milestoneBar.left}%`, width: `${milestoneBar.width}%`, top: 0, bottom: 0, background: milestoneSchedule.isInvalid ? uiTokens.colors.danger : uiTokens.colors.accent, borderRadius: 999 }} />
              </div>
            </div>
            {milestoneGroup.activities.map((item) => {
              const activityBar = getBarPosition(item.startDate, item.endDate, ganttBounds);
              const activitySchedule = toScheduleLabel(item.startDate, item.endDate);

              return (
                <div key={`${item.milestoneTitle}_${item.activityTitle}_${item.startDate}_${item.endDate}`}>
                  <div style={{ display: "flex", alignItems: "center", gap: uiTokens.spacing.xs, fontSize: 11, color: uiTokens.colors.text, marginBottom: 4, paddingLeft: uiTokens.spacing.lg }}>
                    <span style={{ minWidth: 0, flex: 1 }}><strong>[ATIVIDADE]</strong> {item.activityTitle}</span>
                    <span style={{ marginLeft: "auto", textAlign: "right", color: activitySchedule.isInvalid ? uiTokens.colors.danger : uiTokens.colors.textMuted }}>{activitySchedule.label}</span>
                  </div>
                  <div style={{ position: "relative", height: 8, borderRadius: 999, background: uiTokens.colors.borderMuted, overflow: "hidden", marginLeft: uiTokens.spacing.lg }}>
                    <div style={{ position: "absolute", left: `${activityBar.left}%`, width: `${activityBar.width}%`, top: 0, bottom: 0, background: activitySchedule.isInvalid ? uiTokens.colors.danger : uiTokens.colors.accentSoft, borderRadius: 999, border: `1px solid ${activitySchedule.isInvalid ? uiTokens.colors.danger : uiTokens.colors.borderStrong}` }} />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
