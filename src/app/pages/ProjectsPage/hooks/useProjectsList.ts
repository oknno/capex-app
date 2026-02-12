import { useCallback, useMemo, useState } from "react";

import { getProjectsPage } from "../../../../services/sharepoint/projectsApi";
import type { ProjectRow } from "../../../../services/sharepoint/projectsApi";
import type { ProjectsFilters } from "../CommandBar";

export type LoadState = "idle" | "loading" | "error";

const PAGE_SIZE = 15;

export function useProjectsList(initialFilters: ProjectsFilters) {
  const [items, setItems] = useState<ProjectRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [nextLink, setNextLink] = useState<string | undefined>(undefined);
  const [state, setState] = useState<LoadState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [filters, setFilters] = useState<ProjectsFilters>(initialFilters);

  const selected = useMemo(() => items.find((x) => x.Id === selectedId) ?? null, [items, selectedId]);

  const loadFirstPage = useCallback(async () => {
    setState("loading");
    setErrorMsg("");
    setSelectedId(null);

    try {
      const res = await getProjectsPage({
        top: PAGE_SIZE,
        searchTitle: filters.searchTitle,
        statusEquals: filters.status || undefined,
        unitEquals: filters.unit || undefined,
        orderBy: filters.sortBy,
        orderDir: filters.sortDir
      });

      setItems(res.items);
      setNextLink(res.nextLink);
      setState("idle");
    } catch (e: any) {
      setState("error");
      setErrorMsg(e?.message ? String(e.message) : "Erro ao carregar Projects.");
      console.error(e);
    }
  }, [filters]);

  const loadMore = useCallback(async () => {
    if (!nextLink) return;

    setState("loading");
    setErrorMsg("");

    try {
      const res = await getProjectsPage({ nextLink });
      setItems((prev) => prev.concat(res.items));
      setNextLink(res.nextLink);
      setState("idle");
    } catch (e: any) {
      setState("error");
      setErrorMsg(e?.message ? String(e.message) : "Erro ao carregar mais Projects.");
      console.error(e);
    }
  }, [nextLink]);

  const clearFilters = useCallback(() => {
    setFilters({ searchTitle: "", status: "", unit: "", sortBy: "Id", sortDir: "desc" });
  }, []);

  return {
    items,
    selected,
    selectedId,
    setSelectedId,
    nextLink,
    state,
    errorMsg,
    filters,
    setFilters,
    clearFilters,
    loadFirstPage,
    loadMore
  };
}
