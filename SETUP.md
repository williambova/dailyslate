# Supabase setup — accounts + cloud-synced picks

Follow this once. Until it's done, the app runs fine as a guest (picks save on
the device). When the two env vars below exist, accounts switch on automatically.

## 1. Create the project
1. Go to https://supabase.com → New project. Pick a name, a strong DB password,
   and a region near your users. Wait ~2 min for it to provision.

## 2. Create the tables
1. In the project: **SQL Editor → New query**.
2. Paste the entire contents of `sql/schema.sql` and click **Run**.
3. You should see "Success." This creates `profiles`, `picks`, `groups`,
   `group_members`, the security rules, and a trigger that makes a profile
   automatically on sign-up.

## 3. Email sign-up settings
By default Supabase emails a confirmation link before a new account can sign in.
For the simplest MVP:
1. **Authentication → Sign In / Providers → Email**.
2. Turn **off** "Confirm email" so sign-up logs you straight in.
   (Leave it on if you prefer — the login screen handles the "check your email"
   case, users just have to confirm before signing in.)

## 4. Get your keys
**Project Settings → API**, copy:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

(The anon key is meant to be public; Row Level Security is what protects data.)

## 5. Add the env vars
**Local dev:** copy `.env.local.example` to `.env.local` and fill in both values.

**Vercel:** Project → **Settings → Environment Variables**. Add both names with
their values, scoped to **Production** and **Preview**. Then **redeploy** (env
vars only take effect on a new build).

## 6. Verify
1. Open `/login`, create an account.
2. On `/profile` you should see "Signed in as <name>" with a Sign out button.
3. Make a few picks on `/slate`, reload the page — your picks should still be
   there (they're now in the `picks` table, not just this device). Confirm in
   Supabase: **Table Editor → picks**.

## Troubleshooting
- **"Accounts aren't switched on yet"** on /login → env vars missing or the
  deploy predates them. Re-check the Vercel values and redeploy.
- **Sign-up works but sign-in says "Email not confirmed"** → either confirm via
  the email link, or turn off "Confirm email" (step 3).
- **Picks don't persist after reload while signed in** → open the browser
  console for a `pick save failed` message; it usually means the SQL didn't run
  or RLS is off. Re-run `sql/schema.sql`.
- **Profile name is your email prefix** → you signed up before the trigger
  existed, or via the dashboard. New sign-ups through `/login` set the name.

## What's next (multiplayer)
The `groups` / `group_members` tables are already created. The next step wires
the Groups screen and a live group leaderboard to them so invite codes work
across devices. The Groups tab stays in local mode until then.
