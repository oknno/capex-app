// src/domain/rules/types.ts
export type RuleLevel = "ok" | "warn" | "error";

export type RuleResult = {
  id: string;
  level: RuleLevel;
  title: string;
  message?: string;
};

export type RulesSummary = {
  ok: boolean;          // ✅ se não há errors
  errors: RuleResult[];
  warns: RuleResult[];
  oks: RuleResult[];
};

export function summarizeRulesTypes(results: RuleResult[]): RulesSummary {
  const errors = results.filter((r) => r.level === "error");
  const warns  = results.filter((r) => r.level === "warn");
  const oks    = results.filter((r) => r.level === "ok");
  return { ok: errors.length === 0, errors, warns, oks };
}
