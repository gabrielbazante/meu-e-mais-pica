import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isStaleDeploymentError, recoverFromStaleDeployment } from "@/lib/staleDeploy";

const REAL = 'Server Action "4017abc123" was not found on the server. Read more: https://nextjs.org/docs/messages/failed-to-find-server-action';

describe("isStaleDeploymentError", () => {
  it("detecta a mensagem real do print", () => {
    expect(isStaleDeploymentError(new Error(REAL))).toBe(true);
  });
  it("detecta a string com o link da doc", () => {
    expect(isStaleDeploymentError("https://nextjs.org/docs/messages/failed-to-find-server-action")).toBe(true);
  });
  it("Error generico nao e", () => {
    expect(isStaleDeploymentError(new Error("Sala nao encontrada"))).toBe(false);
  });
  it("valor que nao e Error nao e", () => {
    expect(isStaleDeploymentError(undefined)).toBe(false);
    expect(isStaleDeploymentError(null)).toBe(false);
    expect(isStaleDeploymentError(42)).toBe(false);
    expect(isStaleDeploymentError({ foo: 1 })).toBe(false);
  });
});

describe("recoverFromStaleDeployment", () => {
  const reload = vi.fn();
  const original = window.location;
  beforeEach(() => {
    reload.mockClear();
    sessionStorage.clear();
    Object.defineProperty(window, "location", { configurable: true, value: { reload } });
  });
  afterEach(() => {
    Object.defineProperty(window, "location", { configurable: true, value: original });
    vi.useRealTimers();
  });

  it("nao recarrega para erro comum", () => {
    expect(recoverFromStaleDeployment(new Error("x"))).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
  it("recarrega na primeira vez e nao de novo dentro de 30s", () => {
    expect(recoverFromStaleDeployment(new Error(REAL))).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(recoverFromStaleDeployment(new Error(REAL))).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });
  it("recarrega de novo depois de 30s", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    expect(recoverFromStaleDeployment(new Error(REAL))).toBe(true);
    vi.setSystemTime(1_000_000 + 31_000);
    expect(recoverFromStaleDeployment(new Error(REAL))).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });
  it("sem sessionStorage utilizavel nao recarrega e retorna false", () => {
    const original = Object.getOwnPropertyDescriptor(window, "sessionStorage");
    const broken = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
    };
    Object.defineProperty(window, "sessionStorage", { configurable: true, value: broken });
    try {
      expect(recoverFromStaleDeployment(new Error(REAL))).toBe(false);
      expect(reload).not.toHaveBeenCalled();
    } finally {
      if (original) Object.defineProperty(window, "sessionStorage", original);
      else delete (window as unknown as Record<string, unknown>).sessionStorage;
    }
  });
});
