"use client";
import { useEffect } from "react";
import { recoverFromStaleDeployment } from "@/lib/staleDeploy";

// Rede de seguranca: Server Actions que nao capturam o erro de versao antiga
// (deploy novo com a aba aberta) disparam recarga automatica.
export function StaleDeployGuard() {
  useEffect(() => {
    const onRejection = (ev: PromiseRejectionEvent) => { recoverFromStaleDeployment(ev.reason); };
    const onError = (ev: ErrorEvent) => { recoverFromStaleDeployment(ev.error ?? ev.message); };
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError);
    };
  }, []);
  return null;
}
