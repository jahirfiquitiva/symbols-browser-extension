import Browser from 'webextension-polyfill';
import type { IconSize } from './icon-sizes';

export type UserConfig = {
  extEnabled: boolean;
  iconSize: IconSize;
};

export const hardDefaults: UserConfig = {
  extEnabled: true,
  iconSize: 'md',
};

/** The pseudo-domain holding the value used when a site has no override. */
export const DEFAULT_DOMAIN = 'default';

/**
 * Settings are stored per domain as `${domain}:${name}`, falling back to
 * `default:${name}`, so a site can be turned off without touching the rest.
 */
export const getConfig = async <T extends keyof UserConfig>(
  name: T,
  domain: string = window.location.hostname,
  useDefault = true
): Promise<UserConfig[T]> => {
  const isDefaultDomain = domain === DEFAULT_DOMAIN;
  const result = await Browser.storage.sync.get({
    [`${isDefaultDomain ? 'SKIP' : domain}:${name}`]: null,
    [`${DEFAULT_DOMAIN}:${name}`]: hardDefaults[name],
  });

  const domainValue = result[`${domain}:${name}`];
  const defaultValue = result[`${DEFAULT_DOMAIN}:${name}`];

  return (domainValue ?? (useDefault ? defaultValue : null)) as UserConfig[T];
};

export const setConfig = <T extends keyof UserConfig>(
  name: T,
  value: UserConfig[T],
  domain: string = window.location.hostname
) => Browser.storage.sync.set({ [`${domain}:${name}`]: value });

export const addConfigChangeListener = (
  name: keyof UserConfig,
  handler: (value: never) => void,
  domain: string = window.location.hostname
) =>
  Browser.storage.onChanged.addListener((changes) => {
    const change = changes[`${domain}:${name}`];
    if (change?.newValue !== undefined) handler(change.newValue as never);
  });
