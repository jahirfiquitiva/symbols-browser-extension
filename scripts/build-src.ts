import * as path from 'node:path';
import * as esbuild from 'esbuild';
import * as fs from 'fs-extra';
import sharp from 'sharp';
import type { SymbolsManifest } from '../src/models/symbols-manifest';
import { buildIconManifest, upstreamDir } from './icon-manifest';

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const distDir = path.join(root, 'dist');
const generatedDir = path.join(srcDir, 'generated');
const logoIconsDir = path.join(generatedDir, 'extension-icons');

/** The Symbols icon set, resolved as a dependency and never vendored. */
const upstreamSrcDir = path.join(upstreamDir, 'src');

const targets = [
  { name: 'chrome-edge', manifest: 'chrome-edge.json' },
  { name: 'firefox', manifest: 'firefox.json' },
  { name: 'safari', manifest: 'safari.json' },
];

const logoSizes = [16, 32, 48, 128];

async function generateIconManifest(): Promise<SymbolsManifest> {
  const { manifest, dropped } = await buildIconManifest();

  if (dropped.length > 0) {
    console.warn(
      `Dropped ${dropped.length} association(s) pointing at undeclared icons:\n  ${dropped.join('\n  ')}`
    );
  }

  await fs.ensureDir(generatedDir);
  await fs.writeJson(path.join(generatedDir, 'icon-manifest.json'), manifest);

  console.log(
    `Icon manifest: ${Object.keys(manifest.icons).length} icons from symbols@${manifest.upstreamVersion}`
  );

  return manifest;
}

/** Rasterises the extension's own logo. Unrelated to the Symbols icon set. */
async function generateLogos(): Promise<void> {
  await fs.ensureDir(logoIconsDir);
  const logo = path.join(srcDir, 'logo.svg');

  await Promise.all(
    logoSizes.map((size) =>
      sharp(logo)
        .resize(size, size)
        .png()
        .toFile(path.join(logoIconsDir, `icon-${size}.png`))
    )
  );
}

const bundle = (outDir: string, entryPoint: string) =>
  esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    minify: true,
    sourcemap: false,
    outdir: outDir,
    target: 'es2022',
    format: 'iife',
  });

async function buildTarget(
  target: (typeof targets)[number],
  version: string,
  manifest: SymbolsManifest
): Promise<void> {
  const outDir = path.join(distDir, target.name);
  await fs.ensureDir(outDir);

  await Promise.all([
    // Only the SVGs the manifest actually resolves to, so nothing unreferenced
    // ships and web_accessible_resources stays an accurate description of the
    // bundle. They are copied from the dependency, never from this repository.
    // Deduplicated: two icon names can alias one SVG (folder-auth and
    // folder-lock, go-mod and go-pink), and two concurrent copies of the same
    // destination race on fs-extra's unlink-before-write.
    ...[...new Set(Object.values(manifest.icons))].map((iconPath) =>
      fs.copy(path.join(upstreamSrcDir, iconPath), path.join(outDir, iconPath))
    ),
    fs.copy(logoIconsDir, outDir),

    bundle(outDir, path.join(srcDir, 'main.ts')),
    bundle(outDir, path.join(srcDir, 'ui', 'popup', 'popup.ts')),

    fs.copy(
      path.join(srcDir, 'ui', 'popup', 'popup.html'),
      path.join(outDir, 'popup.html')
    ),
    fs.copy(
      path.join(srcDir, 'ui', 'popup', 'popup.css'),
      path.join(outDir, 'popup.css')
    ),
    fs.copy(
      path.join(srcDir, 'injected-styles.css'),
      path.join(outDir, 'injected-styles.css')
    ),
  ]);

  const [baseManifest, targetManifest] = await Promise.all([
    fs.readJson(path.join(srcDir, 'manifests', 'base.json')),
    fs.readJson(path.join(srcDir, 'manifests', target.manifest)),
  ]);

  await fs.writeJson(
    path.join(outDir, 'manifest.json'),
    { ...baseManifest, ...targetManifest, version },
    { spaces: 2 }
  );
}

async function main(): Promise<void> {
  const { version } = (await fs.readJson(path.join(root, 'package.json'))) as {
    version: string;
  };

  const [manifest] = await Promise.all([
    generateIconManifest(),
    generateLogos(),
  ]);

  for (const target of targets) {
    await buildTarget(target, version, manifest);
    console.log(`Built ${target.name}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
