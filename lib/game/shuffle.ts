// Ordem pseudo-aleatoria por item: cada item ganha a chave fnv1a(seed:key) e a lista
// e ordenada por ela. Nao depende da ordem de entrada (ex.: ordem das linhas do banco),
// entao todo cliente ve a mesma ordem e ela nao revela a ordem de chegada.
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function orderBySeed<T>(items: readonly T[], seed: string, keyOf: (t: T) => string): T[] {
  return items
    .map((item) => ({ item, key: keyOf(item), h: fnv1a(seed + ":" + keyOf(item)) }))
    .sort((a, b) => a.h - b.h || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
    .map((x) => x.item);
}
