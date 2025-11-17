# Architecture Audit & Refactor Plan

## Observed Issues

### Architecture & Organization
- Card layouts, radial glows, and hover shadows were copied across landing pages, tool cards, and CTA tiles. Updating one variant required touching every page, which risks visual drift and increases bundle size.
- Tool metadata helpers (live status, "new" indicator, sort options) were re-implemented inside each page, creating divergent business logic and forcing duplicated date math.
- Layout backgrounds and shell overlays were defined inline per page, rather than drawing from a single theme token set.

### Performance & State Management
- Tools directory re-created filter logic on every render with ad-hoc array operations, and landing page search performed manual string filtering without reuse, making future memoization difficult.
- Tool cards re-rendered heavy DOM trees due to inline class composition per render; lack of shared helpers meant no consistent memoizable abstractions.

### Accessibility
- Hero and directory search inputs lacked associated labels, violating WCAG requirements for assistive technology users.
- Repeated CTA cards did not expose descriptive `aria-label`s when wrapped in `<Link>` components, reducing clarity for screen readers.

### Type Safety & Single Source of Truth
- Tool category filters, sort keys, and featured limits were magic strings scattered between modules with no shared types, creating opportunities for typos and inconsistent behavior.
- Navigation links and shell classes were literal strings within components, so adding or renaming sections risked missing updates elsewhere.

### Styling & Design System
- Repeated Tailwind class strings encoded the design system in-line, preventing discovery of allowed variants (muted vs dashed cards, overlays, etc.).
- Overlays and glow gradients were duplicated in multiple files, leading to conflicting opacity levels and inconsistent theming.

### Bug Risk / UX Defects
- Without a guard around normalized tool paths, whitespace-only routes could slip through and break navigation.
- CTA cards advertised "Coming soon" but still triggered hover glows that suggested interactivity, creating a misleading affordance.

## Staged Refactor Plan
1. **Centralize metadata helpers** – move live-tool guards, sort keys, category lists, and derived labels into `lib/tools.ts` so business logic is versioned once.
2. **Unify design tokens** – capture shell overlays, card shadows, and glow layers in `lib/design-system.ts`, and introduce a shared `GlowCard` wrapper to enforce spacing, hover, and accessibility defaults.
3. **Standardize inputs** – add a reusable `SearchInput` with baked-in labeling, icon handling, and variant sizing to eliminate ad-hoc forms.
4. **Normalize navigation & layout shells** – extract nav links and shell class stacks into config/constants for consistent application across layout and headers.
5. **Apply shared abstractions** – refactor landing and tools pages to consume the centralized helpers/components, reducing per-page logic while improving readability.
6. **Document architecture** – capture audit results, staged plan, and per-file responsibilities to keep future contributors aligned.

## Per-file Change Summary

| File | Summary |
| --- | --- |
| `src/lib/cn.ts` | Introduced a tiny utility to join conditional class strings, enabling the design system helpers to stay framework-agnostic. |
| `src/lib/design-system.ts` | Added shell overlay tokens, card variant helpers, and glow constants to consolidate duplicated UI primitives. |
| `src/components/cards/GlowCard.tsx` | New abstraction that applies the shared card styles, manages glow layers, and exposes variant props for muted/dashed states. |
| `src/components/SearchInput.tsx` | Accessible, theme-aware search field component with hero/compact variants and built-in icon handling. |
| `src/lib/tools.ts` | Centralized tool-specific helpers (live guards, formatting, filters, sort options, category lists, featured limits). |
| `src/config/navigation.ts` | Single source of truth for header navigation links. |
| `src/components/SiteHeader.tsx` | Header now maps config-driven links and exposes an aria-label on the mobile toggle. |
| `src/components/ToolPageShell.tsx` | Consumed the shared shell classes and `cn` helper for consistent max-width logic. |
| `src/app/layout.tsx` | Replaced inline overlay markup with `THEME_OVERLAYS`, ensuring site-wide backgrounds stay in sync. |
| `src/app/page.tsx` | Landing page now uses `GlowCard`, `SearchInput`, and centralized tool helpers; CTA cards share styling while search is accessible. |
| `src/app/tools/client-page.tsx` | Tools directory consumes the new helpers/components, standardizes filtering logic, and improves non-live card affordances. |
| `docs/ARCHITECTURE.md` | Captures this audit, staged plan, and per-file rationale for future maintainers. |
