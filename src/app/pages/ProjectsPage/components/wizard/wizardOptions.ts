export type SelectOption = { value: string; label: string };

import { COMPANY_CENTER_UNIT_LOCATION_MAP } from "./companyStructure";

export const EXCHANGE_RATE = 5.4;

export const FUNDING_SOURCE_OPTIONS: SelectOption[] = [
  { value: "BUDGET", label: "BUDGET" },
  { value: "EXTRA", label: "EXTRA" },
  { value: "REMANEJAMENTO", label: "REMANEJAMENTO" }
];

export const PROGRAM_OPTIONS: SelectOption[] = [
  { value: "ACELERAAI", label: "ACELERAAI" },
  { value: "INOVACAO", label: "INOVAÇÃO" },
  { value: "REGULAR", label: "REGULAR" }
];

export const COMPANY_OPTIONS: SelectOption[] = [
  ...Object.keys(COMPANY_CENTER_UNIT_LOCATION_MAP).map((company) => ({ value: company, label: company }))
];

export const CENTER_OPTIONS_BY_COMPANY: Record<string, SelectOption[]> = {
  ...Object.fromEntries(
    Object.entries(COMPANY_CENTER_UNIT_LOCATION_MAP).map(([company, centers]) => [
      company,
      Object.keys(centers).map((center) => ({ value: center, label: center }))
    ])
  )
};

export const UNIT_OPTIONS_BY_CENTER: Record<string, SelectOption[]> = Object.values(COMPANY_CENTER_UNIT_LOCATION_MAP).reduce<Record<string, SelectOption[]>>((acc, centers) => {
  for (const [center, details] of Object.entries(centers)) {
    acc[center] = details.units.map((unit) => ({ value: unit, label: unit }));
  }
  return acc;
}, {});

export const LOCATION_OPTIONS_BY_UNIT: Record<string, SelectOption[]> = Object.values(COMPANY_CENTER_UNIT_LOCATION_MAP).reduce<Record<string, SelectOption[]>>((acc, centers) => {
  for (const details of Object.values(centers)) {
    for (const unit of details.units) {
      const map = new Map((acc[unit] ?? []).map((option) => [option.value, option]));
      for (const location of details.locations) {
        map.set(location, { value: location, label: location });
      }
      acc[unit] = Array.from(map.values());
    }
  }
  return acc;
}, {});

export const CATEGORY_OPTIONS: SelectOption[] = [
  { value: "I1", label: "Cat 1 - Segurança" },
  { value: "I2", label: "Cat 2 - Crescimento" },
  { value: "I3", label: "Cat 3 - Modificações" },
  { value: "I4", label: "Cat 4 - Manutenção" },
  { value: "I5", label: "Cat 5 - Renovações" },
  { value: "I6", label: "Cat 6 - Meio Ambiente" },
  { value: "I7", label: "Cat 7 - Informatização" },
  { value: "I8", label: "Cat 8 - Pesquisa e Desenvolvimento" },
  { value: "I9", label: "Cat 9 - SPA e Requisitos Legais Crescimento" },
  { value: "J1", label: "Cat 10 - SPA e Req. Legais Manut. e Meio Ambiente" },
  { value: "J2", label: "Cat 11 - Cilindros de Laminadores" },
  { value: "J3", label: "Cat 12 - Energia" }
];
export const INVESTMENT_TYPE_OPTIONS: SelectOption[] = [
  { value: "CILINDROS_E_DISCOS", label: "CILINDROS E DISCOS" },
  { value: "ESTRATEGICOS", label: "ESTRATÉGICOS" },
  { value: "NORMATIVO", label: "NORMATIVO" },
  { value: "RELINES_GRANDES_REFORMAS", label: "RELINES (GRANDES REFORMAS)" }
];

export const ASSET_TYPE_OPTIONS: SelectOption[] = [
  { value: "01", label: "01 - EDIFICAÇÕES/BENFEITORIAS EM IMÓVEIS PRÓPRIOS" },
  { value: "02", label: "02 - EDIFICAÇÕES/BENFEITORIAS EM IMÓVEIS TERCEIROS" },
  { value: "03", label: "03 - MÁQUINAS/EQUIPAMENTOS/INSTALAÇÃO" },
  { value: "06", label: "06 - VEÍCULOS" },
  { value: "99", label: "99 - INFORMÁTICA (HARDWARE/SOFTWARE)" }
];
export const KPI_TYPE_OPTIONS: SelectOption[] = [
  { value: "PRODUTIVIDADE", label: "PRODUTIVIDADE" },
  { value: "SAUDE_E_SEGURANCA", label: "SAÚDE E SEGURANÇA" },
  { value: "OUTROS", label: "OUTROS" }
];

export const ROCE_AVAILABILITY_OPTIONS: SelectOption[] = [
  { value: "SIM", label: "SIM" },
  { value: "NAO", label: "NÃO" }
];

export const ROCE_CLASS_OPTIONS: SelectOption[] = [
  { value: "GANHO", label: "GANHO" },
  { value: "PERDA", label: "PERDA" },
  { value: "AMBOS", label: "AMBOS" }
];

const PEP_ELEMENT_OPTIONS_DEFAULT: SelectOption[] = [
  { value: "DESP.ENGENHARIA / DETALHAMENTO PROJETO", label: "DESP.ENGENHARIA / DETALHAMENTO PROJETO" },
  { value: "AQUISIÇÃO DE EQUIPAMENTOS NACIONAIS", label: "AQUISIÇÃO DE EQUIPAMENTOS NACIONAIS" },
  { value: "AQUISIÇÃO DE EQUIPAMENTOS IMPORTADOS", label: "AQUISIÇÃO DE EQUIPAMENTOS IMPORTADOS" },
  { value: "AQUISIÇÃO DE VEÍCULOS", label: "AQUISIÇÃO DE VEÍCULOS" },
  { value: "DESPESAS COM OBRAS CIVIS", label: "DESPESAS COM OBRAS CIVIS" },
  { value: "DESP.MONTAGEM EQUIPTOS/ESTRUTURAS/OUTRAS", label: "DESP.MONTAGEM EQUIPTOS/ESTRUTURAS/OUTRAS" },
  { value: "AQ.DE COMPONENTES/MAT.INSTAL./FERRAMENTA", label: "AQ.DE COMPONENTES/MAT.INSTAL./FERRAMENTA" },
  { value: "DESPESAS COM MEIO AMBIENTE", label: "DESPESAS COM MEIO AMBIENTE" },
  { value: "DESPESAS COM SEGURANÇA", label: "DESPESAS COM SEGURANÇA" },
  { value: "DESPESAS COM SEGUROS", label: "DESPESAS COM SEGUROS" },
  { value: "DESP.CONSULTORIA INTERNA (AMS)-TEC.INFOR", label: "DESP.CONSULTORIA INTERNA (AMS)-TEC.INFOR" },
  { value: "DESP.CONSULTORIA EXTERNA - TEC.INFOR", label: "DESP.CONSULTORIA EXTERNA - TEC.INFOR" },
  { value: "AQUISIÇÃO DE HARDWARE (NOTEBOOKS, ETC)", label: "AQUISIÇÃO DE HARDWARE (NOTEBOOKS, ETC)" },
  { value: "AQUISIÇÃO DE SOFTWARE", label: "AQUISIÇÃO DE SOFTWARE" },
  { value: "AQUISIÇÃO DE IMÓVEIS", label: "AQUISIÇÃO DE IMÓVEIS" },
  { value: "DESP.GERENCIAMENTO E COORDENAÇÃO", label: "DESP.GERENCIAMENTO E COORDENAÇÃO" },
  { value: "CONTINGÊNCIAS", label: "CONTINGÊNCIAS" },
  { value: "CILINDROS E DISCOS DE LAMINAÇÃO", label: "CILINDROS E DISCOS DE LAMINAÇÃO" }
];

const PEP_ELEMENT_OPTIONS_BF00: SelectOption[] = [
  { value: "VIGA", label: "VIGA" },
  { value: "TUBO DE ATIÇO", label: "TUBO DE ATIÇO" },
  { value: "TELHADO", label: "TELHADO" },
  { value: "PORTAS", label: "PORTAS" },
  { value: "PISO E MURETA DE APOIO", label: "PISO E MURETA DE APOIO" },
  { value: "PISO", label: "PISO" },
  { value: "PILAR", label: "PILAR" },
  { value: "PAREDE DEFLETORA", label: "PAREDE DEFLETORA" },
  { value: "PAREDE", label: "PAREDE" },
  { value: "LAYOUT CÉLULA DE QUEIMA", label: "LAYOUT CÉLULA DE QUEIMA" },
  { value: "FUNDAÇÃO", label: "FUNDAÇÃO" },
  { value: "ELÉTRICA/AUTOMAÇÃO", label: "ELÉTRICA/AUTOMAÇÃO" },
  { value: "ELÉTRICA E INSTRUMENTAÇÃO", label: "ELÉTRICA E INSTRUMENTAÇÃO" },
  { value: "DUTOS PASSAGEM GASES", label: "DUTOS PASSAGEM GASES" },
  { value: "DUTO METÁLICO", label: "DUTO METÁLICO" },
  { value: "CÚPULA", label: "CÚPULA" },
  { value: "CHAMINÉ METÁLICA", label: "CHAMINÉ METÁLICA" },
  { value: "CHAMINÉ CAPELA", label: "CHAMINÉ CAPELA" },
  { value: "CENTRAL DE ALCATRÃO", label: "CENTRAL DE ALCATRÃO" },
  { value: "CÉLULA DE QUEIMA", label: "CÉLULA DE QUEIMA" },
  { value: "CÂMARAS", label: "CÂMARAS" },
  { value: "CAIXAS DEFLETORAS", label: "CAIXAS DEFLETORAS" },
  { value: "CAIXA DE COLETA DE ALCATRÃO", label: "CAIXA DE COLETA DE ALCATRÃO" },
  { value: "INSTALAÇÕES INDUSTRIAIS", label: "INSTALAÇÕES INDUSTRIAIS" },
  { value: "INSTALAÇÕES PREDIAIS", label: "INSTALAÇÕES PREDIAIS" },
  { value: "COMPUTADORES E PERIFÉRICOS", label: "COMPUTADORES E PERIFÉRICOS" },
  { value: "SOFTWARES", label: "SOFTWARES" },
  { value: "CERTIFICAÇÕES E LICENÇAS", label: "CERTIFICAÇÕES E LICENÇAS" },
  { value: "INFRAESTRUTURA UPC'S", label: "INFRAESTRUTURA UPC'S" },
  { value: "MÓDULOS MOVIMENTAÇÃO", label: "MÓDULOS MOVIMENTAÇÃO" },
  { value: "MÓDULOS MECANIZAÇÃO", label: "MÓDULOS MECANIZAÇÃO" },
  { value: "CONSTRUÇÃO DE VIVEIROS", label: "CONSTRUÇÃO DE VIVEIROS" },
  { value: "MELHORIAS INDUSTRIAIS", label: "MELHORIAS INDUSTRIAIS" },
  { value: "MELHORIAS AMBIENTAIS", label: "MELHORIAS AMBIENTAIS" },
  { value: "TECNOLOGIA DA INFORMAÇÃO", label: "TECNOLOGIA DA INFORMAÇÃO" },
  { value: "MÁQUINAS E EQUIPAMENTOS", label: "MÁQUINAS E EQUIPAMENTOS" },
  { value: "FERRAMENTAS", label: "FERRAMENTAS" },
  { value: "IMPLEMENTOS AGRÍCOLAS", label: "IMPLEMENTOS AGRÍCOLAS" },
  { value: "MÓVEIS E UTENSÍLIOS", label: "MÓVEIS E UTENSÍLIOS" },
  { value: "VEÍCULOS LEVES", label: "VEÍCULOS LEVES" },
  { value: "VEÍCULOS PESADOS", label: "VEÍCULOS PESADOS" }
];

export function getPepElementOptions(company?: string): SelectOption[] {
  return company === "BF00" ? PEP_ELEMENT_OPTIONS_BF00 : PEP_ELEMENT_OPTIONS_DEFAULT;
}

export function ensurePepElementOption(options: SelectOption[], value?: string): SelectOption[] {
  const current = String(value ?? "").trim();
  if (!current) return options;
  if (options.some((option) => option.value === current)) return options;
  return [...options, { value: current, label: current }];
}

export const INVESTMENT_LEVEL_OPTIONS: Array<SelectOption & { minUsd: number; maxUsd?: number }> = [
  { value: "N1", label: "N1 - Board of Directors", minUsd: 150_000_000 },
  { value: "N2", label: "N2 - IAC/Executive Office", minUsd: 10_000_000, maxUsd: 150_000_000 },
  { value: "N3", label: "N3 - Pre-IAC", minUsd: 2_000_000, maxUsd: 10_000_000 },
  { value: "N4", label: "N4 - Local Segment", minUsd: 0, maxUsd: 2_000_000 }
];

export function buildYearOptions(range = 5): SelectOption[] {
  const current = new Date().getFullYear();
  return Array.from({ length: range + 1 }, (_, i) => {
    const year = current + i;
    return { value: String(year), label: String(year) };
  });
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}
