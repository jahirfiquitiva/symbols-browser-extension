import { EXTENSION_ATTRIBUTE } from '../lib/constants';

/**
 * Carries the site's own attributes (classes, sizing, aria) over to our icon so
 * it inherits the surrounding layout. Our own bookkeeping attributes and `src`
 * are left alone, since copying those would overwrite the icon we just built.
 */
export const cloneAttributes = (
  source: HTMLElement,
  target: HTMLElement
): void => {
  for (const name of source.getAttributeNames()) {
    if (name === 'src' || name.startsWith(EXTENSION_ATTRIBUTE)) continue;
    target.setAttribute(name, source.getAttribute(name) ?? '');
  }
};

/**
 * The common case: take the site's attributes, then stand in for its element.
 * Sites that crash when their icon node is removed do something else instead.
 */
export const swapIcon = (oldIcon: HTMLElement, newIcon: HTMLElement): void => {
  cloneAttributes(oldIcon, newIcon);
  oldIcon.parentNode?.replaceChild(newIcon, oldIcon);
};
