import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import { BASE_URLS, VIDEO_BASE_URLS } from "../constants/api";
import { getLocalUriByUploadedVideoId } from "../constants/pitch-store";
import { clearAuthToken, getAuthTokens, saveAuthTokens } from "./authStorage";

export interface StreamVariant {
  url: string;
  protocol: "hls" | "progressive";
  bitrate?: number;
  resolution?: string;
  expiresAt?: string;
}

export interface VideoOwner {
  id: string;
  displayName: string;
}

export interface FeedItem {
  id: number;
  title: string;
  description?: string;
  category?: string;
  previewImageUrl?: string;
  durationSeconds?: number;
  aspectRatio?: string;
  stream?: StreamVariant[];
  progressiveUrl?: string;
  signedUrl?: string; // Mux signed URL van de backend
  localUri?: string; // Local fallback (net opgenomen pitch)
  playbackId?: string;
  muxAssetId?: string;
  urlExpiresIn?: number;
  liked: boolean;
  likeCount: number;
  owner?: VideoOwner;
  userId?: number; // ID van de user die de video uploaded heeft
  ownerId?: number; // Alternative field voor owner ID
  createdAt?: string; // ISO 8601 timestamp van video creatie
}

export interface FeedResponse {
  items: FeedItem[];
  nextCursor?: string;
  total: number;
}

const REQUEST_TIMEOUT_MS = 10000;
const CREATE_UPLOAD_TIMEOUT_MS = 30000;

const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS
) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error("Verbinding duurde te lang.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

const parseErrorMessage = async (res: Response) => {
  try {
    const text = await res.text();
    if (!text) return `Er is iets misgegaan (HTTP ${res.status})`;
    try {
      const data = JSON.parse(text);
      if (typeof data === "string") return data;
      if (data?.message) return data.message;
      if (data?.error) return data.error;
      return text;
    } catch {
      return text;
    }
  } catch {
    return "Er is iets misgegaan";
  }
};

const decodeJwtPayload = (token: string): any | null => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const requestWithFallback = async (
  path: string,
  init: RequestInit,
  bases: string[] = VIDEO_BASE_URLS,
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<Response> => {
  let lastError: Error | null = null;
  const method = String(init?.method || "GET").toUpperCase();
  const isIdempotent = method === "GET" || method === "HEAD";

  for (const base of bases) {
    const url = `${base}${path}`;
    console.log(`[VideoAPI] Probeer: ${url}`);
    console.log(`[VideoAPI] Method: ${method}`);
    console.log(`[VideoAPI] Headers:`, init.headers);
    if (init.body) {
      console.log(`[VideoAPI] Body preview:`, typeof init.body === 'string' ? init.body.substring(0, 200) : init.body);
    }
    try {
      let res = await fetchWithTimeout(url, init, timeoutMs);
      console.log(`[VideoAPI] Response: ${res.status} van ${url}`);

      // Transient 5xx gebeurt soms; voor idempotente requests proberen we 1x opnieuw op dezelfde host.
      if (isIdempotent && (res.status === 502 || res.status === 503 || res.status === 504)) {
        await sleep(250);
        console.log(`[VideoAPI] Retry: ${url}`);
        res = await fetchWithTimeout(url, init, timeoutMs);
        console.log(`[VideoAPI] Response (retry): ${res.status} van ${url}`);
      }

      // Als we een response krijgen die geen netwerk error is, return die
      if (res.status < 500 || res.ok) {
        return res;
      }
      lastError = new Error(`Server error ${res.status} op ${base}`);
    } catch (err: any) {
      console.log(`[VideoAPI] Error op ${url}:`, err?.message);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  if (lastError) {
    throw lastError;
  }
  throw new Error("Geen verbinding met video service mogelijk");
};

const refreshAccessToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new Error("Geen sessie gevonden. Log opnieuw in.");
  }
  const res = await requestWithFallback(
    "/api/auth/refresh",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    },
    BASE_URLS,
    REQUEST_TIMEOUT_MS
  );

  if (!res.ok) {
    throw new Error("Sessie verlopen. Log opnieuw in.");
  }

  const data = await res.json();
  const newAccess = data.access_token || data.accessToken;
  const newRefresh = data.refresh_token || data.refreshToken;
  if (!newAccess || !newRefresh) {
    throw new Error("Sessie verlopen. Log opnieuw in.");
  }
  await saveAuthTokens(newAccess, newRefresh);
  return { accessToken: newAccess, refreshToken: newRefresh };
};

const videoRequestWithAuth = async (
  path: string,
  init: RequestInit = {},
  timeoutMs: number = REQUEST_TIMEOUT_MS
) => {
  const { accessToken, refreshToken } = await getAuthTokens();
  if (!accessToken) {
    throw new Error("Geen toegang. Log opnieuw in.");
  }

  const withAuth = (token: string) => {
    const headers = {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    };
    console.log('[VideoAPI] Final request headers:', headers);
    return requestWithFallback(path, {
      ...init,
      headers,
    }, VIDEO_BASE_URLS, timeoutMs);
  };

  let res = await withAuth(accessToken);
  if (res.status === 401 && refreshToken) {
    try {
      const refreshed = await refreshAccessToken(refreshToken);
      res = await withAuth(refreshed.accessToken || "");
    } catch (err) {
      // Alleen uitloggen als refresh echt faalt, niet bij tijdelijke server errors
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('503') || errMsg.includes('duurde te lang')) {
        // Server probleem, niet authenticatie - blijf ingelogd
        throw new Error("Server tijdelijk niet bereikbaar. Probeer het opnieuw.");
      }
      await clearAuthToken();
      throw err;
    }
  }
  if (res.status === 401) {
    // Alleen uitloggen als het echt een auth probleem is
    const errorText = await res.text();
    if (errorText.toLowerCase().includes('token') || errorText.toLowerCase().includes('expired')) {
      await clearAuthToken();
      throw new Error("Sessie verlopen. Log opnieuw in.");
    }
    // Anders is het een server issue
    throw new Error("Server tijdelijk niet bereikbaar. Probeer het opnieuw.");
  }
  return res;
};

export async function getVideoFeed(limit: number = 10): Promise<FeedResponse> {
  const toFeedResponse = (data: any): FeedResponse => {
    const items = Array.isArray(data?.items) ? data.items : [];
    const total = typeof data?.total === "number" ? data.total : items.length;
    return {
      items: items.map((item: any) => ({
        ...item,
        liked: typeof item?.liked === "boolean" ? item.liked : false,
        likeCount: typeof item?.likeCount === "number" ? item.likeCount : 0,
      })),
      nextCursor: typeof data?.nextCursor === "string" ? data.nextCursor : undefined,
      total,
    };
  };

  const fallbackToAllVideos = async (): Promise<FeedResponse | null> => {
    try {
      const listRes = await videoRequestWithAuth("/videos", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!listRes.ok) {
        return null;
      }

      const listData = await listRes.json();
      const normalized = toFeedResponse(listData);
      await enrichItemsWithSignedUrls(normalized.items);
      attachLocalUris(normalized.items);
      return normalized;
    } catch {
      return null;
    }
  };

  try {
    const res = await videoRequestWithAuth(`/feed?limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      // Alleen bij 401 als authenticatie issue behandelen
      if (res.status === 401) {
        const errorMsg = await parseErrorMessage(res);
        if (errorMsg.toLowerCase().includes('token') || errorMsg.toLowerCase().includes('unauthorized')) {
          throw new Error("Sessie verlopen. Log opnieuw in.");
        }
      }

      // Bij 5xx proberen we te vallen terug op `/videos` zodat je alsnog video's ziet.
      if (res.status >= 500) {
        console.warn('[VideoAPI] Feed server error:', res.status, 'probeer fallback /videos');
        const fallback = await fallbackToAllVideos();
        if (fallback) return fallback;
        throw new Error("Video server heeft problemen. Probeer het opnieuw.");
      }
      const errorMsg = await parseErrorMessage(res);
      throw new Error(errorMsg || `Video service error (${res.status})`);
    }

    const data = await res.json();
    const normalized = toFeedResponse(data);
    attachLocalUris(normalized.items);

    // `/feed` is gepersonaliseerd en kan leeg zijn als de recommendation-service (nog) niks teruggeeft
    // of als de upload nog wordt verwerkt. Val dan terug op `/videos` (algemene lijst).
    if (!normalized.items.length) {
      const fallback = await fallbackToAllVideos();
      if (fallback && fallback.items.length) {
        console.log(`[VideoAPI] Feed leeg; fallback ${fallback.items.length} video's geladen (/videos)`);
        return fallback;
      }
      console.log('[VideoAPI] Feed leeg en /videos ook leeg');
      return normalized;
    }

    await enrichItemsWithSignedUrls(normalized.items);
    attachLocalUris(normalized.items);
    console.log(`[VideoAPI] ${normalized.items.length} video's geladen (/feed)`);
    return normalized;
  } catch (err: any) {
    // Als het een netwerk error is, geef specifieke melding
    if (err?.message?.includes("Verbinding duurde te lang")) {
      throw new Error("Video service reageert niet. Controleer je internetverbinding of probeer later opnieuw.");
    }
    throw new Error(err?.message || "Kon video feed niet laden");
  }
}

export interface CreateVideoRequest {
  title: string;
  description?: string;
  tags?: string[];
  contentType?: string;
  category?: string;
}

export interface UploadResponse {
  id: string;
  message: string;
  uploadUrl: string;
  muxUploadId?: string;
}

export const getPlayableVideoUrl = (item: Partial<FeedItem> | null | undefined): string | null => {
  if (!item) return null;
  const streamUrl =
    item.stream?.find((s) => s?.protocol === "hls" && typeof s?.url === "string" && s.url.length)?.url ||
    item.stream?.find((s) => typeof s?.url === "string" && s.url.length)?.url;
  const url = item.signedUrl || streamUrl || item.progressiveUrl || item.localUri;
  return typeof url === "string" && url.length ? url : null;
};

type SignedUrlCacheEntry = { url: string; expiresAtMs: number };
const signedUrlCache = new Map<string, SignedUrlCacheEntry>();
const signedUrlNegativeCache = new Map<string, number>();

const getCachedSignedUrl = (videoId: string | number): string | null => {
  const key = String(videoId);
  const entry = signedUrlCache.get(key);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAtMs) {
    signedUrlCache.delete(key);
    return null;
  }
  return entry.url;
};

const getStreamUrl = async (videoId: string | number): Promise<string> => {
  const res = await videoRequestWithAuth(
    `/videos/${encodeURIComponent(String(videoId))}/stream`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
    REQUEST_TIMEOUT_MS
  );

  if (!res.ok) {
    const errorMsg = await parseErrorMessage(res);
    throw new Error(errorMsg || `Kon stream url niet ophalen (${res.status})`);
  }

  const data = await res.json().catch(() => ({}));
  const variants: any[] =
    Array.isArray(data?.variants) ? data.variants : Array.isArray(data) ? data : Array.isArray(data?.stream) ? data.stream : [];

  const hls = variants.find((v) => v?.protocol === "hls" && typeof v?.url === "string" && v.url.length)?.url;
  const progressive = variants.find((v) => v?.protocol === "progressive" && typeof v?.url === "string" && v.url.length)?.url;
  const any = variants.find((v) => typeof v?.url === "string" && v.url.length)?.url;
  const url = hls || progressive || any;

  if (!url) {
    throw new Error("Stream varianten zijn nog niet beschikbaar.");
  }

  return url;
};

export async function getSignedPlaybackUrl(
  videoId: string | number,
  expirationSeconds: number = 3600
): Promise<string> {
  const cached = getCachedSignedUrl(videoId);
  if (cached) return cached;

  const negativeUntil = signedUrlNegativeCache.get(String(videoId));
  if (negativeUntil && Date.now() < negativeUntil) {
    throw new Error("Signed URL nog niet beschikbaar.");
  }

  const res = await videoRequestWithAuth(
    `/videos/${encodeURIComponent(String(videoId))}/signed-url?type=video&expiration=${expirationSeconds}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
    REQUEST_TIMEOUT_MS
  );

  if (!res.ok) {
    const errorMsg = await parseErrorMessage(res);

    // Vaak betekent dit: video bestaat wel, maar Mux asset/playback is nog niet ready.
    // Cache dit kort zodat we niet blijven spammen met signed-url requests.
    if (res.status === 404) {
      signedUrlNegativeCache.set(String(videoId), Date.now() + 30_000);
    } else if (res.status === 503) {
      signedUrlNegativeCache.set(String(videoId), Date.now() + 10_000);
    }

    throw new Error(errorMsg || `Kon signed url niet ophalen (${res.status})`);
  }

  const data = await res.json().catch(() => ({}));
  const url =
    data?.signed_url ||
    data?.signedUrl ||
    data?.signedURL ||
    data?.url ||
    data?.playbackUrl;

  if (!url || typeof url !== "string") {
    throw new Error("Signed URL response was leeg of ongeldig.");
  }

  const expiresIn = Number(data?.expires_in ?? data?.expiresIn ?? expirationSeconds);
  const expiresAtMs = Date.now() + Math.max(30, expiresIn - 30) * 1000;
  signedUrlCache.set(String(videoId), { url, expiresAtMs });
  return url;
}

const getPlayableUrlForVideoId = async (videoId: string | number): Promise<string> => {
  try {
    return await getSignedPlaybackUrl(videoId, 24 * 3600);
  } catch {
    // Signed-url kan 404 zijn terwijl stream endpoint al wel werkt (of vice versa).
    return await getStreamUrl(videoId);
  }
};

const enrichItemsWithSignedUrls = async (items: FeedItem[], concurrency: number = 3) => {
  const queue = items
    .filter((item) => item?.id != null)
    .filter((item) => !item.signedUrl)
    .filter((item) => !getPlayableVideoUrl(item)); // only if we have no usable url

  if (!queue.length) return items;

  let index = 0;
  const runWorker = async () => {
    while (index < queue.length) {
      const current = queue[index++];
      try {
        const playableUrl = await getPlayableUrlForVideoId(current.id);
        current.signedUrl = playableUrl;
      } catch {
        // Ignore per-item failures (video might still be processing)
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, runWorker));
  return items;
};

const attachLocalUris = (items: FeedItem[]) => {
  for (const item of items) {
    if (item.localUri) continue;
    if (getPlayableVideoUrl(item)) continue;
    const local = getLocalUriByUploadedVideoId(item.id);
    if (local) {
      item.localUri = local;
    }
  }
};

export async function createVideoUpload(
  payload: CreateVideoRequest
): Promise<UploadResponse> {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('[VideoAPI] 🎬 CREATE VIDEO UPLOAD');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('[VideoAPI] Timestamp:', new Date().toISOString());
  console.log('[VideoAPI] Available video base URLs:', VIDEO_BASE_URLS);
  console.log('[VideoAPI] Original payload:', JSON.stringify(payload, null, 2));
  
  // Backend validatie blijkt in productie soms strenger dan de OpenAPI beschrijving.
  // Stuur daarom standaard een minimale payload (alleen `title` + optioneel `contentType`).
  // Extra metadata kan later toegevoegd worden als de backend dit overal accepteert.
  const uploadPayload: Partial<CreateVideoRequest> = {
    title: payload.title || "Nieuwe Video",
    ...(payload.contentType ? { contentType: payload.contentType } : {}),
  };

  console.log('[VideoAPI] Minimized payload for backend:', JSON.stringify(uploadPayload, null, 2));
  console.log('[VideoAPI] Endpoint: POST /videos');
  console.log('[VideoAPI] Timeout:', CREATE_UPLOAD_TIMEOUT_MS, 'ms');
  
  // Log de exacte body die we gaan versturen
  const bodyString = JSON.stringify(uploadPayload);
  console.log('[VideoAPI] Request body (raw JSON string):', bodyString);
  console.log('[VideoAPI] Body length:', bodyString.length, 'bytes');
  console.log('');

  try {
    const requestHeaders = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
    console.log('[VideoAPI] Request headers (before auth):', requestHeaders);
    
    const res = await videoRequestWithAuth("/videos", {
      method: "POST",
      headers: requestHeaders,
      body: bodyString,
    }, CREATE_UPLOAD_TIMEOUT_MS);

    console.log('[VideoAPI] ✓ Response received:');
    console.log('[VideoAPI]   - Status:', res.status, res.statusText);
    console.log('[VideoAPI]   - URL:', res.url);
    console.log('[VideoAPI]   - Headers:', Object.fromEntries(res.headers.entries()));
    console.log('');

    if (!res.ok) {
      const errorMsg = await parseErrorMessage(res);
      console.error('[VideoAPI] ✗ Upload creation FAILED');
      console.error('[VideoAPI]   - Status:', res.status);
      console.error('[VideoAPI]   - Error message:', errorMsg);
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('');
      
      if (res.status === 401) {
        throw new Error("Sessie verlopen. Log opnieuw in.");
      }
      if (res.status === 400) {
        throw new Error(`Validatie error: ${errorMsg}. Controleer of alle velden correct zijn ingevuld.`);
      }
      if (res.status === 503) {
        throw new Error(`Video service tijdelijk niet beschikbaar (503). Probeer het over een paar minuten opnieuw.\n\nDit kan betekenen:\n- Backend is overbelast\n- Mux service heeft problemen\n- Database connectie faalt`);
      }
      throw new Error(errorMsg || `Upload mislukt (${res.status})`);
    }

    const text = await res.text();
    console.log('[VideoAPI] Response body (raw):', text);
    
    const data = text ? JSON.parse(text) : null;
    console.log('[VideoAPI] ✓ Upload created successfully!');
    console.log('[VideoAPI] Response data:', JSON.stringify(data, null, 2));
    
    if (data?.uploadUrl) {
      console.log('[VideoAPI] ✓ Upload URL received:', data.uploadUrl.substring(0, 100) + '...');
      console.log('[VideoAPI] Mux upload ID:', data.muxUploadId || 'N/A');
      console.log('[VideoAPI] Video ID:', data.id || 'N/A');
    } else {
      console.warn('[VideoAPI] ⚠️  No uploadUrl in response!');
    }
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    return data;
  } catch (err: any) {
    console.error('');
    console.error('[VideoAPI] ✗ EXCEPTION during upload creation:');
    console.error('[VideoAPI] Error type:', err?.name);
    console.error('[VideoAPI] Error message:', err?.message);
    console.error('[VideoAPI] Stack trace:', err?.stack);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    throw new Error(err?.message || "Kon upload niet starten");
  }
}

export async function uploadVideoToMux(
  uploadUrl: string,
  videoFile: Blob | File | string,
  contentType?: string
): Promise<void> {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('[VideoAPI] 📤 UPLOAD VIDEO TO MUX');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('[VideoAPI] Timestamp:', new Date().toISOString());
  console.log('[VideoAPI] Upload URL:', uploadUrl.substring(0, 100) + '...');
  console.log('[VideoAPI] Video file type:', typeof videoFile);
  console.log('[VideoAPI] Content-Type:', contentType || 'auto-detect');
  
  if (typeof videoFile === 'string') {
    console.log('[VideoAPI] File is string (URI):', videoFile.substring(0, 100));
  } else if (videoFile instanceof Blob) {
    console.log('[VideoAPI] File is Blob, size:', videoFile.size, 'bytes');
    console.log('[VideoAPI] File type:', videoFile.type);
  }
  console.log('');
  
  try {
    if (typeof videoFile === "string") {
      const isLocalFileUri = /^file:\/\//i.test(videoFile);
      console.log('[VideoAPI] Is local file URI:', isLocalFileUri);
      
      if (!isLocalFileUri) {
        console.log('[VideoAPI] Remote URL detected, fetching as blob first...');
        const blobRes = await fetch(videoFile);
        if (!blobRes.ok) {
          console.error('[VideoAPI] ✗ Failed to fetch video file:', blobRes.status);
          throw new Error("Video bestand niet gevonden");
        }
        const blob = await blobRes.blob();
        console.log('[VideoAPI] Blob fetched, size:', blob.size, 'bytes');
        return await uploadVideoToMux(uploadUrl, blob, contentType);
      }

      console.log('[VideoAPI] Using FileSystem.uploadAsync for local file...');
      console.log('[VideoAPI] File path:', videoFile);
      
      const result = await FileSystem.uploadAsync(uploadUrl, videoFile, {
        httpMethod: "PUT",
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: contentType ? { "Content-Type": contentType } : undefined,
      });

      console.log('[VideoAPI] Upload result:');
      console.log('[VideoAPI]   - Status:', result.status);
      console.log('[VideoAPI]   - Headers:', result.headers);
      console.log('[VideoAPI]   - Body:', result.body?.substring(0, 200));

      if (result.status < 200 || result.status >= 300) {
        const suffix = result.body ? ` - ${result.body}` : "";
        console.error('[VideoAPI] ✗ Upload to Mux FAILED:', result.status);
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('');
        throw new Error(`Upload mislukt: ${result.status}${suffix}`);
      }
      
      console.log('[VideoAPI] ✓ Upload to Mux SUCCESS!');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('');
      return;
    }

    const resolvedContentType =
      contentType || ("type" in videoFile && (videoFile as any).type) || "application/octet-stream";

    console.log('[VideoAPI] Using fetch to upload blob...');
    console.log('[VideoAPI] Content-Type:', resolvedContentType);
    console.log('[VideoAPI] Blob size:', (videoFile as Blob).size, 'bytes');

    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": resolvedContentType,
      },
      body: videoFile as Blob,
    });

    console.log('[VideoAPI] Mux response:');
    console.log('[VideoAPI]   - Status:', res.status, res.statusText);
    console.log('[VideoAPI]   - Headers:', Object.fromEntries(res.headers.entries()));

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const suffix = body ? ` - ${body}` : "";
      console.error('[VideoAPI] ✗ Upload to Mux FAILED:', res.status);
      console.error('[VideoAPI] Response body:', body);
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('');
      throw new Error(`Upload mislukt: ${res.status}${suffix}`);
    }
    
    console.log('[VideoAPI] ✓ Upload to Mux SUCCESS!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
  } catch (err: any) {
    console.error('');
    console.error('[VideoAPI] ✗ EXCEPTION during Mux upload:');
    console.error('[VideoAPI] Error type:', err?.name);
    console.error('[VideoAPI] Error message:', err?.message);
    console.error('[VideoAPI] Stack trace:', err?.stack);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    throw new Error(err?.message || "Video upload mislukt");
  }
}

// Haal eigen videos op (van ingelogde user)
export async function getMyVideos(): Promise<FeedResponse> {
  try {
    const commonInit: RequestInit = {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    };

    // Sommige deployments hebben geen `/videos/my` endpoint (niet in de OpenAPI).
    // Probeer eerst `/videos/my`, en val bij 404 terug op `/videos`.
    const myRes = await videoRequestWithAuth("/videos/my", commonInit);

    if (myRes.ok) {
      const data = await myRes.json();
      console.log(`[VideoAPI] ${data.items?.length || 0} eigen video's geladen (/videos/my)`);
      return data;
    }

    if (myRes.status === 401) {
      throw new Error("Sessie verlopen. Log opnieuw in.");
    }

    if (myRes.status !== 404) {
      const errorMsg = await parseErrorMessage(myRes);
      throw new Error(`Video service error (${myRes.status}): ${errorMsg}`);
    }

    // Fallback: `/videos` + client-side filter op userId/sub/owner.id indien aanwezig.
    const listRes = await videoRequestWithAuth("/videos", commonInit);
    if (!listRes.ok) {
      if (listRes.status === 401) {
        throw new Error("Sessie verlopen. Log opnieuw in.");
      }
      const errorMsg = await parseErrorMessage(listRes);
      throw new Error(`Video service error (${listRes.status}): ${errorMsg}`);
    }

    const data = await listRes.json();
    const items: FeedItem[] = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    const total = typeof data?.total === "number" ? data.total : items.length;

    const { accessToken } = await getAuthTokens();
    const tokenPayload = accessToken ? decodeJwtPayload(accessToken) : null;
    const tokenUserId = String(
      tokenPayload?.sub ?? tokenPayload?.user_id ?? tokenPayload?.userId ?? ""
    ).trim();

    if (!tokenUserId) {
      const enriched = await enrichItemsWithSignedUrls(items);
      attachLocalUris(enriched);
      return { items: enriched, total };
    }

    const filtered = items.filter((video) => {
      const ownerId = video?.owner?.id ? String(video.owner.id).trim() : "";
      const userId = video?.userId != null ? String(video.userId).trim() : "";
      const ownerIdAlt = video?.ownerId != null ? String(video.ownerId).trim() : "";
      return ownerId === tokenUserId || userId === tokenUserId || ownerIdAlt === tokenUserId;
    });

    const enriched = await enrichItemsWithSignedUrls(filtered);
    attachLocalUris(enriched);

    console.log(`[VideoAPI] ${enriched.length}/${items.length} eigen video's geladen (fallback /videos)`);
    return { items: enriched, total: enriched.length };
  } catch (err: any) {
    console.error('[VideoAPI] Get my videos error:', err);
    throw new Error(err?.message || "Kon eigen videos niet laden");
  }
}
