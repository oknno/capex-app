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
  const [selectedMs, setSelectedMs] = useState<string>("");

  useEffect(() => {
    if (!selectedMs && props.milestones.length) setSelectedMs(props.milestones[0].tempId);
  }, [props.milestones.length]);

  return (
    <div style={{ padding: 14, display: "grid", gap: 14 }}>
      <SectionTitle title="Estrutura (Milestones + Activities)" subtitle="Obrigatório para projetos ≥ 1.000.000." />

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input value={msTitle} onChange={(e) => setMsTitle(e.target.value)} placeholder="Novo milestone..." style={wizardLayoutStyles.input} />
          <Button tone="primary" disabled={props.readOnly || !msTitle.trim()} onClick={() => {
            const next = [...props.milestones, { tempId: uid("ms"), Title: msTitle.trim().toUpperCase() }];
            props.onChange({ milestones: next });
            setMsTitle("");
            if (!selectedMs) setSelectedMs(next[0].tempId);
          }}>Adicionar Milestone</Button>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select value={selectedMs} onChange={(e) => setSelectedMs(e.target.value)} disabled={props.readOnly || props.milestones.length === 0} style={{ ...wizardLayoutStyles.input, width: 260 }}>
            <option value="">Selecione milestone...</option>
            {props.milestones.map((m) => <option key={m.tempId} value={m.tempId}>{m.Title}</option>)}
          </select>

          <input value={acTitle} onChange={(e) => setAcTitle(e.target.value)} placeholder="Nova activity..." style={wizardLayoutStyles.input} />

          <Button tone="primary" disabled={props.readOnly || !selectedMs || !acTitle.trim()} onClick={() => {
            props.onChange({ activities: [...props.activities, { tempId: uid("ac"), Title: acTitle.trim().toUpperCase(), milestoneTempId: selectedMs }] });
            setAcTitle("");
          }}>Adicionar Activity</Button>
        </div>
      </div>

      <div style={wizardLayoutStyles.grid2}>
        <div style={wizardLayoutStyles.box}>
          <div style={wizardLayoutStyles.boxHead}>Milestones ({props.milestones.length})</div>
          {!props.milestones.length ? <div style={wizardLayoutStyles.empty}><StateMessage state="empty" message="Nenhum milestone." /></div> : props.milestones.map((m) => <div key={m.tempId} style={wizardLayoutStyles.row}>{m.Title}</div>)}
        </div>
        <div style={wizardLayoutStyles.box}>
          <div style={wizardLayoutStyles.boxHead}>Activities ({props.activities.length})</div>
          {!props.activities.length ? <div style={wizardLayoutStyles.empty}><StateMessage state="empty" message="Nenhuma activity." /></div> : props.activities.map((a) => {
            const ms = props.milestones.find((m) => m.tempId === a.milestoneTempId);
            return <div key={a.tempId} style={wizardLayoutStyles.row}><b>{a.Title}</b><div style={{ fontSize: 12, color: "#6b7280" }}>{ms?.Title ?? "(milestone?)"}</div></div>;
          })}
        </div>
      </div>
    </div>
  );
}
