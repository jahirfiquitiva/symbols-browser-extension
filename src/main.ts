import { initIconSizes } from './lib/icon-sizes';
import { observePage } from './lib/replace-icons';
import { symbolsManifest } from './lib/symbols-manifest';
import { DEFAULT_DOMAIN, getConfig } from './lib/user-config';
import { getGitProvider } from './providers';

const init = async () => {
  const provider = getGitProvider(window.location.href);
  if (!provider) return;

  initIconSizes();

  const [enabledHere, enabledGlobally] = await Promise.all([
    getConfig('extEnabled'),
    getConfig('extEnabled', DEFAULT_DOMAIN),
  ]);
  if (!enabledHere || !enabledGlobally) return;

  observePage(provider, symbolsManifest);
};

init();
