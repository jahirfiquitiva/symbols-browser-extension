import type { Provider } from '../models';
import azure from './azure';
import bitbucket from './bitbucket';
import forgejo from './forgejo';
import gitea from './gitea';
import gitee from './gitee';
import github from './github';
import gitlab from './gitlab';
import sourceforge from './sourceforge';
import tangled from './tangled';

export const providers: Provider[] = [
  azure(),
  bitbucket(),
  forgejo(),
  gitea(),
  gitee(),
  github(),
  gitlab(),
  sourceforge(),
  tangled(),
];

/** Resolves a URL or bare hostname to the provider that handles it. */
export const getGitProvider = (urlOrDomain: string): Provider | null => {
  let host: string;
  try {
    host = new URL(
      urlOrDomain.startsWith('http') ? urlOrDomain : `http://${urlOrDomain}`
    ).host;
  } catch {
    return null;
  }

  return (
    providers.find((provider) =>
      provider.domains.some((domain) => domain.test.test(host))
    ) ?? null
  );
};
