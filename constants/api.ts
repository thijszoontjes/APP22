// Vast endpoint voor de gebruikersservice in productie.
// Met EXPO_PUBLIC_API_URL kun je dit eventueel overschrijven voor testen.
const DEFAULT_BASE_URL = "https://userservice-userservice-projectgroup1-prod.apps.inholland-minor.openshift.eu";
const SECONDARY_BASE_URL = "https://userservice-projectgroup1-prod.apps.inholland-minor.openshift.eu";
const SECONDARY_BASE_URL_HTTP = "http://userservice-projectgroup1-prod.apps.inholland-minor.openshift.eu";

const DEFAULT_CHAT_BASE_URL = "https://chatservice-chatservice-projectgroup1-prod.apps.inholland-minor.openshift.eu";
const SECONDARY_CHAT_BASE_URL = "https://chatservice-projectgroup1-prod.apps.inholland-minor.openshift.eu";
const SECONDARY_CHAT_BASE_URL_HTTP = "http://chatservice-projectgroup1-prod.apps.inholland-minor.openshift.eu";

const DEFAULT_VIDEO_BASE_URL = "https://videoservice-videoservice-projectgroup1-prod.apps.inholland-minor.openshift.eu";
const SECONDARY_VIDEO_BASE_URL = "https://videoservice-projectgroup1-prod.apps.inholland-minor.openshift.eu";
const SECONDARY_VIDEO_BASE_URL_HTTP = "http://videoservice-projectgroup1-prod.apps.inholland-minor.openshift.eu";

const stripTrailingSlash = (url: string) => url.replace(/\/+$/, "");

// Probeer eerst de env-var, daarna de bekende routes (oude + nieuwe DNS zonder dubbele service-naam).
const isString = (value: string | undefined): value is string => typeof value === "string" && value.length > 0;

export const BASE_URLS = Array.from(
  new Set(
    [
      process.env.EXPO_PUBLIC_API_URL,
      SECONDARY_BASE_URL,
      DEFAULT_BASE_URL,
      SECONDARY_BASE_URL_HTTP,
    ]
      .filter(isString)
      .map((url) => stripTrailingSlash(url)),
  ),
);

// Eerste waarde blijft het "huidige" BASE_URL voor code die een string verwacht.
export const BASE_URL = BASE_URLS[0] || DEFAULT_BASE_URL;

export const CHAT_BASE_URLS = Array.from(
  new Set(
    [
      process.env.EXPO_PUBLIC_CHAT_URL,
      SECONDARY_CHAT_BASE_URL,
      DEFAULT_CHAT_BASE_URL,
      SECONDARY_CHAT_BASE_URL_HTTP,
    ]
      .filter(isString)
      .map((url) => stripTrailingSlash(url)),
  ),
);

export const CHAT_BASE_URL = CHAT_BASE_URLS[0] || DEFAULT_CHAT_BASE_URL;

export const VIDEO_BASE_URLS = Array.from(
  new Set(
    [
      process.env.EXPO_PUBLIC_VIDEO_URL,
      SECONDARY_VIDEO_BASE_URL,
      DEFAULT_VIDEO_BASE_URL,
      SECONDARY_VIDEO_BASE_URL_HTTP,
    ]
      .filter(isString)
      .map((url) => stripTrailingSlash(url)),
  ),
);

export const VIDEO_BASE_URL = VIDEO_BASE_URLS[0] || DEFAULT_VIDEO_BASE_URL;
