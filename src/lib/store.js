// All data lives in the browser (localStorage) – no backend needed.
const U = 'viha_user', C = 'viha_classes';
export const getUser = () => localStorage.getItem(U);
export const setUser = (n) => localStorage.setItem(U, n);
export const clearUser = () => localStorage.removeItem(U);
export const getClasses = () => JSON.parse(localStorage.getItem(C) || '[]');
const saveAll = (list) => localStorage.setItem(C, JSON.stringify(list));
export const addClass = (c) => saveAll([c, ...getClasses()]);
export const getClass = (id) => getClasses().find((c) => c.id === id);
export const updateClass = (id, patch) =>
  saveAll(getClasses().map((c) => (c.id === id ? { ...c, ...patch } : c)));

export function stats() {
  const list = getClasses();
  const scores = list.map((c) => c.result?.score).filter((s) => typeof s === 'number');
  const weak = [...new Set(list.flatMap((c) => c.result?.weak || []))];
  const strong = [...new Set(list.flatMap((c) => c.result?.strong || []))];
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  return { list, scores, weak, strong, avg };
}
