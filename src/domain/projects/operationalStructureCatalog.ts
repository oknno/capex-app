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

const MILESTONE_INDEXES_BY_COMPLEXITY: Record<OperationalCategory, Record<OperationalComplexity, readonly number[]>> = {
  aquisicao_e_instalacao_industrial: {
    alta: [0, 1, 2, 3, 4, 5],
    media: [0, 2, 4, 5],
    baixa: [2, 5]
  },
  manutencao_industrial_pesada: {
    alta: [0, 1, 2, 3, 4, 5],
    media: [0, 1, 3, 5],
    baixa: [0, 5]
  },
  obras_civis_e_infraestrutura_industrial: {
    alta: [0, 1, 2, 3, 4, 5],
    media: [0, 1, 3, 5],
    baixa: [0, 5]
  },
  adequacao_normativa_seguranca_e_meio_ambiente: {
    alta: [0, 1, 2, 3, 4, 5],
    media: [0, 1, 3, 5],
    baixa: [0, 5]
  },
  automacao_sistemas_e_digitalizacao_industrial: {
    alta: [0, 1, 2, 3, 4, 5],
    media: [0, 1, 3, 5],
    baixa: [0, 5]
  },
  engenharia_estudos_e_viabilidade: {
    alta: [0, 1, 2, 3, 4, 5],
    media: [0, 1, 2, 5],
    baixa: [0, 5]
  },
  infraestrutura_administrativa_ti_e_facilities: {
    alta: [0, 1, 2, 3, 4, 5],
    media: [0, 2, 4, 5],
    baixa: [2, 5]
  }
};

export function buildOperationalMilestones(category: OperationalCategory, complexity: OperationalComplexity): string[] {
  const milestones = OPERATIONAL_MILESTONES_BY_CATEGORY[category];
  const indexes = MILESTONE_INDEXES_BY_COMPLEXITY[category][complexity];
  return indexes.map((index) => milestones[index]);
}
