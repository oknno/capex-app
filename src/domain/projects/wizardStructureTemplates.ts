import type { OperationalCategory, OperationalComplexity } from "./operationalStructureCatalog";

export type StructureTemplateSeedKey = `${OperationalCategory}:${OperationalComplexity}`;

type ActivityTemplateItem = {
  title: string;
  placeholder: string;
};

const DEFAULT_ACTIVITY_TEMPLATE: readonly ActivityTemplateItem[] = [
  { title: "Planejamento", placeholder: "Planejamento" },
  { title: "Execução", placeholder: "Execução" },
  { title: "Validação", placeholder: "Validação" }
] as const;

const ACTIVITY_TEMPLATES_BY_CATEGORY_AND_MILESTONE: Partial<Record<OperationalCategory, Record<string, readonly ActivityTemplateItem[]>>> = {
  aquisicao_e_instalacao_industrial: {
    "DEFINIÇÃO TÉCNICA": [
      { title: "Levantar necessidade operacional", placeholder: "Levantar necessidade operacional" },
      { title: "Definir especificação do equipamento", placeholder: "Definir especificação do equipamento" },
      { title: "Validar capacidade, dimensões e requisitos técnicos", placeholder: "Validar capacidade, dimensões e requisitos técnicos" },
      { title: "Mapear interfaces com equipamentos existentes", placeholder: "Mapear interfaces com equipamentos existentes" },
      { title: "Validar solução com operação/manutenção", placeholder: "Validar solução com operação/manutenção" }
    ],
    "APROVAÇÃO E LIBERAÇÃO": [
      { title: "Validar escopo técnico", placeholder: "Validar escopo técnico" },
      { title: "Validar orçamento CAPEX", placeholder: "Validar orçamento CAPEX" },
      { title: "Confirmar enquadramento do investimento", placeholder: "Confirmar enquadramento do investimento" },
      { title: "Obter aprovação técnica/financeira", placeholder: "Obter aprovação técnica/financeira" },
      { title: "Liberar aquisição", placeholder: "Liberar aquisição" }
    ],
    "AQUISIÇÃO": [
      { title: "Solicitar cotações", placeholder: "Solicitar cotações" },
      { title: "Equalizar propostas técnicas", placeholder: "Equalizar propostas técnicas" },
      { title: "Equalizar propostas comerciais", placeholder: "Equalizar propostas comerciais" },
      { title: "Definir fornecedor", placeholder: "Definir fornecedor" },
      { title: "Emitir pedido de compra", placeholder: "Emitir pedido de compra" }
    ],
    "FABRICAÇÃO / ENTREGA": [
      { title: "Acompanhar fabricação", placeholder: "Acompanhar fabricação" },
      { title: "Realizar follow-up com fornecedor", placeholder: "Realizar follow-up com fornecedor" },
      { title: "Validar documentação técnica", placeholder: "Validar documentação técnica" },
      { title: "Planejar transporte", placeholder: "Planejar transporte" },
      { title: "Receber equipamento na unidade", placeholder: "Receber equipamento na unidade" }
    ],
    "INSTALAÇÃO": [
      { title: "Preparar área de instalação", placeholder: "Preparar área de instalação" },
      { title: "Mobilizar equipe ou fornecedor", placeholder: "Mobilizar equipe ou fornecedor" },
      { title: "Executar instalação mecânica/elétrica", placeholder: "Executar instalação mecânica/elétrica" },
      { title: "Integrar equipamento ao processo", placeholder: "Integrar equipamento ao processo" },
      { title: "Registrar pendências de campo", placeholder: "Registrar pendências de campo" }
    ],
    "COMISSIONAMENTO E START-UP": [
      { title: "Realizar testes funcionais", placeholder: "Realizar testes funcionais" },
      { title: "Realizar testes operacionais", placeholder: "Realizar testes operacionais" },
      { title: "Validar desempenho do equipamento", placeholder: "Validar desempenho do equipamento" },
      { title: "Corrigir pendências", placeholder: "Corrigir pendências" },
      { title: "Liberar equipamento para uso", placeholder: "Liberar equipamento para uso" }
    ]
  },
  manutencao_industrial_pesada: {
    "DIAGNÓSTICO TÉCNICO": [
      { title: "Inspecionar ativo/equipamento", placeholder: "Inspecionar ativo/equipamento" },
      { title: "Identificar falhas ou degradações", placeholder: "Identificar falhas ou degradações" },
      { title: "Avaliar criticidade operacional", placeholder: "Avaliar criticidade operacional" },
      { title: "Levantar histórico de manutenção", placeholder: "Levantar histórico de manutenção" },
      { title: "Definir escopo da intervenção", placeholder: "Definir escopo da intervenção" }
    ],
    "PLANEJAMENTO DA INTERVENÇÃO": [
      { title: "Definir janela de parada", placeholder: "Definir janela de parada" },
      { title: "Planejar recursos necessários", placeholder: "Planejar recursos necessários" },
      { title: "Elaborar cronograma da intervenção", placeholder: "Elaborar cronograma da intervenção" },
      { title: "Mapear riscos de segurança/operação", placeholder: "Mapear riscos de segurança/operação" },
      { title: "Validar plano com operação/manutenção", placeholder: "Validar plano com operação/manutenção" }
    ],
    "CONTRATAÇÃO E MATERIAIS": [
      { title: "Definir materiais e sobressalentes", placeholder: "Definir materiais e sobressalentes" },
      { title: "Verificar disponibilidade em estoque", placeholder: "Verificar disponibilidade em estoque" },
      { title: "Solicitar compras necessárias", placeholder: "Solicitar compras necessárias" },
      { title: "Contratar serviços especializados", placeholder: "Contratar serviços especializados" },
      { title: "Confirmar prazos de entrega", placeholder: "Confirmar prazos de entrega" }
    ],
    "EXECUÇÃO DA INTERVENÇÃO": [
      { title: "Mobilizar equipe e recursos", placeholder: "Mobilizar equipe e recursos" },
      { title: "Isolar equipamento ou área", placeholder: "Isolar equipamento ou área" },
      { title: "Executar desmontagem/reparo/substituição", placeholder: "Executar desmontagem/reparo/substituição" },
      { title: "Acompanhar avanço físico", placeholder: "Acompanhar avanço físico" },
      { title: "Registrar desvios de execução", placeholder: "Registrar desvios de execução" }
    ],
    "TESTES E RETORNO OPERACIONAL": [
      { title: "Realizar inspeção pós-intervenção", placeholder: "Realizar inspeção pós-intervenção" },
      { title: "Executar testes funcionais", placeholder: "Executar testes funcionais" },
      { title: "Validar segurança operacional", placeholder: "Validar segurança operacional" },
      { title: "Acompanhar retorno à operação", placeholder: "Acompanhar retorno à operação" },
      { title: "Liberar equipamento para produção", placeholder: "Liberar equipamento para produção" }
    ],
    "ENCERRAMENTO TÉCNICO": [
      { title: "Consolidar evidências da intervenção", placeholder: "Consolidar evidências da intervenção" },
      { title: "Registrar aceite da manutenção", placeholder: "Registrar aceite da manutenção" },
      { title: "Atualizar documentação técnica", placeholder: "Atualizar documentação técnica" },
      { title: "Registrar lições aprendidas", placeholder: "Registrar lições aprendidas" },
      { title: "Encerrar projeto no sistema", placeholder: "Encerrar projeto no sistema" }
    ]
  },
  obras_civis_e_infraestrutura_industrial: {
    "LEVANTAMENTO DE CAMPO": [
      { title: "Levantar medidas do local", placeholder: "Levantar medidas do local" },
      { title: "Avaliar condições físicas da área", placeholder: "Avaliar condições físicas da área" },
      { title: "Identificar interferências existentes", placeholder: "Identificar interferências existentes" },
      { title: "Verificar acessos para execução", placeholder: "Verificar acessos para execução" },
      { title: "Registrar fotos/evidências", placeholder: "Registrar fotos/evidências" }
    ],
    "ENGENHARIA E PROJETO": [
      { title: "Elaborar projeto civil", placeholder: "Elaborar projeto civil" },
      { title: "Desenvolver desenhos técnicos", placeholder: "Desenvolver desenhos técnicos" },
      { title: "Validar fundações, cargas e estruturas", placeholder: "Validar fundações, cargas e estruturas" },
      { title: "Compatibilizar disciplinas envolvidas", placeholder: "Compatibilizar disciplinas envolvidas" },
      { title: "Aprovar projeto técnico", placeholder: "Aprovar projeto técnico" }
    ],
    "CONTRATAÇÃO": [
      { title: "Elaborar escopo de contratação", placeholder: "Elaborar escopo de contratação" },
      { title: "Solicitar propostas de fornecedores", placeholder: "Solicitar propostas de fornecedores" },
      { title: "Equalizar propostas técnicas/comerciais", placeholder: "Equalizar propostas técnicas/comerciais" },
      { title: "Definir empresa executora", placeholder: "Definir empresa executora" },
      { title: "Emitir pedido ou contrato", placeholder: "Emitir pedido ou contrato" }
    ],
    "EXECUÇÃO DA OBRA": [
      { title: "Mobilizar frente de serviço", placeholder: "Mobilizar frente de serviço" },
      { title: "Preparar área", placeholder: "Preparar área" },
      { title: "Executar fundações, bases ou estruturas", placeholder: "Executar fundações, bases ou estruturas" },
      { title: "Acompanhar avanço físico", placeholder: "Acompanhar avanço físico" },
      { title: "Controlar segurança da obra", placeholder: "Controlar segurança da obra" }
    ],
    "INSPEÇÃO E QUALIDADE": [
      { title: "Realizar inspeções técnicas", placeholder: "Realizar inspeções técnicas" },
      { title: "Validar conformidade com projeto", placeholder: "Validar conformidade com projeto" },
      { title: "Registrar não conformidades", placeholder: "Registrar não conformidades" },
      { title: "Solicitar correções", placeholder: "Solicitar correções" },
      { title: "Aprovar qualidade final da obra", placeholder: "Aprovar qualidade final da obra" }
    ],
    "ENTREGA DA OBRA": [
      { title: "Realizar vistoria final", placeholder: "Realizar vistoria final" },
      { title: "Formalizar aceite da área", placeholder: "Formalizar aceite da área" },
      { title: "Entregar documentação técnica", placeholder: "Entregar documentação técnica" },
      { title: "Liberar área para uso", placeholder: "Liberar área para uso" },
      { title: "Encerrar serviço/projeto", placeholder: "Encerrar serviço/projeto" }
    ]
  },
  adequacao_normativa_seguranca_e_meio_ambiente: {
    "DIAGNÓSTICO DE CONFORMIDADE": [
      { title: "Identificar requisito legal/normativo", placeholder: "Identificar requisito legal/normativo" },
      { title: "Avaliar situação atual", placeholder: "Avaliar situação atual" },
      { title: "Levantar gaps de conformidade", placeholder: "Levantar gaps de conformidade" },
      { title: "Classificar criticidade do risco", placeholder: "Classificar criticidade do risco" },
      { title: "Registrar evidências da condição atual", placeholder: "Registrar evidências da condição atual" }
    ],
    "SOLUÇÃO TÉCNICA": [
      { title: "Definir alternativa técnica", placeholder: "Definir alternativa técnica" },
      { title: "Validar solução com Segurança/Meio Ambiente/Compliance", placeholder: "Validar solução com Segurança/Meio Ambiente/Compliance" },
      { title: "Estimar custo da adequação", placeholder: "Estimar custo da adequação" },
      { title: "Definir escopo de implantação", placeholder: "Definir escopo de implantação" },
      { title: "Avaliar impacto operacional", placeholder: "Avaliar impacto operacional" }
    ],
    "APROVAÇÃO E CONTRATAÇÃO": [
      { title: "Validar orçamento CAPEX", placeholder: "Validar orçamento CAPEX" },
      { title: "Aprovar escopo com áreas responsáveis", placeholder: "Aprovar escopo com áreas responsáveis" },
      { title: "Solicitar propostas", placeholder: "Solicitar propostas" },
      { title: "Contratar serviço ou comprar materiais", placeholder: "Contratar serviço ou comprar materiais" },
      { title: "Liberar execução", placeholder: "Liberar execução" }
    ],
    "IMPLANTAÇÃO": [
      { title: "Mobilizar fornecedor/equipe interna", placeholder: "Mobilizar fornecedor/equipe interna" },
      { title: "Executar adequação em campo", placeholder: "Executar adequação em campo" },
      { title: "Acompanhar avanço físico", placeholder: "Acompanhar avanço físico" },
      { title: "Controlar riscos de segurança", placeholder: "Controlar riscos de segurança" },
      { title: "Registrar pendências", placeholder: "Registrar pendências" }
    ],
    "VALIDAÇÃO DE CONFORMIDADE": [
      { title: "Realizar inspeção final", placeholder: "Realizar inspeção final" },
      { title: "Validar aderência ao requisito", placeholder: "Validar aderência ao requisito" },
      { title: "Coletar laudos/certificados/evidências", placeholder: "Coletar laudos/certificados/evidências" },
      { title: "Corrigir não conformidades", placeholder: "Corrigir não conformidades" },
      { title: "Obter aceite da área responsável", placeholder: "Obter aceite da área responsável" }
    ],
    "ENCERRAMENTO E EVIDÊNCIAS": [
      { title: "Arquivar documentação comprobatória", placeholder: "Arquivar documentação comprobatória" },
      { title: "Registrar aceite final", placeholder: "Registrar aceite final" },
      { title: "Atualizar controles internos", placeholder: "Atualizar controles internos" },
      { title: "Encerrar pendências", placeholder: "Encerrar pendências" },
      { title: "Encerrar projeto no sistema", placeholder: "Encerrar projeto no sistema" }
    ]
  }
};

export function makeStructureTemplateSeedKey(category: OperationalCategory, complexity: OperationalComplexity): StructureTemplateSeedKey {
  return `${category}:${complexity}`;
}

export function buildSuggestedActivitiesByMilestone(seedKey: StructureTemplateSeedKey, milestoneTitles: readonly string[]) {
  const [category] = seedKey.split(":") as [OperationalCategory, OperationalComplexity];
  const categoryMap = ACTIVITY_TEMPLATES_BY_CATEGORY_AND_MILESTONE[category] ?? {};

  return milestoneTitles.reduce<Record<string, ActivityTemplateItem[]>>((acc, milestoneTitle) => {
    const key = milestoneTitle.toUpperCase();
    acc[key] = [...(categoryMap[key] ?? DEFAULT_ACTIVITY_TEMPLATE)];
    return acc;
  }, {});
}
