# Styles

The core visual system lives in `src/index.css`.

## Typography — `typography.css`

One type scale is used on every screen of both portals. It is imported at the top of
`src/index.css` and applied through the `hrm-typography` cascade layer, so it wins
over the older page-scoped rules in `index.css` without editing them.

| Role          | Size        | Weight         | Applies to                                       |
| ------------- | ----------- | -------------- | ------------------------------------------------ |
| Page title    | 22 → 28px   | Bold (700)     | `h1`, `.page-hero__title`                        |
| Section title | 16 → 18px   | Bold (700)     | `h2`, `h3`, card and panel headings              |
| Sub-heading   | 15px        | Semibold (600) | `h4`–`h6`                                        |
| Stat value    | 22 → 26px   | Bold (700)     | metric numbers on summary cards                  |
| Body          | 14px        | Regular (400)  | paragraphs, table cells, inputs, labels          |
| Small         | 12px        | Regular (400)  | `small`, meta lines, hints, pills (medium)       |
| Caption       | 11px        | Semibold, caps | eyebrows, table headers, navigation group labels |

Rules of thumb for new UI:

- Bold is only for headings and stat values. Use `<h1>`–`<h3>` for titles rather than
  bold `div`s or Tailwind `font-bold`.
- `strong` / `b` render as medium (500) emphasis, not bold.
- Do not hard-code font sizes on page elements; pick the matching element or class
  above. Sizes marked `→` scale with the viewport via `clamp()`.
- New stat-value classes go in the "Stat values" list in `typography.css`.

## Responsive containment

Page containers in the app shell can shrink below their content (`min-width: 0`), so
wide tables scroll inside their own `.table-scroll` box instead of widening the page.
Wrap any wide table in `.table-scroll`.
