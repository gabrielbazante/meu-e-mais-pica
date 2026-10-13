/** Link de convite: leva direto ao card "Entrar nesta sala" de /sala/[code]. */
export function inviteUrl(origin: string, code: string): string {
  return `${origin.replace(/\/+$/, "")}/sala/${code.toUpperCase()}`;
}

/** Link de compartilhamento do WhatsApp com mensagem pronta. */
export function whatsappShareUrl(origin: string, code: string): string {
  const text = `Bora jogar O meu é mais pica? 🔥 Entra aqui: ${inviteUrl(origin, code)} (código ${code.toUpperCase()})`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
