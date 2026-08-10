---
id: website.experience.runtime
source:
  code:
    - app/page.tsx
    - app/layout.tsx
    - app/robots.ts
    - app/site-url.ts
    - app/sitemap.ts
    - app/icon.png
    - app/favicon.ico
    - app/components/**
    - app/walkthrough-data.ts
    - app/hero-example.ts
    - app/globals.css
    - app/styles/**
    - public/source-twin-mark.png
    - worker/index.ts
    - build/sites-vite-plugin.ts
    - vite.config.ts
    - next.config.ts
    - .openai/hosting.json
  tests:
    - tests/rendered-html.test.mjs
---
# Website experience and runtime

The private website server-renders one focused Source Twin launch page. A simple pair of mirrored code chevrons identifies Source Twin in the header, footer, browser icon, and favicon. One continuous practice chapter walks through a substantial subscription change from product problem to review and then opens the resulting Source Twin folder from the same example project. The page also explains the three-command loop, shows practical use cases and compact language support, and ends with installation guidance. Public copy stays natural, concise, and free of the punctuation patterns rejected by the product writing guidance.

Two client interactions let readers move through the feature journey and inspect its representative Source Twin files. Each walkthrough stage includes a condensed human and agent exchange from a tested coding-agent scenario. Its evidence board keeps the twin file, code, tests, and terminal result visible together, using two columns on larger screens and one readable column on small screens. The final folder includes the approved cancellation, subscription, and renewal terms described by the journey. The command loop uses one compact terminal-like surface. The everyday workflow uses one neutral, connected row with four concise steps and no decorative hover movement. Language support fits in one contained panel. The file explorer announces changed content to assistive technology, and the language support section uses real table headings and row headings. Subtle load and stage-change motion supports orientation without blocking use, and reduced-motion preferences disable it. The layout adapts at smaller widths without horizontal overflow.

Vite and vinext build the page through the Cloudflare RSC environment. The worker is the request entrypoint, and the local configuration supports optional D1/R2 bindings plus project-local build state. A small Sites plugin packages hosting metadata after the bundle completes. Styles and hosting configuration are important runtime evidence, but remain declarative file mappings rather than entity inventory.

The walkthrough identifies its tested scenario as the basis for the condensed example. Its final refinement describes the human requirement to preserve a scheduled cancellation date and avoid duplicate work, while the visible test can still show the precise implementation assertion. Test, Source Twin validation, and structural coverage results remain under their actual commands. The hero's Source Twin example uses schema-valid frontmatter, and both the walkthrough results and final folder are explicitly illustrative. Displayed counts and command output should not be treated as live CLI results unless a current test or command verifies them. Metadata uses the configured public site URL with a localhost fallback, and the build exposes canonical, social, robots, and sitemap information without hard-coding the old prototype address.

## Test coverage

- The server response has the expected title, product promise, continuous practice chapter, use cases, language support, and installation guidance.
- Brand assets exist at the expected dimensions and the favicon is a valid icon file.
- Client components use state, visible evidence cards, linked panels, and live content with the accessibility relationships described above.
- The page remains modular, compact, responsive, and reduced-motion aware.
- Canonical and social metadata render with the configured site URL, and robots and sitemap routes are reachable.
- Preview-only artifacts and disallowed presentation dependencies are absent.
