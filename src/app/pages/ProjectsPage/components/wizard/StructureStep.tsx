import { useMemo, useState } from "react";

import { toIntOrUndefined } from "../../../../../domain/projects/project.calculations";
import type { ActivityDraftLocal, MilestoneDraftLocal } from "../../../../../domain/projects/project.validators";
import { PEP_ELEMENT_OPTIONS } from "./wizardOptions";
import { SectionTitle, wizardLayoutStyles } from "./WizardUi";
import { Button } from "../../../../components/ui/Button";
import { Field } from "../../../../components/ui/Field";
import { StateMessage } from "../../../../components/ui/StateMessage";
import { uiTokens } from "../../../../components/ui/tokens";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function emptyActivityForm() {
  return {
    acTitle: "",
    acAmount: "",
    acPepElement: "",
    acStartDate: "",
    acEndDate: "",
    acSupplier: "",
    acDescription: ""
  };
}

type ActivityFormState = ReturnType<typeof emptyActivityForm>;

export function StructureStep(props: {
  readOnly: boolean;
  projectStartDate?: string;
  projectEndDate?: string;
  milestones: MilestoneDraftLocal[];
  activities: ActivityDraftLocal[];
  onChange: (patch: Partial<{ milestones: MilestoneDraftLocal[]; activities: ActivityDraftLocal[] }>) => void;
  onValidationError: (message: string) => void;
}) {
  const [formsByMilestone, setFormsByMilestone] = useState<Record<string, ActivityFormState>>({});
  const [editingByMilestone, setEditingByMilestone] = useState<Record<string, string | undefined>>({});

  const activitiesByMilestone = useMemo(() => {
    const grouped: Record<string, ActivityDraftLocal[]> = {};
    for (const milestone of props.milestones) grouped[milestone.tempId] = [];
    for (const activity of props.activities) {
      if (!grouped[activity.milestoneTempId]) grouped[activity.milestoneTempId] = [];
      grouped[activity.milestoneTempId].push(activity);
    }
    return grouped;
  }, [props.milestones, props.activities]);

  function getForm(milestoneTempId: string): ActivityFormState {
    return formsByMilestone[milestoneTempId] ?? emptyActivityForm();
  }

  function setFormField(milestoneTempId: string, patch: Partial<ActivityFormState>) {
    setFormsByMilestone((prev) => ({
      ...prev,
      [milestoneTempId]: { ...getForm(milestoneTempId), ...patch }
    }));
  }

  function clearMilestoneForm(milestoneTempId: string) {
    setFormsByMilestone((prev) => ({ ...prev, [milestoneTempId]: emptyActivityForm() }));
    setEditingByMilestone((prev) => ({ ...prev, [milestoneTempId]: undefined }));
  }

  function removeMilestone(milestoneTempId: string) {
    props.onChange({
      milestones: props.milestones.filter((m) => m.tempId !== milestoneTempId),
      activities: props.activities.filter((a) => a.milestoneTempId !== milestoneTempId)
    });
    setFormsByMilestone((prev) => {
      const next = { ...prev };
      delete next[milestoneTempId];
      return next;
    });
    setEditingByMilestone((prev) => {
      const next = { ...prev };
      delete next[milestoneTempId];
      return next;
    });
  }

  function updateMilestoneTitle(milestoneTempId: string, nextTitle: string) {
    props.onChange({ milestones: props.milestones.map((milestone) => (milestone.tempId === milestoneTempId ? { ...milestone, Title: nextTitle.toUpperCase() } : milestone)) });
  }

  function removeActivity(milestoneTempId: string, activityTempId: string) {
    props.onChange({ activities: props.activities.filter((a) => a.tempId !== activityTempId) });
    setEditingByMilestone((prev) => {
      if (prev[milestoneTempId] !== activityTempId) return prev;
      return { ...prev, [milestoneTempId]: undefined };
    });
  }

  function startEditingActivity(milestoneTempId: string, activity: ActivityDraftLocal) {
    setEditingByMilestone((prev) => ({ ...prev, [milestoneTempId]: activity.tempId }));
    setFormsByMilestone((prev) => ({
      ...prev,
      [milestoneTempId]: {
        acTitle: activity.Title,
        acAmount: String(activity.amountBrl ?? ""),
        acPepElement: activity.pepElement ?? "",
        acStartDate: activity.startDate ?? "",
        acEndDate: activity.endDate ?? "",
        acSupplier: activity.supplier ?? "",
        acDescription: activity.activityDescription ?? ""
      }
    }));
  }

  function saveActivity(milestoneTempId: string) {
    const activityTempId = editingByMilestone[milestoneTempId];
    if (!activityTempId) return;

    const form = getForm(milestoneTempId);
    const amount = toIntOrUndefined(form.acAmount);
    const milestoneTitle = props.milestones.find((milestone) => milestone.tempId === milestoneTempId)?.Title ?? "";

    if (!milestoneTitle.trim()) return props.onValidationError("Nome do marco é obrigatório.");
    if (!form.acTitle.trim()) return props.onValidationError("Título da atividade é obrigatório.");
    if (!amount || amount <= 0) return props.onValidationError("Valor da Atividade deve ser inteiro > 0.");
    if (!form.acPepElement) return props.onValidationError("Selecione o elemento PEP da atividade.");
    if (props.projectStartDate && form.acStartDate && form.acStartDate < props.projectStartDate) return props.onValidationError("Início da atividade não pode ser antes do início do projeto.");
    if (form.acStartDate && form.acEndDate && form.acEndDate < form.acStartDate) return props.onValidationError("Término da atividade não pode ser antes do início.");
    if (props.projectEndDate && form.acEndDate && form.acEndDate > props.projectEndDate) return props.onValidationError("Término da atividade não pode ser após término do projeto.");

    props.onChange({
      activities: props.activities.map((activity) => {
        if (activity.tempId !== activityTempId) return activity;
        return {
          ...activity,
          Title: form.acTitle.trim().toUpperCase(),
          amountBrl: amount,
          pepElement: form.acPepElement,
          startDate: form.acStartDate || undefined,
          endDate: form.acEndDate || undefined,
          supplier: form.acSupplier.trim() || undefined,
          activityDescription: form.acDescription.trim() || undefined
        };
      })
    });

    clearMilestoneForm(milestoneTempId);
  }

  function addActivity(milestoneTempId: string) {
    const form = getForm(milestoneTempId);
    const amount = toIntOrUndefined(form.acAmount);
    const milestoneTitle = props.milestones.find((milestone) => milestone.tempId === milestoneTempId)?.Title ?? "";

    if (!milestoneTitle.trim()) return props.onValidationError("Nome do marco é obrigatório.");
    if (!form.acTitle.trim()) return props.onValidationError("Título da atividade é obrigatório.");
    if (!amount || amount <= 0) return props.onValidationError("Valor da Atividade deve ser inteiro > 0.");
    if (!form.acPepElement) return props.onValidationError("Selecione o elemento PEP da atividade.");
    if (props.projectStartDate && form.acStartDate && form.acStartDate < props.projectStartDate) return props.onValidationError("Início da atividade não pode ser antes do início do projeto.");
    if (form.acStartDate && form.acEndDate && form.acEndDate < form.acStartDate) return props.onValidationError("Término da atividade não pode ser antes do início.");
    if (props.projectEndDate && form.acEndDate && form.acEndDate > props.projectEndDate) return props.onValidationError("Término da atividade não pode ser após término do projeto.");

    props.onChange({
      activities: [
        ...props.activities,
        {
          tempId: uid("ac"),
          Title: form.acTitle.trim().toUpperCase(),
          milestoneTempId,
          amountBrl: amount,
          pepElement: form.acPepElement,
          startDate: form.acStartDate || undefined,
          endDate: form.acEndDate || undefined,
          supplier: form.acSupplier.trim() || undefined,
          activityDescription: form.acDescription.trim() || undefined
        }
      ]
    });

    clearMilestoneForm(milestoneTempId);
  }

  return (
    <div style={{ padding: 14, display: "grid", gap: 14 }}>
      <SectionTitle title="8. KEY Projects" subtitle="Disponível para projetos com orçamento igual ou superior a R$ 1.000.000,00." />

      <div style={wizardLayoutStyles.cardSubtle}>
        {!props.milestones.length ? (
          <div style={wizardLayoutStyles.empty}><StateMessage state="empty" message="Nenhum marco cadastrado." /></div>
        ) : (
          <div style={{ display: "grid", gap: uiTokens.spacing.md }}>
            {props.milestones.map((milestone) => {
              const form = getForm(milestone.tempId);
              const milestoneActivities = activitiesByMilestone[milestone.tempId] ?? [];
              const editingActivityTempId = editingByMilestone[milestone.tempId];
              const isEditing = Boolean(editingActivityTempId);
              const canAddActivity = Boolean(form.acTitle.trim() && form.acAmount.trim() && form.acPepElement);

              return (
                <div key={milestone.tempId} style={{ ...wizardLayoutStyles.card, background: "#f9fafb" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: uiTokens.spacing.sm }}>
                    <div style={{ flex: 1 }}>
                      <Field label="Nome do Marco">
                        <input value={milestone.Title} onChange={(e) => updateMilestoneTitle(milestone.tempId, e.target.value)} style={wizardLayoutStyles.input} />
                      </Field>
                      <div style={{ fontSize: uiTokens.typography.xs, color: uiTokens.colors.textMuted }}>Atividades ({milestoneActivities.length})</div>
                    </div>
                    <button
                      type="button"
                      disabled={props.readOnly}
                      onClick={() => removeMilestone(milestone.tempId)}
                      style={{ border: "none", background: "transparent", cursor: props.readOnly ? "not-allowed" : "pointer", color: "#6b7280", fontSize: 16 }}
                      aria-label="Remover marco"
                      title="Remover marco"
                    >
                      🗑️
                    </button>
                  </div>

                  <div style={{ ...wizardLayoutStyles.cardSubtle, background: "#fff" }}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{isEditing ? "Editar atividade" : "Atividade"}</div>
                    {isEditing ? <div style={{ fontSize: 12, color: uiTokens.colors.accent, fontWeight: 600 }}>Editando atividade existente</div> : null}

                    <div style={wizardLayoutStyles.journeyPairGrid}>
                      <Field label="Título da Atividade">
                        <input value={form.acTitle} onChange={(e) => setFormField(milestone.tempId, { acTitle: e.target.value })} placeholder="Ex.: Obra civil" style={wizardLayoutStyles.input} />
                      </Field>

                      <Field label="Valor da Atividade (R$)">
                        <input
                          value={form.acAmount}
                          onChange={(e) => {
                            if (e.target.value === "" || /^\d+$/.test(e.target.value)) setFormField(milestone.tempId, { acAmount: e.target.value });
                          }}
                          placeholder="Ex: 500000 (sem pontos ou vírgulas)"
                          style={wizardLayoutStyles.input}
                        />
                      </Field>
                    </div>

                    <div style={wizardLayoutStyles.journeyPairGrid}>
                      <Field label="Início da Atividade">
                        <input type="date" min={props.projectStartDate} max={props.projectEndDate} value={form.acStartDate} onChange={(e) => setFormField(milestone.tempId, { acStartDate: e.target.value })} style={wizardLayoutStyles.input} />
                      </Field>
                      <Field label="Término da Atividade">
                        <input type="date" min={form.acStartDate || props.projectStartDate} max={props.projectEndDate} value={form.acEndDate} onChange={(e) => setFormField(milestone.tempId, { acEndDate: e.target.value })} style={wizardLayoutStyles.input} />
                      </Field>
                    </div>

                    <Field label="Elemento PEP">
                      <select value={form.acPepElement} onChange={(e) => setFormField(milestone.tempId, { acPepElement: e.target.value })} style={wizardLayoutStyles.input}>
                        <option value="">Selecione o elemento PEP</option>
                        {PEP_ELEMENT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </Field>

                    <Field label="Fornecedor">
                      <input value={form.acSupplier} onChange={(e) => setFormField(milestone.tempId, { acSupplier: e.target.value })} placeholder="Fornecedor (opcional)" style={wizardLayoutStyles.input} />
                    </Field>

                    <Field label="Descrição Geral da Atividade">
                      <textarea value={form.acDescription} onChange={(e) => setFormField(milestone.tempId, { acDescription: e.target.value })} placeholder="Descrição geral da atividade" style={{ ...wizardLayoutStyles.input, ...wizardLayoutStyles.textareaReadable }} />
                    </Field>

                    <div style={{ display: "flex", gap: uiTokens.spacing.sm, flexWrap: "wrap" }}>
                      <Button tone="primary" disabled={props.readOnly || !canAddActivity} onClick={() => isEditing ? saveActivity(milestone.tempId) : addActivity(milestone.tempId)}>
                        {isEditing ? "Salvar alterações" : "Adicionar Atividade"}
                      </Button>
                      {isEditing ? <Button disabled={props.readOnly} onClick={() => clearMilestoneForm(milestone.tempId)}>Cancelar edição</Button> : null}
                    </div>
                  </div>

                  {!milestoneActivities.length ? (
                    <div style={wizardLayoutStyles.empty}><StateMessage state="empty" message="Nenhuma atividade cadastrada para este marco." /></div>
                  ) : (
                    <div style={{ display: "grid", gap: uiTokens.spacing.xs }}>
                      <div style={{ fontWeight: 600 }}>Atividades cadastradas</div>
                      {milestoneActivities.map((activity) => (
                        <div key={activity.tempId} style={{ ...wizardLayoutStyles.cardSubtle, borderColor: editingActivityTempId === activity.tempId ? uiTokens.colors.accent : uiTokens.colors.borderMuted }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: uiTokens.spacing.sm }}>
                              <div style={{ fontWeight: 700 }}>{activity.Title}</div>
                              <button
                                type="button"
                                disabled={props.readOnly}
                                onClick={() => startEditingActivity(milestone.tempId, activity)}
                                style={{ border: "none", background: "transparent", cursor: props.readOnly ? "not-allowed" : "pointer", color: "#6b7280", fontSize: 16 }}
                                aria-label="Editar atividade"
                                title="Editar atividade"
                              >
                                ✏️
                              </button>
                            </div>
                            <div style={{ fontSize: 12, color: "#6b7280" }}>Valor: {(activity.amountBrl ?? 0).toLocaleString("pt-BR")} • PEP: {activity.pepElement ?? "-"}</div>
                            <div style={{ fontSize: 12, color: "#6b7280" }}>{activity.startDate ?? ""}{activity.endDate ? ` → ${activity.endDate}` : ""}{activity.supplier ? ` • ${activity.supplier}` : ""}</div>
                          </div>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: uiTokens.spacing.sm, flexWrap: "wrap" }}>
                            <Button disabled={props.readOnly} onClick={() => removeActivity(milestone.tempId, activity.tempId)}>Remover atividade</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <Button
          tone="primary"
          disabled={props.readOnly}
          onClick={() => {
            const nextMilestone = { tempId: uid("ms"), Title: "" };
            props.onChange({ milestones: [...props.milestones, nextMilestone] });
          }}
          style={{ width: "100%", marginTop: uiTokens.spacing.md }}
        >
          Adicionar Marco
        </Button>
      </div>
    </div>
  );
}
