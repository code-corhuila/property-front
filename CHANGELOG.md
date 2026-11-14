# Changelog of `property-front`

Every release of this repository, newest first. One release per course cut, tagged on `main`
(`git-conventions.md`, "Tags and versioning"; SemVer). Each entry lists the user stories it
brought, with the pull requests of `develop` that built them.

## [3.0.0] - 2026-11-15

### Added

- **HU-IDENT-002 (code-corhuila/property-docs#185) — Log in, renew and close the session**
  - feat(front): keep, renew and close the session of the identity portal (#15)
- **HU-NOTIF-002 (code-corhuila/property-docs#198) — Choose notification channels**
  - feat(front): mount the react notification portal (#16)

### Removed

- The development sign-in (`/auth/dev-login`), which lives only in `develop` (norm 5.5.2).

## [2.0.0] - 2026-10-13

### Added

- **HU-PLAT-002 (code-corhuila/property-docs#133) — One web application**
- **HU-PLAT-003 (code-corhuila/property-docs#146) — An environment that starts the same way everywhere**

The web container: frame, routes, session, shared HTTP client, isolation of a portal that is down. The development sign-in was kept out of the release.
