# BuildReady — Deploy Guide (Phone-Only)

## What changed vs. the artifact version
The artifact preview called the Anthropic API directly from the browser using a
sandbox-only trick that doesn't work reliably outside Claude.ai (and not at all
in production). This version calls a real server route — `app/api/analyze/route.ts`
— which holds your API key securely and never exposes it to the client. This is
also why your earlier "spins forever" bug is gone: server-side calls don't hit
the same timeout/CORS quirks as the artifact sandbox.

## Steps to deploy from your phone

1. **Push to GitHub**
   - Easiest on mobile: use the GitHub app or github.com in your browser →
     create a new repo → use "Add file → Upload files" → upload this entire
     folder's contents (you can drag/select multiple files at once on most
     mobile browsers, or upload in a few batches).
   - Keep the folder structure exactly as-is: `app/`, `app/api/analyze/`, etc.

2. **Import into Vercel**
   - Go to vercel.com on your phone browser → "Add New Project" → select the
     GitHub repo you just created.
   - Framework preset should auto-detect as "Next.js" — leave defaults.

3. **Add your API key**
   - In the Vercel project → Settings → Environment Variables.
   - Add: `ANTHROPIC_API_KEY` = your real key (starts with `sk-ant-...`).
   - Apply to Production, Preview, and Development.

4. **Deploy**
   - Vercel will build automatically on push. First deploy takes ~1-2 minutes.
   - You'll get a live `.vercel.app` URL — open it on your phone, that's your
     real app.

5. **Test**
   - Paste a real build prompt, hit Analyze.
   - Expect 20-40 seconds for the full 11-category response (this is normal —
     it's a large structured generation, not a bug).

## If something fails
- **"Server misconfigured: missing ANTHROPIC_API_KEY"** → env var isn't set in
  Vercel, or you forgot to redeploy after adding it (Vercel needs a fresh
  deploy to pick up new env vars — push any small change, or hit "Redeploy" in
  the Vercel dashboard).
- **"Model returned malformed JSON"** → rare, just retry. The route already
  strips stray text around the JSON block.
- **Build fails on Vercel** → check the build log for missing dependency
  errors; `package.json` already includes everything needed.

## What's NOT included yet (next steps)
- Sidebar navigation / History / Templates / Settings pages (only the
  Inspector + Results flow is wired to the real backend right now, since
  that's the core value prop you needed verified first)
- Supabase (saved history persistence)
- Clerk (auth)
- PostHog (analytics)

We can layer these in once the core analysis loop is confirmed working in
production.
