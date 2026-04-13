import { useMemo, useState } from "react";

import { toIntOrUndefined } from "../../../../../domain/projects/project.calculations";
import type { ActivityDraftLocal, MilestoneDraftLocal } from "../../../../../domain/projects/project.validators";
import { ensurePepElementOption, getPepElementOptions } from "./wizardOptions";
import { SectionTitle } from "./WizardUi";
import { wizardLayoutStyles } from "./wizardLayoutStyles";
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

type GanttItem = {
  milestoneTitle: string;
  activityTitle: string;
  startDate: string;
  endDate: string;
};

function toDateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

export function StructureStep(props: {
  readOnly: boolean;
  projectStartDate?: string;
  projectEndDate?: string;
  milestones: MilestoneDraftLocal[];
  activities: ActivityDraftLocal[];
  company?: string;
  onChange: (patch: Partial<{ milestones: MilestoneDraftLocal[]; activities: ActivityDraftLocal[] }>) => void;
  onValidationError: (message: string) => void;
}) {
  const [formsByMilestone, setFormsByMilestone] = useState<Record<string, ActivityFormState>>({});
  const [isAddingActivityByMilestone, setIsAddingActivityByMilestone] = useState<Record<string, boolean>>({});
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");

  const activitiesByMilestone = useMemo(() => {
    const grouped: Record<string, ActivityDraftLocal[]> = {};
    for (const milestone of props.milestones) grouped[milestone.tempId] = [];
    for (const activity of props.activities) {
      if (!grouped[activity.milestoneTempId]) grouped[activity.milestoneTempId] = [];
      grouped[activity.milestoneTempId].push(activity);
    }
    return grouped;
  }, [props.milestones, props.activities]);

  const ganttItems = useMemo<GanttItem[]>(() => props.activities
    .filter((activity) => activity.startDate && activity.endDate)
    .map((activity) => ({
      milestoneTitle: props.milestones.find((milestone) => milestone.tempId === activity.milestoneTempId)?.Title ?? "MARCO",
      activityTitle: activity.Title || "ATIVIDADE",
      startDate: activity.startDate as string,
      endDate: activity.endDate as string
    })), [props.activities, props.milestones]);

  const ganttBounds = useMemo(() => {
    if (ganttItems.length === 0) return null;
    const starts = ganttItems.map((item) => new Date(`${item.startDate}T00:00:00`).getTime());
    const ends = ganttItems.map((item) => new Date(`${item.endDate}T00:00:00`).getTime());
    return {
      min: Math.min(...starts),
      max: Math.max(...ends)
    };
  }, [ganttItems]);

  const ganttRangeLabel = useMemo(() => {
    if (!ganttBounds) return null;
    return `${new Date(ganttBounds.min).toLocaleDateString("pt-BR")} - ${new Date(ganttBounds.max).toLocaleDateString("pt-BR")}`;
  }, [ganttBounds]);

  const pepOptions = useMemo(() => getPepElementOptions(props.company), [props.company]);

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
  }

  function toggleActivityForm(milestoneTempId: string, open: boolean) {
    setIsAddingActivityByMilestone((prev) => ({ ...prev, [milestoneTempId]: open }));
    if (!open) clearMilestoneForm(milestoneTempId);
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
    setIsAddingActivityByMilestone((prev) => {
      const next = { ...prev };
      delete next[milestoneTempId];
      return next;
    });
  }

  function updateMilestoneTitle(milestoneTempId: string, nextTitle: string) {
    props.onChange({ milestones: props.milestones.map((milestone) => (milestone.tempId === milestoneTempId ? { ...milestone, Title: nextTitle.toUpperCase() } : milestone)) });
  }

  function removeActivity(activityTempId: string) {
    props.onChange({ activities: props.activities.filter((a) => a.tempId !== activityTempId) });
  }

  function updateActivity(activityTempId: string, patch: Partial<ActivityDraftLocal>) {
    props.onChange({ activities: props.activities.map((activity) => (activity.tempId === activityTempId ? { ...activity, ...patch } : activity)) });
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
    toggleActivityForm(milestoneTempId, false);
  }

  function addMilestone() {
    if (!newMilestoneTitle.trim()) return props.onValidationError("Nome do marco é obrigatório.");

    props.onChange({ milestones: [...props.milestones, { tempId: uid("ms"), Title: newMilestoneTitle.trim().toUpperCase() }] });
    setNewMilestoneTitle("");
    setIsAddingMilestone(false);
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
              const canAddActivity = Boolean(form.acTitle.trim() && form.acAmount.trim() && form.acPepElement);
              const isAddingActivity = isAddingActivityByMilestone[milestone.tempId] ?? false;

              return (
                <div key={milestone.tempId} style={{ ...wizardLayoutStyles.card, background: uiTokens.colors.surfaceMuted }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: uiTokens.spacing.sm }}>
                    <div style={{ flex: 1 }}>
                      <Field label="Nome do Marco">
                        <input value={milestone.Title} onChange={(e) => updateMilestoneTitle(milestone.tempId, e.target.value)} style={wizardLayoutStyles.input} />
                      </Field>
                      <div style={{ fontSize: uiTokens.typography.xs, color: uiTokens.colors.textMuted }}>Atividades ({milestoneActivities.length})</div>
                    </div>
                    <Button
                      disabled={props.readOnly}
                      onClick={() => removeMilestone(milestone.tempId)}
                      aria-label="Remover marco"
                      title="Remover marco"
                    >
                      Remover marco
                    </Button>
                  </div>

                  {milestoneActivities.map((activity) => (
                    <div key={activity.tempId} style={{ ...wizardLayoutStyles.cardSubtle, background: uiTokens.colors.surface }}>
                      <div style={{ fontWeight: 600, marginBottom: uiTokens.spacing.sm }}>Atividade</div>

                      <div style={wizardLayoutStyles.journeyPairGrid}>
                        <Field label="Título da Atividade">
                          <input
                            value={activity.Title}
                            onChange={(e) => updateActivity(activity.tempId, { Title: e.target.value.toUpperCase() })}
                            placeholder="Ex.: Obra civil"
                            style={wizardLayoutStyles.input}
                          />
                        </Field>

                        <Field label="Valor da Atividade (R$)">
                          <input
                            value={activity.amountBrl ?? ""}
                            onChange={(e) => {
                              if (e.target.value === "" || /^\d+$/.test(e.target.value)) {
                                updateActivity(activity.tempId, { amountBrl: toIntOrUndefined(e.target.value) });
                              }
                            }}
                            placeholder="Ex: 500000 (sem pontos ou vírgulas)"
                            style={wizardLayoutStyles.input}
                          />
                        </Field>
                      </div>

                      <div style={wizardLayoutStyles.journeyPairGrid}>
                        <Field label="Início da Atividade">
                          <input
                            type="date"
                            min={props.projectStartDate}
                            max={props.projectEndDate}
                            value={activity.startDate ?? ""}
                            onChange={(e) => updateActivity(activity.tempId, { startDate: e.target.value || undefined })}
                            style={wizardLayoutStyles.input}
                          />
                        </Field>
                        <Field label="Término da Atividade">
                          <input
                            type="date"
                            min={(activity.startDate ?? "") || props.projectStartDate}
                            max={props.projectEndDate}
                            value={activity.endDate ?? ""}
                            onChange={(e) => updateActivity(activity.tempId, { endDate: e.target.value || undefined })}
                            style={wizardLayoutStyles.input}
                          />
                        </Field>
                      </div>

                      <Field label="Elemento PEP">
                        <select value={activity.pepElement ?? ""} onChange={(e) => updateActivity(activity.tempId, { pepElement: e.target.value || undefined })} style={wizardLayoutStyles.input}>
                          <option value="">Selecione o elemento PEP</option>
                          {ensurePepElementOption(pepOptions, activity.pepElement).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </Field>

                      <Field label="Fornecedor">
                        <input
                          value={activity.supplier ?? ""}
                          onChange={(e) => updateActivity(activity.tempId, { supplier: e.target.value || undefined })}
                          placeholder="Fornecedor (opcional)"
                          style={wizardLayoutStyles.input}
                        />
                      </Field>

                      <Field label="Descrição Geral da Atividade">
                        <textarea
                          value={activity.activityDescription ?? ""}
                          onChange={(e) => updateActivity(activity.tempId, { activityDescription: e.target.value || undefined })}
                          placeholder="Descrição geral da atividade"
                          style={{ ...wizardLayoutStyles.input, ...wizardLayoutStyles.textareaReadable }}
                        />
                      </Field>

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: uiTokens.spacing.sm, flexWrap: "wrap" }}>
                        <Button disabled={props.readOnly} onClick={() => removeActivity(activity.tempId)}>Remover atividade</Button>
                      </div>
                    </div>
                  ))}

                  {isAddingActivity ? (
                    <div style={{ ...wizardLayoutStyles.cardSubtle, background: uiTokens.colors.surface }}>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>Atividade</div>

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
                          {ensurePepElementOption(pepOptions, form.acPepElement).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </Field>

                      <Field label="Fornecedor">
                        <input value={form.acSupplier} onChange={(e) => setFormField(milestone.tempId, { acSupplier: e.target.value })} placeholder="Fornecedor (opcional)" style={wizardLayoutStyles.input} />
                      </Field>

                      <Field label="Descrição Geral da Atividade">
                        <textarea value={form.acDescription} onChange={(e) => setFormField(milestone.tempId, { acDescription: e.target.value })} placeholder="Descrição geral da atividade" style={{ ...wizardLayoutStyles.input, ...wizardLayoutStyles.textareaReadable }} />
                      </Field>

                      <div style={{ display: "flex", gap: uiTokens.spacing.sm, flexWrap: "wrap" }}>
                        <Button tone="primary" disabled={props.readOnly || !canAddActivity} onClick={() => addActivity(milestone.tempId)}>
                          Adicionar Atividade
                        </Button>
                        <Button disabled={props.readOnly} onClick={() => toggleActivityForm(milestone.tempId, false)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button disabled={props.readOnly} onClick={() => toggleActivityForm(milestone.tempId, true)}>
                      Nova atividade
                    </Button>
                  )}

                  {!milestoneActivities.length ? <div style={wizardLayoutStyles.empty}><StateMessage state="empty" message="Nenhuma atividade cadastrada para este marco." /></div> : null}
                </div>
              );
            })}
          </div>
        )}

        {isAddingMilestone ? (
          <div style={{ ...wizardLayoutStyles.cardSubtle, background: uiTokens.colors.surface, marginTop: uiTokens.spacing.md }}>
            <Field label="Nome do Marco">
              <input value={newMilestoneTitle} onChange={(e) => setNewMilestoneTitle(e.target.value)} style={wizardLayoutStyles.input} placeholder="Ex.: ETAPA 1" />
            </Field>
            <div style={{ display: "flex", gap: uiTokens.spacing.sm, flexWrap: "wrap" }}>
              <Button tone="primary" disabled={props.readOnly || !newMilestoneTitle.trim()} onClick={addMilestone}>
                Salvar Marco
              </Button>
              <Button
                disabled={props.readOnly}
                onClick={() => {
                  setIsAddingMilestone(false);
                  setNewMilestoneTitle("");
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button disabled={props.readOnly} onClick={() => setIsAddingMilestone(true)} style={{ marginTop: uiTokens.spacing.md }}>
            Adicionar Marco
          </Button>
        )}

        <div style={{ ...wizardLayoutStyles.cardSubtle, background: uiTokens.colors.surface, marginTop: uiTokens.spacing.md }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: uiTokens.colors.textStrong, marginBottom: uiTokens.spacing.sm }}>Pré-visualização do cronograma (Gantt)</div>
          {ganttItems.length === 0 || !ganttBounds ? (
            <StateMessage state="empty" message="Preencha início e término das atividades para visualizar o cronograma." />
          ) : (
            <div style={{ display: "grid", gap: uiTokens.spacing.sm }}>
              <div style={{ fontSize: 12, color: uiTokens.colors.textMuted }}>
                Período do cronograma: {ganttRangeLabel}
              </div>
              {ganttItems.map((item) => {
                const total = Math.max(ganttBounds.max - ganttBounds.min, 1);
                const start = new Date(`${item.startDate}T00:00:00`).getTime();
                const end = new Date(`${item.endDate}T00:00:00`).getTime();
                const left = ((start - ganttBounds.min) / total) * 100;
                const width = (Math.max(end - start, 86400000) / total) * 100;

                return (
                  <div key={`${item.milestoneTitle}_${item.activityTitle}_${item.startDate}_${item.endDate}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: uiTokens.colors.textMuted, marginBottom: 4 }}>
                      <span>{item.milestoneTitle} • {item.activityTitle}</span>
                      <span>{toDateLabel(item.startDate)} - {toDateLabel(item.endDate)}</span>
                    </div>
                    <div style={{ position: "relative", height: 14, borderRadius: 999, background: uiTokens.colors.border, overflow: "hidden" }}>
                      <div style={{ position: "absolute", left: `${left}%`, width: `${Math.min(width, 100 - left)}%`, top: 0, bottom: 0, borderRadius: 999, background: uiTokens.colors.accentAlt }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
