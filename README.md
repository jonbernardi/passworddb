```txt
npm install
npm run dev
```

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiating `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

## Tests

Use Node.js 24 or newer (the server feature tests use `node:sqlite`). All tests run with Vitest.
After installing the project dependencies:

```sh
npm test                       # All Vitest projects (client and server)
npm run test:client            # All Vitest client tests
npm run test:client:unit       # API service unit tests
npm run test:client:components # Vue component tests
npm run test:client:watch      # Vitest watch mode
npm run test:client:coverage   # Client coverage (text and coverage/client/index.html)
npm run test:server            # All server tests
npm run test:server:unit       # Crypto and repository unit tests
npm run test:server:feature    # API feature tests
npm run test:server:coverage   # Server coverage (text and coverage/server/index.html)
```

- `tests/server/unit/crypto.test.mjs` checks encrypted round-trips, random IVs, key validation,
  tampering, unsupported envelopes, and decrypted field validation.
- `tests/server/unit/repositories.test.mjs` isolates the site, section, and data services with
  scripted database responses. It checks returned data, encrypted writes, parent scoping,
  missing entities, and database/decryption failures.
- `tests/server/feature/api.test.mjs` runs requests through the complete Hono app, including
  middleware, validators, repositories, and encryption. Each test creates a fresh in-memory
  SQLite database, applies the SQL migrations in filename order, enables foreign keys, and
  discards the database afterward. It covers CRUD, ordered details, moves and boundaries,
  cascading deletes, input validation, cross-origin write protection, and error responses.

Feature tests adapt the D1 statement methods used by the app to real SQLite queries. They do
not mock SQL results, access `.dev.vars`, or connect to local/remote application databases.
These are local application tests; Cloudflare Workers runtime behavior and hosted D1-specific
behavior are not verified. Vitest handles TypeScript imports directly. Database cleanup uses
Vitest's `onTestFinished` hook, and spies are restored after each test. No custom module loader
or running dev server is needed.

### Client tests

The shared `vitest.config.ts` defines a `client` project with Vue Test Utils and jsdom, and a
`server` project with the Node environment. The client project compiles and mounts
the real Vue SFCs without loading the Cloudflare Vite plugin or `.dev.vars`. The previous
hand-written Node/Vue component harness has been replaced by these Vitest component tests.

- `tests/client/services/api.test.ts` tests `BaseApi`, `SiteApi`, `SectionApi`, and `DataApi` at
  the fetch boundary: paths, methods, payloads, headers, 204 responses, validation errors,
  other HTTP errors, and network failures.
- `tests/client/components/` tests every Vue component and the app shell: form controls and
  accessibility attributes, icon/sprite wiring, modal lifecycle and busy states, all add/edit/
  delete forms, dynamic fields and validation, clipboard actions, ordering controls, site
  search and query strings, load/error states, and propagation of saved changes.

Tests clean up mounted components, restore spies/globals/timers, and reject unexpected fetches.
API service calls are mocked for component tests; no application API or clipboard is contacted.
The only shared browser shim models native dialog lifecycle events missing from jsdom; the
focus test supplies an element rectangle because jsdom does not calculate layout. These tests
verify DOM behavior, not CSS layout or real-browser dialog/clipboard permissions. Browser
end-to-end tests remain a separate layer.
