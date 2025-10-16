ReactorDesign — Migration map

This file lists legacy pages, detected visualization/dependency usage, and a recommended migration approach and priority.

Summary of legacy pages (copied to `public/legacy`)
- index.html — homepage; links to modules.
- reactor.html — Reactor design UI and calculations (large JS logic, charts via Chart.js, SVG diagrams, canvas).
- reactorss.html — Customizable reactor page (forms + charts).
- chemical.html — Chemical equilibrium page (forms + Chart.js visualizations).
- heattransfer.html — Heat transfer calculators, Chart.js and Chart.js-based charts.
- heatintegration.html — Heat integration with Chart.js graphs, local calculations.
- dynamics.html — Dynamic simulation using p5.js for visualization and custom JS for simulations.
- vaporizer.html — Vaporizer design with Three.js 3D visualization and calculations.
- optimization.html — Optimization page using Plotly (plotly-latest) and custom GA logic.
- history.html — Calculation history UI reading/writing localStorage.
- form.html — Experiment data entry form and remote POST (fetch) calls.

Detected libraries (from legacy pages and code)
- Chart.js (chart.js) — used for most 2D graphs
- Three.js (three + examples/jsm) — used in vaporizer 3D model
- Plotly (plotly.js or plotly-latest) — used for optimization visualizations
- p5.js — used in dynamics page for canvas-based simulation visualization
- translations.js, responsive.js, styles.css, responsive.css — global scripts/styles
- localStorage usage for calculation history and form submission

Recommended migration approach (per-page)
1) Safety-first: keep `public/legacy/` route (already added) and an iframe preview. This preserves exact behavior.
2) Prioritize pages by importance/size and use-case — suggested order:
   - reactor.html (high): core feature, high priority to port logic into `src/lib/reactor.js` (done) and UI into `pages/reactor.js`.
   - heattransfer.html (medium): port calculators into `src/lib/heattransfer.js` and `pages/heattransfer.js` using ChartClient.
   - dynamics.html (medium): retain p5 visual, port logic into `src/lib/dynamics.js` and use `P5Client` for visualization.
   - vaporizer.html (medium-high): 3D visualization; port logic + use `ThreeClient` wrapper to mount the scene.
   - optimization.html (low-medium): Plotly visualizations; use `PlotlyClient` wrapper and port optimization logic into `src/lib/optimizer.js`.
   - chemical.html, reactorss.html, form.html: port forms and calculation logic into components; keep submission hooks compatible.
   - history.html: port localStorage helpers into `src/lib/history.js` and create a `History` component.

Migration tactics
- Start by extracting pure calculation logic (no DOM) into `src/lib/` modules and unit-test if possible. This preserves numerical behavior exactly.
- Create small React components for input forms that emit structured data which the `src/lib` functions accept.
- For visualization, use client-only wrappers (`components/ChartClient.js`, `PlotlyClient.js`, `ThreeClient.js`, `P5Client.js`) — these are already added.
- Gradually replace iframes with ported components when the calculation logic and visualizations are verified.
- Keep `translations.js` and `responsive.js` as interim client modules under `src/lib/` and migrate to React-friendly hooks or context later.

Assets to move
- CSS: `responsive.css`, `styles.css`, `styles/` if any
- JS: `responsive.js`, `translations.js`, any custom .js calculation files
- Images: any diagrams in repo root (move into `public/static` or `public/assets`)

Notes & Next actions
- `pages/reactor.js` and `src/lib/reactor.js` were added as a proof-of-concept.
- Next recommended migration: port `heattransfer.html` to `pages/heattransfer.js` (I'll do it if you say `proceed`), using `ChartClient` to render charts and extracting calculation logic to `src/lib/heattransfer.js`.

If you approve, I will implement the `heattransfer` migration next (calculation module + page + basic charts) and run a build to verify.
