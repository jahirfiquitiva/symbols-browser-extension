import type { Provider } from '../models';
import { swapIcon } from './shared';

export default function gitlab(): Provider {
  return {
    name: 'gitlab',
    domains: [{ host: 'gitlab.com', test: /^gitlab\.com$/ }],
    selectors: {
      row: `table[data-testid="file-tree-table"].table.tree-table tr.tree-item,
        table[data-qa-selector="file_tree_table"] tr,
        .file-header-content,
        .gl-card[data-testid="release-block"] .js-assets-list ul li`,
      filename: `.tree-item-file-name .tree-item-link,
        .tree-item-file-name,
        .file-header-content .file-title-name,
        .file-header-content .gl-link,
        .gl-link`,
      icon: `.tree-item-file-name .tree-item-link svg,
        .tree-item svg,
        .file-header-content svg:not(.gl-button-icon),
        .gl-link svg.gl-icon[data-testid="doc-code-icon"]`,
    },
    getIsDirectory: ({ icon }) =>
      icon.getAttribute('data-testid') === 'folder-icon',
    getIsSubmodule: ({ row }) =>
      row.querySelector('a')?.classList.contains('is-submodule') ?? false,
    getIsSymlink: ({ icon }) =>
      icon.getAttribute('data-testid') === 'symlink-icon',
    replaceIcon: (svgEl, newIcon) => {
      newIcon.style.height = '16px';
      newIcon.style.width = '16px';
      swapIcon(svgEl, newIcon);
    },
    onAdd: () => {},
    transformFileName: (rowEl, _iconEl, fileName) => {
      // Release assets read as "Source code (zip)".
      if (
        rowEl.parentElement?.parentElement?.classList.contains(
          'js-assets-list'
        ) &&
        fileName.includes('Source code')
      ) {
        return fileName.replace(/\s+\((.*?)\)$/, '.$1');
      }

      return fileName;
    },
  };
}
