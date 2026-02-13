export type SelectOption = { value: string; label: string };

import { COMPANY_CENTER_UNIT_LOCATION_MAP } from "./companyStructure";

export const EXCHANGE_RATE = 5.4;

export const FUNDING_SOURCE_OPTIONS: SelectOption[] = [
  { value: "BUDGET", label: "BUDGET" },
  { value: "EXTRA", label: "EXTRA" },
  { value: "REMANEJAMENTO", label: "REMANEJAMENTO" }
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
