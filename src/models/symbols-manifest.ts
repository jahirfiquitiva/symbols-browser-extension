/** A map of names (extensions, file names, folder names) to icon names. */
export type IconAssociations = Record<string, string>;

/**
 * The resolved Symbols icon theme.
 *
 * Generated at build time by `scripts/build-src.ts` from the upstream
 * `symbol-icon-theme.json` shipped by the `symbols` dependency. The association
 * maps are upstream's, unchanged, apart from entries pointing at icons that do
 * not exist being dropped. `icons` flattens upstream's `iconDefinitions` down to
 * the one field we need, and `defaults.folderOpen` is added here because
 * upstream ships `folder-open.svg` without ever declaring it.
 */
export type SymbolsManifest = {
  /**
   * Upstream's self-reported version. Read from its package.json, which can lag
   * behind its git tags, so this may not match the ref pinned in package.json.
   */
  upstreamVersion: string;
  defaults: {
    file: string;
    folder: string;
    folderOpen: string;
    rootFolder: string;
  };
  /** Icon name to its SVG path, relative to the extension root. */
  icons: Record<string, string>;
  fileExtensions: IconAssociations;
  fileNames: IconAssociations;
  languageIds: IconAssociations;
  folderNames: IconAssociations;
  /**
   * Icons for the repository root itself. Upstream ships this map empty today,
   * and it is only reachable once a provider implements `getIsRoot`, which none
   * do yet: these sites render the root's contents rather than a row standing
   * for the root. Carried so that supporting it later is a provider change
   * rather than a change to the manifest and everything that reads it.
   */
  rootFolderNames: IconAssociations;
};
