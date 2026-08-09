---
id: website.experience.runtime
source:
  code:
    - app/page.tsx
    - app/layout.tsx
    - app/components/**
    - app/product-data.ts
    - app/walkthrough-data.ts
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

The private website server-renders a single Source Twin overview with a title, product explanation, command examples, workflow sections, file-format explorer, capability summary, and repository map. Shared data keeps the workflow and evidence examples separate from the page composition.

Three client interactions let readers choose a workflow, move through a project-evolution walkthrough, and inspect representative Source Twin files. The tab controls identify their panels, keep one active tab in the keyboard sequence, and support arrow, Home, and End navigation. The file explorer announces changed content to assistive technology. The layout adapts at smaller widths and respects reduced-motion preferences.

Vite and vinext build the page through the Cloudflare RSC environment. The worker is the request entrypoint, and the local configuration supports optional D1/R2 bindings plus project-local build state. A small Sites plugin packages hosting metadata after the bundle completes. Styles and hosting configuration are important runtime evidence, but remain declarative file mappings rather than entity inventory.

The workflow area uses {{evidence-provenance}} labels to separate real runs from supported workflows. The file explorer explicitly labels its subscription files as an illustrative example. Displayed counts and command output should not be treated as live CLI results unless a current test or command verifies them.

## Test coverage

- The server response has the expected title, major sections, workflow labels, and boundary language.
- Client components use state, keyboard-aware tabs, linked panels, and live content with the accessibility relationships described above.
- The page remains modular, responsive, and reduced-motion aware.
- Preview-only artifacts and disallowed presentation dependencies are absent.
