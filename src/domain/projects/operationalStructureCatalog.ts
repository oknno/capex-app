export const OPERATIONAL_CATEGORIES = [
  "aquisicao_e_instalacao_industrial",
  "manutencao_industrial_pesada",
  "obras_civis_e_estruturas",
  "adequacao_normativa_seguranca",
  "automacao_sistemas_digital",
  "engenharia_e_estudos",
  "grandes_projetos_complexos"
] as const;

export type OperationalCategory = (typeof OPERATIONAL_CATEGORIES)[number];

export const OPERATIONAL_COMPLEXITIES = ["baixa", "media", "alta"] as const;

export type OperationalComplexity = (typeof OPERATIONAL_COMPLEXITIES)[number];

export const OPERATIONAL_MILESTONES_BY_CATEGORY: Record<OperationalCategory, readonly string[]> = {
  aquisicao_e_instalacao_industrial: ["Engenharia", "Aprovação", "Aquisição", "Fabricação / Entrega", "Instalação", "Start-up"],
  manutencao_industrial_pesada: ["Diagnóstico", "Planejamento", "Contratação / Materiais", "Execução", "Testes", "Encerramento"],
  obras_civis_e_estruturas: ["Levantamento", "Engenharia", "Contratação", "Execução", "Qualidade", "Entrega"],
  adequacao_normativa_seguranca: ["Diagnóstico", "Solução Técnica", "Contratação", "Implantação", "Validação", "Encerramento"],
  automacao_sistemas_digital: ["Requisitos", "Desenvolvimento", "Integração", "Implantação", "Homologação", "Go-live"],
  engenharia_e_estudos: ["Levantamento", "Desenvolvimento Técnico", "Revisão", "Aprovação", "Consolidação", "Entrega"],
  grandes_projetos_complexos: ["Conceituação", "Engenharia", "Aprovações", "Contratações", "Suprimentos", "Execução"]
} as const;

const MILESTONES_COUNT_BY_COMPLEXITY: Record<OperationalComplexity, number> = {
  baixa: 2,
  media: 4,
  alta: 6
};

export function buildOperationalMilestones(category: OperationalCategory, complexity: OperationalComplexity): string[] {
  const milestones = OPERATIONAL_MILESTONES_BY_CATEGORY[category];
  const count = MILESTONES_COUNT_BY_COMPLEXITY[complexity];
  return milestones.slice(0, count);
}
