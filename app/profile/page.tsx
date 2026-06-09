"use client";

import { Bell, Moon, Shield, ChevronRight } from "lucide-react";
import { useSlate } from "@/lib/store";
import { ProfileStats } from "@/components/ProfileStats";

/**
 * Profile / Stats (#8) with a lightweight settings block (#9). Settings are
 * presentational in the MVP — wire to Supabase profile + notification prefs
 * later.
 */
export default function ProfilePage() {
  const { user } = useSlate();

  return (
    <div className="px-4 pb-4 pt-4 lg:mx-auto lg:max-w-[760px]">
      <ProfileStats user={user} />

      {/* Basic settings */}
      <div className="mt-6">
        <h2 className="mb-2.5 px-0.5 text-xs font-extrabold uppercase tracking-wide text-ink-600">
          Settings
        </h2>
        <div className="overflow-hidden rounded-2xl border border-line bg-ink-850/60">
          <SettingRow icon={Bell} label="Daily slate reminder" value="On" />
          <SettingRow icon={Moon} label="Appearance" value="Dark" />
          <SettingRow icon={Shield} label="Privacy" value="Friends only" />
        </div>
        <p className="mt-3 text-center text-[11px] text-ink-600">
          Mock session · no login required. Auth plugs in via Supabase later.
        </p>
      </div>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <button className="flex w-full items-center gap-3 border-b border-line/60 px-4 py-3.5 text-left last:border-0 transition active:bg-ink-800/50">
      <Icon className="h-4.5 w-4.5 text-ink-600" />
      <span className="flex-1 text-sm font-semibold">{label}</span>
      <span className="text-[13px] font-medium text-ink-600">{value}</span>
      <ChevronRight className="h-4 w-4 text-ink-600" />
    </button>
  );
}
