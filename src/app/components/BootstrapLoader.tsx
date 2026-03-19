export function BootstrapLoader(props: { title?: string; subtitle?: string }) {
  return (
    <div className="capex-bootstrap" role="status" aria-live="polite" aria-busy="true">
      <div className="capex-bootstrap__card">
        <div className="capex-bootstrap__eyebrow">CAPEX</div>
        <div className="capex-bootstrap__spinner" aria-hidden="true" />
        <h1 className="capex-bootstrap__title">{props.title ?? "Carregando CAPEX"}</h1>
        <p className="capex-bootstrap__subtitle">
          {props.subtitle ?? "Buscando projetos iniciais no SharePoint..."}
        </p>
      </div>
    </div>
  );
}
