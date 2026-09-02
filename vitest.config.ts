import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

// icon-manifest.json is generated at build time and gitignored. Write an empty
// stub so Vite can resolve the import; tests mock the module via vi.mock.
const manifestPath = path.resolve(
  __dirname,
  'src/generated/icon-manifest.json'
);
if (!fs.existsSync(manifestPath)) {
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(
    manifestPath,
    JSON.stringify({
      upstreamVersion: '0.0.0',
      defaults: {
        file: 'document',
        folder: 'folder',
        folderOpen: 'folder-open',
      },
      icons: {},
      fileExtensions: {},
      fileNames: {},
      languageIds: {},
      folderNames: {},
    })
  );
}

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
});
