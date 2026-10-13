import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { PlayerRow, VoteRow } from "@/lib/supabase/database.types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const player = (id: string, name: string, total_points = 0): PlayerRow => ({
  id, room_id: "r", name, total_points, connected: true, joined_at: `2026-10-13T00:00:0${id}Z`,
});
const vote = (voter_id: string): VoteRow => ({
  id: `v${voter_id}`, round_id: "x", voter_id, best_id: null, worst_id: null, is_tiebreak: false,
});

describe("VotersList", () => {
  it("marca quem votou com o ícone de check acessível, sem caractere ✓", async () => {
    const { VotersList } = await import("@/components/ui/VotersList");
    const html = renderToStaticMarkup(
      <VotersList players={[player("1", "Ana"), player("2", "Bia")]} votes={[vote("1")]} isTiebreak={false} />,
    );
    expect(html).toContain('aria-label="votou"');
    expect(html).toContain("ainda não votou");
    expect(html).not.toContain("✓");
  });
});

describe("Ranking", () => {
  it("usa medalhas SVG para o top 3 e 'Nº' do 4º em diante, sem emoji", async () => {
    const { Ranking } = await import("@/components/screens/Ranking");
    const html = renderToStaticMarkup(
      <Ranking players={[player("1", "Ana", 30), player("2", "Bia", 20), player("3", "Caio", 10), player("4", "Duda", 5)]} />,
    );
    expect(html).toContain('aria-label="1º lugar"');
    expect(html).toContain('aria-label="3º lugar"');
    expect(html).toContain("4º");
    expect(html).not.toMatch(/[\u{1F947}-\u{1F949}]/u);
  });
});
