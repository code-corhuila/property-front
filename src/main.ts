import { initFederation } from '@angular-architects/native-federation';

// Federation is initialised first: it must know where every portal lives
// before Angular bootstraps and the router tries to load one.
initFederation('federation.manifest.json')
  .catch((err) => console.error(err))
  .then(() => import('./bootstrap'))
  .catch((err) => console.error(err));
