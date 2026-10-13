import { timingSafeEqual } from "node:crypto";

// Confere o header Authorization do Vercel Cron contra `Bearer ${CRON_SECRET}`.
// Comparação em tempo constante; tamanhos diferentes são recusados antes,
// porque timingSafeEqual lança exceção com buffers de tamanhos distintos.
export function isAuthorized(
  header: string | null,
  secret: string | undefined,
): boolean {
  if (!secret || header === null) return false;
  const esperado = Buffer.from(`Bearer ${secret}`);
  const recebido = Buffer.from(header);
  if (esperado.length !== recebido.length) return false;
  return timingSafeEqual(esperado, recebido);
}
