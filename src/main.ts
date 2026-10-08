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
    return initFederation(manifest);
  })
  .catch((err) => console.error(err))
  .then(() => import('./bootstrap'))
  .catch((err) => console.error(err));
