---
type: ADR
id: "0109"
title: "Universal mobile app with Expo React Native"
status: active
date: 2026-05-03
supersedes: "0005"
---

## Context

Tolaria needs a production mobile path that starts with iPad, follows with iPhone, and keeps Android possible later. The existing desktop app is Tauri v2 + React + Rust and has an earlier iPad prototype decision in [ADR-0005](0005-tauri-ios-for-ipad.md). That prototype proved that a mobile Tauri target could run, but the production goal has changed: the mobile app must feel smooth and native, support over-the-air updates, and avoid blocking active desktop Tolaria work.

The mobile product model should preserve Tolaria's four-surface information architecture:

```text
Sidebar | Note List | Editor | Properties
```

On iPad this becomes an adaptive split layout. On iPhone it becomes adjacent horizontal surfaces:

```text
Sidebar <- Note List -> Editor -> Properties
```

Mobile vaults will start as app-managed storage synced with Git. External folder/file-provider access is not a launch requirement. The editor should initially use TenTap as the preferred mobile editor candidate, isolated behind an adapter, with native Markdown kept as a fallback if TenTap fails quality gates.

## Decision

**Build Tolaria mobile as a separate Expo React Native app in the same monorepo, with iPad as the first target, iPhone as the second target, Android as a later target, Expo EAS Update for OTA JavaScript/style/asset updates, and shared headless packages for Tolaria domain logic.**

The production mobile app will not reuse desktop React DOM components directly. It will share pure TypeScript packages for domain models, markdown/frontmatter/wikilink parsing, sync contracts, design tokens, and localization. Rendering, navigation, storage, Git, auth, and native integration remain app/platform-specific.

GitHub OAuth App over HTTPS is the first GitHub auth path. A GitHub App remains a later hardening option if Tolaria needs selected-repository installation permissions and short-lived installation tokens.

## Options considered

- **Expo React Native** (chosen): best balance of native-feeling mobile UI, iPad/iPhone/Android reach, Expo EAS Update OTA support, and TypeScript logic sharing. Supports custom native modules through development builds when Git/storage/auth bridges are needed.
- **Tauri v2 mobile**: maximizes reuse of the desktop web UI and Rust backend shape, but keeps the app WebView-first. That is a poor production bet for native mobile gestures, editor focus, list performance, keyboard behavior, iPad split-view feel, and future Android back-gesture integration.
- **SwiftUI**: likely strongest native iPad feel, but would discard most TypeScript sharing, slow Android dramatically, and make OTA product iteration harder.
- **Capacitor**: preserves more web UI than React Native, but still carries the WebView tradeoffs and does not naturally reuse the existing Tauri/Rust backend.

## Consequences

Positive:

- Mobile can be built without destabilizing desktop Tolaria.
- Shared headless packages let desktop and mobile agree on vault semantics without forcing shared UI components.
- iPad layouts can intentionally converge toward desktop Tolaria while iPhone gets a purpose-built compact navigation model.
- EAS Update gives a clear OTA path for JavaScript, styling, and assets.
- Android remains feasible because the app is not SwiftUI-only or iOS-only.

Negative:

- Most desktop UI components will be rewritten for React Native.
- Native bridge work is required for production Git/storage/auth.
- Editor strategy remains a major risk until the TenTap spike passes on iPad.
- Native runtime/API changes still require store/TestFlight/Play builds, not OTA updates.

Quality implications:

- New mobile/shared scorable code starts at CodeScene `10.0`.
- Codacy or equivalent scanner findings for new mobile/shared code must be zero.
- Shared packages require high coverage from the start, especially markdown, core domain logic, and sync contracts.

Re-evaluate this decision if:

- TenTap and native Markdown both fail to deliver acceptable iPad editing quality.
- React Native blocks core iPad split-view or keyboard behavior in a way SwiftUI would clearly solve.
- Expo/EAS Update constraints prevent the required OTA workflow.
- Android is explicitly dropped as a future target.

## Advice

This decision follows the detailed roadmap in [MOBILE_STRATEGY.md](../MOBILE_STRATEGY.md).
