import type { Provider } from '../models';
import { swapIcon } from './shared';

export default function gitee(): Provider {
  return {
    name: 'gitee',
    domains: [{ host: 'gitee.com', test: /^gitee\.com$/ }],
    selectors: {
      row: `#git-project-content .tree-content .row.tree-item,
        .file_title,
        .blob-description,
        .release-body .releases-download-list .item`,
      filename: `.tree-list-item > a,
        .tree-item-submodule-name a,
        span.file_name,
        a`,
      // The delete button in the file view header is an icon too. Skip it.
      icon: 'i.iconfont:not(.icon-delete), i.icon',
    },
    getIsDirectory: ({ icon }) => icon.classList.contains('icon-folders'),
    getIsSubmodule: ({ icon }) => icon.classList.contains('icon-submodule'),
    getIsSymlink: ({ icon }) => icon.classList.contains('icon-file-shortcut'),
    replaceIcon: (iconEl, newIcon) => {
      newIcon.style.height = '28px';
      newIcon.style.width = '18px';
      swapIcon(iconEl, newIcon);
    },
    onAdd: () => {},
    transformFileName: (rowEl, _iconEl, fileName) => {
      if (
        rowEl.classList.contains('item') &&
        fileName.includes('Source code')
      ) {
        return fileName.replace(/\s+\((.*?)\)$/, '.$1');
      }

      return fileName;
    },
  };
}
