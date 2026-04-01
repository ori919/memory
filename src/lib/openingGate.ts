/** Prevents duplicate opening-message runs (e.g. React Strict Mode). */

let openingLock = false;

export function runOpeningExclusive(fn: () => Promise<void>): boolean {
  if (openingLock) return false;
  openingLock = true;
  const p = fn();
  void p.finally(() => {
    openingLock = false;
  });
  return true;
}

export function resetOpeningExclusive(): void {
  openingLock = false;
}
