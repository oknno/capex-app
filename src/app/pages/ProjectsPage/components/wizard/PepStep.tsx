import { useMemo, useState } from "react";

import { toIntOrUndefined } from "../../../../../domain/projects/project.calculations";
import type { ActivityDraftLocal, MilestoneDraftLocal, PepDraftLocal } from "../../../../../domain/projects/project.validators";
import { buildYearOptions, ensurePepElementOption, getPepElementOptions } from "./wizardOptions";
import { SectionTitle } from "./WizardUi";
import { wizardLayoutStyles } from "./wizardLayoutStyles";
import { Button } from "../../../../components/ui/Button";
import { Field } from "../../../../components/ui/Field";
import { StateMessage } from "../../../../components/ui/StateMessage";
import { uiTokens } from "../../../../components/ui/tokens";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function PepStep(props: {
  readOnly: boolean;
  needStructure: boolean;
  milestones: MilestoneDraftLocal[];
  activities: ActivityDraftLocal[];
  peps: PepDraftLocal[];
  company?: string;
  defaultYear: number;
  onChange: (next: PepDraftLocal[]) => void;
  onValidationError: (message: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(String(props.defaultYear));
  const [amount, setAmount] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");

  const yearOptions = buildYearOptions(5);
  const pepOptions = useMemo(() => getPepElementOptions(props.company), [props.company]);
  const pepOptionsForCreation = useMemo(() => ensurePepElementOption(pepOptions, title), [pepOptions, title]);

  const defaultActivityTempId = useMemo(() => {
    if (!props.needStructure || !props.activities.length) return "";
    return props.activities[0].tempId;
  }, [props.needStructure, props.activities]);

  const selectedActivityId = selectedActivity || defaultActivityTempId;


  function removePep(tempId: string) {
    props.onChange(props.peps.filter((pep) => pep.tempId !== tempId));
  }

  function updatePep(tempId: string, patch: Partial<PepDraftLocal>) {
    props.onChange(props.peps.map((pep) => (pep.tempId === tempId ? { ...pep, ...patch } : pep)));
  }

  return (
    <div style={{ padding: 14, display: "grid", gap: 12 }}>
      <SectionTitle title={props.needStructure ? "Elemento PEP (rateio das atividades)" : "5. Elemento PEP (projeto abaixo de 1M)"} subtitle={props.needStructure ? "Projeto ≥ 1M: vincule cada PEP a uma atividade." : "Projeto < 1M: preencha apenas elemento, ano e valor do PEP."} />

      <div style={wizardLayoutStyles.cardSubtle}>
        <div style={wizardLayoutStyles.journeyStack}>
          {props.needStructure && (
            <Field label="Atividade vinculada">
              <select value={selectedActivityId} onChange={(e) => setSelectedActivity(e.target.value)} disabled={props.readOnly || props.activities.length === 0} style={wizardLayoutStyles.input}>
                <option value="">Selecione a atividade...</option>
                {props.activities.map((a) => {
                  const ms = props.milestones.find((m) => m.tempId === a.milestoneTempId);
                  return <option key={a.tempId} value={a.tempId}>{a.Title} — {ms?.Title ?? ""}</option>;
                })}
              </select>
            </Field>
          )}

          <Field label="Elemento PEP">
            <select value={title} onChange={(e) => setTitle(e.target.value)} style={wizardLayoutStyles.input}>
              <option value="">Selecione o elemento...</option>
              {pepOptionsForCreation.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>

          <div style={wizardLayoutStyles.journeyPairGrid}>
            <Field label="Ano do PEP">
              <select value={year} onChange={(e) => setYear(e.target.value)} style={wizardLayoutStyles.input}>
                <option value="">Selecione...</option>
                {yearOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </Field>

            <Field label="Valor do PEP (R$)">
              <input
                value={amount}
                onChange={(e) => {
                  if (e.target.value === "" || /^\d+$/.test(e.target.value)) setAmount(e.target.value);
                }}
                placeholder="Somente números inteiros"
                style={wizardLayoutStyles.input}
              />
            </Field>
          </div>

          <div>
            <Button tone="primary" disabled={props.readOnly || !title.trim() || !year.trim() || !amount.trim() || (props.needStructure && !selectedActivityId)} onClick={() => {
              const y = Number(year.trim());
              const amt = toIntOrUndefined(amount);
              if (!Number.isFinite(y)) return props.onValidationError("Ano inválido.");
              if (!amt || amt <= 0) return props.onValidationError("Valor do PEP inválido.");

              props.onChange([...props.peps, { tempId: uid("pp"), Title: title.trim(), year: y, amountBrl: amt, activityTempId: props.needStructure ? selectedActivityId : undefined }]);
              setTitle("");
              setAmount("");
            }}>Adicionar PEP</Button>
          </div>
        </div>
      </div>

      <div style={wizardLayoutStyles.box}>
        <div style={wizardLayoutStyles.boxHead}>Elementos PEP ({props.peps.length})</div>
        {!props.peps.length ? (
          <div style={wizardLayoutStyles.empty}><StateMessage state="empty" message="Nenhum elemento PEP cadastrado." /></div>
        ) : (
          <div style={{ display: "grid", gap: uiTokens.spacing.md, padding: uiTokens.spacing.sm }}>
            {props.peps.map((pep) => (
              <div key={pep.tempId} style={{ ...wizardLayoutStyles.cardSubtle, background: uiTokens.colors.surface }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: uiTokens.spacing.sm }}>
                  <div style={{ fontWeight: 600 }}>PEP</div>
                  <Button
                    type="button"
                    disabled={props.readOnly}
                    onClick={() => removePep(pep.tempId)}
                    style={{ padding: "6px 10px" }}
                    aria-label="Remover PEP"
                    title="Remover PEP"
                  >
                    Remover PEP
                  </Button>
                </div>

                <Field label="Elemento PEP">
                  <select value={pep.Title} onChange={(e) => updatePep(pep.tempId, { Title: e.target.value })} style={wizardLayoutStyles.input}>
                    <option value="">Selecione o elemento...</option>
                    {ensurePepElementOption(pepOptions, pep.Title).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </Field>

                {props.needStructure && (
                  <Field label="Atividade vinculada">
                    <select
                      value={pep.activityTempId ?? ""}
                      onChange={(e) => updatePep(pep.tempId, { activityTempId: e.target.value || undefined })}
                      disabled={props.readOnly || props.activities.length === 0}
                      style={wizardLayoutStyles.input}
                    >
                      <option value="">Selecione a atividade...</option>
                      {props.activities.map((activity) => {
                        const milestone = props.milestones.find((item) => item.tempId === activity.milestoneTempId);
                        return <option key={activity.tempId} value={activity.tempId}>{activity.Title} — {milestone?.Title ?? ""}</option>;
                      })}
                    </select>
                  </Field>
                )}

                <div style={wizardLayoutStyles.journeyPairGrid}>
                  <Field label="Ano do PEP">
                    <select value={String(pep.year)} onChange={(e) => updatePep(pep.tempId, { year: Number(e.target.value) })} style={wizardLayoutStyles.input}>
                      <option value="">Selecione...</option>
                      {yearOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </Field>

                  <Field label="Valor do PEP (R$)">
                    <input
                      value={String(pep.amountBrl ?? "")}
                      onChange={(e) => {
                        if (e.target.value === "" || /^\d+$/.test(e.target.value)) {
                          updatePep(pep.tempId, { amountBrl: toIntOrUndefined(e.target.value) ?? 0 });
                        }
                      }}
                      placeholder="Somente números inteiros"
                      style={wizardLayoutStyles.input}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
