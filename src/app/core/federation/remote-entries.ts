/**
 * Where each portal is served from: public/federation.manifest.json, read once by
 * main.ts. A portal that did not answer at start-up is registered from here when
 * its route is opened, so "Reintentar" works without reloading the page.
 */
export const remoteEntries: Record<string, string> = {};
