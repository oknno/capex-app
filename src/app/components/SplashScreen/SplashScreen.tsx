import { useEffect, useState } from "react";
import arcelorMittalLogo from "../../../assets/branding/arcelormittal-logo.svg";
import splashBuilding from "../../../assets/splash/splash-building.webp";
import "./SplashScreen.css";

type SplashScreenProps = {
  onExitStart?: () => void;
  onFinish?: () => void;
};

const splashDurationInMs = 3000;
const splashExitDurationInMs = 560;

export function SplashScreen({ onExitStart, onFinish }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [hasLogoError, setHasLogoError] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    const exitTimer = window.setTimeout(() => {
      setIsExiting(true);
      onExitStart?.();
    }, splashDurationInMs);

    const finishTimer = window.setTimeout(() => {
      onFinish?.();
    }, splashDurationInMs + splashExitDurationInMs);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(finishTimer);
    };
  }, [onExitStart, onFinish]);

  return (
    <div className={`capex-splash${isExiting ? " capex-splash--exit" : ""}`} aria-label="Carregando sistema CAPEX">
      <div className="capex-splash__content">
        <header className="capex-splash__brand" aria-label="ArcelorMittal">
          {hasLogoError ? (
            <span className="capex-splash__brandFallback" aria-hidden="true">
              ArcelorMittal
            </span>
          ) : (
            <img
              className="capex-splash__logo"
              src={arcelorMittalLogo}
              alt="ArcelorMittal"
              onError={() => setHasLogoError(true)}
            />
          )}
        </header>

        <section className="capex-splash__titleBlock" aria-live="polite">
          <p className="capex-splash__eyebrow">SISTEMA CORPORATIVO</p>
          <h1>Cadastro de Projetos CAPEX</h1>
          <p>Gestão e Controle de Projetos</p>
          <div className="capex-splash__progress" aria-hidden="true" />
        </section>

        <section className="capex-splash__visual" aria-hidden="true">
          <div className="capex-splash__visualFrame">
            {hasImageError ? (
              <div className="capex-splash__image capex-splash__imageFallback" />
            ) : (
              <img
                className="capex-splash__image"
                src={splashBuilding}
                alt=""
                onError={() => setHasImageError(true)}
              />
            )}
          </div>
        </section>

        <span className="capex-splash__curve capex-splash__curve--primary" aria-hidden="true" />
        <span className="capex-splash__curve capex-splash__curve--secondary" aria-hidden="true" />
        <span className="capex-splash__line capex-splash__line--top" aria-hidden="true" />
        <span className="capex-splash__line capex-splash__line--bottom" aria-hidden="true" />

        <p className="capex-splash__credits">Desenvolvido por Gerência de CAPEX</p>
      </div>
    </div>
  );
}
