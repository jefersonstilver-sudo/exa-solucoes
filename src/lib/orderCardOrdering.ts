export function applyCardOrder<T extends { id: string }>(items: T[], savedIds: string[]): T[] {
  const positions = new Map(savedIds.map((id, index) => [id, index]));
  return [...items].sort((a, b) =>
    (positions.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
    (positions.get(b.id) ?? Number.MAX_SAFE_INTEGER));
}

export function moveCard(ids: string[], activeId: string, overId: string): string[] {
  const from = ids.indexOf(activeId);
  const to = ids.indexOf(overId);
  if (from < 0 || to < 0 || from === to) return ids;
  const result = [...ids];
  const [moved] = result.splice(from, 1);
  if (moved === undefined) return ids;
  result.splice(to, 0, moved);
  return result;
}