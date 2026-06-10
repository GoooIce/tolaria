# Mobile UI Parity Inventory

This inventory is the working source map for the experimental mobile UI foundation. Mobile and tablet styling should copy the desktop Tolaria implementation by default, and only diverge where the target form factor requires a different interaction model.

## Tokens

| Mobile file | Desktop source | Parity target |
| --- | --- | --- |
| `src/ui/tokens.ts` | `src/index.css`, `src/theme.json` | Mirror light theme colors: sidebar `#F7F6F3`, text `#37352F`, secondary/muted text `#787774`, faint text `#B4B4B4`, borders `#E9E9E7` and `#D9D9D6`, selected `#E8F4FE`, accent blue `#155DFF`. |
| `src/ui/tokens.ts` | `src/theme.json` | Mirror editor scale: body 15/1.5, H1 32/700/1.2 with a bottom separator, H2 27/600, H3 20/600, table 14, blockquote secondary italic with blue left border. |

## Shared Wrappers

| Mobile wrapper | Desktop source | Required alignment |
| --- | --- | --- |
| `MobilePanel`, `MobileToolbar` | App shell panels and toolbar chrome | White/card surfaces, hairline borders, compact 13-16px toolbar labels, muted icons. |
| `MobileButton` | `src/components/ui/button.tsx` | Use RNR/shadcn-like button primitive; labels should be medium, not bold. |
| `MobileChip` | `SidebarCountPill`, note property chips | Rounded compact pills, muted labels, small type. Count pills are 10px, rounded-full, tabular. |
| `MobileListRow` | `src/components/NoteItem.tsx` | Row padding 14/16, title 13px medium default and semibold only when selected, snippets 12px muted, dates/meta 10-12px muted, type icon only at the row edge. |
| `MobilePropertyRow` | `src/components/propertyPanelLayout.ts` | Dense rows, 12px muted labels, 12px normal values, no heavy text weight. |

## Read-Only Workspace Components

| Mobile component | Desktop source | Required alignment |
| --- | --- | --- |
| `MobileWorkspaceSidebar` | `SidebarGroupHeader.tsx`, `SidebarParts.tsx`, folder tree components | Owns tablet sidebar rendering: top nav, groups, count pills, and folder tree. |
| `MobileNoteListPanel` | `NoteItem.tsx`, note-list header | Owns tablet note-list chrome and row composition. |
| `TabletEditorPanel` | `EditorTheme.css`, `theme.json` | Owns read-only tablet editor rendering for H1, paragraphs, headings, bullets, quotes, inline styles, and tables. |
| `MobilePropertiesPanel` | `propertyPanelLayout.ts`, `RelationshipsPanel.tsx` | Owns read-only properties and relationship display. |
| `MobileSyncStatusBar` | `StatusBar.tsx` | Owns subtle bottom sync footer display. |
| `TabletWorkspace` | Desktop four-panel layout | Owns tablet shell layout and selected-note state only. |

The tablet shell consumes `MobileWorkspaceSnapshot` from `src/workspace/mobileWorkspaceModel.ts`. The current repository is fixture-backed for UI lab speed, but the component boundary is read-only and production-shaped so native vault loading can replace the fixture repository without rewriting the tablet surfaces.

## Tablet Screens

| Surface | Desktop source | Required alignment |
| --- | --- | --- |
| Sidebar groups | `SidebarGroupHeader.tsx` | 10px muted group labels, 0.5px letter spacing, compact rounded count pills. |
| Sidebar items and folder tree | `SidebarParts.tsx`, sidebar folder rows | 13px medium labels, muted inactive icons/text, selected rows use Tolaria selected blue surface. |
| Note list | `NoteItem.tsx`, `PropertyChips.tsx` | No invented metadata lines, no word counts, no floating create button. Titles/snippets/dates follow desktop hierarchy. |
| Editor | `EditorTheme.css`, `theme.json` | H1 title has 32px desktop scale and bottom separator. Markdown fixture should exercise paragraphs, bold, italic, inline code, bullets, blockquotes, and tables. |
| Properties | `propertyPanelLayout.ts`, `RelationshipsPanel.tsx` | Dense 12px rows. Tags wrap under their label. Relationships are individual property sections; no global Relationships heading. Relationship values are full-width rows with type icon and type-colored text. |
| Sync footer | `StatusBar.tsx`, status-bar badges | Bottom bar stays subtle: white/card surface, hairline top border, muted detail text. |

## Phone Screens

| Surface | Desktop source | Required alignment |
| --- | --- | --- |
| Navigation model | Bear Notes reference images | The interaction can use full-screen note list, left drawer over a partially visible note list, and editor opened from the right. |
| Phone visual styling | Tolaria desktop sidebar/list/editor | Do not copy Bear's dark sidebar or oversized text. Use Tolaria light sidebar colors, muted labels, and desktop-derived hierarchy adjusted only for touch targets. |

## Current Intentional Gaps

- These screens are still static mocks; they validate UI structure and visual parity before full mobile business logic is wired.
- Phone navigation is represented as discrete states for screenshot QA. Gestures and native navigation transitions will come after the visual language is stable.
- Mobile wrappers are thin Tolaria wrappers over RNR-style primitives so the eventual implementation can swap in more RNR coverage without changing Tolaria-specific tokens and semantics.
