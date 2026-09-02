import { describe, expect, it } from 'vitest';
import { getGitProvider, providers } from './index';

describe('provider resolution', () => {
  it.each([
    ['https://github.com/user/repo', 'github'],
    ['https://gitlab.com/user/repo', 'gitlab'],
    ['https://bitbucket.org/user/repo', 'bitbucket'],
    ['https://dev.azure.com/org/project', 'azure'],
    ['https://myorg.visualstudio.com/project', 'azure'],
    ['https://gitea.com/user/repo', 'gitea'],
    ['https://codeberg.org/user/repo', 'forgejo'],
    ['https://gitee.com/user/repo', 'gitee'],
    ['https://sourceforge.net/projects/x', 'sourceforge'],
    ['https://tangled.org/user/repo', 'tangled'],
  ])('resolves %s to %s', (url, expected) => {
    expect(getGitProvider(url)?.name).toBe(expected);
  });

  it('accepts a bare hostname', () => {
    expect(getGitProvider('github.com')?.name).toBe('github');
  });

  it('does not match a lookalike domain', () => {
    // The domain patterns are anchored, so a host that merely contains a
    // supported name must not be treated as that provider.
    expect(getGitProvider('https://github.com.evil.test/user/repo')).toBeNull();
    expect(getGitProvider('https://notgithub.com/user/repo')).toBeNull();
  });

  it('returns null for an unsupported host', () => {
    expect(getGitProvider('https://example.com')).toBeNull();
  });

  it('returns null rather than throwing on an unparseable url', () => {
    expect(getGitProvider('not a url')).toBeNull();
  });

  it('gives every provider a distinct name', () => {
    const names = providers.map((provider) => provider.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
