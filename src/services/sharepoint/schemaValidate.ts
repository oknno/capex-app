import type { SpFieldInfo } from "./listSchemaApi";

export type MissingField = {
  expectedInternalName: string;
  hint?: string;
};

export function validateExpectedFields(fields: SpFieldInfo[], expected: MissingField[]) {
  const byInternal = new Set(fields.map((f) => f.InternalName));
  const missing = expected.filter((e) => !byInternal.has(e.expectedInternalName));
  return missing;
}
