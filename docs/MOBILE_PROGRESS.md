# Mobile Progress

Last updated: 2026-05-03

This file is the resumable working log for Tolaria mobile. The strategy and roadmap live in [MOBILE_STRATEGY.md](./MOBILE_STRATEGY.md); this file records the current execution state.

## Current State

- Branch: `codex/mobile`
- Active phase: Phase 0 - Decision and Setup
- Active slice: Lock production mobile architecture and resumable work loop
- Push policy: commit locally; do not push unless explicitly requested
- Validation target: iPad/iOS simulator first

## Completed

- Created high-fidelity iPhone mobile mockups in `design/mobile-mockups/`.
- Documented the production mobile strategy in `docs/MOBILE_STRATEGY.md`.
- Installed and authenticated Codacy MCP for this Codex environment.
- Confirmed Codacy MCP can access `refactoringhq/tolaria`.
- Recorded GitHub OAuth App as the first mobile GitHub auth path.
- Created [ADR-0109](./adr/0109-universal-mobile-app-with-expo-react-native.md) for Expo React Native production mobile.
- Superseded [ADR-0005](./adr/0005-tauri-ios-for-ipad.md), the earlier Tauri iOS prototype ADR.

## Next Action

Start Phase 1 with the smallest low-risk shared package extraction:

1. Identify pure markdown/frontmatter/wikilink utilities suitable for `packages/markdown`.
2. Capture CodeScene scores before editing any existing scorable files.
3. Add tests or preserve existing tests around extracted behavior.
4. Create the package with CodeScene `10.0` and zero scanner issues as the target.

## Verification Log

- `tool_search` exposed Codacy MCP tools after Codex restart.
- `codacy_get_repository_with_analysis` succeeded for `refactoringhq/tolaria`.
- Current branch verified as `codex/mobile`.

## Risks / Watch Items

- Editor quality remains the largest mobile risk; TenTap must pass the quality gates before becoming accepted.
- Shared package extraction must not destabilize active desktop work.
- Desktop alpha release currently triggers on every push to `main`; this branch is safe, but release path filters should be added before mobile work merges to `main`.
- Codacy analyzes committed/pushed repository state; local edits still need local lint/test/CodeScene discipline before remote checks exist.
