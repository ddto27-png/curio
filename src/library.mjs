export const STORAGE_KEY = 'commonwealth-saved';

// Keep the established key so existing saves survive on the same origin.
// Storage is injected, allowing the account-backed implementation to replace it later.
export function readSaved(storage, validIds) {
  const value = JSON.parse(storage.getItem(STORAGE_KEY) ?? '[]');
  if (!Array.isArray(value)) throw new Error('Saved ideas are not a list.');
  return new Set(value.filter(id => typeof id === 'string' && validIds.has(id)));
}

export function toggleSaved(storage, saved, id, validIds) {
  if (!validIds.has(id)) throw new Error('Unknown story.');
  const next = new Set(saved);
  if (next.has(id)) next.delete(id); else next.add(id);
  // Commit before changing the UI: failure must not look like a successful save.
  storage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  return next;
}
