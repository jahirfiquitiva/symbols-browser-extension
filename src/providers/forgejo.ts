import type { Provider } from '../models';
import { swapIcon } from './shared';

export default function forgejo(): Provider {
  return {
    name: 'forgejo',
    domains: [{ host: 'codeberg.org', test: /^codeberg\.org$/ }],
    selectors: {
      // Forgejo's own markup, plus a fallback for older Gitea-like templates.
      row: '#repo-files-table .entry, #repo-files-table .repo-file-item',
      filename: '.name a, .repo-file-cell.name a',
      icon: '.name svg, .repo-file-cell.name svg',
    },
    getIsDirectory: ({ icon }) =>
      icon.classList.contains('octicon-file-directory-fill'),
    getIsSubmodule: ({ icon }) =>
      icon.classList.contains('octicon-file-submodule'),
    getIsSymlink: ({ icon }) =>
      icon.classList.contains('octicon-file-symlink-file'),
    replaceIcon: swapIcon,
    onAdd: () => {},
    transformFileName: (rowEl, _iconEl, fileName) => {
      if (
        rowEl.querySelector('.archive-link') &&
        fileName.includes('Source code')
      ) {
        return fileName.replace(/\s+\((.*?)\)$/, '.$1');
      }

      return fileName;
    },
  };
}
