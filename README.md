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

## The portals

`src/app/app.routes.ts` mounts the portals row by row from the "Screen map" of
`navigation-map.md`. Each Angular portal exposes `./routes`, a module that exports one
array of routes per mount point. The federation `name` of a portal must equal its key in
`public/federation.manifest.json`.

| Route | Portal | Export of `./routes` | Local address |
|---|---|---|---|
| `/auth/login` ¹, `/auth/register` ¹, `/auth/onboarding`, `/perfil` | `identity` | `LOGIN_ROUTES`, `REGISTER_ROUTES`, `ONBOARDING_ROUTES`, `PROFILE_ROUTES` | `http://localhost:4204` |
| `/explorar`, `/propiedades/:propiedadId` | `catalog` | `EXPLORE_ROUTES`, `PROPERTY_ROUTES` | `http://localhost:4201` |
| `/propiedades/:propiedadId/reservar`, `/reservas` | `booking` | `BOOKING_FORM_ROUTES`, `BOOKINGS_ROUTES` | `http://localhost:4202` |
| `/reservas/checkout/pago` | `payment` | `PAYMENT_ROUTES` | `http://localhost:4203` |
| `/perfil/notificaciones` | `notification` (React) | — ² | `http://localhost:4205/mount.js` |

¹ Public, like `/`. Every other route needs a session.
² The React portal is a plain ES module, `mount.js`, not a federation remote: the route
imports it and `src/app/core/federation/react-portal.component.ts` calls
`mount(element, { apiClient })` and, when the route is left, `unmount(element)` (ADR-012,
rule 3). The `apiClient` wraps the container's `HttpClient` behind promises, with the same
interceptor. `main.ts` hands Native Federation only the `remoteEntry.json` entries.

**The ports 4201 to 4205 are provisional**: the documentation does not fix them yet.

**A portal that is down.** `main.ts` starts the application even when no portal answers.
When a portal cannot be loaded, its area shows "Esta sección no está disponible" and a
"Reintentar" button; the frame and the other portals keep working. "Reintentar" loads the
portal again without reloading the page, which would close the session.

## The session (HU-IDENT-002)

`/auth/login` and `/auth/register` are screens of `property-identity-portal`; the container
keeps what they obtain (`00-governance/security-policy.md`, "Client storage"):

- **The interceptor takes the tokens** out of the answers of `POST /login`, `/register` and
  `/refresh`: the access token stays in memory, the refresh token in `sessionStorage`, and the
  portal receives the account without either.
- **Renewal.** A `401` on a protected call is renewed once with `POST /refresh` and the call
  is sent again; concurrent calls share one renewal, because a refresh token is single-use and
  a reuse revokes every session (E-12). Right after `POST /users/me/upgrade-to-host` the
  container renews too, so the next token carries `HOST`. A refused renewal closes the session
  and opens the login with `expired=true`.
- **Reload.** At start-up the refresh token of the tab renews the session; closing the tab ends it.
- **"Cerrar sesión"** sends `POST /logout` with the refresh token of this session (E-13) and
  closes it here even when Identity does not answer.

## Development sign-in (develop only)

The development sign-in, `/auth/dev-login` (a token pasted by hand, minted with
`property-infra-postgres/scripts/dev-token.sh`), exists only in `develop` (norm 5.5.2). This
release logs in through `property-identity-portal`.

## Install, run and test

```bash
npm ci          # installs exactly what package-lock.json records
npm start       # http://localhost:4200
npm run build   # dist/shell
npm test        # unit tests, one run (Vitest)
```

`package-lock.json` is versioned: `npm ci` installs exactly what was tested.
`tsconfig.federation.json` is rewritten by every build.

`deploy/` builds the image (`npm ci`, then nginx) and joins the `platform` network. nginx
never caches `remoteEntry` nor the federation manifest: they decide which version of each
portal the browser loads.

## Run with Docker

Build the image on its own, from the root of this repository:

```bash
docker build -f deploy/Dockerfile -t property-front:dev .
```

`.dockerignore` keeps `node_modules`, `dist`, `.angular` and `.git` out of the image: it
installs its own dependencies with `npm ci`. `deploy/compose.yml` publishes no port and
expects the external `platform` network, so to see the container with the catalog portal
and test data, use [`property-infra`](https://github.com/code-corhuila/property-infra).

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
