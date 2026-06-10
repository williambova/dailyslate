"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Camera, Check, LogIn, LogOut, UserCircle2 } from "lucide-react";
import { useSlate } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ProfileStats } from "@/components/ProfileStats";

/**
 * Profile / Stats (#8) + identity (#9). Stats come from real picks. Identity is
 * either a signed-in Supabase account or a local guest you can name.
 */
export default function ProfilePage() {
  const { user, isGuest, setDisplayName } = useSlate();
  const { isConfigured, signOut, authUserId, refreshProfile } = useAuth();
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Upload a profile image to Supabase Storage and save its URL.
  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file || !supabase || !authUserId) return;
    setUploadError("");
    if (file.size > 4 * 1024 * 1024) {
      setUploadError("Image must be under 4MB.");
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${authUserId}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw new Error(upErr.message);

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?v=${Date.now()}`; // bust stale caches

      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", authUserId);
      if (dbErr) throw new Error(dbErr.message);

      await refreshProfile();
    } catch (err: any) {
      setUploadError(err?.message ?? "Upload failed, try another image.");
    } finally {
      setUploading(false);
    }
  };

  const save = () => {
    if (!draft.trim()) return;
    setDisplayName(draft);
    setDraft("");
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="px-4 pb-4 pt-4 lg:mx-auto lg:max-w-[760px]">
      <ProfileStats user={user} />

      <div className="mt-6">
        <h2 className="mb-2.5 px-0.5 text-xs font-extrabold uppercase tracking-wide text-ink-600">
          Account
        </h2>

        {isGuest ? (
          <div className="rounded-2xl border border-line bg-ink-850/60 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <UserCircle2 className="h-4.5 w-4.5 text-lime" />
              You&apos;re playing as a guest
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600">
              Set a display name for this device, or create an account to save
              your picks to the cloud and join groups with friends.
            </p>

            <div className="mt-3 flex gap-2.5">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                placeholder={user.name === "Guest" ? "Your name" : user.name}
                className="min-w-0 flex-1 rounded-xl border border-line bg-ink-900 px-3.5 py-3 text-sm font-medium text-white outline-none placeholder:text-ink-600 focus:border-lime/50"
              />
              <button
                onClick={save}
                disabled={!draft.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-ink-800 px-4 py-3 text-sm font-bold text-white/85 transition active:scale-95 disabled:opacity-50"
              >
                {saved ? <Check className="h-4 w-4 text-lime" /> : null}
                {saved ? "Saved" : "Save"}
              </button>
            </div>

            <Link
              href="/login"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-lime py-3.5 text-sm font-extrabold uppercase tracking-wide text-ink-950 transition active:scale-95"
            >
              <LogIn className="h-4 w-4" />
              {isConfigured ? "Create account / Log in" : "Set up an account"}
            </Link>
            {!isConfigured && (
              <p className="mt-2 text-center text-[11px] text-ink-600">
                Accounts activate once the Supabase backend is connected.
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-ink-850/60 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <UserCircle2 className="h-4.5 w-4.5 text-lime" />
              Signed in as {user.name}
            </div>
            <p className="mt-1.5 text-[13px] text-ink-600">
              Your picks sync to the cloud across devices.
            </p>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickImage}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-lime py-3.5 text-sm font-extrabold uppercase tracking-wide text-ink-950 transition active:scale-95 disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
              {uploading ? "Uploading…" : "Change profile photo"}
            </button>
            {uploadError && (
              <p className="mt-2 text-[12px] font-semibold text-red-400">
                {uploadError}
              </p>
            )}

            <button
              onClick={signOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-ink-800 py-3.5 text-sm font-bold text-white/85 transition active:scale-95"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
