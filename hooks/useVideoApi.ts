import { VIDEO_BASE_URLS } from "../constants/api";
import { getAuthTokens } from "./authStorage";

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
  playbackId?: string;
  muxAssetId?: string;
  urlExpiresIn?: number;
  liked: boolean;
  likeCount: number;
  owner?: VideoOwner;
  userId?: number; // ID van de user die de video uploaded heeft
  ownerId?: number; // Alternative field voor owner ID
}

export interface FeedResponse {
  items: FeedItem[];
  nextCursor?: string;
  total: number;
}

const REQUEST_TIMEOUT_MS = 10000;

const fetchWithTimeout = async (url: string, options: RequestInit) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
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

const requestWithFallback = async (
  path: string,
  init: RequestInit
): Promise<Response> => {
  let lastError: Error | null = null;

  for (const base of VIDEO_BASE_URLS) {
    const url = `${base}${path}`;
    console.log(`[VideoAPI] Probeer: ${url}`);
    try {
      const res = await fetchWithTimeout(url, init);
      console.log(`[VideoAPI] Response: ${res.status} van ${url}`);
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

export async function getVideoFeed(limit: number = 10): Promise<FeedResponse> {
  const { accessToken } = await getAuthTokens();
  if (!accessToken) {
    throw new Error("Geen toegang. Log opnieuw in.");
  }

  try {
    const res = await requestWithFallback(`/feed?limit=${limit}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
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
      // Bij 500/503 - dit is server probleem, niet authenticatie
      if (res.status >= 500) {
        console.warn('[VideoAPI] Server error:', res.status);
        throw new Error("Video server heeft problemen. Probeer het opnieuw.");
      }
      const errorMsg = await parseErrorMessage(res);
      throw new Error(errorMsg || `Video service error (${res.status})`);
    }

    const data = await res.json();
    
    console.log('[VideoAPI] Feed data ontvangen:', JSON.stringify(data, null, 2));
    
    // Check of we daadwerkelijk items hebben
    if (!data.items || data.items.length === 0) {
      throw new Error("Nog geen video's beschikbaar. Upload de eerste video!");
    }
    
    console.log(`[VideoAPI] ${data.items.length} video's geladen`);
    data.items.forEach((item: FeedItem, index: number) => {
      console.log(`[VideoAPI] Video ${index + 1}:`, {
        id: item.id,
        title: item.title,
        hasStream: !!item.stream,
        streamCount: item.stream?.length || 0,
        hasProgressiveUrl: !!item.progressiveUrl,
        progressiveUrl: item.progressiveUrl,
        streamUrls: item.stream?.map(s => s.url) || []
      });
    });
    
    return data;
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

export async function createVideoUpload(
  payload: CreateVideoRequest
): Promise<UploadResponse> {
  const { accessToken } = await getAuthTokens();
  if (!accessToken) {
    throw new Error("Geen toegang. Log opnieuw in.");
  }

  // Minimale payload - alleen title is vereist
  const uploadPayload = {
    title: payload.title || 'Nieuwe Video'
  };

  console.log('[VideoAPI] Create upload with payload:', uploadPayload);

  try {
    const res = await requestWithFallback("/videos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(uploadPayload),
    });

    if (!res.ok) {
      const errorMsg = await parseErrorMessage(res);
      console.error('[VideoAPI] Upload creation failed:', res.status, errorMsg);
      
      if (res.status === 401) {
        throw new Error("Sessie verlopen. Log opnieuw in.");
      }
      if (res.status === 400) {
        throw new Error(`Validatie error: ${errorMsg}. Controleer of alle velden correct zijn ingevuld.`);
      }
      throw new Error(errorMsg || `Upload mislukt (${res.status})`);
    }

    const data = await res.json();
    console.log('[VideoAPI] Upload created:', data);
    return data;
  } catch (err: any) {
    console.error('[VideoAPI] Create upload error:', err);
    throw new Error(err?.message || "Kon upload niet starten");
  }
}

export async function uploadVideoToMux(
  uploadUrl: string,
  videoFile: Blob | File
): Promise<void> {
  try {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "video/mp4",
      },
      body: videoFile,
    });

    if (!res.ok) {
      throw new Error(`Upload mislukt: ${res.status}`);
    }
  } catch (err: any) {
    throw new Error(err?.message || "Video upload mislukt");
  }
}

// Haal eigen videos op (van ingelogde user)
export async function getMyVideos(): Promise<FeedResponse> {
  const { accessToken } = await getAuthTokens();
  if (!accessToken) {
    throw new Error("Geen toegang. Log opnieuw in.");
  }

  try {
    const res = await requestWithFallback("/videos/my", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("Sessie verlopen. Log opnieuw in.");
      }
      if (res.status === 404) {
        // Nog geen videos
        return { items: [], total: 0 };
      }
      const errorMsg = await parseErrorMessage(res);
      throw new Error(`Video service error (${res.status}): ${errorMsg}`);
    }

    const data = await res.json();
    console.log(`[VideoAPI] ${data.items?.length || 0} eigen video's geladen`);
    return data;
  } catch (err: any) {
    console.error('[VideoAPI] Get my videos error:', err);
    throw new Error(err?.message || "Kon eigen videos niet laden");
  }
}

