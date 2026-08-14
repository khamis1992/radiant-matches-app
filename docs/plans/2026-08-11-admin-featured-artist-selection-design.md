# Admin-controlled featured artist

## Goal

Replace the automatic “highest-rated artist” showcase with one explicit artist
selected by an administrator.

## Design

- Store one selection in the existing `public.platform_settings` table using
  the unique key `featured_artist_id`.
- Keep selection data outside `public.artists`; artists can update their own
  artist row, while `platform_settings` writes are already restricted to
  administrators by RLS.
- Reuse the table's existing public read policy so guest users can resolve the
  selected artist without a schema migration.
- Add the selection controls to `/admin/artists`: current selection summary,
  set/replace action per available artist, and a remove action.
- Resolve the public featured card by exact selected `artist_id`; do not fall
  back to rating when no administrator selection exists.

## Verification

- TypeScript and ESLint pass.
- The existing `platform_settings` endpoint is queried successfully with the
  project's public client.
- Admin can set, replace, and remove the selected artist.
- The public featured card matches the persisted selection.
