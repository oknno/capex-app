import { useEffect, useMemo, useState } from "react";

import { toIntOrUndefined } from "../../../../../domain/projects/project.calculations";
import type { ActivityDraftLocal, MilestoneDraftLocal } from "../../../../../domain/projects/project.validators";
import { PEP_ELEMENT_OPTIONS } from "./wizardOptions";
import { SectionTitle, wizardLayoutStyles } from "./WizardUi";
import { Button } from "../../../../components/ui/Button";
import { Field } from "../../../../components/ui/Field";
import { StateMessage } from "../../../../components/ui/StateMessage";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function StructureStep(props: {
  readOnly: boolean;
  projectStartDate?: string;
  projectEndDate?: string;
  milestones: MilestoneDraftLocal[];
  activities: ActivityDraftLocal[];
  onChange: (patch: Partial<{ milestones: MilestoneDraftLocal[]; activities: ActivityDraftLocal[] }>) => void;
  onValidationError: (message: string) => void;
}) {
  const [msTitle, setMsTitle] = useState("");
  const [acTitle, setAcTitle] = useState("");
  const [acAmount, setAcAmount] = useState("");
  const [acPepElement, setAcPepElement] = useState("");
  const [acStartDate, setAcStartDate] = useState("");
  const [acEndDate, setAcEndDate] = useState("");
  const [acSupplier, setAcSupplier] = useState("");
  const [acDescription, setAcDescription] = useState("");
  const [selectedMs, setSelectedMs] = useState<string>("");

  useEffect(() => {
    if (!selectedMs && props.milestones.length) setSelectedMs(props.milestones[0].tempId);
  }, [props.milestones.length]);

  const canAddActivity = useMemo(() => {
    return Boolean(selectedMs && acTitle.trim() && acAmount.trim() && acPepElement);
  }, [selectedMs, acTitle, acAmount, acPepElement]);

  return (
    <div style={{ padding: 14, display: "grid", gap: 14 }}>
      <SectionTitle title="8. KEY Projects" subtitle="Disponível para projetos com orçamento igual ou superior a R$ 1.000.000,00." />

      <div style={wizardLayoutStyles.cardSubtle}>
        <div style={wizardLayoutStyles.journeyStack}>
          <div style={wizardLayoutStyles.journeyPairGrid}>
            <Field label="Nome do marco">
              <input value={msTitle} onChange={(e) => setMsTitle(e.target.value)} placeholder="Ex.: Aprovação Técnica" style={wizardLayoutStyles.input} />
            </Field>
            <div style={{ alignSelf: "end" }}>
              <Button tone="primary" disabled={props.readOnly || !msTitle.trim()} onClick={() => {
                const next = [...props.milestones, { tempId: uid("ms"), Title: msTitle.trim().toUpperCase() }];
                props.onChange({ milestones: next });
                setMsTitle("");
                if (!selectedMs) setSelectedMs(next[0].tempId);
              }}>Adicionar Marco</Button>
            </div>
          </div>

          <Field label="Marco para nova atividade">
            <select value={selectedMs} onChange={(e) => setSelectedMs(e.target.value)} disabled={props.readOnly || props.milestones.length === 0} style={wizardLayoutStyles.input}>
              <option value="">Selecione o marco...</option>
              {props.milestones.map((m) => <option key={m.tempId} value={m.tempId}>{m.Title}</option>)}
            </select>
          </Field>

          <div style={wizardLayoutStyles.journeyPairGrid}>
            <Field label="Título da atividade">
              <input value={acTitle} onChange={(e) => setAcTitle(e.target.value)} placeholder="Ex.: Obra civil" style={wizardLayoutStyles.input} />
            </Field>

            <Field label="Valor da Atividade (R$)">
              <input
                value={acAmount}
                onChange={(e) => {
                  if (e.target.value === "" || /^\d+$/.test(e.target.value)) setAcAmount(e.target.value);
                }}
                placeholder="Somente números inteiros"
                style={wizardLayoutStyles.input}
              />
            </Field>
          </div>

          <div style={wizardLayoutStyles.journeyPairGrid}>
            <Field label="Elemento PEP">
              <select value={acPepElement} onChange={(e) => setAcPepElement(e.target.value)} style={wizardLayoutStyles.input}>
                <option value="">Selecione o elemento...</option>
                {PEP_ELEMENT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </Field>

            <Field label="Fornecedor">
              <input value={acSupplier} onChange={(e) => setAcSupplier(e.target.value)} placeholder="Fornecedor (opcional)" style={wizardLayoutStyles.input} />
            </Field>
          </div>

          <div style={wizardLayoutStyles.journeyPairGrid}>
            <Field label="Data de início">
              <input type="date" min={props.projectStartDate} max={props.projectEndDate} value={acStartDate} onChange={(e) => setAcStartDate(e.target.value)} style={wizardLayoutStyles.input} />
            </Field>
            <Field label="Data de término">
              <input type="date" min={acStartDate || props.projectStartDate} max={props.projectEndDate} value={acEndDate} onChange={(e) => setAcEndDate(e.target.value)} style={wizardLayoutStyles.input} />
            </Field>
          </div>

          <Field label="Descrição da atividade">
            <input value={acDescription} onChange={(e) => setAcDescription(e.target.value)} placeholder="Descrição geral da atividade" style={wizardLayoutStyles.input} />
          </Field>

          <div>
            <Button tone="primary" disabled={props.readOnly || !canAddActivity} onClick={() => {
              const amount = toIntOrUndefined(acAmount);
              if (!amount || amount <= 0) return props.onValidationError("Valor da Atividade deve ser inteiro > 0.");
              if (props.projectStartDate && acStartDate && acStartDate < props.projectStartDate) return props.onValidationError("Início da atividade não pode ser antes do início do projeto.");
              if (acStartDate && acEndDate && acEndDate < acStartDate) return props.onValidationError("Término da atividade não pode ser antes do início.");
              if (props.projectEndDate && acEndDate && acEndDate > props.projectEndDate) return props.onValidationError("Término da atividade não pode ser após término do projeto.");

              props.onChange({
                activities: [
                  ...props.activities,
                  {
                    tempId: uid("ac"),
                    Title: acTitle.trim().toUpperCase(),
                    milestoneTempId: selectedMs,
                    amountBrl: amount,
                    pepElement: acPepElement,
                    startDate: acStartDate || undefined,
                    endDate: acEndDate || undefined,
                    supplier: acSupplier.trim() || undefined,
                    activityDescription: acDescription.trim() || undefined
                  }
                ]
              });
              setAcTitle("");
              setAcAmount("");
              setAcPepElement("");
              setAcStartDate("");
              setAcEndDate("");
              setAcSupplier("");
              setAcDescription("");
            }}>Adicionar Atividade</Button>
          </div>
        </div>
      </div>

      <div style={wizardLayoutStyles.grid2}>
        <div style={wizardLayoutStyles.box}>
          <div style={wizardLayoutStyles.boxHead}>Marcos ({props.milestones.length})</div>
          {!props.milestones.length ? <div style={wizardLayoutStyles.empty}><StateMessage state="empty" message="Nenhum marco cadastrado." /></div> : props.milestones.map((m) => <div key={m.tempId} style={wizardLayoutStyles.row}>{m.Title}</div>)}
        </div>
        <div style={wizardLayoutStyles.box}>
          <div style={wizardLayoutStyles.boxHead}>Atividades ({props.activities.length})</div>
          {!props.activities.length ? <div style={wizardLayoutStyles.empty}><StateMessage state="empty" message="Nenhuma atividade cadastrada." /></div> : props.activities.map((a) => {
            const ms = props.milestones.find((m) => m.tempId === a.milestoneTempId);
            return <div key={a.tempId} style={wizardLayoutStyles.row}><b>{a.Title}</b><div style={{ fontSize: 12, color: "#6b7280" }}>{ms?.Title ?? "(marco não informado)"}</div><div style={{ fontSize: 12, color: "#6b7280" }}>Valor: {(a.amountBrl ?? 0).toLocaleString("pt-BR")} • PEP: {a.pepElement ?? "-"}</div><div style={{ fontSize: 12, color: "#6b7280" }}>{a.startDate ?? ""}{a.endDate ? ` → ${a.endDate}` : ""}{a.supplier ? ` • ${a.supplier}` : ""}</div></div>;
          })}
        </div>
      </div>
    </div>
  );
}
