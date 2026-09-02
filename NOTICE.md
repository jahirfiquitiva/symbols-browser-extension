# Notices and attributions

This extension is a derivative work. Almost none of the interesting parts are
original, and this file records who they came from.

Everything here is MIT licensed, including this project, so the combination is
distributable under MIT as long as the notices below travel with it.

---

## 1. The icons: Symbols, by Miguel Solorio

**Every icon this extension displays was designed by Miguel Solorio.** This
project designed none of them and claims no rights over them. It is a viewer.

- Source: <https://github.com/miguelsolorio/vscode-symbols>
- Marketplace: <https://marketplace.visualstudio.com/items?itemName=miguelsolorio.symbols>
- License: MIT

The SVG files and the icon-to-filename mappings in `symbol-icon-theme.json` are
taken directly from that repository at the release pinned in `symbols.json`:

```json
{
  "repository": "miguelsolorio/vscode-symbols",
  "tag": "0.0.26",
  "commit": "5c207346a91bba200cc666e43ce6fdac1fb72f80"
}
```

The icons are **not** vendored into this repository. `scripts/fetch-icons.ts`
downloads that exact commit and extracts it into `vendor/`, and the build copies
what it needs into `dist/`. Both paths are gitignored. Updating the icon set
means bumping that pin. Nothing is forked, so upstream stays the single source
of truth.

Upstream's LICENSE file is fetched alongside the icons and kept in `vendor/`, so
the licence travels with the artwork it covers.

```
MIT License

Copyright (c) 2020-22 Miguel Solorio

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 2. The extension architecture: material-icons-browser-extension

This project is a port of
[material-icons-browser-extension](https://github.com/material-extensions/material-icons-browser-extension)
with the Material icon set swapped for Symbols.

The following are adapted from that project, in some places close to verbatim:

- The `Provider` strategy interface (`src/models/provider.ts`)
- All nine provider implementations (`src/providers/*.ts`), including the
  CSS selectors, the per-site `replaceIcon` workarounds, and the SPA
  `MutationObserver` handling. These selectors represent a large amount of
  accumulated site-specific debugging that this project did not do.
- The icon lookup chain (`src/lib/replace-icon.ts`)
- The domain-scoped storage wrapper (`src/lib/user-config.ts`)
- The icon sizing mechanism (`src/lib/icon-sizes.ts`)
- The multi-target build and manifest assembly (`scripts/build-src.ts`)
- Portions of the test suites

- Source: <https://github.com/material-extensions/material-icons-browser-extension>
- License: MIT

```
MIT License

Copyright (c) 2021 Claudio Santos and Richard Lam
(MIT) Copyright (c) 2021 Philipp Kief (VSCode Material Icon Theme)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 3. Runtime dependencies

| Package | License | Used for |
| --- | --- | --- |
| [selector-observer](https://github.com/josh/selector-observer) | MIT | Reacting to file rows entering the DOM |
| [webextension-polyfill](https://github.com/mozilla/webextension-polyfill) | MPL-2.0 | Promise-based `browser.*` API across engines |

`webextension-polyfill` is MPL-2.0, a file-level copyleft licence. It is
consumed unmodified as a library, which imposes no licence obligation on this
project's own source. If its source is ever modified, those modified files must
be published under MPL-2.0.

---

## Trademarks

GitHub, GitLab, Bitbucket, Azure DevOps, Gitea, Forgejo, Codeberg, Gitee,
SourceForge and Tangled are trademarks of their respective owners. This project
is not affiliated with, endorsed by, or sponsored by any of them.
