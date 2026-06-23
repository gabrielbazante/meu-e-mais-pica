// Normaliza uma resposta para comparação de duplicatas:
// minúsculas, sem acentos, sem espaços nas pontas e espaços internos colapsados.
export function normalizeAnswer(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // remove acentos
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}
