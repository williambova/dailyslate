"use client";

import { forwardRef } from "react";
import { Check } from "lucide-react";
import type { Game, Pick } from "@/types";
import { sportMeta } from "@/lib/sportConfig";
import { shareDate } from "@/lib/date";

export interface ShareCardProps {
  userName: string;
  date: Date | string;
  games: Game[];
  picks: Pick[];
  totalGames: number;
  lockedStatus: string; // e.g. "All picks locked"
  favoritesCount: number;
  underdogsCount: number;
}

interface Row {
  league: Game["league"];
  away: string;
  home: string;
  pick: string;
  accent: string;
  abbr: string;
}

function buildRows(games: Game[], picks: Pick[]): Row[] {
  const byId = new Map(games.map((g) => [g.id, g]));
  return picks
    .map((p) => {
      const g = byId.get(p.gameId);
      if (!g) return null;
      const m = sportMeta(g.league);
      return {
        league: g.league,
        away: g.awayTeam,
        home: g.homeTeam,
        pick: p.selectedTeam,
        accent: m.accent,
        abbr: m.abbr,
      } as Row;
    })
    .filter((r): r is Row => r !== null);
}

/**
 * Authored at native 1080×1920 (9:16). The preview scales this node down with
 * a CSS transform; export captures it at full resolution. Generated entirely
 * from the user's real picks — never a static image.
 */
export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  function ShareCard(
    {
      userName,
      date,
      games,
      picks,
      totalGames,
      lockedStatus,
      favoritesCount,
      underdogsCount,
    },
    ref
  ) {
    const rows = buildRows(games, picks);
    const visible = rows.slice(0, 12);
    const overflow = rows.length - visible.length;

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1920,
          position: "relative",
          overflow: "hidden",
          color: "#F5F6F7",
          fontFamily: "var(--font-display), system-ui, sans-serif",
          background:
            "radial-gradient(900px 700px at 88% -6%, rgba(77,159,255,0.16), transparent 60%)," +
            "radial-gradient(820px 620px at -8% 4%, rgba(198,242,78,0.13), transparent 58%)," +
            "linear-gradient(180deg, #0C0E12 0%, #08090B 60%, #060708 100%)",
          padding: "72px 64px 56px",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        {/* faint grid texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage:
              "linear-gradient(180deg, rgba(0,0,0,0.6), transparent 40%)",
          }}
        />

        {/* header */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 11,
                  background: "#C6F24E",
                  display: "grid",
                  placeItems: "center",
                  color: "#08090B",
                }}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                  <path
                    d="M4 7h16M4 12h16M4 17h10"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                }}
              >
                Daily<span style={{ color: "#C6F24E" }}>Slate</span>
              </span>
            </div>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                border: "1px solid rgba(198,242,78,0.4)",
                background: "rgba(198,242,78,0.1)",
                color: "#C6F24E",
                borderRadius: 999,
                padding: "10px 18px",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  background: "#C6F24E",
                }}
              />
              {totalGames} games • {lockedStatus}
            </span>
          </div>

          <h1
            style={{
              fontSize: 132,
              lineHeight: 0.92,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
              marginTop: 56,
            }}
          >
            Today&apos;s
            <br />
            <span
              style={{
                background: "linear-gradient(90deg,#C6F24E,#9FD028)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Picks
            </span>
          </h1>
          <p
            style={{
              marginTop: 18,
              fontSize: 30,
              fontWeight: 600,
              color: "#9AA0AB",
            }}
          >
            {userName}&apos;s card • {shareDate(date)}
          </p>
        </div>

        {/* rows */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            marginTop: 44,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {visible.map((r, i) => {
            const awayPicked = r.pick === r.away;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  background: "rgba(255,255,255,0.035)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderLeft: `5px solid ${r.accent}`,
                  borderRadius: 16,
                  padding: "0 24px",
                  height: 86,
                }}
              >
                <span
                  style={{
                    minWidth: 96,
                    textAlign: "center",
                    fontSize: 20,
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    color: r.accent,
                    background: `${r.accent}1F`,
                    borderRadius: 9,
                    padding: "7px 0",
                  }}
                >
                  {r.abbr}
                </span>

                <div
                  style={{
                    flex: 1,
                    fontSize: 30,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                  }}
                >
                  <span style={{ color: awayPicked ? "#FFFFFF" : "#6E737D" }}>
                    {r.away}
                  </span>
                  <span style={{ color: "#4A4F58", margin: "0 12px", fontSize: 22 }}>
                    vs
                  </span>
                  <span style={{ color: awayPicked ? "#6E737D" : "#FFFFFF" }}>
                    {r.home}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    color: r.accent,
                  }}
                >
                  <span
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {r.pick}
                  </span>
                  <span
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 999,
                      background: r.accent,
                      display: "grid",
                      placeItems: "center",
                      color: "#08090B",
                    }}
                  >
                    <Check size={20} strokeWidth={4} />
                  </span>
                </div>
              </div>
            );
          })}
          {overflow > 0 && (
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#9AA0AB",
                textAlign: "center",
                marginTop: 8,
              }}
            >
              + {overflow} more picks
            </div>
          )}
        </div>

        {/* summary */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            marginTop: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
            borderRadius: 20,
            padding: "26px 32px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: "0.14em",
                color: "#7B8089",
                textTransform: "uppercase",
              }}
            >
              Pick Strategy
            </div>
            <div style={{ fontSize: 38, fontWeight: 800, marginTop: 8 }}>
              <span style={{ color: "#C6F24E" }}>{favoritesCount} favorites</span>
              <span style={{ color: "#4A4F58", margin: "0 14px" }}>•</span>
              <span style={{ color: "#4D9FFF" }}>{underdogsCount} underdogs</span>
            </div>
            <div style={{ fontSize: 24, color: "#9AA0AB", marginTop: 6 }}>
              Going for the perfect day
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 76,
                fontWeight: 900,
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              {totalGames}
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "#7B8089",
                textTransform: "uppercase",
              }}
            >
              Games Picked
            </div>
          </div>
        </div>

        {/* footer */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            marginTop: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: 30,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
            }}
          >
            Daily<span style={{ color: "#C6F24E" }}>Slate</span>
          </span>
          <span style={{ fontSize: 24, fontWeight: 600, color: "#9AA0AB" }}>
            Pick winners. Beat your friends.
          </span>
        </div>
      </div>
    );
  }
);
