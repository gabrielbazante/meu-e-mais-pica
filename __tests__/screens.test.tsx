import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { AnswerRow, PlayerRow, RoundRow, VoteRow } from "@/lib/supabase/database.types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/app/actions/room", () => ({ closeRoom: vi.fn() }));
vi.mock("@/app/actions/game", () => ({ castVote: vi.fn(), voidAnswer: vi.fn() }));

const room = { id: "r", host_id: "1" };

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

describe("Podium", () => {
  it("mostra o campeão no selo com coroa e os degraus 1-2-3", async () => {
    const { Podium } = await import("@/components/screens/Podium");
    const html = renderToStaticMarkup(
      <Podium players={[player("1", "Júlia Branco", 68), player("2", "Marina", 66), player("3", "Rafael", 64)]} room={room} meId="1" />,
    );
    expect(html).toContain("Júlia Branco venceu!");
    expect(html).toContain('aria-label="campeã(o)"');
    expect(html).toContain('data-rank="1"');
    expect(html).toContain('data-rank="2"');
    expect(html).toContain('data-rank="3"');
    expect(html).not.toMatch(/[\u{1F3C6}\u{1F451}\u{1F947}-\u{1F949}]/u);
  });

  it("com 2 jogadores renderiza só os degraus existentes", async () => {
    const { Podium } = await import("@/components/screens/Podium");
    const html = renderToStaticMarkup(<Podium players={[player("1", "Ana", 10), player("2", "Bia", 4)]} room={room} meId="2" />);
    expect(html).toContain('data-rank="1"');
    expect(html).toContain('data-rank="2"');
    expect(html).not.toContain('data-rank="3"');
  });
});

describe("Vote (anônimo)", () => {
  const round = {
    id: "round-1", phase: "votacao", theme: "Time", letter: "M", tiebreak_kind: null, tiebreak_candidates: [],
  } as unknown as RoundRow;
  const ps = [player("1", "Ana"), player("2", "Bia"), player("3", "Caio")];
  const ans = (player_id: string, text: string, submitted_at = "2026-10-13T00:00:10Z") =>
    ({ round_id: "round-1", player_id, text, voided: false, submitted_at }) as unknown as AnswerRow;

  it("não mostra o nome dos autores, rotula a própria resposta e mostra os textos", async () => {
    const { Vote } = await import("@/components/screens/Vote");
    const html = renderToStaticMarkup(
      <Vote round={round} players={ps} answers={[ans("1", "Gato"), ans("2", "Peixe"), ans("3", "Zebra")]}
        votes={[]} meId="1" isHost={false} roomId="r" />,
    );
    expect(html).not.toContain("Bia");
    expect(html).not.toContain("Caio");
    expect(html).toContain("Sua resposta");
    for (const t of ["Gato", "Peixe", "Zebra"]) expect(html).toContain(t);
  });

  const similar = [
    ans("2", "Manchester United", "2026-10-13T00:00:20Z"),
    ans("3", "Man United", "2026-10-13T00:00:10Z"),
  ];

  it("dono vê a ordem de chegada e o rótulo de quem chegou depois", async () => {
    const { Vote } = await import("@/components/screens/Vote");
    const html = renderToStaticMarkup(
      <Vote round={round} players={ps} answers={similar} votes={[]} meId="1" isHost roomId="r" />,
    );
    expect(html).toContain("chegou 1º");
    expect(html).toContain("chegou 2º");
    expect(html).toContain("marcar repetida (chegou depois)");
  });

  it("quem não é dono vê só a dica, sem ordem de chegada", async () => {
    const { Vote } = await import("@/components/screens/Vote");
    const html = renderToStaticMarkup(
      <Vote round={round} players={ps} answers={similar} votes={[]} meId="1" isHost={false} roomId="r" />,
    );
    expect(html).not.toContain("chegou");
    expect(html).toContain("parece repetida?");
  });
});
