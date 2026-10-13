"use client";
import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { inviteUrl, whatsappShareUrl } from "@/lib/invite";

const BTN =
  "block w-full rounded-xl border-3 border-ink px-4 py-2.5 text-center font-display font-extrabold text-ink " +
  "shadow-chunkySm active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all";

export function InviteShare({ code }: { code: string }) {
  const [origin, setOrigin] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "ok" | "fail">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const upper = code.toUpperCase();

  if (!origin) return <div className="mx-auto mt-3 h-[180px] w-[180px]" aria-hidden />;

  const link = inviteUrl(origin, code);

  async function copy() {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(link);
      setStatus("ok");
      timer.current = setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("fail");
    }
  }

  return (
    <div className="mt-3 flex flex-col items-center gap-3">
      <QRCodeSVG
        value={link}
        size={180}
        bgColor="#ffffff"
        fgColor="#1a1a2e"
        marginSize={4}
        className="rounded-xl border-3 border-ink"
        aria-label={`QR Code para entrar na sala ${upper}`}
        role="img"
      />
      <div className="flex w-full flex-col gap-2">
        <a
          href={whatsappShareUrl(origin, code)}
          target="_blank"
          rel="noopener noreferrer"
          className={BTN + " bg-party-teal"}
        >
          Compartilhar no WhatsApp
        </a>
        <button type="button" onClick={copy} className={BTN + " bg-party-yellow"}>
          {status === "ok" ? "Copiado ✓" : status === "fail" ? "Não deu pra copiar" : "Copiar link"}
        </button>
        <span className="sr-only" role="status" aria-live="polite">
          {status === "ok" ? "Link copiado" : status === "fail" ? "Não deu pra copiar o link" : ""}
        </span>
        {status === "fail" && (
          <p className="select-all break-all rounded-xl bg-party-yellow/40 px-3 py-2 text-sm font-bold">{link}</p>
        )}
      </div>
    </div>
  );
}
