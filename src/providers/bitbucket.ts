import type { Provider } from '../models';
import { swapIcon } from './shared';

export default function bitbucket(): Provider {
  return {
    name: 'bitbucket',
    domains: [{ host: 'bitbucket.org', test: /^bitbucket\.org$/ }],
    selectors: {
      // The parent directory row is excluded, it is navigation rather than a file.
      row: 'table[data-qa="repository-directory"] td:first-child a:first-child:not([aria-label="Parent directory,"])',
      filename: 'span',
      icon: 'svg',
    },
    getIsDirectory: ({ icon }) =>
      (icon.parentNode as HTMLElement | null)?.getAttribute('aria-label') ===
      'Directory,',
    getIsSubmodule: ({ icon }) =>
      (icon.parentNode as HTMLElement | null)?.getAttribute('aria-label') ===
      'Submodule,',
    // Bitbucket's markup gives no indication that an entry is a symlink.
    getIsSymlink: () => false,
    replaceIcon: (svgEl, newIcon) => {
      newIcon.style.overflow = 'hidden';
      newIcon.style.pointerEvents = 'none';
      newIcon.style.maxHeight = '100%';
      newIcon.style.maxWidth = '100%';
      newIcon.style.verticalAlign = 'bottom';
      swapIcon(svgEl, newIcon);
    },
    onAdd: () => {},
    transformFileName: (_rowEl, _iconEl, fileName) => fileName,
  };
}
