import { EXTENSION_ATTRIBUTE } from '../lib/constants';
import type { Provider } from '../models';
import { swapIcon } from './shared';

export default function tangled(): Provider {
  return {
    name: 'tangled',
    domains: [{ host: 'tangled.org', test: /^tangled\.org$/ }],
    selectors: {
      // The repo root, subfolders, and the pull request file tree each use
      // different markup.
      row: `#file-tree .grid.grid-cols-3,
        .tree .grid.grid-cols-12,
        .tree-file,
        .tree-directory`,
      filename: '.truncate',
      icon: 'svg',
    },
    getIsDirectory: ({ row, icon }) =>
      icon.classList.contains('fill-current') ||
      row.classList.contains('tree-directory') ||
      icon.querySelector('path[d*="M20 20a2"]') !== null,
    getIsSubmodule: () => false,
    getIsSymlink: () => false,
    replaceIcon: (svgEl, newIcon) => {
      // Pull request folders ship two svgs, one for each open state, toggled by
      // Tailwind `group-open/` classes. Ours must survive both states, and the
      // sibling has to go or both icons render at once.
      const sibling = svgEl.nextElementSibling;
      if (
        sibling?.tagName.toLowerCase() === 'svg' &&
        !sibling.hasAttribute(EXTENSION_ATTRIBUTE)
      ) {
        (sibling as HTMLElement).style.display = 'none';
      }

      swapIcon(svgEl, newIcon);

      newIcon.className = newIcon.className
        .split(' ')
        .filter((name) => name !== 'hidden' && !name.startsWith('group-open/'))
        .join(' ');
    },
    onAdd: () => {},
    transformFileName: (_rowEl, _iconEl, fileName) => fileName,
  };
}
