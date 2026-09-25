interface PostgresError extends Error {
  code?: string;
  constraint?: string;
}

export function isUniqueViolation(
  err: unknown,
  constraintName?: string,
): boolean {
  if (!(err instanceof Error)) return false;

  const pgErr = err as PostgresError;

  // '23505' is Postgres's error code for unique_violation
  if (pgErr.code !== '23505') return false;

  // If a specific constraint name is given, make sure it's THIS constraint
  if (constraintName && !pgErr.constraint?.includes(constraintName))
    return false;

  return true;
}
