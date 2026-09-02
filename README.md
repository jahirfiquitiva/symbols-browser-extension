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
extension needs today. It currently asks for `storage`, plus `activeTab` so the
popup can tell which site you are on when you open it.

## Install from source

```bash
pnpm install
pnpm build
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
pnpm bundle-safari
```

That generates an Xcode project in `safari/`. Open it, select the
`Symbols Icons (macOS)` scheme, set your signing team under Signing &
Capabilities, then build and run. The app that launches has a button to open
Safari's extension settings, where the extension needs to be enabled and granted
access to the sites you want it on.

The Xcode project references `dist/safari` by relative path rather than copying
it, so `pnpm build` is enough to pick up code changes. Re-running
`bundle-safari` regenerates the project and discards any Xcode settings, signing
included, so only do that when the manifest changes.

Safari 16.4 or later. Distributing outside your own machine needs a paid Apple
Developer account.

## Packaging

```bash
pnpm bundle          # chrome, edge and firefox zips
pnpm bundle-safari   # xcode project
```

## Development

```bash
pnpm test     # vitest
pnpm lint     # biome
pnpm build    # fetch icons, generate the manifest, bundle, typecheck
```

This project uses pnpm. `pnpm-workspace.yaml` allows build scripts for esbuild
and sharp, which need them, and nothing else.

Manifests are assembled per target from `src/manifests`: `base.json` plus a
small per-browser fragment carrying only what differs, which today is each
engine's minimum version.

### How it fits together

The icons come from a build step, not from source control. `scripts/fetch-icons.ts`
downloads the release pinned in `symbols.json` and extracts it into `vendor/`.
`scripts/icon-manifest.ts` then reads upstream's `symbol-icon-theme.json` from
there and turns it into `src/generated/icon-manifest.json`: one map of icon
names to SVG paths, plus the file name, extension, language and folder
associations. All three of `vendor/`, `src/generated/` and `dist/` are
gitignored.

The icon set is fetched rather than installed as a dependency. Package managers
insist on running a git-hosted package's build scripts, and upstream's `prepare`
would pull in its own toolchain to build a VS Code extension this project never
uses. Fetching sidesteps that, keeps installs free of upstream code execution,
and works the same whichever package manager you use.

`src/main.ts` runs on a supported page, resolves the site to a provider, and
watches for file rows. `src/lib/replace-icon.ts` turns a file name into an icon
name by walking a chain from most specific to least: a provider's own override,
an exact file name, progressively shorter extensions, then a default.

Each supported site is one file in `src/providers` implementing the `Provider`
type. Adding a site means adding a file there and registering it in
`src/providers/index.ts`, with no changes anywhere else.

One hook on that type, `getIsRoot`, has no implementations. These sites list a
repository's contents rather than a row standing for the repository itself, so
there is nothing to detect yet. The manifest still carries upstream's
`rootFolderNames` and root folder default, and the lookup chain still consults
them, so a site that does surface such a row only needs the provider to say so.

### Working with the icon set

The icon set is pinned in `symbols.json`, not forked, so there is nothing to
merge. Three commands cover the whole maintenance loop.

```bash
pnpm icons:check             # is there a newer Symbols release
pnpm icons:update            # move to the latest one
pnpm icons:update 0.0.27     # move to a specific one
```

`icons:update` rewrites the pin, re-fetches, then reports what changed: icons added and
removed, and file, extension, language and folder associations added, removed or
repointed. Without that, an update is an opaque jump from one tag to another.
A real run looks like this:

```
pinned: 0.0.24
latest: 0.0.26

Icons  +41  -1
  added:   folder-claude, folder-redis, folder-next and 38 more
  removed: oxlint

fileExtensions  +40  -0  ~3
  changed: resx: xml -> i18n, psd: image -> photoshop

folderNames  +22  -1  ~1
  changed: .next: folder-gray -> folder-next
```

Then run `pnpm build && pnpm test`.

To see what a release offers, which is needed whenever an icon name has to be
written by hand:

```bash
pnpm icons:list              # all 349 icons
pnpm icons:list folder-git   # only names containing "folder-git"
pnpm icons:list --unused     # icons no association points at
```

`--unused` is the interesting one. It currently lists 48 icons that upstream
ships but never maps to anything, `supabase` and the `nest-*` variants among
them, which is where to look for something to wire into a provider custom
mapping.

### When an update breaks

The build and the test suite both refuse to paper over a bad release.

An association pointing at an icon upstream never declared is recoverable. The
entry is dropped, the lookup falls through to a default, and the build says what
it dropped. Two of these exist today, `less` and `yml`.

A declared icon whose file is missing is not recoverable, since it would 404 in
the browser, so it fails the build outright.

`scripts/icon-manifest.test.ts` covers the same ground plus the icon names
hardcoded in the lookup chain, so a release that renames `link` or `folder-github`
surfaces as a test failure rather than as missing icons in a browser. Upstream
0.0.24 has no `link` icon at all, which is what that test is for.

Upstream releases also drift structurally, and the generator absorbs that: 0.0.24
ships icon paths with trailing whitespace, and defines neither `rootFolderNames`
nor `rootFolder`. Both are handled, with tests.

Upstream's `package.json` version can lag its git tags, so the version the build
prints may read lower than the tag pinned in symbols.json. The pin is what
matters.

### Differences from the Material extension

Symbols is a single set, so there is no icon pack setting. It ships no light
theme variants, so there is no light theme handling. It ships no submodule or
symlink icons, so those fall back to the folder and link icons. It ships one
`folder-open` and no per-folder open variants, so an expanded folder that has
its own icon keeps it, and only a plain folder gets the open one.

## Licence

MIT. See [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md).
