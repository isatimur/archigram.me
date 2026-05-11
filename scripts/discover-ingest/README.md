# Library ingestion pipeline

Scales the curated `/library/*` from a handful of hand-seeded diagrams to
hundreds of community-sourced examples. Each stage is a separate script that
reads JSON from disk and writes JSON to disk, so you can resume mid-pipeline,
inspect intermediate output, and replace any one stage without touching the
others.

## Pipeline at a glance

| Stage | Script                   | Input                                | Output                              |
| ----- | ------------------------ | ------------------------------------ | ----------------------------------- |
| 1     | `fetch-github-code.ts`   | GitHub Code Search                   | `stages/1-fetched/<hash>.json`      |
| 2     | `fetch-github-gists.ts`  | GitHub public gists                  | `stages/2-gists/<hash>.json`        |
| 3     | `fetch-awesome-lists.ts` | `mermaid-js/awesome-mermaid`         | `stages/3-awesome/<hash>.json`      |
| 4     | `fetch-mermaid-docs.ts`  | `mermaid-js/mermaid` syntax examples | `stages/4-mermaid-docs/<hash>.json` |
| 5     | `validate-render.ts`     | union of stages 1–4                  | `stages/5-validated/<hash>.json`    |
| 6     | `dedupe.ts`              | stage 5                              | `stages/6-deduped/<hash>.json`      |
| 7     | `score.ts`               | stage 6                              | `stages/7-scored/<hash>.json`       |
| 8     | `enrich-ai.ts`           | stage 7                              | `stages/8-enriched/<slug>.json`     |
| 9     | `render-svg.ts`          | stage 8                              | `stages/9-rendered/<slug>.json`     |

After stage 9, the orchestrator (when invoked with `--prod`) copies records
into `data/library/<slug>.json`, regenerates `data/library/_manifest.json`,
and writes a manual-review queue to `data/library/_review.md`. Hand-seeded
files are never overwritten — colliding slugs are suffixed `-2`, `-3`, …

## Running it

### Dry-run (default — safe, no network, no API spend)

```bash
bun run library:ingest:dry-run
```

This reads from `scripts/discover-ingest/fixtures/*.json`, stubs out Gemini,
and writes everything under `tmp/library-ingest/`. The fixtures intentionally
include a too-small diagram (should be rejected by stage 5) and a near-duplicate
(should be folded by stage 6) so you can see the pipeline doing its job.

### Production

```bash
GITHUB_TOKEN=ghp_… GEMINI_API_KEY=… bun run library:ingest
```

The orchestrator:

- Asserts both env vars are set
- Pipes through stages 1–9
- Copies stage-9 records into `data/library/`
- Regenerates `data/library/_manifest.json` from the union of hand-seeded +
  ingested files
- Writes the review queue at `data/library/_review.md`

You can cap volume with `--limit=N` (default 300 — applies to the AI enrichment
stage), and run a subset of stages with `--stages=5,6,7,8,9` if you only want
to re-process a previous fetch.

## Required tooling

- **Bun** (project already uses it).
- **mermaid-cli** for the validate and render stages:
  ```bash
  bun add -g @mermaid-js/mermaid-cli
  ```
  If `mmdc` isn't on `PATH`, stage 5 exits non-zero with an install hint and
  stage 9 falls back to a placeholder SVG.

## Required env vars

| Variable         | When required        | Notes                                                              |
| ---------------- | -------------------- | ------------------------------------------------------------------ |
| `GITHUB_TOKEN`   | live mode (`--prod`) | Standard `ghp_…` PAT. Public repo read access is enough.           |
| `GEMINI_API_KEY` | live mode (`--prod`) | Used by stage 8 for AI commentary. Falls back to a stub if absent. |

In dry-run mode neither is required.

## Resuming a failed run

Every stage is idempotent — re-running it overwrites the same `<hash>.json`
files. To resume after a failure:

```bash
# Re-run only stages 5 onwards using whatever survived in tmp/library-ingest/
bun run scripts/discover-ingest/build-library.ts --dry-run --stages=5,6,7,8,9
```

For prod, swap `--dry-run` for `--prod`. You can also point at an alternate
output root with `--output-dir=/tmp/some-other-root`.

## Review queue

`data/library/_review.md` is regenerated on every prod run. It lists any
diagrams where:

- `ai.fallback: true` — Gemini failed or was unavailable; commentary is stubbed
- the source license is missing or unknown

Treat these as candidates only — do **not** include them in the sitemap or
homepage until a human has reviewed and approved them. Once you've reviewed
an entry, set `ai.fallback: false` and add a real license in the JSON.

## Adding more sources

The current list of `awesome-list` repos is hardcoded in
`fetch-awesome-lists.ts` (the `AWESOME_LISTS` constant). Add more curated lists
there rather than expanding the generic code-search query — quality > quantity.

## Schema reference

Final on-disk records match `lib/library/types.ts → LibraryDiagram`. The
intermediate-stage shapes live in `lib/types.ts` next to this README.
