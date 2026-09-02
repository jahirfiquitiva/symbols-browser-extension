import type { Provider } from '../models';
import { swapIcon } from './shared';

export default function gitea(): Provider {
  return {
    name: 'gitea',
    domains: [{ host: 'gitea.com', test: /^gitea\.com$/ }],
    selectors: {
      row: '#repo-files-table .repo-file-item',
      filename: '.repo-file-cell.name a',
      icon: '.repo-file-cell.name svg',
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
