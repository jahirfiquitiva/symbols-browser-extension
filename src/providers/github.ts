import {
  EXTENSION_ATTRIBUTE,
  FILE_NAME_ATTRIBUTE,
  ICON_NAME_ATTRIBUTE,
} from '../lib/constants';
import type { Provider } from '../models';

export default function github(): Provider {
  return {
    name: 'github',
    domains: [{ host: 'github.com', test: /^github\.com$/ }],
    selectors: {
      row: `.js-navigation-container[role=grid] > .js-navigation-item,
        file-tree .ActionList-content,
        a.tree-browser-result,
        .PRIVATE_TreeView-item-content,
        .react-directory-filename-column,
        .Box details .Box-row`,
      filename: `div[role="rowheader"] > span,
        .ActionList-item-label,
        a.tree-browser-result > marked-text,
        .PRIVATE_TreeView-item-content > .PRIVATE_TreeView-item-content-text,
        .react-directory-filename-column a,
        a.Truncate`,
      icon: `.octicon-file,
        .octicon-file-directory-fill,
        .octicon-file-directory-open-fill,
        .octicon-file-submodule,
        .react-directory-filename-column > svg,
        .octicon-package,
        .octicon-file-zip,
        .octicon-file-diff,
        .octicon-file-added,
        .octicon-file-moved,
        .octicon-file-removed`,
    },
    getIsDirectory: ({ icon }) =>
      icon.getAttribute('aria-label') === 'Directory' ||
      icon.classList.contains('octicon-file-directory-fill') ||
      icon.classList.contains('octicon-file-directory-open-fill') ||
      icon.classList.contains('icon-directory'),
    getIsSubmodule: ({ icon }) =>
      icon.classList.contains('octicon-file-submodule'),
    getIsSymlink: ({ icon }) =>
      icon.classList.contains('octicon-file-symlink-file'),
    getIsExpanded: ({ icon }) =>
      icon.classList.contains('octicon-file-directory-open-fill'),
    replaceIcon: (svgEl, newIcon) => {
      // Removing GitHub's <svg> crashes its React tree view, so the element
      // stays put and only its contents are swapped for a background image.
      // This also avoids fighting other extensions such as Refined GitHub.
      // https://github.com/material-extensions/material-icons-browser-extension/issues/65
      svgEl.innerHTML = '';
      svgEl.style.backgroundImage = `url("${newIcon.getAttribute('src') ?? ''}")`;
      svgEl.style.backgroundSize = 'contain';
      svgEl.style.backgroundRepeat = 'no-repeat';
      svgEl.style.backgroundPosition = 'center';
      svgEl.style.display = '';

      svgEl.setAttribute(EXTENSION_ATTRIBUTE, 'icon');
      svgEl.setAttribute(
        ICON_NAME_ATTRIBUTE,
        newIcon.getAttribute(ICON_NAME_ATTRIBUTE) ?? ''
      );
      svgEl.setAttribute(
        FILE_NAME_ATTRIBUTE,
        newIcon.getAttribute(FILE_NAME_ATTRIBUTE) ?? ''
      );

      // The original svg carried the row's text colour. Now that it renders no
      // glyph, move that colour onto the adjacent link so the row still reads
      // as changed/added/removed. `fgColor-muted` is the default, so skip it.
      const fgColorClass = Array.from(svgEl.classList).find((className) =>
        className.startsWith('fgColor-')
      );
      if (!fgColorClass || fgColorClass === 'fgColor-muted') return;

      svgEl.parentElement?.nextElementSibling
        ?.querySelector('a')
        ?.classList.add(fgColorClass);
    },
    onAdd: (row, callback) => {
      // Expanding a folder makes GitHub's tree view swap the whole <svg> out.
      // selector-observer will not fire again for a row it has already seen,
      // so watch for a replacement svg that is not one of ours.
      const observer = new MutationObserver((mutations) => {
        const gotNewSvg = mutations.some((mutation) =>
          Array.from(mutation.addedNodes).some(
            (node) =>
              node.nodeName === 'svg' &&
              !(node as Element).hasAttribute(EXTENSION_ATTRIBUTE)
          )
        );

        if (gotNewSvg) callback();
      });

      observer.observe(row, { childList: true, subtree: true });
    },
    transformFileName: (rowEl, _iconEl, fileName) => {
      // Submodule rows read as "name @ 1a2b3c4". Four or more hex characters,
      // in case GitHub ever lengthens the abbreviated sha.
      if (fileName.includes('@')) {
        return fileName.replace(/\s+@\s+[a-fA-F0-9]{4,}$/, '');
      }

      // Release assets read as "Source code (zip)", which only resolves to an
      // icon once it looks like a file name.
      if (
        rowEl.classList.contains('Box-row') &&
        fileName.includes('Source code')
      ) {
        return fileName.replace(/\s+\((.*?)\)$/, '.$1');
      }

      return fileName;
    },
    // Symbols has no GitHub Actions icons, so these fall back to the GitHub
    // mark, which still reads as "this belongs to GitHub" rather than "yaml".
    customMappings: [
      {
        match: ({ row }) => {
          const hasWorkflowsHref = Array.from(row.querySelectorAll('a')).some(
            (anchor) =>
              (anchor.getAttribute('href') ?? '').endsWith('.github/workflows')
          );
          const hasWorkflowsText = Array.from(
            row.querySelectorAll('.PRIVATE_TreeView-item-content-text')
          ).some((el) => {
            const text = el.textContent ?? '';
            return text.includes('.github/') && text.includes('workflows');
          });

          return hasWorkflowsHref || hasWorkflowsText;
        },
        iconName: 'folder-github',
      },
      {
        match: ({ row }) => {
          const treeItemId = row.closest('.PRIVATE_TreeView-item')?.id ?? '';
          const href = row.querySelector('a')?.getAttribute('href') ?? '';

          return (
            /^\.github\/workflows\/.*\.ya?ml-item$/.test(treeItemId) ||
            /\.github\/workflows\/.*\.ya?ml$/.test(href)
          );
        },
        iconName: 'github',
      },
    ],
  };
}
