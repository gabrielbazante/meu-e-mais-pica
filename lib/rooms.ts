// Regras puras de ciclo de vida da sala.

// Salas mais velhas que isso (encerradas ou abandonadas) sao apagadas pelo cron diario.
export const ROOM_TTL_HOURS = 24;

// Atraso entre marcar a sala como "closed" e apaga-la. Apagar junto do UPDATE faz o cascade
// remover os players antes de o Realtime entregar o evento aos clientes.
export const CLOSE_DELETE_DELAY_MS = 5000;

export function staleRoomCutoff(nowMs: number): string {
  return new Date(nowMs - ROOM_TTL_HOURS * 3_600_000).toISOString();
}

// O Realtime nao entrega DELETE com filtro, entao o cliente so descobre o fim da sala
// pelo status "closed" ou, se perdeu esse UPDATE, por a sala ter sumido depois de existir.
// Sala que nunca existiu e "nao encontrada", nao "encerrada".
export function isRoomClosed(prevExisted: boolean, room: { status: string } | null): boolean {
  return room?.status === "closed" || (prevExisted && room === null);
}

// Decisao de "encerrada" a cada load. Erro de rede nao e sala sumida: mantem o anterior.
// Sticky: depois de true, continua true.
export function nextClosed(
  prevClosed: boolean,
  existed: boolean,
  room: { status: string } | null,
  error: unknown,
): boolean {
  if (prevClosed) return true;
  if (error) return false;
  return isRoomClosed(existed, room);
}
