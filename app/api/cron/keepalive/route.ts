import { isAuthorized } from "@/lib/keepalive";
import { staleRoomCutoff } from "@/lib/rooms";
import { createServerClient } from "@/lib/supabase/server";

// Executa a cada requisição (nada de cache): é um cron.
export const dynamic = "force-dynamic";

const RETENCAO_DIAS = 30;

// Chamado diariamente pelo Vercel Cron (ver vercel.json). Insere uma linha em
// keepalive_log para o Supabase (plano gratuito) contar atividade e não pausar.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "CRON_SECRET ausente" }, { status: 500 });
  }
  if (!isAuthorized(request.headers.get("authorization"), secret)) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("keepalive_log").insert({});
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Limpeza das linhas antigas; falha aqui não invalida o keep-alive.
    const limite = new Date(Date.now() - RETENCAO_DIAS * 86_400_000).toISOString();
    const { error: erroLimpeza } = await supabase
      .from("keepalive_log")
      .delete()
      .lt("created_at", limite);
    if (erroLimpeza) console.error("keepalive cleanup", erroLimpeza.message);

    // Salas "closed" (delete adiado que nao rodou) e salas com mais de 24 h; o cascade leva o resto.
    // Falha aqui tambem nao derruba o keep-alive.
    let roomsDeleted = 0;
    const { data: apagadas, error: erroSalas } = await supabase
      .from("rooms")
      .delete()
      .or(`status.eq.closed,created_at.lt.${staleRoomCutoff(Date.now())}`)
      .select("id");
    if (erroSalas) console.error("rooms cleanup", erroSalas.message);
    else {
      roomsDeleted = apagadas?.length ?? 0;
      console.log("rooms cleanup", roomsDeleted);
    }

    return Response.json({ ok: true, at: new Date().toISOString(), roomsDeleted });
  } catch (e) {
    const message = e instanceof Error ? e.message : "erro inesperado";
    return Response.json({ error: message }, { status: 500 });
  }
}
