import type { Game, League } from "@/types";
import { sportMeta } from "@/lib/sportConfig";
import { GameCard } from "./GameCard";

export function SportSection({
  league,
  games,
}: {
  league: League;
  games: Game[];
}) {
  const m = sportMeta(league);
  return (
    <section className="animate-fade-up">
      <div className="mb-2.5 flex items-center gap-2.5 px-0.5">
        <span
          className="h-4 w-1 rounded-full"
          style={{ background: m.accent }}
        />
        <h2 className="text-sm font-extrabold uppercase tracking-wide">
          {m.label}
        </h2>
        <span className="text-xs font-semibold text-ink-600">
          {games.length} {games.length === 1 ? "game" : "games"}
        </span>
      </div>
      <div className="space-y-2.5">
        {games.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </div>
    </section>
  );
}
