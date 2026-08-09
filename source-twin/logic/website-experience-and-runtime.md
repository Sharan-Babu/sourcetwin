---
id: website.experience.runtime
source:
  code:
    - app/page.tsx
    - app/layout.tsx
    - app/robots.ts
    - app/site-url.ts
    - app/sitemap.ts
    - app/components/**
    - app/walkthrough-data.ts
    - app/hero-example.ts
    - app/globals.css
    - app/styles/**
    - worker/index.ts
    - build/sites-vite-plugin.ts
    - vite.config.ts
    - next.config.ts
    - .openai/hosting.json
  tests:
    - tests/rendered-html.test.mjs
    - tests/tab-navigation.test.mjs
---
# Website experience and runtime

The private website server-renders one focused Source Twin launch page. It introduces the readable file format, walks through a substantial multi-turn subscription change, explains the three commands, lets visitors inspect example files, shows practical use cases and language support, and ends with installation guidance. Public copy stays natural, concise, and free of the punctuation patterns rejected by the product writing guidance.

Two client interactions let readers move through a project-evolution walkthrough and inspect representative Source Twin files. Each walkthrough stage includes a condensed human and agent exchange from a tested coding-agent scenario. Its evidence tabs identify their panel, keep one active tab in the keyboard sequence, and support arrow, Home, and End navigation. The file explorer announces changed content to assistive technology. The language support section uses real table headings and row headings. The layout adapts at smaller widths and respects reduced-motion preferences.

Vite and vinext build the page through the Cloudflare RSC environment. The worker is the request entrypoint, and the local configuration supports optional D1/R2 bindings plus project-local build state. A small Sites plugin packages hosting metadata after the bundle completes. Styles and hosting configuration are important runtime evidence, but remain declarative file mappings rather than entity inventory.

The walkthrough identifies its tested scenario as the basis for the condensed example. Test, Source Twin validation, and structural coverage results remain under their actual commands. The hero's Source Twin example uses schema-valid frontmatter, and the file explorer explicitly labels its subscription files as illustrative. Displayed counts and command output should not be treated as live CLI results unless a current test or command verifies them. Metadata uses the configured public site URL with a localhost fallback, and the build exposes canonical, social, robots, and sitemap information without hard-coding the old prototype address.

## Test coverage

- The server response has the expected title, product promise, walkthrough, files, use cases, language support, and installation guidance.
- Client components use state, keyboard-aware tabs, linked panels, and live content with the accessibility relationships described above.
- The page remains modular, responsive, and reduced-motion aware.
- Canonical and social metadata render with the configured site URL, and robots and sitemap routes are reachable.
- Preview-only artifacts and disallowed presentation dependencies are absent.
