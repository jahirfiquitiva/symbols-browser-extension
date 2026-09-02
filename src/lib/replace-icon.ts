import Browser from 'webextension-polyfill';
import type { Provider, SymbolsManifest } from '../models';
import {
  EXTENSION_ATTRIBUTE,
  FILE_NAME_ATTRIBUTE,
  ICON_NAME_ATTRIBUTE,
} from './constants';

/**
 * Symbols has no dedicated submodule or symlink icons, unlike the Material set
 * this extension is ported from, so both fall back to the closest match.
 */
const SUBMODULE_ICON = 'folder';
const SYMLINK_ICON = 'link';

/**
 * Guards against pathological names blowing up extension parsing. Matches the
 * longest file name most filesystems accept.
 */
const MAX_FILE_NAME_LENGTH = 255;

export function replaceIconInRow(
  itemRow: HTMLElement,
  provider: Provider,
  manifest: SymbolsManifest
): void {
  const rawName = itemRow.querySelector(
    provider.selectors.filename
  )?.textContent;
  if (!rawName) return;

  const iconEl = itemRow.querySelector(
    provider.selectors.icon
  ) as HTMLElement | null;
  if (!iconEl || iconEl.getAttribute(EXTENSION_ATTRIBUTE)) return;

  // `textContent` picks up whatever whitespace the site's markup happens to
  // contain, so collapse it before anything tries to match on the name.
  const fileName = provider.transformFileName(
    itemRow,
    iconEl,
    rawName.split('/').reverse()[0].replace(/\s+/g, ' ').trim()
  );
  if (!fileName) return;

  const iconName = resolveIconName(
    fileName,
    itemRow,
    iconEl,
    provider,
    manifest
  );
  replaceElementWithIcon(iconEl, iconName, fileName, provider, manifest);
}

/**
 * Walks the lookup chain, most specific match first: a provider's own override,
 * then an exact file name, then progressively shorter extensions, then the
 * catch-all default.
 */
export function resolveIconName(
  fileName: string,
  itemRow: HTMLElement,
  iconEl: HTMLElement,
  provider: Provider,
  manifest: SymbolsManifest
): string {
  const params = { row: itemRow, icon: iconEl };

  const customMapping = provider.customMappings?.find((mapping) =>
    mapping.match(params)
  );
  if (customMapping) return customMapping.iconName;

  if (provider.getIsSubmodule(params)) return SUBMODULE_ICON;
  if (provider.getIsSymlink(params)) return SYMLINK_ICON;

  const lowerFileName = fileName.toLowerCase();

  if (!provider.getIsDirectory(params)) {
    return (
      manifest.fileNames[fileName] ??
      manifest.fileNames[lowerFileName] ??
      matchExtension(fileName, lowerFileName, manifest) ??
      manifest.defaults.file
    );
  }

  // Only reachable for a provider that implements getIsRoot. None do yet, so
  // in practice every directory falls through to the folder lookup below.
  if (provider.getIsRoot?.(params)) {
    return (
      manifest.rootFolderNames[fileName] ??
      manifest.rootFolderNames[lowerFileName] ??
      manifest.defaults.rootFolder
    );
  }

  const folderIcon =
    manifest.folderNames[fileName] ??
    manifest.folderNames[lowerFileName] ??
    manifest.defaults.folder;

  // Symbols ships a single `folder-open` and no per-folder open variants, so an
  // expanded folder that has its own icon keeps it. Only the plain folder gets
  // the open treatment, which is the only place the asset would fit.
  const isExpanded = provider.getIsExpanded?.(params) ?? false;
  if (isExpanded && folderIcon === manifest.defaults.folder) {
    return manifest.defaults.folderOpen;
  }

  return folderIcon;
}

/**
 * Tries every suffix after a dot, longest first, so `archive.tar.gz` resolves
 * against `tar.gz` before falling back to `gz`.
 */
function matchExtension(
  fileName: string,
  lowerFileName: string,
  manifest: SymbolsManifest
): string | undefined {
  if (fileName.length > MAX_FILE_NAME_LENGTH) return undefined;

  for (let i = 0; i < fileName.length; i += 1) {
    if (fileName[i] !== '.') continue;

    const extension = lowerFileName.slice(i + 1);
    const match =
      manifest.fileExtensions[extension] ?? manifest.languageIds[extension];
    if (match) return match;
  }

  return undefined;
}

export function replaceElementWithIcon(
  iconEl: HTMLElement,
  iconName: string,
  fileName: string,
  provider: Provider,
  manifest: SymbolsManifest
): void {
  const iconPath = manifest.icons[iconName];
  if (!iconPath) return;

  const newIcon = document.createElement('img');
  newIcon.setAttribute(EXTENSION_ATTRIBUTE, 'icon');
  newIcon.setAttribute(ICON_NAME_ATTRIBUTE, iconName);
  newIcon.setAttribute(FILE_NAME_ATTRIBUTE, fileName);
  newIcon.src = Browser.runtime.getURL(iconPath);
  newIcon.alt = '';

  provider.replaceIcon(iconEl, newIcon);
}
