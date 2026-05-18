export const OPERATIONAL_CATEGORIES = [
  "aquisicao_e_instalacao_industrial",
  "manutencao_industrial_pesada",
  "obras_civis_e_infraestrutura_industrial",
  "adequacao_normativa_seguranca_e_meio_ambiente",
  "automacao_sistemas_e_digitalizacao_industrial",
  "engenharia_estudos_e_viabilidade",
  "infraestrutura_administrativa_ti_e_facilities"
] as const;

export type OperationalCategory = (typeof OPERATIONAL_CATEGORIES)[number];

export const OPERATIONAL_COMPLEXITIES = ["baixa", "media", "alta"] as const;

export type OperationalComplexity = (typeof OPERATIONAL_COMPLEXITIES)[number];

export const OPERATIONAL_MILESTONES_BY_CATEGORY: Record<OperationalCategory, readonly string[]> = {
  aquisicao_e_instalacao_industrial: ["Definição Técnica", "Aprovação e Liberação", "Aquisição", "Fabricação / Entrega", "Instalação", "Comissionamento e Start-up"],
  manutencao_industrial_pesada: ["Diagnóstico Técnico", "Planejamento da Intervenção", "Contratação e Materiais", "Execução da Intervenção", "Testes e Retorno Operacional", "Encerramento Técnico"],
  obras_civis_e_infraestrutura_industrial: ["Levantamento de Campo", "Engenharia e Projeto", "Contratação", "Execução da Obra", "Inspeção e Qualidade", "Entrega da Obra"],
  adequacao_normativa_seguranca_e_meio_ambiente: ["Diagnóstico de Conformidade", "Solução Técnica", "Aprovação e Contratação", "Implantação", "Validação de Conformidade", "Encerramento e Evidências"],
  automacao_sistemas_e_digitalizacao_industrial: ["Levantamento de Requisitos", "Desenvolvimento / Configuração", "Integração", "Implantação", "Homologação", "Go-live e Estabilização"],
  engenharia_estudos_e_viabilidade: ["Levantamento Inicial", "Desenvolvimento Técnico", "Análise de Viabilidade", "Revisão e Validação", "Aprovação", "Entrega Técnica"],
  infraestrutura_administrativa_ti_e_facilities: ["Definição da Necessidade", "Especificação", "Aquisição / Contratação", "Entrega / Preparação", "Instalação / Configuração", "Liberação para Uso"]
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
