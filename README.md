```txt
pnpm install
pnpm run db:migrate
pnpm run dev
```

Run `pnpm run db:migrate` to initialize the local D1 database before starting development.
Run it again after adding migrations or changing the configured database ID, which selects
a separate local database. This command applies pending migrations locally only.

```txt
pnpm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
pnpm run cf-typegen
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
pnpm test                       # All Vitest projects (client and server)
pnpm run test:client            # All Vitest client tests
pnpm run test:client:unit       # API service unit tests
pnpm run test:client:components # Vue component tests
pnpm run test:client:watch      # Vitest watch mode
pnpm run test:client:coverage   # Client coverage (text and coverage/client/index.html)
pnpm run test:server            # All server tests
pnpm run test:server:unit       # Crypto and repository unit tests
pnpm run test:server:feature    # API feature tests
pnpm run test:server:coverage   # Server coverage (text and coverage/server/index.html)
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

## Cloudflare deployment

To deploy your own copy, fork this repository and configure a Worker and D1 database in your
Cloudflare account. Install the dependencies with `pnpm install`, then sign in:

```sh
pnpm exec wrangler login
pnpm exec wrangler whoami
pnpm exec wrangler d1 create passworddb
```

Update `wrangler.jsonc` in your fork:

- Replace `account_id` with your account ID, shown by `wrangler whoami`.
- Replace the existing `d1_databases` entry's `database_id` with the ID returned when creating
  your database. Keep its binding named `DB` and its `migrations_dir` set to `migrations`.
- If you chose a different database name, update `database_name` to match.
- Optionally change `name` from `passworddb` to your preferred Worker name.

If Wrangler offers to update the configuration when creating the database, review the result
and make sure there is only one D1 binding named `DB`, pointing to your own database.

Apply the migrations to your remote database, then commit and push your configuration changes:

```sh
pnpm exec wrangler d1 migrations apply DB --remote --config wrangler.jsonc
```

In the Cloudflare dashboard, create a Worker by importing your fork through the Git integration.
Use the same Worker name as `name` in `wrangler.jsonc`, and configure:

- **Build command:** `pnpm run build`
- **Deploy command:** `pnpm exec wrangler deploy`
- **Root directory:** the repository root

Vite builds the Worker and SPA separately; Wrangler automatically uses the generated deployment
configuration. Subsequent pushes to your configured production branch build and deploy your
Worker. Apply any new database migrations with the remote migration command above before
deploying code that requires them.

Before using the deployed app, generate your own base64-encoded 32-byte encryption key:

```sh
openssl rand -base64 32
```

In your Worker's **Settings > Variables & Secrets**, add `ENCRYPTION_KEY` as a **Secret** with
that value and deploy the settings change. This is a runtime secret, not a build variable.
Back it up securely: existing encrypted records require the same key. Do not commit it to
your fork. Ordinary code deploys preserve the existing Worker secret.

You can also deploy from your local checkout with `pnpm run deploy` after configuring your
account and database. Local `.dev.vars` and local database records are separate from production;
local records are not uploaded during deployment.

The app currently has no login protection; configure Cloudflare Access before storing real
credentials.
