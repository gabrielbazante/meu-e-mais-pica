import { createClient } from "@supabase/supabase-js";

// Server Actions: sem sessão de usuário (jogo anônimo). Usa a anon key.
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}
