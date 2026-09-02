/**
 * Marks an element as replaced by this extension.
 *
 * Providers copy attributes between the site's icon and ours, and must not copy
 * these across, so they are defined once here rather than as string literals
 * scattered through every provider.
 */
export const EXTENSION_ATTRIBUTE = 'data-symbols-icons-extension';
export const ICON_NAME_ATTRIBUTE = `${EXTENSION_ATTRIBUTE}-iconname`;
export const FILE_NAME_ATTRIBUTE = `${EXTENSION_ATTRIBUTE}-filename`;
export const ICON_SIZE_ATTRIBUTE = `${EXTENSION_ATTRIBUTE}-size`;

/** Suppresses an icon font `::before` glyph rendering underneath ours. */
export const HIDE_PSEUDO_CLASS = 'symbols-icons-extension-hide-pseudo';
