import type { OperationalCategory, OperationalComplexity } from "./operationalStructureCatalog";

export type StructureTemplateSeedKey = `${OperationalCategory}:${OperationalComplexity}`;

const DEFAULT_ACTIVITY_TEMPLATE = ["Planejamento", "Execução", "Validação"] as const;

const TEMPLATE_SEED_BY_KEY: Record<StructureTemplateSeedKey, readonly string[]> = {
  "aquisicao_e_instalacao_industrial:baixa": ["Definição técnica", "Aprovação e liberação"],
  "aquisicao_e_instalacao_industrial:media": ["Definição técnica", "Aquisição", "Fabricação / entrega"],
  "aquisicao_e_instalacao_industrial:alta": ["Definição técnica", "Aquisição", "Instalação", "Comissionamento e start-up"],
  "manutencao_industrial_pesada:baixa": ["Diagnóstico técnico", "Planejamento da intervenção"],
  "manutencao_industrial_pesada:media": ["Diagnóstico técnico", "Planejamento da intervenção", "Execução da intervenção"],
  "manutencao_industrial_pesada:alta": ["Diagnóstico técnico", "Planejamento da intervenção", "Execução da intervenção", "Testes e retorno operacional"],
  "obras_civis_e_infraestrutura_industrial:baixa": ["Levantamento de campo", "Engenharia e projeto"],
  "obras_civis_e_infraestrutura_industrial:media": ["Levantamento de campo", "Engenharia e projeto", "Execução da obra"],
  "obras_civis_e_infraestrutura_industrial:alta": ["Levantamento de campo", "Execução da obra", "Inspeção e qualidade", "Entrega da obra"],
  "adequacao_normativa_seguranca_e_meio_ambiente:baixa": ["Diagnóstico de conformidade", "Solução técnica"],
  "adequacao_normativa_seguranca_e_meio_ambiente:media": ["Diagnóstico de conformidade", "Solução técnica", "Implantação"],
  "adequacao_normativa_seguranca_e_meio_ambiente:alta": ["Diagnóstico de conformidade", "Solução técnica", "Validação de conformidade", "Encerramento e evidências"],
  "automacao_sistemas_e_digitalizacao_industrial:baixa": ["Levantamento de requisitos", "Desenvolvimento / configuração"],
  "automacao_sistemas_e_digitalizacao_industrial:media": ["Levantamento de requisitos", "Desenvolvimento / configuração", "Integração"],
  "automacao_sistemas_e_digitalizacao_industrial:alta": ["Levantamento de requisitos", "Desenvolvimento / configuração", "Implantação", "Go-live e estabilização"],
  "engenharia_estudos_e_viabilidade:baixa": ["Levantamento inicial", "Desenvolvimento técnico"],
  "engenharia_estudos_e_viabilidade:media": ["Levantamento inicial", "Desenvolvimento técnico", "Análise de viabilidade"],
  "engenharia_estudos_e_viabilidade:alta": ["Levantamento inicial", "Desenvolvimento técnico", "Revisão e validação", "Entrega técnica"],
  "infraestrutura_administrativa_ti_e_facilities:baixa": ["Definição da necessidade", "Especificação"],
  "infraestrutura_administrativa_ti_e_facilities:media": ["Definição da necessidade", "Aquisição / contratação", "Entrega / preparação"],
  "infraestrutura_administrativa_ti_e_facilities:alta": ["Definição da necessidade", "Aquisição / contratação", "Instalação / configuração", "Liberação para uso"]
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
