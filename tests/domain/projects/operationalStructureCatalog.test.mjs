import assert from "node:assert/strict";
import test from "node:test";

import {
  OPERATIONAL_CATEGORIES,
  OPERATIONAL_COMPLEXITIES,
  OPERATIONAL_MILESTONES_BY_CATEGORY,
  buildOperationalMilestones
} from "../../../src/domain/projects/operationalStructureCatalog.ts";

const EXPECTED_COUNT = {
  baixa: 2,
  media: 4,
  alta: 6
};

const EXPECTED_MILESTONES_BY_CATEGORY = {
  aquisicao_e_instalacao_industrial: ["Engenharia", "Aprovação", "Aquisição", "Fabricação / Entrega", "Instalação", "Start-up"],
  manutencao_industrial_pesada: ["Diagnóstico", "Planejamento", "Contratação / Materiais", "Execução", "Testes", "Encerramento"],
  obras_civis_e_estruturas: ["Levantamento", "Engenharia", "Contratação", "Execução", "Qualidade", "Entrega"],
  adequacao_normativa_seguranca: ["Diagnóstico", "Solução Técnica", "Contratação", "Implantação", "Validação", "Encerramento"],
  automacao_sistemas_digital: ["Requisitos", "Desenvolvimento", "Integração", "Implantação", "Homologação", "Go-live"],
  engenharia_e_estudos: ["Levantamento", "Desenvolvimento Técnico", "Revisão", "Aprovação", "Consolidação", "Entrega"],
  grandes_projetos_complexos: ["Conceituação", "Engenharia", "Aprovações", "Contratações", "Suprimentos", "Execução"]
};

test("catálogo de marcos por categoria mantém os nomes exatos e ordem fixa", () => {
  assert.deepEqual(OPERATIONAL_MILESTONES_BY_CATEGORY, EXPECTED_MILESTONES_BY_CATEGORY);
});

for (const category of OPERATIONAL_CATEGORIES) {
  for (const complexity of OPERATIONAL_COMPLEXITIES) {
    test(`retorna marcos corretos para categoria=${category} e complexidade=${complexity}`, () => {
      const expected = EXPECTED_MILESTONES_BY_CATEGORY[category].slice(0, EXPECTED_COUNT[complexity]);

      const result = buildOperationalMilestones(category, complexity);

      assert.equal(result.length, EXPECTED_COUNT[complexity]);
      assert.deepEqual(result, expected);
    });
  }
}
