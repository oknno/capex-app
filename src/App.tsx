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

const INITIAL_FILTERS = {
  searchTitle: "",
  status: "",
  unit: "",
  sortBy: "Id" as const,
  sortDir: "desc" as const
};

export default function App() {
  const [bootState, setBootState] = useState<BootState>("loading");
  const [bootstrapData, setBootstrapData] = useState<BootstrapData>({ items: [] });
  const [bootError, setBootError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setBootState("loading");
      setBootError("");

      try {
        const result = await getProjectsPage({
          top: 15,
          searchTitle: INITIAL_FILTERS.searchTitle,
          statusEquals: INITIAL_FILTERS.status || undefined,
          unitEquals: INITIAL_FILTERS.unit || undefined,
          orderBy: INITIAL_FILTERS.sortBy,
          orderDir: INITIAL_FILTERS.sortDir
        });

        if (cancelled) return;
        setBootstrapData(result);
        setBootState("ready");
      } catch (error) {
        console.error(error);
        if (cancelled) return;
        setBootError("Não foi possível carregar os projetos iniciais. Tente novamente em instantes.");
        setBootState("error");
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const mainContent = useMemo(() => {
    if (bootState === "loading") {
      return (
        <BootstrapLoader
          title="Carregando CAPEX"
          subtitle="Conectando ao SharePoint e carregando projetos..."
        />
      );
    }

    if (bootState === "error") {
      return (
        <BootstrapLoader
          title="Falha ao iniciar o CAPEX"
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
  }, [bootError, bootState, bootstrapData.items, bootstrapData.nextLink]);

  return (
    <ToastProvider>
      <div className="capex-app">
        <main className="capex-container">{mainContent}</main>
      </div>
    </ToastProvider>
  );
}
