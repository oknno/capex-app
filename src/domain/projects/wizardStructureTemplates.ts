import type { OperationalCategory, OperationalComplexity } from "./operationalStructureCatalog";

export type StructureTemplateSeedKey = `${OperationalCategory}:${OperationalComplexity}`;

const DEFAULT_ACTIVITY_TEMPLATE = ["Planejamento", "Execução", "Validação"] as const;

const TEMPLATE_SEED_BY_KEY: Record<StructureTemplateSeedKey, readonly string[]> = {
  "aquisicao_e_instalacao_industrial:baixa": ["Especificação", "Contratação"],
  "aquisicao_e_instalacao_industrial:media": ["Especificação", "Contratação", "Comissionamento"],
  "aquisicao_e_instalacao_industrial:alta": ["Especificação", "Contratação", "Instalação", "Comissionamento"],
  "manutencao_industrial_pesada:baixa": ["Inspeção", "Plano de intervenção"],
  "manutencao_industrial_pesada:media": ["Inspeção", "Plano de intervenção", "Execução"],
  "manutencao_industrial_pesada:alta": ["Inspeção", "Plano de intervenção", "Execução", "Partida assistida"],
  "obras_civis_e_estruturas:baixa": ["Levantamento de campo", "Execução civil"],
  "obras_civis_e_estruturas:media": ["Levantamento de campo", "Execução civil", "Controle de qualidade"],
  "obras_civis_e_estruturas:alta": ["Levantamento de campo", "Execução civil", "Controle de qualidade", "Entrega técnica"],
  "adequacao_normativa_seguranca:baixa": ["Gap assessment", "Ação corretiva"],
  "adequacao_normativa_seguranca:media": ["Gap assessment", "Ação corretiva", "Teste de conformidade"],
  "adequacao_normativa_seguranca:alta": ["Gap assessment", "Ação corretiva", "Teste de conformidade", "Validação final"],
  "automacao_sistemas_digital:baixa": ["Mapeamento", "Configuração"],
  "automacao_sistemas_digital:media": ["Mapeamento", "Configuração", "Integração"],
  "automacao_sistemas_digital:alta": ["Mapeamento", "Configuração", "Integração", "Go-live assistido"],
  "engenharia_e_estudos:baixa": ["Coleta de dados", "Análise técnica"],
  "engenharia_e_estudos:media": ["Coleta de dados", "Análise técnica", "Consolidação"],
  "engenharia_e_estudos:alta": ["Coleta de dados", "Análise técnica", "Consolidação", "Revisão interdisciplinar"],
  "grandes_projetos_complexos:baixa": ["Planejamento executivo", "Liberação"],
  "grandes_projetos_complexos:media": ["Planejamento executivo", "Liberação", "Coordenação de frentes"],
  "grandes_projetos_complexos:alta": ["Planejamento executivo", "Liberação", "Coordenação de frentes", "Integração final"]
};

export function makeStructureTemplateSeedKey(category: OperationalCategory, complexity: OperationalComplexity): StructureTemplateSeedKey {
  return `${category}:${complexity}`;
}

export function buildSuggestedActivitiesByMilestone(seedKey: StructureTemplateSeedKey, milestoneTitles: readonly string[]) {
  const seed = TEMPLATE_SEED_BY_KEY[seedKey] ?? DEFAULT_ACTIVITY_TEMPLATE;

  return milestoneTitles.reduce<Record<string, string[]>>((acc, milestoneTitle) => {
    acc[milestoneTitle.toUpperCase()] = seed.map((activityName) => `${milestoneTitle.toUpperCase()} - ${activityName.toUpperCase()}`);
    return acc;
  }, {});
}
