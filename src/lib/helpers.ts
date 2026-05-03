export function sortItems<T>(items: T[], key: keyof T, desc = true): T[] {
  return [...items].sort((a, b) => {
    const valA = a[key];
    const valB = b[key];

    if (valA === valB) return 0;

    // Логика для сортировки (по умолчанию — по убыванию)
    if (desc) {
      return valA < valB ? 1 : -1;
    } else {
      return valA > valB ? 1 : -1;
    }
  });
}

export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
