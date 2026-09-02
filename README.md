# Symbols Icons for the browser

Replaces the file and folder icons on GitHub, GitLab, Bitbucket and other code
hosts with [Symbols](https://github.com/miguelsolorio/vscode-symbols), the icon
set by Miguel Solorio.

Chrome, Edge, Firefox and Safari.

## Credits

**Every icon this extension shows was designed by
[Miguel Solorio](https://github.com/miguelsolorio).** This project designed none
of them. It is a viewer for his icon set, which it pulls from upstream rather
than forking. Icons are never copied into this repository.

The extension itself is a port of
[material-icons-browser-extension](https://github.com/material-extensions/material-icons-browser-extension)
with the Material set swapped for Symbols. The site selectors and per-site
workarounds in `src/providers` come from that project and represent a lot of
debugging this project did not do.

Full attributions, including licences, are in [NOTICE.md](NOTICE.md).

## Supported sites

GitHub, GitLab, Bitbucket, Azure DevOps, Gitea, Codeberg (Forgejo), Gitee,
SourceForge and Tangled.

Self-hosted instances are not supported. Doing that requires asking for
permission on every domain, which is a much larger permission prompt than this
extension needs today. It currently asks for `storage` and nothing else.

## Install from source

```bash
npm install
npm run build
```

That writes one unpacked extension per target under `dist/`.

**Chrome and Edge.** Open `chrome://extensions`, turn on Developer mode, choose
Load unpacked, and select `dist/chrome-edge`.

**Firefox.** Open `about:debugging#/runtime/this-firefox`, choose Load Temporary
Add-on, and select `dist/firefox/manifest.json`. Temporary add-ons are removed
when Firefox restarts.

**Safari.** Safari only loads web extensions wrapped in an app, so there is an
extra step:

```bash
npm run bundle-safari
```

That generates an Xcode project in `safari/`. Open it, select the
`Symbols Icons (macOS)` scheme, set your signing team under Signing &
Capabilities, then build and run. The app that launches has a button to open
Safari's extension settings, where the extension needs to be enabled and granted
access to the sites you want it on.

The Xcode project references `dist/safari` by relative path rather than copying
it, so `npm run build` is enough to pick up code changes. Re-running
`bundle-safari` regenerates the project and discards any Xcode settings, signing
included, so only do that when the manifest changes.

Safari 16.4 or later. Distributing outside your own machine needs a paid Apple
Developer account.

## Packaging

```bash
npm run bundle          # chrome, edge and firefox zips
npm run bundle-safari   # xcode project
```

## Development

```bash
npm test        # vitest
npm run lint    # biome
npm run build   # build-src, then tsc
```

### How it fits together

The icons come from a build step, not from source control. `scripts/icon-manifest.ts`
reads upstream's `symbol-icon-theme.json` out of `node_modules/symbols` and
turns it into `src/generated/icon-manifest.json`: one map of icon names to SVG
paths, plus the file name, extension, language and folder associations. That
file is gitignored, as is everything under `dist/`.

`src/main.ts` runs on a supported page, resolves the site to a provider, and
watches for file rows. `src/lib/replace-icon.ts` turns a file name into an icon
name by walking a chain from most specific to least: a provider's own override,
an exact file name, progressively shorter extensions, then a default.

Each supported site is one file in `src/providers` implementing the `Provider`
type. Adding a site means adding a file there and registering it in
`src/providers/index.ts`, with no changes anywhere else.

### Updating the icon set

Bump the pinned tag in `package.json`:

```json
"symbols": "github:miguelsolorio/vscode-symbols#0.0.27"
```

Then `npm install && npm run build && npm test`.

The build drops any association pointing at an icon upstream never declared,
printing what it dropped, and fails outright if a declared icon has no file
behind it. `scripts/icon-manifest.test.ts` covers the same ground plus the icons
this extension hardcodes as fallbacks, so a bad release surfaces as a test
failure rather than as missing icons in the browser.

Upstream's `package.json` version can lag its git tags, so the version the build
prints may read lower than the tag pinned above. The pin is what matters.

### Differences from the Material extension

Symbols is a single set, so there is no icon pack setting. It ships no light
theme variants, so there is no light theme handling. It ships no submodule or
symlink icons, so those fall back to the folder and link icons. It ships one
`folder-open` and no per-folder open variants, so an expanded folder that has
its own icon keeps it, and only a plain folder gets the open one.

## Licence

MIT. See [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md).
