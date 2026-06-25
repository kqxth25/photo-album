# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A shared photo album web app — users upload and browse photos via a shareable link. No login required. Link = access. Deployed on Vercel, backed by Supabase.

## Tech Stack

- **Next.js 16.2** (App Router, Turbopack) — check `node_modules/next/dist/docs/` for breaking changes
- **Supabase** — Postgres database + file storage (via `@supabase/supabase-js`)
- **Tailwind CSS v4** (`@import "tailwindcss"` syntax in globals.css)
- **sharp** for image dimension detection on upload
- **uuid** for unique photo IDs

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm start        # Start production server
```

## Architecture

### Data flow
User uploads → `POST /api/photos` (multipart form, field "files") → file uploaded to Supabase Storage bucket "photos" → metadata inserted into Supabase `photos` table → grid re-fetches `GET /api/photos` (returns list with public URLs) → images rendered directly from Supabase Storage CDN URLs

### Key files

| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Lazy-initialized Supabase clients (anon + service_role). Does NOT init at module load — uses `getSupabase()` / `getSupabaseAdmin()` to avoid build-time env var requirement |
| `src/lib/db.ts` | Postgres CRUD via Supabase: `getAllPhotos`, `getPhotoById`, `insertPhoto`, `deletePhoto` — all async |
| `src/lib/upload.ts` | File processing: UUID rename, sharp metadata, upload to Supabase Storage, return public URL |
| `src/app/api/photos/route.ts` | `GET` lists photos with `publicUrl` appended; `POST` handles multipart upload |
| `src/app/api/photos/[id]/route.ts` | `GET` single photo; `DELETE` removes DB record + storage file |
| `src/app/api/photos/[id]/file/route.ts` | Redirects to Supabase Storage public URL |
| `src/app/page.tsx` | Home page: masonry grid (CSS columns) + drag-and-drop upload zone |
| `src/app/photo/[id]/page.tsx` | Full-screen viewer: prev/next nav, download, delete, keyboard arrows |

### Supabase credential pattern
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public, used by `getSupabase()`
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, used by `getSupabaseAdmin()` for DB writes and storage ops
- All clients are lazily created — no env vars needed at build time

### Database table
```sql
photos (
  id UUID PRIMARY KEY,
  filename TEXT NOT NULL,
  stored_name TEXT NOT NULL,    -- UUID-based filename in storage
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  width INTEGER, height INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
)
```
RLS policies allow all operations (SELECT, INSERT, DELETE) since there's no user auth.

### Supabase Storage
- Bucket name: `photos`
- Must be set to **public** bucket (for direct URL access)
- Files stored as `{uuid}.{ext}`

### Next.js 16 notable changes
- `context.params` is a Promise — always `await` it
- `RouteContext<'/path/[param]'>` helper is globally available
- Default GET caching is `dynamic`
- `@import "tailwindcss"` replaces old `@tailwind` directives
- Native modules (sharp) must be in `serverExternalPackages`

## Deployment

1. Create Supabase project at https://supabase.com
2. Run `supabase-setup.sql` in Supabase SQL Editor
3. Create public storage bucket named `photos`
4. Copy `.env.local.example` to `.env.local` and fill in Supabase credentials
5. Push to GitHub, import on Vercel, set env vars
