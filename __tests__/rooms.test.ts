import { describe, it, expect } from "vitest";
import { staleRoomCutoff, isRoomClosed, ROOM_TTL_HOURS } from "@/lib/rooms";

describe("staleRoomCutoff", () => {
  it("devolve o ISO de agora menos 24 h", () => {
    expect(ROOM_TTL_HOURS).toBe(24);
    expect(staleRoomCutoff(Date.UTC(2026, 9, 14, 12))).toBe("2026-10-13T12:00:00.000Z");
  });
});

describe("isRoomClosed", () => {
  it("sala que nunca existiu nao e encerrada", () => expect(isRoomClosed(false, null)).toBe(false));
  it("sala que existia e sumiu foi encerrada", () => expect(isRoomClosed(true, null)).toBe(true));
  it("sala em jogo nao e encerrada", () => expect(isRoomClosed(true, { status: "playing" })).toBe(false));
  it("status closed e encerrada", () => expect(isRoomClosed(false, { status: "closed" })).toBe(true));
  it("status ended (podio) nao e encerrada", () => expect(isRoomClosed(true, { status: "ended" })).toBe(false));
});

import { nextClosed } from "@/lib/rooms";
describe("nextClosed", () => {
  it("erro de rede nao encerra", () => expect(nextClosed(false, true, null, new Error("net"))).toBe(false));
  it("sala sumida sem erro encerra", () => expect(nextClosed(false, true, null, null)).toBe(true));
  it("e sticky", () => expect(nextClosed(true, true, { status: "playing" }, null)).toBe(true));
  it("closed encerra", () => expect(nextClosed(false, true, { status: "closed" }, null)).toBe(true));
});

import { CLOSE_DELETE_DELAY_MS } from "@/lib/rooms";
describe("CLOSE_DELETE_DELAY_MS", () => {
  it("espera 5 s antes de apagar", () => expect(CLOSE_DELETE_DELAY_MS).toBe(5000));
});
