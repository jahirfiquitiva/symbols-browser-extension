import Browser from 'webextension-polyfill';
import { type IconSize, iconSizeLabels, iconSizes } from '../../lib/icon-sizes';
import { DEFAULT_DOMAIN, getConfig, setConfig } from '../../lib/user-config';
import { getGitProvider } from '../../providers';

const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id) as T | null;
  if (!element) throw new Error(`Missing element #${id}`);
  return element;
};

const getCurrentTab = () =>
  Browser.tabs
    .query({ active: true, currentWindow: true })
    .then(([tab]) => tab as Browser.Tabs.Tab | undefined);

/**
 * The content script reads its settings once, at document start, so a changed
 * setting only takes effect on the next load.
 */
const reload = (tabId: number | undefined) => {
  if (tabId !== undefined) Browser.tabs.reload(tabId);
};

const renderIconSizes = (select: HTMLSelectElement, current: IconSize) => {
  for (const size of iconSizes) {
    const option = document.createElement('option');
    option.value = size;
    option.textContent = iconSizeLabels[size];
    option.selected = size === current;
    select.appendChild(option);
  }
};

const init = async () => {
  const tab = await getCurrentTab();
  const provider = tab?.url ? getGitProvider(tab.url) : null;

  if (!provider || !tab?.url) {
    byId('unsupported').hidden = false;
    return;
  }

  const domain = new URL(tab.url).hostname;
  const [enabledHere, enabledEverywhere, iconSize] = await Promise.all([
    getConfig('extEnabled', domain),
    getConfig('extEnabled', DEFAULT_DOMAIN),
    getConfig('iconSize', domain),
  ]);

  const hereInput = byId<HTMLInputElement>('enabled-here');
  const everywhereInput = byId<HTMLInputElement>('enabled-everywhere');
  const sizeSelect = byId<HTMLSelectElement>('icon-size');

  byId('domain').textContent = domain;
  hereInput.checked = enabledHere;
  hereInput.disabled = !enabledEverywhere;
  everywhereInput.checked = enabledEverywhere;
  renderIconSizes(sizeSelect, iconSize);

  byId('settings').hidden = false;

  hereInput.addEventListener('change', async () => {
    await setConfig('extEnabled', hereInput.checked, domain);
    reload(tab.id);
  });

  everywhereInput.addEventListener('change', async () => {
    await setConfig('extEnabled', everywhereInput.checked, DEFAULT_DOMAIN);
    // Turning the extension off globally makes the per-site switch meaningless.
    hereInput.disabled = !everywhereInput.checked;
    reload(tab.id);
  });

  sizeSelect.addEventListener('change', () => {
    // Sizing is applied by a storage listener in the content script, so this
    // one takes effect without a reload.
    setConfig('iconSize', sizeSelect.value as IconSize, domain);
  });
};

init();
