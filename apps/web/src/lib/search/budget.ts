/** Lecture d’un budget saisi (50 000, 50000 GNF, etc.). */
export function parseBudgetInput(raw: string): number | undefined {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return undefined;
  const value = Number(digits);
  return Number.isFinite(value) ? value : undefined;
}
