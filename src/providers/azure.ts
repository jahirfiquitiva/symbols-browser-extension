import { HIDE_PSEUDO_CLASS } from '../lib/constants';
import type { Provider } from '../models';

export default function azure(): Provider {
  return {
    name: 'azure',
    domains: [
      { host: 'dev.azure.com', test: /^dev\.azure\.com$/ },
      { host: 'visualstudio.com', test: /.*\.visualstudio\.com$/ },
    ],
    selectors: {
      row: 'table.bolt-table tbody tr.bolt-table-row, table.bolt-table tbody > a',
      filename:
        'td.bolt-table-cell[data-column-index="0"] .bolt-table-link .text-ellipsis, table.bolt-table tbody > a > td[aria-colindex="1"] span.text-ellipsis',
      icon: 'td.bolt-table-cell[data-column-index="0"] span.icon-margin, td[aria-colindex="1"] span.icon-margin',
    },
    getIsDirectory: ({ icon }) => icon.classList.contains('repos-folder-icon'),
    // Azure DevOps does not mark submodules in its file listing markup.
    getIsSubmodule: () => false,
    getIsSymlink: ({ icon }) =>
      icon.classList.contains('ms-Icon--PageArrowRight'),
    replaceIcon: (iconEl, newIcon) => {
      newIcon.style.display = 'inline-flex';
      newIcon.style.height = '1rem';
      newIcon.style.width = '1rem';

      // Azure renders its icon as a font glyph in a ::before pseudo element,
      // which would otherwise show through underneath ours.
      iconEl.classList.add(HIDE_PSEUDO_CLASS);

      // Replacing the container crashes Azure DevOps while navigating a repo,
      // so our icon goes inside it instead.
      if (iconEl.firstChild) {
        iconEl.replaceChild(newIcon, iconEl.firstChild);
      } else {
        iconEl.appendChild(newIcon);
      }
    },
    onAdd: (row, callback) => {
      // Azure reuses rows instead of removing them on navigation, so without
      // this the first render is correct and every later one is stale.
      const observer = new MutationObserver((mutations) => {
        // Our own insertions mutate the row too. Re-running on those would
        // loop forever, and every insertion of ours is an <img>.
        const isOurs = mutations.some((mutation) =>
          Array.from(mutation.addedNodes).some(
            (node) => node.nodeName === 'IMG'
          )
        );

        if (!isOurs) callback();
      });

      observer.observe(row, {
        attributes: true,
        childList: true,
        subtree: true,
      });
    },
    transformFileName: (_rowEl, _iconEl, fileName) => fileName,
  };
}
