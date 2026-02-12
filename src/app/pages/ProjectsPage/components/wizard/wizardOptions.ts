export type SelectOption = { value: string; label: string };

export const EXCHANGE_RATE = 5.4;

// Ajuste manualmente as opções abaixo conforme necessidade do negócio.
export const FUNDING_SOURCE_OPTIONS: SelectOption[] = [
  { value: "BUDGET", label: "BUDGET" },
  { value: "EXTRA", label: "EXTRA" },
  { value: "REMANEJAMENTO", label: "REMANEJAMENTO" }
];

export const COMPANY_OPTIONS: SelectOption[] = [
  { value: "COMP_A", label: "Empresa A" },
  { value: "COMP_B", label: "Empresa B" },
  { value: "COMP_C", label: "Empresa C" },
  { value: "COMP_D", label: "Empresa D" }
];

export const CENTER_OPTIONS_BY_COMPANY: Record<string, SelectOption[]> = {
  COMP_A: [
    { value: "A_CENTRO_1", label: "Centro A-1" },
    { value: "A_CENTRO_2", label: "Centro A-2" },
    { value: "A_CENTRO_3", label: "Centro A-3" },
    { value: "A_CENTRO_4", label: "Centro A-4" }
  ],
  COMP_B: [
    { value: "B_CENTRO_1", label: "Centro B-1" },
    { value: "B_CENTRO_2", label: "Centro B-2" },
    { value: "B_CENTRO_3", label: "Centro B-3" },
    { value: "B_CENTRO_4", label: "Centro B-4" }
  ],
  COMP_C: [
    { value: "C_CENTRO_1", label: "Centro C-1" },
    { value: "C_CENTRO_2", label: "Centro C-2" },
    { value: "C_CENTRO_3", label: "Centro C-3" },
    { value: "C_CENTRO_4", label: "Centro C-4" }
  ],
  COMP_D: [
    { value: "D_CENTRO_1", label: "Centro D-1" },
    { value: "D_CENTRO_2", label: "Centro D-2" },
    { value: "D_CENTRO_3", label: "Centro D-3" },
    { value: "D_CENTRO_4", label: "Centro D-4" }
  ]
};

export const UNIT_OPTIONS_BY_CENTER: Record<string, SelectOption[]> = {
  A_CENTRO_1: [{ value: "A1_UN_1", label: "Unidade A1-1" }, { value: "A1_UN_2", label: "Unidade A1-2" }, { value: "A1_UN_3", label: "Unidade A1-3" }, { value: "A1_UN_4", label: "Unidade A1-4" }],
  B_CENTRO_1: [{ value: "B1_UN_1", label: "Unidade B1-1" }, { value: "B1_UN_2", label: "Unidade B1-2" }, { value: "B1_UN_3", label: "Unidade B1-3" }, { value: "B1_UN_4", label: "Unidade B1-4" }],
  C_CENTRO_1: [{ value: "C1_UN_1", label: "Unidade C1-1" }, { value: "C1_UN_2", label: "Unidade C1-2" }, { value: "C1_UN_3", label: "Unidade C1-3" }, { value: "C1_UN_4", label: "Unidade C1-4" }],
  D_CENTRO_1: [{ value: "D1_UN_1", label: "Unidade D1-1" }, { value: "D1_UN_2", label: "Unidade D1-2" }, { value: "D1_UN_3", label: "Unidade D1-3" }, { value: "D1_UN_4", label: "Unidade D1-4" }]
};

export const LOCATION_OPTIONS_BY_UNIT: Record<string, SelectOption[]> = {
  A1_UN_1: [{ value: "A1_LOC_1", label: "Local A1-1" }, { value: "A1_LOC_2", label: "Local A1-2" }, { value: "A1_LOC_3", label: "Local A1-3" }, { value: "A1_LOC_4", label: "Local A1-4" }],
  B1_UN_1: [{ value: "B1_LOC_1", label: "Local B1-1" }, { value: "B1_LOC_2", label: "Local B1-2" }, { value: "B1_LOC_3", label: "Local B1-3" }, { value: "B1_LOC_4", label: "Local B1-4" }],
  C1_UN_1: [{ value: "C1_LOC_1", label: "Local C1-1" }, { value: "C1_LOC_2", label: "Local C1-2" }, { value: "C1_LOC_3", label: "Local C1-3" }, { value: "C1_LOC_4", label: "Local C1-4" }],
  D1_UN_1: [{ value: "D1_LOC_1", label: "Local D1-1" }, { value: "D1_LOC_2", label: "Local D1-2" }, { value: "D1_LOC_3", label: "Local D1-3" }, { value: "D1_LOC_4", label: "Local D1-4" }]
};

export const CATEGORY_OPTIONS: SelectOption[] = Array.from({ length: 12 }, (_, i) => ({ value: `CAT_${i + 1}`, label: `Categoria ${i + 1}` }));
export const INVESTMENT_TYPE_OPTIONS: SelectOption[] = Array.from({ length: 5 }, (_, i) => ({ value: `INV_${i + 1}`, label: `Tipo de Investimento ${i + 1}` }));
export const ASSET_TYPE_OPTIONS: SelectOption[] = Array.from({ length: 5 }, (_, i) => ({ value: `ASSET_${i + 1}`, label: `Tipo de Ativo ${i + 1}` }));
export const KPI_TYPE_OPTIONS: SelectOption[] = Array.from({ length: 5 }, (_, i) => ({ value: `KPI_${i + 1}`, label: `Tipo de KPI ${i + 1}` }));
export const ROCE_CLASS_OPTIONS: SelectOption[] = Array.from({ length: 5 }, (_, i) => ({ value: `ROCE_${i + 1}`, label: `Classificação ROCE ${i + 1}` }));
export const PEP_ELEMENT_OPTIONS: SelectOption[] = Array.from({ length: 18 }, (_, i) => ({ value: `PEP_${i + 1}`, label: `Elemento PEP ${i + 1}` }));

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
