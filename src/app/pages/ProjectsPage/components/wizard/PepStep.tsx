import { useEffect, useState } from "react";

import { toIntOrUndefined } from "../../../../../domain/projects/project.calculations";
import type { ActivityDraftLocal, MilestoneDraftLocal, PepDraftLocal } from "../../../../../domain/projects/project.validators";
import { SectionTitle, wizardLayoutStyles } from "./WizardUi";
import { Button } from "../../../../components/ui/Button";
import { StateMessage } from "../../../../components/ui/StateMessage";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function PepStep(props: {
  readOnly: boolean;
  needStructure: boolean;
  milestones: MilestoneDraftLocal[];
  activities: ActivityDraftLocal[];
  peps: PepDraftLocal[];
  defaultYear: number;
  onChange: (next: PepDraftLocal[]) => void;
  onValidationError: (message: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(String(props.defaultYear));
  const [amount, setAmount] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");

  useEffect(() => {
    if (!props.needStructure) return;
    if (!selectedActivity && props.activities.length) setSelectedActivity(props.activities[0].tempId);
  }, [props.needStructure, props.activities.length]);

  return (
    <div style={{ padding: 14, display: "grid", gap: 12 }}>
      <SectionTitle title="Elemento PEP" subtitle={props.needStructure ? "Projeto ≥ 1M: vincule cada PEP a uma atividade." : "Projeto < 1M: preencha apenas tipo, ano e valor do PEP."} />

      {props.needStructure && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)} disabled={props.readOnly || props.activities.length === 0} style={{ ...wizardLayoutStyles.input, width: 360 }}>
            <option value="">Selecione a atividade...</option>
            {props.activities.map((a) => {
              const ms = props.milestones.find((m) => m.tempId === a.milestoneTempId);
              return <option key={a.tempId} value={a.tempId}>{a.Title} — {ms?.Title ?? ""}</option>;
            })}
          </select>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tipo / Elemento PEP" style={{ ...wizardLayoutStyles.input, width: 280 }} />
        <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Ano do PEP" style={{ ...wizardLayoutStyles.input, width: 120 }} />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Valor do PEP (R$)" style={{ ...wizardLayoutStyles.input, width: 200 }} />

        <Button tone="primary" disabled={props.readOnly || !title.trim() || !year.trim() || !amount.trim() || (props.needStructure && !selectedActivity)} onClick={() => {
          const y = Number(year.trim());
          const amt = toIntOrUndefined(amount);
          if (!Number.isFinite(y)) return props.onValidationError("Ano inválido.");
          if (!amt || amt <= 0) return props.onValidationError("Valor do PEP inválido.");

          props.onChange([...props.peps, { tempId: uid("pp"), Title: title.trim(), year: y, amountBrl: amt, activityTempId: props.needStructure ? selectedActivity : undefined }]);
          setTitle("");
          setAmount("");
        }}>Adicionar PEP</Button>
      </div>

      <div style={wizardLayoutStyles.box}>
        <div style={wizardLayoutStyles.boxHead}>Elementos PEP ({props.peps.length})</div>
        {!props.peps.length ? <div style={wizardLayoutStyles.empty}><StateMessage state="empty" message="Nenhum elemento PEP cadastrado." /></div> : props.peps.map((p) => <div key={p.tempId} style={wizardLayoutStyles.row}><b>{p.Title}</b> • {p.year} • {p.amountBrl.toLocaleString("pt-BR")}</div>)}
      </div>
    </div>
  );
}
