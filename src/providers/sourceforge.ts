import { EXTENSION_ATTRIBUTE } from '../lib/constants';
import type { Provider } from '../models';

export default function sourceforge(): Provider {
  return {
    name: 'sourceforge',
    domains: [{ host: 'sourceforge.net', test: /^sourceforge\.net$/ }],
    selectors: {
      row: 'table#files_list tr, #content_base tr td:first-child',
      filename: 'th[headers="files_name_h"], td:first-child > a.icon',
      // In the file list there may be no icon at all, so the anchor is matched
      // instead and the icon is prepended to it.
      icon: 'th[headers="files_name_h"] > a, a.icon > i.fa',
    },
    getIsDirectory: ({ row, icon }) =>
      icon.nodeName === 'I'
        ? icon.classList.contains('fa-folder')
        : row.classList.contains('folder'),
    getIsSubmodule: () => false,
    getIsSymlink: ({ icon }) =>
      icon.nodeName === 'I' && icon.classList.contains('fa-star'),
    replaceIcon: (iconOrAnchor, newIcon) => {
      newIcon.style.verticalAlign = 'text-bottom';

      if (iconOrAnchor.nodeName === 'I') {
        newIcon.style.height = '14px';
        newIcon.style.width = '14px';
        iconOrAnchor.parentNode?.replaceChild(newIcon, iconOrAnchor);
        return;
      }

      // The anchor persists across renders, so guard against prepending twice.
      if (iconOrAnchor.querySelector(`img[${EXTENSION_ATTRIBUTE}="icon"]`))
        return;

      newIcon.style.height = '20px';
      newIcon.style.width = '20px';

      const svgEl = iconOrAnchor.querySelector('svg');
      if (svgEl) {
        svgEl.parentNode?.replaceChild(newIcon, svgEl);
      } else {
        iconOrAnchor.prepend(newIcon);
      }
    },
    onAdd: () => {},
    transformFileName: (_rowEl, _iconEl, fileName) => fileName,
  };
}
