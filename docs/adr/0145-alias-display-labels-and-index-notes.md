---
type: ADR
id: "0145"
title: "Alias-first display labels and _index notes"
status: active
date: 2026-06-26
---

## Context

Some vaults use English/identifier-style filenames (`2605-12825-orthrus.md`,
`speculative-decoding.md`) while storing a human, often localized, name in the
`aliases` frontmatter array. Before this decision, `aliases` was used only for
wikilink resolution (`resolveEntry` → `matchesAlias`) and never influenced the
label shown in navigation surfaces. Every list, tab, favorite, backlink, and
quick-open row displayed `entry.title` (H1 / legacy `title:` / filename slug per
ADR-0044), so these vaults read as a wall of English slugs.

A related concern is hub/index notes (`_index_papers.md`, `index.md`): pages
that exist to aggregate links rather than as standalone notes. They clutter
lists and quick-open but must remain reachable via `[[wikilinks]]`. Tolaria had
no concept for this — `_archived` hides inactive notes, `visible` controls Type
sidebar presence, but nothing marked "structural, keep out of lists, keep
linkable."

## Decision

**1. Navigation surfaces show an alias-first label via a display-layer selector
`displayLabel(entry)`.** The selector returns the first non-blank alias, falling
back to `entry.title`. It is applied only where a human-facing label is rendered
(note list, favorites, backlinks, quick-open/search results). It never changes
`entry.title`, on-disk title resolution, or wikilink targets.

**2. A new `_index` system property (ADR-0008 underscore convention) marks a
note as a structural index.** `_index: true` hides the note from the note list,
inbox, favorites, and quick-open/search, while `[[wikilink]]` resolution still
finds it. It is parsed as bool-or-string (like `_archived`/`_favorite`) and
surfaced on `VaultEntry.is_index`.

**Title resolution (ADR-0044) is unchanged.** H1 remains the canonical title
source; `displayLabel` is a presentation override, not a new title source.

## Options considered

- **Option A — Display-layer selector + `_index` flag** (chosen): localized
  labels appear everywhere without touching the title pipeline; index notes are
  linkable but invisible in lists. Minimal blast radius (Rust frontmatter parse
  + one TS selector + filter predicates). Downside: a note's displayed name can
  differ from its filename/title, so breadcrumb (which intentionally shows the
  filename per ADR-0044) and the list label may diverge.

- **Option B — Make `aliases[0]` a new title source in `extract_title`**:
  uniform everywhere with zero per-surface changes. Rejected: it would violate
  ADR-0044's H1-primary contract, ripple into search indexing, snapshots, and
  rename-on-save, and make aliases write back into filenames.

- **Option C — A per-vault/global setting to enable alias labels**: more
  conservative. Rejected for v1: when `aliases` is empty the behavior is
  identical to today, so the default-on change is non-breaking while still
  serving the localized-vault use case immediately.

- **Option D — Reuse `_archived` to hide index notes**: rejected, conflates two
  semantics (inactive vs. structural) and would bury index notes in the archive
  filter.

## Consequences

- Vaults with populated `aliases` see those names in navigation immediately;
  vaults with empty `aliases` are unaffected (selector falls back to title).
- A note can be "in the list but labeled by alias" and "linkable but not in the
  list" independently — `_index` controls visibility, `aliases` controls label.
- `displayLabel` must be used at new navigation render sites to stay consistent;
  the breadcrumb deliberately keeps showing the filename stem (ADR-0044).
- Wikilink resolution is unaffected: `resolveEntry` already matches aliases, so
  an alias-labeled note is still found by `[[english-filename]]`, by alias, or by
  title.
- Re-evaluate if users want `_index` to also exclude from relationship/backlink
  groups (currently it does not — index notes remain full graph citizens).
