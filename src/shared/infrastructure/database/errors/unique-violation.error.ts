interface PostgresError extends Error {
  code?: string;
  constraint?: string;
}

// Drizzle wraps driver errors in a `DrizzleQueryError`, so the Postgres error
// (and its `code` / `constraint`) lives on `.cause` rather than on the thrown
// error. Walk the cause chain a bounded number of links to find it.
const MAX_CAUSE_DEPTH = 10;

export function isUniqueViolation(
  err: unknown,
  constraintName?: string,
): boolean {
  let current: unknown = err;

  for (let depth = 0; depth < MAX_CAUSE_DEPTH; depth++) {
    if (typeof current !== 'object' || current === null) return false;

    const pgErr = current as PostgresError;

    // '23505' is Postgres's error code for unique_violation
    if (pgErr.code === '23505') {
      // If a specific constraint name is given, make sure it's THIS constraint
      if (constraintName && !pgErr.constraint?.includes(constraintName)) {
        return false;
      }
      return true;
    }

    current = (current as { cause?: unknown }).cause;
  }

  return false;
}
