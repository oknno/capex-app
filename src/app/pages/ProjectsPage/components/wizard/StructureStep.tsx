import { useEffect, useState } from "react";

import type { ActivityDraftLocal, MilestoneDraftLocal } from "../../../../../domain/projects/project.validators";
import { SectionTitle, wizardLayoutStyles } from "./WizardUi";
import { Button } from "../../../../components/ui/Button";
import { StateMessage } from "../../../../components/ui/StateMessage";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function StructureStep(props: {
  readOnly: boolean;
  milestones: MilestoneDraftLocal[];
  activities: ActivityDraftLocal[];
  onChange: (patch: Partial<{ milestones: MilestoneDraftLocal[]; activities: ActivityDraftLocal[] }>) => void;
}) {
  const [msTitle, setMsTitle] = useState("");
  const [acTitle, setAcTitle] = useState("");
  const [acStartDate, setAcStartDate] = useState("");
  const [acEndDate, setAcEndDate] = useState("");
  const [acSupplier, setAcSupplier] = useState("");
  const [acDescription, setAcDescription] = useState("");
  const [selectedMs, setSelectedMs] = useState<string>("");

  useEffect(() => {
    if (!selectedMs && props.milestones.length) setSelectedMs(props.milestones[0].tempId);
  }, [props.milestones.length]);

  return (
    <div style={{ padding: 14, display: "grid", gap: 14 }}>
      <SectionTitle title="KEY Projects" subtitle="Disponível para projetos com orçamento igual ou superior a R$ 1.000.000,00." />

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input value={msTitle} onChange={(e) => setMsTitle(e.target.value)} placeholder="Nome do marco" style={wizardLayoutStyles.input} />
          <Button tone="primary" disabled={props.readOnly || !msTitle.trim()} onClick={() => {
            const next = [...props.milestones, { tempId: uid("ms"), Title: msTitle.trim().toUpperCase() }];
            props.onChange({ milestones: next });
            setMsTitle("");
            if (!selectedMs) setSelectedMs(next[0].tempId);
          }}>Adicionar Marco</Button>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select value={selectedMs} onChange={(e) => setSelectedMs(e.target.value)} disabled={props.readOnly || props.milestones.length === 0} style={{ ...wizardLayoutStyles.input, width: 260 }}>
            <option value="">Selecione o marco...</option>
            {props.milestones.map((m) => <option key={m.tempId} value={m.tempId}>{m.Title}</option>)}
          </select>

          <input value={acTitle} onChange={(e) => setAcTitle(e.target.value)} placeholder="Título da atividade" style={wizardLayoutStyles.input} />

          <input type="date" value={acStartDate} onChange={(e) => setAcStartDate(e.target.value)} style={{ ...wizardLayoutStyles.input, width: 170 }} />

          <input type="date" value={acEndDate} onChange={(e) => setAcEndDate(e.target.value)} style={{ ...wizardLayoutStyles.input, width: 170 }} />

          <input value={acSupplier} onChange={(e) => setAcSupplier(e.target.value)} placeholder="Fornecedor" style={{ ...wizardLayoutStyles.input, width: 220 }} />

          <input value={acDescription} onChange={(e) => setAcDescription(e.target.value)} placeholder="Descrição geral da atividade" style={{ ...wizardLayoutStyles.input, width: 260 }} />

          <Button tone="primary" disabled={props.readOnly || !selectedMs || !acTitle.trim()} onClick={() => {
            props.onChange({
              activities: [
                ...props.activities,
                {
                  tempId: uid("ac"),
                  Title: acTitle.trim().toUpperCase(),
                  milestoneTempId: selectedMs,
                  startDate: acStartDate || undefined,
                  endDate: acEndDate || undefined,
                  supplier: acSupplier.trim() || undefined,
                  activityDescription: acDescription.trim() || undefined
                }
              ]
            });
            setAcTitle("");
            setAcStartDate("");
            setAcEndDate("");
            setAcSupplier("");
            setAcDescription("");
          }}>Adicionar Atividade</Button>
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
            return <div key={a.tempId} style={wizardLayoutStyles.row}><b>{a.Title}</b><div style={{ fontSize: 12, color: "#6b7280" }}>{ms?.Title ?? "(marco não informado)"}</div><div style={{ fontSize: 12, color: "#6b7280" }}>{a.startDate ?? ""}{a.endDate ? ` → ${a.endDate}` : ""}{a.supplier ? ` • ${a.supplier}` : ""}</div></div>;
          })}
        </div>
      </div>
    </div>
  );
}
