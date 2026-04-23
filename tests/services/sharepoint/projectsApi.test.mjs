import assert from "node:assert/strict";
import test from "node:test";

import {
  buildProjectsQueryPlan,
  mergeProjectChunkResults,
  UnitFilterLimitError
} from "../../../src/services/sharepoint/projectsQueryPlanner.ts";

test("buildProjectsQueryPlan mantém GET simples com poucas unidades", () => {
  const plan = buildProjectsQueryPlan({
    top: 15,
    orderExpr: "Id desc",
    searchTitle: "CAPEX",
    unitIn: ["U1", "U2", "U3"]
  });

  assert.equal(plan.mode, "single");
  assert.match(plan.filters ?? "", /substringof\('CAPEX',Title\)/);
  assert.match(plan.filters ?? "", /unit eq 'U1'/);
  assert.match(plan.filters ?? "", /unit eq 'U3'/);
});

test("buildProjectsQueryPlan entra em modo chunked com muitas unidades", () => {
  const units = Array.from({ length: 33 }, (_, idx) => `UNIT-${idx + 1}`);

  const plan = buildProjectsQueryPlan({
    top: 15,
    orderExpr: "Id desc",
    statusEquals: "Aprovado",
    unitIn: units
  });

  assert.equal(plan.mode, "chunked");
  assert.equal(plan.chunkFilters.length, 3);
  assert.match(plan.chunkFilters[0], /status eq 'Aprovado'/);
  assert.match(plan.chunkFilters[2], /UNIT-33/);
});

test("mergeProjectChunkResults deduplica, ordena e aplica top final", () => {
  const merged = mergeProjectChunkResults({
    chunks: [
      [
        { Id: 2, Title: "Projeto B", approvalYear: 2024 },
        { Id: 9, Title: "Projeto Z", approvalYear: 2025 }
      ],
      [
        { Id: 2, Title: "Projeto B duplicado", approvalYear: 2023 },
        { Id: 5, Title: "Projeto M", approvalYear: 2026 }
      ]
    ],
    orderBy: "Id",
    orderDir: "desc",
    top: 2
  });

  assert.deepEqual(
    merged.map((item) => item.Id),
    [9, 5]
  );
});

test("buildProjectsQueryPlan lança erro específico quando limite de unidades é excedido", () => {
  const units = Array.from({ length: 181 }, (_, idx) => `UNIT-${idx + 1}`);

  assert.throws(
    () =>
      buildProjectsQueryPlan({
        top: 15,
        orderExpr: "Id desc",
        unitIn: units
      }),
    (error) => error instanceof UnitFilterLimitError
  );
});
