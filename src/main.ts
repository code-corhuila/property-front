import { initFederation } from '@angular-architects/native-federation';
import { remoteEntries } from './app/core/federation/remote-entries';

// Federation is initialised first: it must know where every portal lives before
// Angular bootstraps and the router tries to load one. A portal that does not
// answer is skipped, and the application starts anyway.
fetch('federation.manifest.json')
  .then((response) => response.json() as Promise<Record<string, string>>)
  .catch(() => ({}))
  .then((manifest) => {
    Object.assign(remoteEntries, manifest);
    // Native Federation registers the Angular portals; a React portal is a plain ES module
    // (mount.js) that its route imports itself (ADR-012, rule 3).
    return initFederation(Object.fromEntries(Object.entries(manifest).filter(([, url]) => !url.endsWith('.js'))));
  })
  .catch((err) => console.error(err))
  .then(() => import('./bootstrap'))
  .catch((err) => console.error(err));
