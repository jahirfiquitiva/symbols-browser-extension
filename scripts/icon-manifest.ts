import * as path from 'node:path';
import * as fs from 'fs-extra';
import type { SymbolsManifest } from '../src/models/symbols-manifest';

/** Upstream's VS Code icon theme, as far as this module cares about it. */
type UpstreamTheme = {
  iconDefinitions: Record<string, { iconPath: string }>;
  fileExtensions: Record<string, string>;
  fileNames: Record<string, string>;
  languageIds: Record<string, string>;
  folderNames: Record<string, string>;
  rootFolderNames: Record<string, string>;
  file: string;
  folder: string;
  rootFolder: string;
};

const associationKeys = [
  'fileExtensions',
  'fileNames',
  'languageIds',
  'folderNames',
  'rootFolderNames',
] as const;

/**
 * Upstream ships this SVG but never declares it, so there is no name to resolve
 * it by. Expanded folders need one.
 */
export const FOLDER_OPEN_ICON = 'folder-open';
const FOLDER_OPEN_PATH = 'icons/folders/folder-open.svg';

/** Where the Symbols icon set lives once npm has resolved it. */
export const upstreamDir = path.resolve(
  __dirname,
  '..',
  'node_modules',
  'symbols'
);

/**
 * Turns upstream's VS Code icon theme into the manifest the extension ships.
 *
 * Two kinds of breakage are possible when the icon set is updated, and they are
 * treated differently. An association pointing at an undeclared icon is
 * recoverable: the entry is dropped and the lookup falls through to a default.
 * A declared icon whose file is missing is not, because it would 404 in the
 * browser, so it throws.
 */
export async function buildIconManifest(
  dir: string = upstreamDir
): Promise<{ manifest: SymbolsManifest; dropped: string[] }> {
  const srcDir = path.join(dir, 'src');
  const [theme, upstreamPackage] = await Promise.all([
    fs.readJson(
      path.join(srcDir, 'symbol-icon-theme.json')
    ) as Promise<UpstreamTheme>,
    fs.readJson(path.join(dir, 'package.json')) as Promise<{ version: string }>,
  ]);

  const icons: Record<string, string> = {};
  const missingFiles: string[] = [];

  for (const [name, definition] of Object.entries(theme.iconDefinitions)) {
    const iconPath = definition.iconPath.replace(/^\.\//, '');

    if (await fs.pathExists(path.join(srcDir, iconPath))) {
      icons[name] = iconPath;
    } else {
      missingFiles.push(`${name} -> ${iconPath}`);
    }
  }

  if (missingFiles.length > 0) {
    throw new Error(
      `Upstream declares icons whose files do not exist:\n  ${missingFiles.join('\n  ')}`
    );
  }

  if (!(await fs.pathExists(path.join(srcDir, FOLDER_OPEN_PATH)))) {
    throw new Error(`Upstream no longer ships ${FOLDER_OPEN_PATH}`);
  }
  icons[FOLDER_OPEN_ICON] = FOLDER_OPEN_PATH;

  const manifest: SymbolsManifest = {
    upstreamVersion: upstreamPackage.version,
    defaults: {
      file: theme.file,
      folder: theme.folder,
      folderOpen: FOLDER_OPEN_ICON,
      rootFolder: theme.rootFolder,
    },
    icons,
    fileExtensions: {},
    fileNames: {},
    languageIds: {},
    folderNames: {},
    rootFolderNames: {},
  };

  const dropped: string[] = [];

  for (const key of associationKeys) {
    for (const [name, iconName] of Object.entries(theme[key])) {
      if (icons[iconName]) {
        manifest[key][name] = iconName;
      } else {
        dropped.push(`${key}.${name} -> ${iconName}`);
      }
    }
  }

  return { manifest, dropped };
}
