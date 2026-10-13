// Version skew: a aba ficou aberta de um deploy antigo e chama uma Server Action
// cujo ID o build novo nao conhece. Recarregar a pagina resolve.
const KEY = "mpc:stale-reload-at";
const WINDOW_MS = 30_000;

const PATTERNS = [/Server Action .* was not found on the server/i, /failed-to-find-server-action/i];

function messageOf(e: unknown): string {
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  return "";
}

export function isStaleDeploymentError(e: unknown): boolean {
  const msg = messageOf(e);
  return PATTERNS.some((p) => p.test(msg));
}

export function recoverFromStaleDeployment(e: unknown): boolean {
  if (typeof window === "undefined" || !isStaleDeploymentError(e)) return false;
  const now = Date.now();
  try {
    const last = Number(window.sessionStorage.getItem(KEY));
    if (last && now - last < WINDOW_MS) return false; // ja recarregou ha pouco: evita loop
    window.sessionStorage.setItem(KEY, String(now));
  } catch {
    // sem sessionStorage nao ha como proteger contra loop: nao recarrega
    return false;
  }
  window.location.reload();
  return true;
}
