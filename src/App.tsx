import { useEffect, useMemo, useState } from "react";

import "./index.css";
import { getProjectsPage } from "./services/sharepoint/projectsApi";
import type { ProjectRow } from "./services/sharepoint/projectsApi";
import { ProjectsPage } from "./app/pages/ProjectsPage/ProjectsPage";
import { BootstrapLoader } from "./app/components/BootstrapLoader";
import { ToastProvider } from "./app/components/notifications/ToastProvider";

type BootState = "loading" | "ready" | "error";

type BootstrapData = {
  items: ProjectRow[];
  nextLink?: string;
};

const DEFAULT_MIN_BOOT_DURATION_MS_NON_PROD = 3000;
const LOADING_TITLES = ["Carregando projetos", "Carregando atividades", "Carregando KPIs"];
const LOADING_TITLE_INTERVAL_MS = 1000;

const INITIAL_FILTERS = {
  searchTitle: "",
  status: "",
  unit: "",
  sortBy: "Id" as const,
  sortDir: "desc" as const
};

function getMinBootDurationMs() {
  const rawValue = import.meta.env.VITE_MIN_BOOT_DURATION_MS;
  const parsedValue = Number(rawValue);
  const fallback = import.meta.env.PROD ? 0 : DEFAULT_MIN_BOOT_DURATION_MS_NON_PROD;

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return fallback;
  }

  return parsedValue;
}

export default function App() {
  const [bootState, setBootState] = useState<BootState>("loading");
  const [bootstrapData, setBootstrapData] = useState<BootstrapData>({ items: [] });
  const [bootError, setBootError] = useState("");
  const [loadingTitleIndex, setLoadingTitleIndex] = useState(0);
  const minBootDurationMs = getMinBootDurationMs();

  useEffect(() => {
    if (bootState !== "loading") return;

    const intervalId = window.setInterval(() => {
      setLoadingTitleIndex((currentIndex) => (currentIndex + 1) % LOADING_TITLES.length);
    }, LOADING_TITLE_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [bootState]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const bootStartedAt = Date.now();
      setBootState("loading");
      setBootError("");
      setLoadingTitleIndex(0);

      try {
        const result = await getProjectsPage({
          top: 15,
          searchTitle: INITIAL_FILTERS.searchTitle,
          statusEquals: INITIAL_FILTERS.status || undefined,
          unitEquals: INITIAL_FILTERS.unit || undefined,
          orderBy: INITIAL_FILTERS.sortBy,
          orderDir: INITIAL_FILTERS.sortDir
        });

        const remainingDelay = Math.max(0, minBootDurationMs - (Date.now() - bootStartedAt));
        if (remainingDelay > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, remainingDelay));
        }

        if (cancelled) return;
        setBootstrapData(result);
        setBootState("ready");
      } catch (error) {
        console.error(error);

        const remainingDelay = Math.max(0, minBootDurationMs - (Date.now() - bootStartedAt));
        if (remainingDelay > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, remainingDelay));
        }

        if (cancelled) return;
        setBootError("Não foi possível carregar os projetos iniciais. Tente novamente em instantes.");
        setBootState("error");
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [minBootDurationMs]);

  const mainContent = useMemo(() => {
    if (bootState === "loading") {
      return (
        <BootstrapLoader
          title={LOADING_TITLES[loadingTitleIndex]}
          subtitle="Conectando ao SharePoint..."
        />
      );
    }

    if (bootState === "error") {
      return (
        <BootstrapLoader
          title="Falha ao iniciar"
          subtitle={bootError || "Não foi possível conectar ao SharePoint no carregamento inicial."}
        />
      );
    }

    return (
      <ProjectsPage
        initialItems={bootstrapData.items}
        initialNextLink={bootstrapData.nextLink}
        skipInitialLoad
      />
    );
  }, [bootError, bootState, bootstrapData.items, bootstrapData.nextLink, loadingTitleIndex]);

  return (
    <ToastProvider>
      <div className="capex-app">
        <main className="capex-container">{mainContent}</main>
      </div>
    </ToastProvider>
  );
}
