# property-front

> The web container of **Property**: one application that mounts the domain portals

Part of the **Property** distributed system — Grupo 2. Governance and documentation live in
[`property-docs`](https://github.com/code-corhuila/property-docs). The decision behind this
repository is `05-architecture/decisions/records/ADR-012-frontend-frameworks.md`; its routes
and screens are in `12-ux-ui/navigation-map.md`, and its look in `12-ux-ui/design-system.md`.

Angular 21 (zoneless, signals) · Native Federation 21 · Node 22 LTS or 24.

## What it owns

The container holds everything that must exist **exactly once**: the frame (top bar and
bottom navigation), the routes, the session, the only HTTP client, the 404 page and the
area that replaces a portal that cannot be loaded. Each domain portal
(`property-<domain>-portal`) is mounted on its routes with Native Federation.

## The single HTTP client

`src/app/app.config.ts` is **the only place where `provideHttpClient()` is called**.
Portals are loaded as routes inside the container's injector, so when a portal injects
`HttpClient` it receives the container's instance with its interceptor: gateway URL, token,
`X-Correlation-Id`, time limit and one error shape. The rule for a portal is simple and
checkable: **a portal never calls `provideHttpClient()`**. If it did, it would create a
second client without the interceptor, and its requests would go out unauthenticated.

## Development sign-in

Until `property-identity-portal` exists, `/auth/login` accepts a token pasted by hand,
minted with `property-infra/scripts/dev-token.sh`. It is for development only and never
reaches `main`. The token lives in memory, so reloading the page closes the session
(`00-governance/security-policy.md`, "Client storage").

## Install, run and test

```bash
npm ci          # installs exactly what package-lock.json records
npm start       # http://localhost:4200
npm run build   # dist/shell
npm test        # unit tests, one run (Vitest)
```

`package-lock.json` is versioned: `npm ci` installs exactly what was tested.
`tsconfig.federation.json` is rewritten by every build.

## Branching

Three permanent branches. **None of them accepts a direct commit** — you enter through a child
branch and leave through a Pull Request.

```
develop  <--PR--  feat/... fix/... chore/...
qa       <--PR--  qa/...
main     <--PR--  release/...  hotfix/...
```

Promotion happens **by re-application** (`git cherry-pick -x`), never by merging one permanent
branch into another. `main` requires **1 approval from `ariel5253`**.

Full policy: `00-governance/branching-policy.md` and `00-governance/git-conventions.md` in
`property-docs`.
