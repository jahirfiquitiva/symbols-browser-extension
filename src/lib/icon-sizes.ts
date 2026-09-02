import { ICON_SIZE_ATTRIBUTE } from './constants';
import {
  addConfigChangeListener,
  DEFAULT_DOMAIN,
  getConfig,
} from './user-config';

export const iconSizes = ['sm', 'md', 'lg', 'xl'] as const;
export type IconSize = (typeof iconSizes)[number];

export const iconSizeLabels: Record<IconSize, string> = {
  sm: 'Small',
  md: 'Medium',
  lg: 'Large',
  xl: 'Extra large',
};

const setSizeAttribute = (iconSize: IconSize) =>
  document.body.setAttribute(ICON_SIZE_ATTRIBUTE, iconSize);

/**
 * Some sites strip attributes off `body` while navigating, which drops the size
 * and leaves every icon at the default scale, so put it back when that happens.
 */
const observeBodyChanges = () => {
  const observer = new MutationObserver(() => {
    if (document.body.hasAttribute(ICON_SIZE_ATTRIBUTE)) return;
    getConfig('iconSize').then(setSizeAttribute);
  });

  observer.observe(document.body, { attributes: true, subtree: false });
};

export const initIconSizes = () => {
  const applyIconSize = () => getConfig('iconSize').then(setSizeAttribute);

  const start = () => {
    applyIconSize();
    observeBodyChanges();
  };

  // The content script runs at document_start, so `document.body` may not exist
  // yet. It may also already be here, if anything awaited before calling this,
  // in which case DOMContentLoaded has been and gone and will not fire again.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  addConfigChangeListener('iconSize', setSizeAttribute);
  addConfigChangeListener('iconSize', applyIconSize, DEFAULT_DOMAIN);
};
