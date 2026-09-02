import type { ProviderCustomMapping } from './provider-custom-mapping';

/**
 * Everything the extension needs to know about one code hosting site.
 *
 * Each supported site supplies one of these: CSS selectors to find file rows,
 * plus hooks describing how that particular site's DOM behaves. The icon
 * replacement logic is written against this interface only, so adding a site
 * means adding a file to `src/providers` and registering it, with no changes
 * anywhere else.
 */
export type Provider = {
  name: string;
  domains: { host: string; test: RegExp }[];
  selectors: {
    /** A file or folder entry. */
    row: string;
    /** The element holding the file name, relative to a row. */
    filename: string;
    /** The icon to replace, relative to a row. */
    icon: string;
  };
  /**
   * Hook for sites that re-render rows after the initial observation, such as
   * SPA navigation or expanding a folder. Sites that render once may no-op.
   */
  onAdd: (row: HTMLElement, callback: () => void) => void;
  getIsDirectory: (params: { row: HTMLElement; icon: HTMLElement }) => boolean;
  getIsSubmodule: (params: { row: HTMLElement; icon: HTMLElement }) => boolean;
  getIsSymlink: (params: { row: HTMLElement; icon: HTMLElement }) => boolean;
  getIsExpanded?: (params: { row: HTMLElement; icon: HTMLElement }) => boolean;
  /**
   * Whether this row stands for the repository root rather than something
   * inside it. No provider implements this yet, since these sites list the
   * root's contents instead of the root itself. Implementing it is all that is
   * needed to activate the manifest's `rootFolderNames`.
   */
  getIsRoot?: (params: { row: HTMLElement; icon: HTMLElement }) => boolean;
  /** How to swap the site's icon element for ours. Varies wildly per site. */
  replaceIcon: (oldIcon: HTMLElement, newIcon: HTMLElement) => void;
  /**
   * Normalises a name read from the DOM into something resolvable, e.g.
   * stripping a submodule's commit sha.
   */
  transformFileName: (
    rowEl: HTMLElement,
    iconEl: HTMLElement,
    fileName: string
  ) => string;
  /** Site-specific overrides that win over the normal lookup chain. */
  customMappings?: ProviderCustomMapping[];
};
