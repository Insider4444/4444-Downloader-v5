import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Zap,
  Coffee,
  Shield,
  Film,
  CheckCircle2,
  Music,
  Settings,
  History,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  PlayCircle,
  FileText,
  AlertTriangle,
  ExternalLink,
  Maximize2,
  X,
  Activity,
  Clock,
  HardDrive,
  Download as DownloadIcon,
  Home,
  Sun,
  Moon,
  BookOpen,
  MousePointer2,
  Globe,
  Instagram,
  Link2,
  Loader2,
  User,
  Eye,
  Code,
  BarChart3,
  Server,
  Layers,
  Cpu,
  Earth,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { flushSync } from "react-dom";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function cleanTitle(title: string, url?: string): string {
  if (!title) return "";
  let cleaned = title.trim();

  // Check if title is generic
  const isGeneric = 
    !cleaned ||
    cleaned.toLowerCase() === "unknown title" ||
    cleaned.toLowerCase().includes("video #") ||
    /^[a-z0-9_]+\s+video\s+#\d+$/i.test(cleaned) ||
    /^video\s+#\d+$/i.test(cleaned) ||
    /^(?:master|index|playlist|manifest)(?:-[a-f0-9]+)?(?:-\d+)?$/i.test(cleaned) ||
    /^[a-f0-9]{32}$/i.test(cleaned);

  if (isGeneric && url) {
    try {
      const parsedUrl = new URL(url.replace(/^ytsearch\d+:/, ""));
      const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
      
      const genericSegments = ["movies", "shows", "watch", "in", "sports", "details", "tv-shows", "movie", "show", "play"];
      const candidateSegments = pathSegments.filter(seg => 
        !genericSegments.includes(seg.toLowerCase()) && 
        !/^\d+$/.test(seg) && 
        seg.length > 2
      );

      if (candidateSegments.length > 0) {
        const slug = candidateSegments[candidateSegments.length - 1];
        cleaned = slug
          .split("-")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
          .split("_")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }
    } catch (e) {
      console.warn("Failed to extract title from fallback URL:", e);
    }
  }

  for (const divider of [" | ", " - ", " – ", " — "]) {
    if (cleaned.includes(divider)) {
      cleaned = cleaned.split(divider)[0];
    }
  }

  cleaned = cleaned
    .replace(/\s*\|\s*Netflix\s*(?:Official\s*Site)?/gi, "")
    .replace(/\s*\|\s*Disney\+?/gi, "")
    .replace(/\s*\|\s*Max/gi, "")
    .replace(/\s*\|\s*JioHotstar/gi, "")
    .replace(/\s*\|\s*Hotstar/gi, "")
    .replace(/\s*\|\s*Prime\s*Video/gi, "")
    .replace(/\s*\|\s*Zee5/gi, "")
    .replace(/\s*-\s*Watch\s+(?:TV\s+Show|Movie)\s+Online.*/gi, "")
    .replace(/\s*-\s*Apple\s*TV\s*\+?/gi, "")
    .replace(/\s*on\s*Apple\s*TV\s*\+?/gi, "")
    .replace(/\s*-\s*Watch\s+on\s*Crunchyroll/gi, "")
    .replace(/^Watch\s+/gi, "")
    .replace(/^Amazon\.com:\s*/gi, "")
    .replace(/^Prime\s*Video:\s*/gi, "")
    .replace(/\s*-\s*JioCinema.*/gi, "")
    .trim();

  return cleaned || title;
}

function getBestHeadersForUrl(urlStr: string): { userAgent: string; referer: string } {
  const defaultUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";
  let userAgent = defaultUA;
  let referer = "";

  try {
    const urlLower = urlStr.toLowerCase();
    if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be")) {
      userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";
      referer = "https://www.youtube.com/";
    } else if (urlLower.includes("jiocinema.com")) {
      userAgent = "Mozilla/5.0 (Linux; Android 10; Android TV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36";
      referer = "https://www.jiocinema.com/";
    } else if (urlLower.includes("hotstar.com") || urlLower.includes("jiohotstar.com")) {
      if (urlLower.includes(".mpd") || urlLower.includes(".m3u8") || urlLower.includes("apix.") || urlLower.includes(".cdn.")) {
        userAgent = "Disney+;in.startv.hotstar.dplus.tv/23.08.14.4.2915 (Android/13)";
      } else {
        userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";
      }
      referer = "https://www.hotstar.com/";
    } else if (urlLower.includes("zee5.com")) {
      userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";
      referer = "https://www.zee5.com/";
    } else if (urlLower.includes("sonyliv.com")) {
      userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";
      referer = "https://www.sonyliv.com/";
    } else if (
      urlLower.includes("quietmidnightgardeningideas.site") ||
      urlLower.includes("justhd.tv") ||
      urlLower.includes("vaplayer.ru")
    ) {
      userAgent = defaultUA;
      referer = "https://nextgencloudfabric.com/";
    }
  } catch (e) {}

  return { userAgent, referer };
}

function extractPlayback(r: any): any {
  try {
    const playerWidget = r?.success?.page?.spaces?.player?.widget_wrappers?.[0]?.widget?.data;
    if (!playerWidget) return null;
    
    const pc = playerWidget.player_config || {};
    let playback = pc.media_asset_v2?.primary || pc.media_asset?.primary;
    
    if (!playback) {
      const ps = pc.primary_stream || {};
      const up = ps.url_params || {};
      const cu = up.content_url || ps.content_url;
      if (cu) {
        playback = {
          content_url: cu,
          license_url: up.license_url || ps.license_url,
          playback_tags: up.playback_tags || ps.playback_tags || "",
        };
      }
    }
    return playback;
  } catch (e) {
    return null;
  }
}

function getCodecScore(codec: string): number {
  if (!codec) return 0;
  const c = codec.toLowerCase();
  if (c.includes("av01") || c.includes("av1")) return 4;
  if (c.includes("vp09") || c.includes("vp9")) return 3;
  if (c.includes("hvc1") || c.includes("hev1") || c.includes("hev") || c.includes("h265") || c.includes("265")) return 2;
  if (c.includes("avc") || c.includes("h264") || c.includes("264")) return 1;
  return 0;
}

function getCodecDisplay(codec: string): string {
  if (!codec) return "";
  const c = codec.toLowerCase();
  if (c.includes("av01") || c.includes("av1")) return "AV1";
  if (c.includes("vp09") || c.includes("vp9")) return "VP9";
  if (c.includes("hvc1") || c.includes("hev1") || c.includes("hev") || c.includes("h265") || c.includes("265")) return "HEVC";
  if (c.includes("avc") || c.includes("h264") || c.includes("264")) return "H264";
  if (c.includes("ec-3") || c.includes("eac3")) return "E-AC3";
  if (c.includes("ac-3") || c.includes("ac3")) return "AC3";
  if (c.includes("mp4a") || c.includes("aac")) return "AAC";
  if (c.includes("opus")) return "Opus";
  if (c.includes("flac")) return "FLAC";
  return codec.split(".")[0].toUpperCase();
}

function getAudioChannels(f: any): string {
  if (!f) return "";
  let chNum = f.audio_channels || f.channels;
  if (chNum === 6) return "5.1 Ch";
  if (chNum === 2) return "2.0 Ch";
  if (chNum === 1) return "1.0 Ch";
  if (chNum) return `${chNum}.0 Ch`;

  const fields = [f.format_note, f.format_id, f.format, f.acodec].map(v => String(v || "").toLowerCase());
  for (const s of fields) {
    if (s.includes("5.1") || s.includes("6ch") || s.includes("surround") || s.includes("ec-3-6") || s.includes("eac3-6") || s.endsWith("-6") || s.includes("-6-") || s.includes("6-channel")) {
      return "5.1 Ch";
    }
    if (s.includes("stereo") || s.includes("2ch") || s.includes("aac-2") || s.includes("aac-lc") || s.includes("mp4a.40.2") || s.endsWith("-2") || s.includes("-2-") || s.includes("2-channel")) {
      return "2.0 Ch";
    }
  }
  return "";
}

async function generateHotstarAuth(): Promise<string> {
  const encKeyHex = "05fc1a01cac94bc412fc53120775f9ee";
  const st = Math.floor(Date.now() / 1000);
  const exp = st + 12000;
  const acl = "/*";
  const message = `st=${st}~exp=${exp}~acl=${acl}`;
  
  try {
    const keyBytes = new Uint8Array(encKeyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await window.crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      new TextEncoder().encode(message)
    );
    const signatureHex = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    return `${message}~hmac=${signatureHex}`;
  } catch (e) {
    console.error("Crypto HMAC failed, returning fallback auth string", e);
    return `st=${st}~exp=${exp}~acl=/*~hmac=d8c9a35e9821dbcae3152345091cbf890f5b12850981abcdc56138982a0b121e`;
  }
}

function extractBffMetadata(res: any) {
  let title = "";
  let duration = 0;
  let thumbnail = "";

  const spaces = res.success?.page?.spaces || {};
  
  const heroWidget = spaces.hero?.widget_wrappers?.[0]?.widget?.data || {};
  if (heroWidget.content_info?.title) {
    title = String(heroWidget.content_info.title);
  }
  
  const playerWidget = spaces.player?.widget_wrappers?.[0]?.widget?.data || {};
  if (!title && playerWidget.content_info?.title) {
    title = String(playerWidget.content_info.title);
  }
  if (!title && playerWidget.title) {
    title = String(playerWidget.title);
  }

  const pc = playerWidget.player_config || {};
  const asset = pc.media_asset_v2?.primary || pc.media_asset?.primary || {};
  
  const durVal = heroWidget.cw_info?.duration || 
                 heroWidget.content_info?.duration || 
                 playerWidget.duration || 
                 asset.duration || 
                 pc.duration;

  if (durVal) {
    const durNum = typeof durVal === "number" ? durVal : parseFloat(String(durVal));
    if (!isNaN(durNum) && durNum > 0) {
      if (durNum > 10000) {
        duration = Math.round(durNum / 1000);
      } else {
        duration = Math.round(durNum);
      }
    }
  }

  // Scan spaces for image URLs, exactly mirroring poster_scraper.py's logic:
  //   - Scan hero, logo, seo spaces fully
  //   - Scan tray space selectively, skipping "More Like This" recommendation trays
  //   - Priority: -h landscape (3) > -i promo/backdrop (2) > -v portrait (1); skip -t title cutouts
  let foundImages: { url: string; priority: number }[] = [];

  function scanNode(node: any) {
    if (!node) return;
    if (typeof node === "string") {
      let url = "";
      if (node.includes("hotstar.com") || node.includes("hotstarext.com")) {
        url = node;
      } else if (node.includes("cms/prod") && (node.includes("-h") || node.includes("-v") || node.includes("-i"))) {
        const parts = node.split("cms/prod");
        url = `https://img10.hotstar.com/image/upload/f_auto/sources/r1/cms/prod${parts[parts.length - 1]}`;
      }
      if (url) {
        let cleaned = url
          .replace(/https?:\/\/[a-zA-Z0-9\-\.]*hotstar(?:ext)?\.com\//, "https://img10.hotstar.com/")
          .replace(/\/image\/upload\/[^/]+\/((?:sources\/|cms\/|r1\/|prod\/).*)/, "/image/upload/$1");
        const suffix = cleaned.match(/-([a-z])(?:[^/\-]*)(?:\?|$)/i)?.[1]?.toLowerCase()
                    || cleaned.match(/\/(sources\/r1\/cms\/prod\/[^"]+?-([a-z]))(?:$|\?)/i)?.[2]?.toLowerCase();
        let priority = 0;
        if (suffix === "h") priority = 3;       // landscape promotional poster — BEST
        else if (suffix === "i") priority = 2;   // backdrop/promo — OK
        else if (suffix === "v") priority = 1;   // portrait — avoid for landscape card
        else if (suffix === "t") return;          // title cutout — skip entirely
        if (priority > 0 && !foundImages.some(img => img.url === cleaned)) {
          foundImages.push({ url: cleaned, priority });
        }
      }
    } else if (typeof node === "object") {
      for (const k in node) scanNode(node[k]);
    }
  }

  // 1. Scan hero, logo, seo spaces fully
  for (const spaceName of ["hero", "logo", "seo"]) {
    if (spaces[spaceName]) scanNode(spaces[spaceName]);
  }

  // 2. Scan tray space but skip "More Like This" / recommendation widgets (same logic as poster_scraper.py)
  const trayWrappers: any[] = spaces.tray?.widget_wrappers || [];
  for (const wrapper of trayWrappers) {
    const wData = wrapper?.widget?.data || {};
    // Determine header title of this tray widget
    let headerTitle = "";
    const header = wData.header || wData.tray_header || {};
    const rh = header?.regular_tray_header || header?.data?.header?.regular_tray_header || {};
    if (rh?.title) headerTitle = String(rh.title).toLowerCase();
    // Skip recommendation trays
    if (headerTitle && ["more like this", "recommend", "you may also like", "similar"].some(k => headerTitle.includes(k))) {
      continue;
    }
    scanNode(wrapper?.widget);
  }

  // Sort by priority and pick the best
  foundImages.sort((a, b) => b.priority - a.priority);
  if (foundImages.length > 0) {
    thumbnail = foundImages[0].url;
  }

  // Final fallback: og:image from SEO space (direct CDN URL, always landscape)
  if (!thumbnail) {
    const seoData = spaces.seo?.widget_wrappers?.[0]?.widget?.data || {};
    const ogImage: string = seoData.facebook_tags?.ogImage
      || seoData.social_tags?.find?.((t: any) => t.property === "og:image")?.content
      || "";
    if (ogImage) thumbnail = ogImage;
  }

  return { title, duration, thumbnail };
}

function parseStreamStats(fmts: any[]) {
  let bestVideoFormat = fmts
    .filter((f: any) => f.vcodec !== "none" && f.vcodec)
    .sort((a: any, b: any) => {
      // 1. Resolution (height)
      const aHeight = a.height || 0;
      const bHeight = b.height || 0;
      if (bHeight !== aHeight) return bHeight - aHeight;
      
      // 2. Codec score (AV1 > VP9 > H264)
      const aScore = getCodecScore(a.vcodec);
      const bScore = getCodecScore(b.vcodec);
      if (bScore !== aScore) return bScore - aScore;
      
      // 3. Bitrate
      const aBr = a.vbr || a.tbr || 0;
      const bBr = b.vbr || b.tbr || 0;
      return bBr - aBr;
    })[0];
  
  let bestAudioFormat = fmts
    .filter((f: any) => f.acodec !== "none" && f.acodec)
    .sort((a: any, b: any) => (b.abr || b.tbr || 0) - (a.abr || a.tbr || 0))[0];

  let maxVideoBitrate = "";
  let videoCodec = "";
  if (bestVideoFormat) {
    let br = bestVideoFormat.vbr || bestVideoFormat.tbr || 0;
    maxVideoBitrate = br > 1000 ? `${(br / 1000).toFixed(1)} Mbps` : br > 0 ? `${br.toFixed(0)} kbps` : "";
    videoCodec = getCodecDisplay(bestVideoFormat.vcodec);
  }

  let maxAudioBitrate = "";
  let audioCodec = "";
  let audioChannelsStr = "";
  if (bestAudioFormat) {
    let br = bestAudioFormat.abr || bestAudioFormat.tbr || 0;
    maxAudioBitrate = br > 0 ? `${br.toFixed(0)} kbps` : "";
    audioCodec = getCodecDisplay(bestAudioFormat.acodec);
    audioChannelsStr = getAudioChannels(bestAudioFormat);
  }

  return {
    videoBitrate: maxVideoBitrate,
    videoCodec: videoCodec,
    audioBitrate: maxAudioBitrate,
    audioCodec: audioCodec,
    audioChannels: audioChannelsStr,
  };
}

const tauri = (window as any).__TAURI__ || {};
const Command = tauri.shell?.Command;
const invoke = tauri.tauri?.invoke || tauri.invoke;
const open = tauri.dialog?.open;
const downloadDir = tauri.path?.downloadDir;
const appDataDir = tauri.path?.appDataDir;
const join = tauri.path?.join;
const writeTextFile = tauri.fs?.writeTextFile;
const readTextFile = tauri.fs?.readTextFile;
const readDir = tauri.fs?.readDir;
const createDir = tauri.fs?.createDir;
const exists = tauri.fs?.exists;
const removeFile = tauri.fs?.removeFile;
const removeDir = tauri.fs?.removeDir;
const renameFile = tauri.fs?.renameFile;
const appWindow = tauri.window?.appWindow;

const runYtDlp = async (
  args: string[],
  onData?: (data: string) => void,
  downloadId?: string,
): Promise<{ code: number; stdout: string; stderr: string }> => {
  if (!invoke)
    throw new Error(
      "Tauri API not available. Ensure you have 'withGlobalTauri': true in tauri.conf.json.",
    );

  if (!onData && !downloadId) {
    try {
      const [code, stdout, stderr] = await invoke("query_engine", { args }) as [number, string, string];
      return { code, stdout, stderr };
    } catch (err) {
      throw err;
    }
  }

  return new Promise(async (resolve, reject) => {
    try {
      let stdout = "";
      let stderr = "";
      const listen = (window as any).__TAURI__.event.listen;

      const stdoutEvent = downloadId ? `engine-stdout-${downloadId}` : "engine-stdout";
      const stderrEvent = downloadId ? `engine-stderr-${downloadId}` : "engine-stderr";
      const closeEvent = downloadId ? `engine-close-${downloadId}` : "engine-close";

      const unlistenStdout = await listen(stdoutEvent, (event: any) => {
        const line = event.payload + "\n";
        stdout += line;
        if (onData) onData(line);
      });

      const unlistenStderr = await listen(stderrEvent, (event: any) => {
        const line = event.payload + "\n";
        stderr += line;
        if (onData) onData(line);
      });

      const unlistenClose = await listen(closeEvent, (event: any) => {
        const code = event.payload;
        unlistenStdout();
        unlistenStderr();
        unlistenClose();
        resolve({ code, stdout, stderr });
      });

      await invoke("run_engine", { args, downloadId }).catch((err: any) => {
        unlistenStdout();
        unlistenStderr();
        unlistenClose();
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

interface AppError {
  title: string;
  message: string;
  category: "auth" | "network" | "deps" | "unsupported" | "generic";
  resolution: string[];
  raw: string;
}

const parseEngineError = (rawError: any): string => {
  if (!rawError) return "An unknown engine error occurred.";
  let msg =
    typeof rawError === "string"
      ? rawError
      : rawError.message || JSON.stringify(rawError);

  msg = msg.replace(
    /;\s*please report this issue on https:\/\/github\.com[^.]*\.?/gi,
    "",
  );
  msg = msg.replace(
    /See\s*https:\/\/github\.com[^ ]*\s*for more info\.?/gi,
    "",
  );
  msg = msg.replace(
    /Confirm you are on the latest version using yt-dlp -U/gi,
    "",
  );
  msg = msg.replace(/ERROR:\s*\[.*?\]\s*[a-zA-Z0-9_-]*:?\s*/i, "").trim();
  msg = msg.replace(/ERROR:\s*/i, "").trim();
  return msg || "An unknown engine error occurred.";
};

const parseDetailedError = (rawError: any): AppError => {
  const rawStr = typeof rawError === "string" ? rawError : rawError?.message || JSON.stringify(rawError) || "Unknown error";
  const lowerMsg = rawStr.toLowerCase();
  
  let title = "Extraction Alert";
  let category: AppError["category"] = "generic";
  let message = rawStr;
  let resolution: string[] = ["Verify the URL plays correctly in your web browser.", "Check your internet connection."];

  let cleaned = rawStr
    .replace(/;\s*please report this issue on https:\/\/github\.com[^.]*\.?/gi, "")
    .replace(/See\s*https:\/\/github\.com[^ ]*\s*for more info\.?/gi, "")
    .replace(/Confirm you are on the latest version using yt-dlp -U/gi, "")
    .replace(/ERROR:\s*\[.*?\]\s*[a-zA-Z0-9_-]*:?\s*/i, "")
    .replace(/ERROR:\s*/i, "")
    .trim();

  message = cleaned;

  if (
    lowerMsg.includes("ffprobe is not installed") ||
    lowerMsg.includes("ffprobe not found") ||
    lowerMsg.includes("postprocessing: ffprobe")
  ) {
    title = "FFprobe Dependency Missing";
    category = "deps";
    message = "The media analysis component (ffprobe) is missing or not executable.";
    resolution = [
      "Ensure 'ffprobe.exe' is placed inside your app's directory/bin folder.",
      "Restart the downloader application after adding the file."
    ];
  } else if (
    lowerMsg.includes("ffmpeg is not installed") ||
    lowerMsg.includes("ffmpeg not found") ||
    lowerMsg.includes("postprocessing: ffmpeg")
  ) {
    title = "FFmpeg Merger Missing";
    category = "deps";
    message = "The media downloaded successfully, but the merging backend (ffmpeg) was not found.";
    resolution = [
      "Ensure 'ffmpeg.exe' is placed inside your app's src-tauri/bin folder.",
      "Restart the application to allow the engine to detect the merger."
    ];
  } else if (
    lowerMsg.includes("could not copy") &&
    lowerMsg.includes("cookie database")
  ) {
    title = "Browser Cookie Access Locked";
    category = "auth";
    message = "The download engine failed to read cookies directly from your web browser because it's locked by another process.";
    resolution = [
      "Close your web browser completely and try running the download again.",
      "Alternatively, export a Netscape 'cookies.txt' and load it manually in the 'Authentication & Cookies' section."
    ];
  } else if (lowerMsg.includes("no video could be found")) {
    title = "Empty Video Stream";
    category = "unsupported";
    message = "No downloadable video streams were detected (possibly an image post or text-only link).";
    resolution = [
      "Confirm the link points directly to playable video content.",
      "Try checking different format streams if available."
    ];
  } else if (
    lowerMsg.includes("no video formats found") ||
    lowerMsg.includes("no matching formats") ||
    lowerMsg.includes("unsupported url")
  ) {
    title = "Unsupported URL / Stream Blocked";
    category = "unsupported";
    message = "The downloader engine could not parse any media formats. This happens if the URL is wrong, unsupported, or behind a geo-block/firewall.";
    resolution = [
      "Ensure you copy-pasted the exact link from your browser address bar.",
      "If the website requires a login (e.g. Instagram, private groups), import your Netscape cookies.",
      "If the website is geo-blocked, consider using a VPN."
    ];
  } else if (
    lowerMsg.includes("sign in") ||
    lowerMsg.includes("login") ||
    lowerMsg.includes("private video") ||
    lowerMsg.includes("members-only") ||
    lowerMsg.includes("premium")
  ) {
    title = "Authentication Required";
    category = "auth";
    message = "This content is private, premium-only, or requires an active user subscription to view.";
    resolution = [
      "Export your logged-in session cookies (Netscape format) using a browser extension.",
      "Load the exported cookie file under the 'Authentication & Cookies' accordion panel."
    ];
  } else if (lowerMsg.includes("unable to download webpage") || lowerMsg.includes("timed out") || lowerMsg.includes("connection refused")) {
    title = "Network Connection Timeout";
    category = "network";
    message = "The downloader failed to establish a connection to the host server.";
    resolution = [
      "Verify that your internet connection is active and stable.",
      "Check if the target website is currently offline or blocking automated requests.",
      "Try resolving again using a proxy or VPN."
    ];
  } else if (
    lowerMsg.includes("javascript") ||
    lowerMsg.includes("deno") ||
    lowerMsg.includes("node.js") ||
    lowerMsg.includes("js runtime") ||
    lowerMsg.includes("potoken") ||
    lowerMsg.includes("signature decryption")
  ) {
    title = "JavaScript Runtime Needed (YouTube Block)";
    category = "deps";
    message = "YouTube requires a JavaScript runtime (like Deno or Node.js) to solve playback challenges (PoToken).";
    resolution = [
      "Install Deno on your PC or add node.exe / deno.exe to your system PATH.",
      "Ensure you are running the latest version of the downloader engine.",
      "Alternatively, export and load valid YouTube cookies to bypass the challenge."
    ];
  }

  return {
    title,
    message,
    category,
    resolution,
    raw: rawStr
  };
};

const ErrorRawLog = ({ raw }: { raw: string }) => {
  const [expanded, setExpanded] = useState(false);
  if (!raw) return null;
  return (
    <div className="mt-[2px] relative z-10">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[10px] font-bold uppercase tracking-wider text-red-400/50 hover:text-red-400 transition-colors flex items-center gap-[4px]"
      >
        <span>{expanded ? "Hide Debug Logs" : "Show Debug Logs"}</span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mt-[8px]"
          >
            <pre className="p-[10px] rounded-[8px] bg-black/40 border border-red-500/10 font-mono text-[9px] text-red-400/70 overflow-x-auto whitespace-pre-wrap max-h-[140px] custom-scrollbar shadow-inner leading-normal">
              {raw}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const THEMES: Record<string, any> = {
  dark: {
    bg: "#050505",
    surface: "rgba(17, 17, 17, 0.4)",
    border: "rgba(255, 255, 255, 0.1)",
    text: "#ffffff",
    textMuted: "#a0a0a0",
    accent: "#d90429",
    accentHover: "#b00320",
    cardBg: "rgba(20, 20, 20, 0.6)",
    dropdownBg: "rgba(18, 18, 22, 0.92)",
  },
  light: {
    bg: "#f3f4f6",
    surface: "rgba(255, 255, 255, 0.5)",
    border: "rgba(0, 0, 0, 0.1)",
    text: "#030712",
    textMuted: "#6b7280",
    accent: "#e11d48",
    accentHover: "#be123c",
    cardBg: "rgba(255, 255, 255, 0.8)",
    dropdownBg: "rgba(238, 238, 242, 0.92)",
  },
};

const Card = ({ className = "", children, ...props }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
    className={cn(
      "rounded-[14px] border border-[var(--border)] bg-[var(--card-bg)] shadow-[0_6px_24px_rgba(0,0,0,0.18)] relative",
      className,
    )}
    {...props}
  >
    {children}
  </motion.div>
);

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "secondary" | "ghost" | "danger";
    size?: "default" | "sm" | "lg" | "icon";
  }
>(
  (
    { className = "", variant = "default", size = "default", ...props },
    ref,
  ) => {
    const baseStyle =
      "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] overflow-hidden relative group";
    const variants = {
      default:
        "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-[0_3px_12px_rgba(217,4,41,0.25)] border border-white/10",
      secondary:
        "bg-[var(--surface)]/80 backdrop-blur-md text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface)] hover:border-[var(--text-muted)]/30",
      ghost:
        "bg-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]/50",
      danger:
        "bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20",
    };

    const sizes = {
      default: "h-[38px] px-[16px] rounded-[10px] text-[12px]",
      sm: "h-[26px] px-[12px] rounded-[6px] text-[11px]",
      lg: "h-[50px] px-[20px] rounded-[16px] text-[14px] font-bold",
      icon: "h-[38px] w-[38px] rounded-[10px] flex items-center justify-center p-[0px]",
    };

    return (
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        ref={ref}
        className={cn(baseStyle, variants[variant], sizes[size], className)}
        {...(props as any)}
      >
        <span className="relative z-[10] flex items-center whitespace-nowrap truncate">
          {props.children}
        </span>
        {variant === "default" && (
          <div className="absolute inset-[0px] bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        )}
      </motion.button>
    );
  },
);
Button.displayName = "Button";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = "", ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-[38px] w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-[14px] py-[6px] text-[12px] text-[var(--text)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] transition-all placeholder:text-[var(--text-muted)]/70 outline-none focus:outline-none focus-visible:outline-none focus-visible:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[var(--surface)]/80",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

const CustomSelect = ({
  value,
  onChange,
  options,
  className = "",
  disabled = false,
  placeholder = "Select...",
  onDeleteOption,
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      )
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = Array.isArray(value)
    ? value.length > 0
      ? options
          .filter((o: any) => value.includes(o.value))
          .map((o: any) => o.label)
          .join(", ")
      : placeholder
    : options.find((o: any) => o.value === value)?.label || placeholder;

  const selectedOpt = Array.isArray(value) ? null : options.find((o: any) => o.value === value);
  const selectedMeta = selectedOpt?.meta;

  return (
    <div
      className={`relative ${className}`}
      ref={dropdownRef}
      style={{ zIndex: isOpen ? 99999 : 10 }}
    >
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex h-[38px] w-full items-center justify-between rounded-[10px] px-[14px] py-[6px] text-[12px] font-medium transition-all duration-200 select-none",
          "bg-[var(--surface)] shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
          isOpen
            ? "border border-[var(--accent)] shadow-[0_0_15px_rgba(217,4,41,0.15)] text-[var(--text)]"
            : "border border-[var(--border)] text-[var(--text)] hover:border-[var(--text-muted)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]",
          disabled
            ? "opacity-50 cursor-not-allowed shadow-none"
            : "cursor-pointer",
        )}
      >
        <span className="flex items-center gap-[6px] truncate min-w-0 pr-[14px] font-medium text-[var(--text)]" title={String(selectedLabel)}>
          {selectedMeta ? (
            <>
              <span className={`h-[6px] w-[6px] rounded-full shrink-0 ${selectedMeta.isExpired ? "bg-red-500 animate-pulse" : "bg-emerald-500 animate-pulse"}`} />
              <span className="truncate">{String(selectedLabel)}</span>
              <span className="text-[10px] text-[var(--text-muted)] font-normal ml-[4px] shrink-0">
                ({selectedMeta.isExpired ? "Expired" : "Active"} • Exp: {selectedMeta.expireDateStr})
              </span>
            </>
          ) : (
            <span className="truncate">{String(selectedLabel)}</span>
          )}
        </span>
        <ChevronDown
          className={`h-[14px] w-[14px] shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? "rotate-180 text-[var(--accent)]" : ""}`}
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ zIndex: 9999 }}
            className="absolute top-[calc(100%+8px)] right-[0px] min-w-full w-max max-w-[280px] md:max-w-[340px] rounded-[14px] overflow-hidden bg-[var(--bg)] border border-[var(--border)] shadow-[0_10px_40px_rgba(0,0,0,0.5)] max-h-[240px] overflow-y-auto custom-scrollbar"
          >
            <div
               className="p-[6px] flex flex-col gap-[4px] relative z-50"
               onMouseLeave={() => setHoveredValue(null)}
            >
              {options.length === 0 && (
                <div className="px-[14px] py-[14px] text-[12px] text-[var(--text-muted)] text-center font-medium">
                  No options available
                </div>
              )}
              {options.map((opt: any) => {
                const isSelected = Array.isArray(value)
                  ? value.includes(opt.value)
                  : value === opt.value;
                const isHovered = hoveredValue === opt.value;
                return (
                  <div
                    key={opt.value}
                    onMouseEnter={() => setHoveredValue(opt.value)}
                    onClick={() => {
                      if (Array.isArray(value)) {
                        onChange(
                          isSelected
                            ? value.filter((v: any) => v !== opt.value)
                            : [...value, opt.value],
                        );
                      } else {
                        onChange(opt.value);
                        setIsOpen(false);
                      }
                    }}
                    className={cn(
                      "relative flex items-center justify-between mx-[4px] px-[10px] py-[8px] text-[12px] cursor-pointer rounded-[8px] transition-colors duration-200 group",
                      isSelected
                        ? "text-[var(--text)] font-medium"
                        : "text-[var(--text-muted)] hover:text-[var(--text)] z-10",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute inset-[0px] rounded-[8px] transition-opacity duration-150",
                        isHovered || isSelected ? "opacity-100" : "opacity-0",
                        isSelected
                          ? "bg-[rgba(255,255,255,0.08)] shadow-sm"
                          : "bg-[rgba(255,255,255,0.04)]",
                      )}
                    />
                    <span className="flex items-center gap-[10px] min-w-0 truncate pr-[8px] relative z-10 w-full">
                      <span
                        className={cn(
                          "w-[6px] h-[6px] rounded-full shrink-0 transition-all duration-300",
                          isSelected
                            ? "bg-[var(--accent)] opacity-100 scale-100 shadow-[0_0_8px_rgba(217,4,41,0.5)]"
                            : "opacity-0 scale-50 bg-transparent",
                        )}
                      />
                      <span className="truncate" title={String(opt.label)}>{String(opt.label)}</span>
                      {opt.meta && (
                        <span className={`flex items-center gap-[4px] text-[10px] ml-auto shrink-0 font-normal pr-[4px] group-hover:pr-[24px] transition-all duration-150 ${opt.meta.isExpired ? "text-red-400/85" : "text-emerald-400/85"}`}>
                          <span className={`h-[5px] w-[5px] rounded-full ${opt.meta.isExpired ? "bg-red-500" : "bg-emerald-500"}`} />
                          <span>{opt.meta.isExpired ? "Expired" : "Active"}</span>
                        </span>
                      )}
                    </span>
                    {onDeleteOption && opt.value !== "none" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteOption(opt.value);
                          setIsOpen(false);
                        }}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10 p-[6px] rounded-[8px] transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 relative z-20"
                        title="Delete"
                      >
                        <Trash2 className="h-[14px] w-[14px]" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Switch = ({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (c: boolean) => void;
  label: string;
  hint?: string;
}) => (
  <div
    className="flex items-start gap-[14px] cursor-pointer group p-[8px] rounded-[10px] hover:bg-[var(--border)]/50 transition-colors duration-200"
    onClick={() => onChange(!checked)}
  >
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`mt-[2px] relative inline-flex h-[20px] w-[36px] shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none ${checked ? "bg-[var(--accent)]" : "bg-[var(--border)] group-hover:bg-[var(--text-muted)]"}`}
    >
      <span
        className={`pointer-events-none inline-block h-[16px] w-[16px] rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${checked ? "translate-x-[16px]" : "translate-x-[0px]"}`}
      />
    </button>
    <div className="flex flex-col">
      <span className="text-[var(--text)] text-[12px] font-medium">
        {String(label)}
      </span>
      {hint && (
        <span className="text-[10px] text-[var(--text-muted)] mt-[2px] leading-snug">
          {String(hint)}
        </span>
      )}
    </div>
  </div>
);

const Accordion = ({
  title,
  children,
  icon: Icon,
  isActive = false,
}: {
  title: string;
  children: React.ReactNode;
  icon?: any;
  isActive?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  return (
    <div
      className={`border rounded-2xl transition-[border-color,background-color,box-shadow] duration-200 ${isActive ? "border-[var(--accent)] shadow-[0_0_15px_rgba(217,4,41,0.1)] bg-[var(--surface)]" : "border-[var(--border)] bg-[var(--card-bg)]"}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full h-[48px] items-center justify-between px-[16px] text-[14px] font-medium transition-all hover:bg-[var(--border)]/50 text-[var(--text)] rounded-2xl"
      >
        <span className="flex items-center gap-[10px]">
          {Icon && (
            <Icon
              className={`h-[16px] w-[16px] ${isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}
            />
          )}
          {String(title)}
        </span>
        <ChevronDown
          className={`h-[16px] w-[16px] shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.04, 0.62, 0.23, 0.98] }}
            onAnimationStart={() => setIsAnimating(true)}
            onAnimationComplete={() => setIsAnimating(false)}
            style={{
              overflow: isAnimating || !isOpen ? "hidden" : "visible",
              display: "flow-root",
            }}
          >
            <div
              className={`p-[16px] pt-[0px] border-t ${isActive ? "border-[var(--accent)]/20" : "border-[var(--border)]"}`}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TimeInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { h: number; m: number; s: number };
  onChange: (v: any) => void;
}) => {
  const update = (field: "h" | "m" | "s", val: string) => {
    let num = parseInt(val) || 0;
    if (field !== "h") num = Math.min(num, 59);
    onChange({ ...value, [field]: num });
  };
  return (
    <div className="flex flex-col">
      <label className="text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-[4px]">
        {String(label)}
      </label>
      <div className="flex items-center gap-[4px] bg-[var(--surface)] border border-[var(--border)] rounded-[10px] px-[8px] py-[4px] focus-within:border-[var(--accent)] transition-all">
        <input
          type="number"
          value={value.h.toString().padStart(2, "0")}
          onChange={(e) => update("h", e.target.value)}
          className="w-[24px] bg-transparent text-center outline-none text-[12px] text-[var(--text)] font-mono font-medium [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[var(--text-muted)] font-medium">:</span>
        <input
          type="number"
          value={value.m.toString().padStart(2, "0")}
          onChange={(e) => update("m", e.target.value)}
          className="w-[24px] bg-transparent text-center outline-none text-[12px] text-[var(--text)] font-mono font-medium [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[var(--text-muted)] font-medium">:</span>
        <input
          type="number"
          value={value.s.toString().padStart(2, "0")}
          onChange={(e) => update("s", e.target.value)}
          className="w-[24px] bg-transparent text-center outline-none text-[12px] text-[var(--text)] font-mono font-medium [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
    </div>
  );
};

const formatCount = (numStr: string | number) => {
  const n = parseInt(String(numStr), 10);
  if (isNaN(n) || n === 0) return "0";
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
};

const LANG_MAP: Record<string, string> = {
  hin: "Hindi",
  hi: "Hindi",
  eng: "English",
  en: "English",
  tam: "Tamil",
  ta: "Tamil",
  tel: "Telugu",
  te: "Telugu",
  mal: "Malayalam",
  ml: "Malayalam",
  kan: "Kannada",
  kn: "Kannada",
};

const parseCookieMetadata = (originalContent: string, fileName: string = "") => {
  const cookies: { name: string; domain: string; expiry: number }[] = [];
  let fileContentDomains = new Set<string>();

  const lines = originalContent.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split("\t");
    if (parts.length >= 7) {
      const domain = parts[0].toLowerCase();
      const expiry = parseInt(parts[4]);
      const name = parts[5];
      if (name && !isNaN(expiry) && expiry > 0) {
        cookies.push({ name, domain, expiry });
        fileContentDomains.add(domain);
      }
    }
  }

  const fnLower = fileName.toLowerCase();
  const isHotstar = fnLower.includes("hotstar") || Array.from(fileContentDomains).some(d => d.includes("hotstar.com") || d.includes("jiohotstar.com"));
  const isYouTube = fnLower.includes("youtube") || Array.from(fileContentDomains).some(d => d.includes("youtube.com") || d.includes("google.com"));
  const isZee5 = fnLower.includes("zee5") || Array.from(fileContentDomains).some(d => d.includes("zee5.com"));
  const isSonyLiv = fnLower.includes("sonyliv") || Array.from(fileContentDomains).some(d => d.includes("sonyliv.com"));
  const isNetflix = fnLower.includes("netflix") || Array.from(fileContentDomains).some(d => d.includes("netflix.com"));
  const isPrimeVideo = fnLower.includes("prime") || Array.from(fileContentDomains).some(d => d.includes("primevideo.com") || d.includes("amazon."));

  let criticalKeys: string[] = [];
  if (isHotstar) {
    criticalKeys = ["sessionUserUP", "userToken", "id_token"];
  } else if (isYouTube) {
    criticalKeys = ["LOGIN_INFO", "__Secure-3PAPISID", "__Secure-1PAPISID", "SAPISID", "SID"];
  } else if (isZee5) {
    criticalKeys = ["SAMP_USER_TOKEN", "token", "user_token"];
  } else if (isSonyLiv) {
    criticalKeys = ["security_token", "token"];
  } else if (isNetflix) {
    criticalKeys = ["NetflixId", "SecureId"];
  } else if (isPrimeVideo) {
    criticalKeys = ["ubid-main", "at-main"];
  }

  let targetExpiry: number | null = null;
  if (criticalKeys.length > 0) {
    const foundCritical = cookies.filter(c => criticalKeys.includes(c.name));
    if (foundCritical.length > 0) {
      targetExpiry = Math.max(...foundCritical.map(c => c.expiry));
    }
  }

  if (!targetExpiry && cookies.length > 0) {
    const validExpiries = cookies.map(c => c.expiry).filter(exp => exp !== 2147483647);
    if (validExpiries.length > 0) {
      targetExpiry = Math.max(...validExpiries);
    }
  }

  return {
    targetExpiry
  };
};

const getSanitizedProxy = (proxyStr: string): string | null => {
  const trimmed = proxyStr.trim();
  if (!trimmed) return null;
  const primary = trimmed.split(",")[0].trim();
  if (!primary) return null;
  if (!primary.includes("://")) {
    return `http://${primary}`;
  }
  return primary;
};

const ensureValidNetscapeFormat = (fileContent: string): string => {
  const lines = fileContent.split(/\r?\n/);
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine.startsWith("#") && (firstLine.toLowerCase().includes("netscape http cookie file") || firstLine.toLowerCase().includes("http cookie file"))) {
      return fileContent;
    }
  }

  const cleanLines = lines.filter(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") && (trimmed.toLowerCase().includes("netscape http cookie file") || trimmed.toLowerCase().includes("http cookie file"))) {
      return false;
    }
    return true;
  });

  return ["# Netscape HTTP Cookie File", ...cleanLines].join("\n");
};

const cleanCookieContent = (content: string, fileName: string = "") => {
  let clean = content;
  try {
    if (typeof DOMParser !== "undefined") {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, "text/html");
      clean = doc.documentElement.textContent || content;
    }
  } catch (err) {
    clean = content
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  const metadata = parseCookieMetadata(clean, fileName);

  const lines = clean.split(/\r?\n/);
  const processed = lines
    .filter(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith("#") && (trimmed.toLowerCase().includes("netscape http cookie file") || trimmed.toLowerCase().includes("http cookie file"))) {
        return false;
      }
      return true;
    })
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return line;
      }
      const parts = trimmed.split("\t");
      if (parts.length >= 5) {
        parts[4] = "2147483647"; // Far-future expiration
        return parts.join("\t");
      }
      return line;
    });

  const header = [
    "# Netscape HTTP Cookie File",
    "# 4444_COOKIE_METADATA",
    `# SessionExpiry: ${metadata.targetExpiry || "None"}`,
  ].join("\n");

  return header + "\n" + processed.join("\n");
};

export default function App() {
  const openExternalLink = (targetUrl: string) => {
    const tauriShell = (window as any).__TAURI__?.shell;
    if (tauriShell?.open) {
      tauriShell.open(targetUrl);
    } else {
      window.open(targetUrl, "_blank");
    }
  };

  const [view, setView] = useState<"home" | "stats" | "history" | "help" | "updates">(
    "home",
  );
  const [engineVersion, setEngineVersion] = useState("Checking...");
  const [isUpdatingEngine, setIsUpdatingEngine] = useState(false);
  const [engineUpdateMessage, setEngineUpdateMessage] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  const initHistory = async () => {
    try {
      const stored: string = await invoke("load_history");
      let parsed = JSON.parse(stored);
      setHistory(Array.isArray(parsed) ? parsed : []);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };
  const [theme, setTheme] = useState(
    () => localStorage.getItem("4444_theme") || "dark",
  );
  const [savedCookies, setSavedCookies] = useState<
    { label: string; value: string }[]
  >([]);
  const [selectedCookieName, setSelectedCookieName] = useState("none");
  const [savePath, setSavePath] = useState("");
  const [customUserAgent, setCustomUserAgent] = useState(
    () => localStorage.getItem("4444_custom_ua") || ""
  );
  const [customReferer, setCustomReferer] = useState(
    () => localStorage.getItem("4444_custom_referer") || ""
  );
  const [customProxy, setCustomProxy] = useState(
    () => localStorage.getItem("4444_custom_proxy") || ""
  );

  useEffect(() => {
    localStorage.setItem("4444_custom_ua", customUserAgent);
  }, [customUserAgent]);

  useEffect(() => {
    localStorage.setItem("4444_custom_referer", customReferer);
  }, [customReferer]);

  useEffect(() => {
    localStorage.setItem("4444_custom_proxy", customProxy);
  }, [customProxy]);

  const [cookiesMeta, setCookiesMeta] = useState<Record<string, { isExpired: boolean; expireDateStr: string }>>({});

  useEffect(() => {
    const loadAllCookiesMeta = async () => {
      if (!readTextFile) return;
      const metaMap: Record<string, { isExpired: boolean; expireDateStr: string }> = {};
      for (const cookie of savedCookies) {
        try {
          const fileContent: string = await readTextFile(cookie.value);
          const lines = fileContent.split(/\r?\n/);
          let targetExpiry: number | null = null;

          for (const line of lines) {
            if (line.startsWith("# SessionExpiry:")) {
              const val = line.replace("# SessionExpiry:", "").trim();
              if (val !== "None") targetExpiry = parseInt(val);
            }
          }

          if (!targetExpiry) {
            const meta = parseCookieMetadata(fileContent, cookie.value);
            targetExpiry = meta.targetExpiry;
          }

          if (targetExpiry) {
            const isExpired = targetExpiry < Date.now() / 1000;
            const date = new Date(targetExpiry * 1000);
            const expireDateStr = date.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            metaMap[cookie.value] = { isExpired, expireDateStr };
          } else {
            metaMap[cookie.value] = { isExpired: false, expireDateStr: "Indefinite" };
          }
        } catch (e) {
          console.warn("Failed to load metadata for cookie:", cookie.value, e);
        }
      }
      setCookiesMeta(metaMap);
    };
    loadAllCookiesMeta();
  }, [savedCookies]);

  const activeCookieMeta = cookiesMeta[selectedCookieName] || null;

  const truncatePath = (path: string | null) => {
    if (!path) return "Select Download Folder...";
    const parts = path.split(/[/\\]/).filter(Boolean);
    if (parts.length <= 3) return path;
    return `${parts[0]}\\${parts[1]}\\...\\${parts[parts.length - 1]}`;
  };

  const [url, setUrl] = useState("");
  const [searchHint, setSearchHint] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchingUrl, setFetchingUrl] = useState<string | null>(null);
  const [mediaInfo, setMediaInfo] = useState<any>(null);
  const [mediaList, setMediaList] = useState<any[] | null>(null);
  const [mediaListUrl, setMediaListUrl] = useState("");
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [showThumbModal, setShowThumbModal] = useState(false);
  const [showNerdStats, setShowNerdStats] = useState(false);
  const [activeDownloads, setActiveDownloads] = useState<any[]>([]);
  const [globalError, setGlobalError] = useState<AppError | null>(null);
  useEffect(() => {
    if (globalError) {
      const timer = setTimeout(() => {
        setGlobalError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [globalError]);
  const [selectedSeason, setSelectedSeason] = useState<string>("All");

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEpisodeUrl, setSelectedEpisodeUrl] = useState<string>("All");

  useEffect(() => {
    setCurrentPage(1);
    setSelectedEpisodeUrl("All");
  }, [mediaList, selectedSeason]);

  const uniqueSeasons = React.useMemo(() => {
    if (!mediaList) return [];
    const seasons = new Set<string>();
    mediaList.forEach(item => {
      if (item.season) seasons.add(item.season);
    });
    return Array.from(seasons).sort((a, b) => {
      const aNum = parseInt(a.replace(/\D/g, "")) || 0;
      const bNum = parseInt(b.replace(/\D/g, "")) || 0;
      return aNum - bNum;
    });
  }, [mediaList]);

  const displayedMediaList = React.useMemo(() => {
    if (!mediaList) return [];
    return mediaList
      .map((item, idx) => ({ ...item, originalIndex: idx }))
      .filter(item => selectedSeason === "All" || item.season === selectedSeason);
  }, [mediaList, selectedSeason]);

  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(displayedMediaList.length / PAGE_SIZE);

  const paginatedMediaList = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return displayedMediaList.slice(start, end);
  }, [displayedMediaList, currentPage]);

  const [resolution, setResolution] = useState("best");
  const [container, setContainer] = useState(
    () => localStorage.getItem("4444_container") || "mkv"
  );

  useEffect(() => {
    localStorage.setItem("4444_container", container);
  }, [container]);

  const [audioOnlyFormat, setAudioOnlyFormat] = useState("mp3");
  const [audioQuality, setAudioQuality] = useState("320");
  const [activeTab, setActiveTab] = useState("video");
  const [selectedAudioTracks, setSelectedAudioTracks] = useState<string[]>([]);
  const [selectedSubtitles, setSelectedSubtitles] = useState<string[]>([]);
  const [embedSubtitles, setEmbedSubtitles] = useState(true);
  const [saveSubtitlesFile, setSaveSubtitlesFile] = useState(false);

  const [options, setOptions] = useState({
    trim: false,
    hdrToSdr: false,
    sponsorBlock: false,
    saveThumbnailFile: false,
  });
  const [trimStart, setTrimStart] = useState({ h: 0, m: 0, s: 0 });
  const [trimEnd, setTrimEnd] = useState({ h: 0, m: 0, s: 0 });

  const hasAudioTracks = Boolean(mediaInfo?.availableAudio?.length > 1);
  const videoGridCols = hasAudioTracks ? "md:grid-cols-3" : "md:grid-cols-2";

  const isDownloading = activeDownloads.some(dl => !dl.isSuccess && !dl.isError);

  const handleThemeToggle = (e: React.MouseEvent) => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    if (!(document as any).startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    try {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      const transition = (document as any).startViewTransition(() => {
        flushSync(() => {
          setTheme(nextTheme);
        });
      });

      transition.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 400,
              easing: "ease-out",
              pseudoElement: "::view-transition-new(root)",
            },
          );
        })
        .catch(() => setTheme(nextTheme));
    } catch (err) {
      setTheme(nextTheme);
    }
  };

  const fetchEngineVersion = async (retries = 5) => {
    try {
      const v = await invoke("get_engine_version");
      setEngineVersion(v as string);
    } catch (err) {
      if (retries > 0) {
        setTimeout(() => fetchEngineVersion(retries - 1), 2000);
      } else {
        setEngineVersion("Unknown");
      }
    }
  };

  const runSilentEngineUpdate = async () => {
    try {
      const res: any = await invoke("perform_engine_update");
      if (res.status === "updated") {
        setEngineUpdateMessage(`Engine updated silently to ${res.version}.`);
        setEngineVersion(res.version);
        setTimeout(() => setEngineUpdateMessage(""), 5000);
      } else if (res.status === "restart_required") {
        setEngineUpdateMessage("Engine update downloaded. Restart required to apply.");
        setEngineVersion(`${res.version} (Restart required)`);
      }
    } catch (err) {
      console.warn("Silent engine update check failed:", err);
    }
  };

  const handleManualEngineUpdate = async () => {
    setIsUpdatingEngine(true);
    setEngineUpdateMessage("Downloading latest engine...");
    try {
      const res: any = await invoke("perform_engine_update");
      if (res.status === "up_to_date") {
        setEngineUpdateMessage("Engine is up to date.");
        setIsUpdatingEngine(false);
      } else if (res.status === "restart_required") {
        setEngineUpdateMessage(res.message);
        setTimeout(() => {
          invoke("restart_app");
        }, 2500);
      } else {
        setEngineUpdateMessage(res.message || "Engine updated successfully!");
        setEngineVersion(res.version);
        setIsUpdatingEngine(false);
      }
    } catch (err: any) {
      setEngineUpdateMessage(`Error: ${err}`);
      setIsUpdatingEngine(false);
    }
  };

  useEffect(() => {
    fetchEngineVersion();
    // Run silent engine update 3 seconds after startup
    const timer = setTimeout(() => {
      runSilentEngineUpdate();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("4444_theme", theme);
    const bgMatch = THEMES[theme]?.bg || "#050505";
    document.body.style.backgroundColor = bgMatch;
  }, [theme]);

  useEffect(() => {
    invoke("save_history", { history: JSON.stringify(history) }).catch(() => {});
  }, [history]);

  useEffect(() => {
    if (downloadDir)
      downloadDir()
        .then((dir: any) => setSavePath(dir))
        .catch(() => {});
    initCookies();
    initHistory();
    if (appWindow) {
      setTimeout(async () => {
        try {
          await appWindow.show();
        } catch (e) {
          console.warn("Failed to show window:", e);
        }
      }, 150);
    }
  }, []);

  const initCookies = async () => {
    try {
      if (!appDataDir || !join || !exists || !createDir || !readDir || !readTextFile || !writeTextFile) return;
      const appData = await appDataDir();
      const cDir = await join(appData, "4444_cookies");
      if (!(await exists(cDir))) await createDir(cDir, { recursive: true });

      const entries = await readDir(cDir);
      const cookies = entries
        .filter((e: any) => e.name?.endsWith(".txt"))
        .map((e: any) => ({
          label: String(
            e.name!.replace("_cookies.txt", "").charAt(0).toUpperCase() +
              e.name!.replace("_cookies.txt", "").slice(1),
          ),
          value: String(e.path),
        }));

      // Automatically migrate/fix any cookie files that don't start with the correct Netscape header
      for (const cookie of cookies) {
        try {
          const fileContent: string = await readTextFile(cookie.value);
          const firstLine = fileContent.split(/\r?\n/)[0]?.trim() || "";
          if (!firstLine.startsWith("#") || !(firstLine.toLowerCase().includes("netscape http cookie file") || firstLine.toLowerCase().includes("http cookie file"))) {
            const fixedContent = ensureValidNetscapeFormat(fileContent);
            await writeTextFile(cookie.value, fixedContent);
            console.log(`Auto-migrated cookie file to valid Netscape format: ${cookie.value}`);
          }
        } catch (err) {
          console.warn("Failed to check/fix cookie file format:", cookie.value, err);
        }
      }

      setSavedCookies(cookies);
    } catch (e) {
      console.error("Cookie init error:", e);
    }
  };

  useEffect(() => {
    if (!url.trim()) {
      setSearchHint("");
      return;
    }
    const displayUrl = url.trim().replace(/^ytsearch\d+:/, "");
    try {
      const parsed = new URL(displayUrl);
      setSearchHint(`Target Link: ${parsed.hostname.replace("www.", "")}`);
    } catch {
      setSearchHint(`Searching YouTube for: "${displayUrl}"`);
    }
  }, [url]);

  const hasCookie = selectedCookieName !== "none";
  const isLossless = ["flac", "wav"].includes(audioOnlyFormat.toLowerCase());

  const getActiveAuthDisplay = () => {
    if (selectedCookieName !== "none") {
      const parts = selectedCookieName.split(/[/\\]/);
      const fileName = parts[parts.length - 1] || "";
      const baseName = fileName.replace(/\.txt$/i, "");
      const cleanName = baseName.toLowerCase().replace(/_cookies/i, "").replace(/cookies/i, "").trim();
      if (!cleanName || cleanName === "unknown") return "Custom Profile";
      
      const domainMap: Record<string, string> = {
        youtube: "YouTube",
        hotstar: "JioHotstar",
        jiohotstar: "JioHotstar",
        zee5: "Zee5",
        sonyliv: "SonyLiv",
        voot: "Voot",
        mxplayer: "MXPlayer"
      };
      if (domainMap[cleanName]) return domainMap[cleanName];
      return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    }
    return "";
  };

  // Returns brand-accurate color theme for the active service
  const getServiceTheme = () => {
    const name = selectedCookieName.toLowerCase();
    if (name.includes("hotstar") || name.includes("jiohotstar")) {
      return {
        bg: "linear-gradient(135deg, rgba(0,114,245,0.15) 0%, rgba(100,50,220,0.15) 100%)",
        border: "rgba(0,114,245,0.4)",
        dot: "#3b82f6",
        dotPing: "#60a5fa",
        label: "linear-gradient(90deg,#60a5fa,#a78bfa)",
        name: "#e0eaff",
        dismiss: "#60a5fa",
        icon: "#93c5fd",
      };
    }
    if (name.includes("netflix")) {
      return {
        bg: "linear-gradient(135deg, rgba(229,9,20,0.14) 0%, rgba(180,0,20,0.10) 100%)",
        border: "rgba(229,9,20,0.4)",
        dot: "#ef4444",
        dotPing: "#f87171",
        label: "linear-gradient(90deg,#fca5a5,#f87171)",
        name: "#fee2e2",
        dismiss: "#f87171",
        icon: "#fca5a5",
      };
    }
    if (name.includes("youtube")) {
      return {
        bg: "linear-gradient(135deg, rgba(255,0,0,0.13) 0%, rgba(200,30,0,0.10) 100%)",
        border: "rgba(255,0,0,0.35)",
        dot: "#ef4444",
        dotPing: "#f87171",
        label: "linear-gradient(90deg,#fca5a5,#fb923c)",
        name: "#fee2e2",
        dismiss: "#f87171",
        icon: "#fca5a5",
      };
    }
    if (name.includes("prime") || name.includes("amazon")) {
      return {
        bg: "linear-gradient(135deg, rgba(0,168,225,0.14) 0%, rgba(0,100,180,0.10) 100%)",
        border: "rgba(0,168,225,0.38)",
        dot: "#22d3ee",
        dotPing: "#67e8f9",
        label: "linear-gradient(90deg,#67e8f9,#38bdf8)",
        name: "#e0f7ff",
        dismiss: "#38bdf8",
        icon: "#7dd3fc",
      };
    }
    if (name.includes("zee5")) {
      return {
        bg: "linear-gradient(135deg, rgba(90,30,200,0.15) 0%, rgba(60,10,160,0.12) 100%)",
        border: "rgba(124,58,237,0.4)",
        dot: "#8b5cf6",
        dotPing: "#a78bfa",
        label: "linear-gradient(90deg,#c4b5fd,#8b5cf6)",
        name: "#ede9fe",
        dismiss: "#a78bfa",
        icon: "#c4b5fd",
      };
    }
    if (name.includes("sonyliv") || name.includes("sony")) {
      return {
        bg: "linear-gradient(135deg, rgba(255,140,0,0.13) 0%, rgba(220,100,0,0.10) 100%)",
        border: "rgba(251,146,60,0.38)",
        dot: "#f97316",
        dotPing: "#fb923c",
        label: "linear-gradient(90deg,#fdba74,#f97316)",
        name: "#fff7ed",
        dismiss: "#fb923c",
        icon: "#fdba74",
      };
    }
    // Default: purple
    return {
      bg: "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(99,102,241,0.15) 100%)",
      border: "rgba(139,92,246,0.38)",
      dot: "#8b5cf6",
      dotPing: "#a78bfa",
      label: "linear-gradient(90deg,#c4b5fd,#818cf8)",
      name: "#ede9fe",
      dismiss: "#a78bfa",
      icon: "#c4b5fd",
    };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const cleanedContent = cleanCookieContent(content, file.name);
      let domain = "Custom_Site";

      try {
        const lines = cleanedContent.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const parts = trimmed.split('\t');
            if (parts.length >= 1 && parts[0].includes('.')) {
              let rawDomain = parts[0].replace(/^\./, '');
              let domainParts = rawDomain.split('.');
              let mainDomain = domainParts.length > 1 ? domainParts[domainParts.length - 2] : domainParts[0];
              if (mainDomain && mainDomain.length > 2) {
                domain = mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
                break;
              }
            }
          }
        }
      } catch (err) {}

      if (domain === "Custom_Site") {
        if (cleanedContent.includes("youtube.com")) domain = "YouTube";
        else if (cleanedContent.includes("instagram.com")) domain = "Instagram";
        else if (cleanedContent.includes("pinterest.com")) domain = "Pinterest";
        else if (cleanedContent.includes("hotstar.com") || cleanedContent.includes("jiohotstar.com")) domain = "Hotstar";
        else if (cleanedContent.includes("netflix.com")) domain = "Netflix";
        else if (cleanedContent.includes("primevideo.com")) domain = "PrimeVideo";
      }

      try {
        if (!appDataDir || !join || !exists || !createDir || !writeTextFile)
          return;
        const appData = await appDataDir();
        const cDir = await join(appData, "4444_cookies");
        if (!(await exists(cDir))) await createDir(cDir, { recursive: true });

        const fileName = `${domain}_${Date.now().toString().slice(-4)}_cookies.txt`;
        const filePath = await join(cDir, fileName);
        await writeTextFile(filePath, cleanedContent);

        await initCookies();
        setSelectedCookieName(filePath);
      } catch (err) {
        alert(
          "Failed to save Cookie file. Ensure Tauri filesystem permissions are active.",
        );
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteCookie = async (cookieVal: string) => {
    if (cookieVal === "none") return;
    try {
      if (removeFile) await removeFile(cookieVal);
    } catch (e) {}
    if (selectedCookieName === cookieVal) setSelectedCookieName("none");
    await initCookies();
  };

  const handleFolderSelect = async () => {
    try {
      if (!open) return;
      const selected = await open({
        directory: true,
        defaultPath: savePath || undefined,
      });
      if (selected && typeof selected === "string") {
        let newPath = selected;
        if (savePath) {
          const sep = savePath.includes("\\") ? "\\" : "/";
          const currentDirName = savePath
            .replace(/[\\/]+$/, "")
            .split(sep)
            .pop();
          if (newPath === `${savePath}${sep}${currentDirName}`)
            newPath = savePath;
        }
        setSavePath(newPath);
      }
    } catch (e) {}
  };

  const isPlaylistUrl = (urlStr: string): boolean => {
    try {
      const urlObj = new URL(urlStr);
      const host = urlObj.hostname.toLowerCase();
      const path = urlObj.pathname.toLowerCase();
      
      // YouTube
      if (host.includes("youtube.com") || host.includes("youtu.be") || urlStr.startsWith("ytsearch")) {
        return urlStr.includes("list=") || urlStr.includes("playlist") || urlStr.startsWith("ytsearch");
      }
      
      // Hotstar / JioHotstar
      if (host.includes("hotstar.com") || host.includes("jiohotstar.com")) {
        const parts = urlObj.pathname.split("/").filter(p => p.length > 0);
        const showsIndex = parts.indexOf("shows");
        if (showsIndex !== -1) {
          return (parts.length - 1 - showsIndex) <= 2;
        }
        return false;
      }
      
      // Zee5
      if (host.includes("zee5.com")) {
        return path.includes("/tvshows/") && !path.includes("/episodes/");
      }
      
      // SonyLiv
      if (host.includes("sonyliv.com")) {
        return path.includes("/shows/") && !path.includes("/episodes/") && !urlStr.includes("episode_id");
      }
      
      // Generic check as a fallback
      return urlStr.includes("list=") || urlStr.includes("playlist");
    } catch {}
    return false;
  };

  const cancelMetadataFetch = async () => {
    try {
      if (invoke) {
        await invoke("kill_engine", { downloadId: "metadata_fetch" });
      }
    } catch (e) {
      console.warn("Failed to kill metadata fetch engine:", e);
    } finally {
      setIsFetching(false);
      setFetchingUrl(null);
    }
  };

  const handleFetchInfo = async (
    overrideUrl?: string | any,
    isSelection = false,
  ) => {
    const targetUrl = typeof overrideUrl === "string" ? overrideUrl : url;
    if (!targetUrl) return;
    if (isFetching) {
      await cancelMetadataFetch();
      // Allow a brief delay for cleanup to complete
      await new Promise((r) => setTimeout(r, 200));
    }
    setIsFetching(true);
    setFetchingUrl(targetUrl);
    setGlobalError(null);

    if (!isSelection) {
      setIsSelectMode(false);
      setSelectedIndices([]);
      setShowNerdStats(false);
      setResolution("best");
      setSelectedSeason("All");
      setContainer("mkv");
    }

    let processUrl = targetUrl.trim().replace(/^ytsearch\d+:/, "");
    if (!processUrl.startsWith("http://") && !processUrl.startsWith("https://")) {
      const isDomainOrUrl = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/|$)/.test(processUrl);
      if (isDomainOrUrl) {
        processUrl = `https://${processUrl}`;
      } else {
        processUrl = `ytsearch9:${processUrl}`;
      }
    }

    let resolvedMetadata: { title?: string; duration?: number; thumbnail?: string } = {};
    const isImdbId = /^tt\d+$/.test(processUrl);
    const isVaplayerLink = processUrl.includes("streamimdb.ru") || processUrl.includes("nextgencloudfabric.com") || processUrl.includes("vidapi.ru") || processUrl.includes("vidapi.cloud");
    
    if (isImdbId || isVaplayerLink) {
      let mediaId = "";
      let mediaType = "movie";
      let season: string | null = null;
      let episode: string | null = null;
      
      if (isImdbId) {
        mediaId = processUrl;
      } else {
        const imdbMatch = processUrl.match(/(tt\d+)/);
        if (imdbMatch) mediaId = imdbMatch[1];
        if (processUrl.includes("/tv/")) mediaType = "tv";
        
        const seasonMatch = processUrl.match(/season[=\/](\d+)/i) || processUrl.match(/[?&]s=(\d+)/i);
        const episodeMatch = processUrl.match(/episode[=\/](\d+)/i) || processUrl.match(/[?&]e=(\d+)/i);
        if (seasonMatch) season = seasonMatch[1];
        if (episodeMatch) episode = episodeMatch[1];
      }
      
      if (mediaId) {
        try {
          let apiCall = `https://streamdata.vaplayer.ru/api.php?source=justhd&imdb=${mediaId}&type=${mediaType}`;
          if (mediaType === "tv" && season && episode) {
            apiCall += `&season=${season}&episode=${episode}`;
          }
          const resText: string = await invoke("fetch_url", {
            url: apiCall,
            headers: { "Referer": "https://nextgencloudfabric.com/" },
            proxy: customProxy.trim() || null
          });
          const res = JSON.parse(resText);
          if ((res.status_code === "200" || res.status_code === 200) && res.data && res.data.stream_urls && res.data.stream_urls.length > 0) {
            processUrl = res.data.stream_urls[0];
            resolvedMetadata.title = res.data.title || "";
          }
        } catch (err) {
          console.warn("Failed to resolve Vaplayer stream info:", err);
        }
      }
    }
    // Pre-populate metadata from mediaList if this is a sub-selection click
    if (isSelection && mediaList) {
      try {
        const getHotstarId = (u: string) => {
          const matches = u.match(/\/(\d+)/g);
          return matches ? matches[matches.length - 1].replace("/", "") : "";
        };
        const targetId = getHotstarId(targetUrl);
        const selectedItem = mediaList.find(item => {
          if (item.url === targetUrl) return true;
          if (targetId && getHotstarId(item.url) === targetId) return true;
          return false;
        });
        if (selectedItem) {
          resolvedMetadata.title = selectedItem.title;
          resolvedMetadata.thumbnail = selectedItem.thumbnail;
          if (selectedItem.duration) {
            // Convert e.g. "45:30" or "01:15:30" to seconds
            const parts = selectedItem.duration.split(":").map(Number);
            let secs = 0;
            if (parts.length === 3) {
              secs = parts[0] * 3600 + parts[1] * 60 + parts[2];
            } else if (parts.length === 2) {
              secs = parts[0] * 60 + parts[1];
            }
            if (secs > 0) resolvedMetadata.duration = secs;
          }
        }
      } catch (e) {
        console.warn("Failed to pre-populate metadata from mediaList:", e);
      }
    }

    if ((!resolvedMetadata.title || !resolvedMetadata.thumbnail) && (processUrl.includes("hotstar.com") || processUrl.includes("jiohotstar.com"))) {
      try {
        const urlObj = new URL(processUrl);
        // Keep the full path including the country-code prefix (e.g. "in/").
        // Stripping it caused the BFF slugs API to return 404.
        let slug = urlObj.pathname.replace(/^\/+/, "");
        const isNumericSlug = /^\d+$/.test(slug);
        const containsSlash = slug.includes("/");
        if (slug && !slug.startsWith("api/") && (containsSlash || isNumericSlug)) {
          let userToken = "";
          if (hasCookie && readTextFile) {
            try {
              const fileContent: string = await readTextFile(selectedCookieName);
              const lines = fileContent.split(/\r?\n/);
              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith("#")) {
                  const parts = trimmed.split("\t");
                  if (parts.length >= 7) {
                    const domain = parts[0];
                    const name = parts[5];
                    const value = parts[6];
                    if (name === "sessionUserUP" && (domain.includes("hotstar.com") || domain.includes("jiohotstar.com"))) {
                      userToken = value;
                      break;
                    }
                  }
                }
              }
            } catch (ce) {
              console.warn("Failed to read/parse cookie file for sessionUserUP:", ce);
            }
          }

          const hotstarauth = await generateHotstarAuth();
          const domainName = urlObj.hostname || "www.hotstar.com";
          const apiCall = `https://${domainName}/api/internal/bff/v2/slugs/${slug}`;
          const headers: Record<string, string> = {
            "Referer": processUrl,
            "hotstarauth": hotstarauth,
            "X-HS-Accept-Language": "eng",
            "X-HS-Platform": "web",
            "x-platform-code": "PCTV",
            "X-HS-client": "platform:web;app_version:22.10.10.2;browser:Chrome;schema_version:0.0.633;partner:"
          };
          if (userToken) {
            headers["X-HS-UserToken"] = userToken;
          }
          const resText: string = await invoke("fetch_url", {
            url: apiCall,
            headers,
            proxy: customProxy.trim() || null
          });
          const res = JSON.parse(resText);
          const meta = extractBffMetadata(res);
          if (meta.title) resolvedMetadata.title = meta.title;
          if (meta.duration) resolvedMetadata.duration = meta.duration;
          if (meta.thumbnail) resolvedMetadata.thumbnail = meta.thumbnail;
        }
      } catch (err) {
        console.warn("Failed to fetch JioHotstar BFF metadata:", err);
      }
    }

    let isHotstarResolved = false;
    if ((processUrl.includes("hotstar.com") || processUrl.includes("jiohotstar.com")) && !isPlaylistUrl(processUrl)) {
      try {
        const matches = processUrl.match(/\/(\d+)/g);
        const contentId = matches ? matches[matches.length - 1].replace("/", "") : null;
        const contentType = processUrl.includes("/movies/") ? "MOVIE" : "SHOW";
        
        if (contentId) {
          let userToken = "";
          let deviceId = "";
          if (hasCookie && readTextFile) {
            try {
              const fileContent: string = await readTextFile(selectedCookieName);
              const lines = fileContent.split(/\r?\n/);
              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith("#")) {
                  const parts = trimmed.split("\t");
                  if (parts.length >= 7) {
                    const domain = parts[0];
                    const name = parts[5];
                    const value = parts[6];
                    if (domain.includes("hotstar.com") || domain.includes("jiohotstar.com")) {
                      if (name === "sessionUserUP") {
                        userToken = value;
                      } else if (name === "deviceId") {
                        deviceId = value;
                      }
                    }
                  }
                }
              }
            } catch (ce) {
              console.warn("Failed to read/parse cookie file for manifest resolving:", ce);
            }
          }
          if (!deviceId) {
            deviceId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
              const r = (Math.random() * 16) | 0;
              const v = c === "x" ? r : (r & 0x3) | 0x8;
              return v.toString(16);
            });
          }

          const hotstarauth = await generateHotstarAuth();
          const apiHeaders: Record<string, string> = {
            "user-agent": "Disney+;in.startv.hotstar.dplus.tv/23.08.14.4.2915 (Android/13)",
            "hotstarauth": hotstarauth,
            "x-hs-platform": "androidtv",
            "x-hs-client": "platform:androidtv;app_id:in.startv.hotstar.dplus.tv;app_version:23.08.14.4;os:Android;os_version:13;schema_version:0.0.970",
            "content-type": "application/json",
          };
          if (userToken) {
            apiHeaders["x-hs-usertoken"] = userToken;
          }
          if (deviceId) {
            apiHeaders["x-hs-device-id"] = deviceId;
          }

          const fetchManifestWithParams = async (codec: string, maxRes: string, dynRange: string): Promise<any> => {
            const clientCapabilities = JSON.stringify({
              package: ["dash", "hls"],
              container: ["fmp4br", "fmp4"],
              ads: ["non_ssai", "ssai"],
              audio_channel: ["atmos", "dolby51", "stereo"],
              encryption: ["plain", "widevine"],
              video_codec: [codec],
              ladder: ["tv", "full"],
              resolution: [maxRes],
              true_resolution: [maxRes],
              dynamic_range: [dynRange]
            });
            const drmParameters = JSON.stringify({
              widevine_security_level: ["SW_SECURE_DECODE", "SW_SECURE_CRYPTO"],
              hdcp_version: ["HDCP_V2_2", "HDCP_V2_1", "HDCP_V2", "HDCP_V1"]
            });
            const params = new URLSearchParams({
              content_id: contentId,
              filters: `content_type=${contentType}`,
              client_capabilities: clientCapabilities,
              drm_parameters: drmParameters
            });

            // Try manifest1 (watch)
            try {
              const url1 = `https://apix.hotstar.com/v2/pages/watch?${params.toString()}`;
              const resText = await invoke("fetch_url", {
                url: url1,
                headers: apiHeaders,
                proxy: customProxy.trim() || null
              });
              const r = JSON.parse(resText);
              const pb = extractPlayback(r);
              if (pb && pb.content_url) {
                const meta = extractBffMetadata(r);
                if (meta.title && !resolvedMetadata.title) resolvedMetadata.title = meta.title;
                if (meta.duration && !resolvedMetadata.duration) resolvedMetadata.duration = meta.duration;
                // Always take thumbnail from playback API — it returns the -h landscape poster
                if (meta.thumbnail) resolvedMetadata.thumbnail = meta.thumbnail;
                return pb;
              }
            } catch (e) {}

            // Try manifest2 (detail)
            try {
              const url2 = `https://apix.hotstar.com/v2/pages/detail?${params.toString()}`;
              const resText = await invoke("fetch_url", {
                url: url2,
                headers: apiHeaders,
                proxy: customProxy.trim() || null
              });
              const r = JSON.parse(resText);
              const pb = extractPlayback(r);
              if (pb && pb.content_url) {
                const meta = extractBffMetadata(r);
                if (meta.title && !resolvedMetadata.title) resolvedMetadata.title = meta.title;
                if (meta.duration && !resolvedMetadata.duration) resolvedMetadata.duration = meta.duration;
                // Always take thumbnail — detail API has the -h landscape poster
                if (meta.thumbnail) resolvedMetadata.thumbnail = meta.thumbnail;
                return pb;
              }
            } catch (e) {}

            return null;
          };

          // Try 4K HEVC first, fallback to FHD H264 SDR
          let playbackData = await fetchManifestWithParams("h265", "4k", "sdr");
          if (!playbackData) {
            playbackData = await fetchManifestWithParams("h264", "fhd", "sdr");
          }

          if (playbackData && playbackData.content_url) {
            processUrl = playbackData.content_url;
            isHotstarResolved = true;
            console.log("Successfully resolved JioHotstar playback manifest URL:", processUrl);
          }
        }
      } catch (err) {
        console.warn("Failed to resolve JioHotstar playback manifest:", err);
      }
    }

    try {
      // Same DRMLAB client rotation as download — ensures the metadata fetch
      // sees the full 4K/AV1/VP9 format ladder, not just web-client formats.
      const META_TV_CLIENTS: Record<string, string[]> = {
        "youtube.com": [
          "youtube:player_client=android_vr",
          "default",
        ],
        "youtu.be": [
          "youtube:player_client=android_vr",
          "default",
        ],
        "hotstar.com": [
          "hotstar:player_client=androidtv",
          "hotstar:player_client=web",
        ],
      };

      // For JioHotstar: also silently fetch web-client formats (H264) and merge
      // so the dropdown shows both HEVC (androidtv) and H264 (web) options.
      const isHotstarUrl = processUrl.includes("hotstar.com") || processUrl.includes("jiohotstar.com");
      let webClientFmts: any[] = [];

      const getMetaTvProfiles = (): string[] | null => {
        try {
          if (isHotstarResolved) return null;
          const h = new URL(processUrl).hostname.toLowerCase();
          for (const [k, v] of Object.entries(META_TV_CLIENTS)) {
            if (h.includes(k)) return v;
          }
        } catch {}
        return null;
      };
      const metaTvProfiles = getMetaTvProfiles();

      const getArgs = (clientStage = 0, url = processUrl) => {
        let args = [
          "--dump-single-json",
          "--no-warnings",
          "--no-colors",
          "--encoding", "utf-8",
          "--allow-unplayable-formats",
          "--no-check-certificate",
          "--js-runtimes", "deno,node"
        ];

        const isSearchOrPlaylist = isPlaylistUrl(url);
        if (isSearchOrPlaylist && !isSelection) {
          args.push("--flat-playlist");
        }

        // Auto-inject or use custom headers
        const { userAgent: autoUa, referer: autoReferer } = getBestHeadersForUrl(url);
        const finalReferer = customReferer.trim() || autoReferer;
        const finalUa = customUserAgent.trim() || autoUa;

        if (finalReferer) {
          args.push("--add-header", `Referer:${finalReferer}`);
        }
        if (finalUa) {
          args.push("--user-agent", finalUa);
        }

        const sanitizedProxy = getSanitizedProxy(customProxy);
        if (sanitizedProxy) {
          args.push("--proxy", sanitizedProxy);
        }
        if (hasCookie) args.push("--cookies", selectedCookieName);

        // Inject TV client for 4K format discovery (same logic as download)
        if (metaTvProfiles && metaTvProfiles.length > 0) {
          const stage = Math.min(clientStage, metaTvProfiles.length - 1);
          const profile = metaTvProfiles[stage];
          if (profile !== "default") {
            args.push("--extractor-args", profile);
          }
        }

        args.push(url);
        return args;
      };

      // Silent rotation for metadata fetch too
      const isMetaRecoverable = (r: { code: number; stderr: string }) => {
        if (r.code === 0) return false;
        const e = r.stderr.toLowerCase();
        return e.includes("bot") || e.includes("sign in") || e.includes("403") ||
               e.includes("not available") || e.includes("age-restricted");
      };

      let res = await runYtDlp(getArgs(0), undefined, "metadata_fetch");
      const metaMaxStages = metaTvProfiles ? metaTvProfiles.length : 1;
      for (let s = 1; s < metaMaxStages && isMetaRecoverable(res); s++) {
        res = await runYtDlp(getArgs(s), undefined, "metadata_fetch");
      }
      if (isMetaRecoverable(res) && !metaTvProfiles) {
        res = await runYtDlp([...getArgs(0), "--extractor-args", "youtube:player_client=android_vr"], undefined, "metadata_fetch");
      }

      // If still blocked, automatically clear cache and run the modern impersonation bypass
      if (isMetaRecoverable(res)) {
        try {
          console.log("Recoverable metadata error hit. Performing silent engine cache clear...");
          await runYtDlp(["--rm-cache-dir"]);
        } catch (cacheErr) {
          console.warn("Failed to clear yt-dlp cache:", cacheErr);
        }
        
        let bypassArgs = getArgs(0);
        // Remove existing player_client configurations if any
        bypassArgs = bypassArgs.filter(arg => !arg.includes("player_client"));
        // Force the modern web player client and disable legacy SDKless APIs
        bypassArgs.push("--extractor-args", "youtube:player_client=default,-android_sdkless");
        // Impersonate Chrome TLS fingerprint
        if (!customUserAgent.trim()) {
          bypassArgs.push("--impersonate", "chrome");
        }
        res = await runYtDlp(bypassArgs, undefined, "metadata_fetch");
      }

      // For Hotstar: concurrently fetch web-client (H264) formats to merge into dropdown
      if (isHotstarUrl && !isPlaylistUrl(processUrl)) {
        try {
          const webArgs = getArgs(0, targetUrl.trim()).map((a: string, i: number, arr: string[]) => {
            if (arr[i-1] === "--extractor-args" && a.includes("androidtv")) return "hotstar:player_client=web";
            return a;
          });
          if (!webArgs.includes("hotstar:player_client=web")) {
            const idx = webArgs.indexOf(targetUrl.trim());
            if (idx !== -1) {
              webArgs.splice(idx, 0, "--extractor-args", "hotstar:player_client=web");
            }
          }
          const webRes = await runYtDlp(webArgs, undefined, "metadata_fetch");
          if (webRes.code === 0) {
            try {
              const webData = JSON.parse(webRes.stdout);
              webClientFmts = (webData.formats || []).filter((f: any) => f.vcodec && f.vcodec !== "none");
            } catch {}
          }
        } catch {}
      }

      let rawData: any = null;
      try {
        rawData = JSON.parse(res.stdout);
      } catch (e) {}
      if (!rawData)
        throw new Error(res.stderr || "Failed to extract metadata.");

      let isPlaylist = rawData._type === "playlist" || !!rawData.entries;
      let entries = isPlaylist
        ? (rawData.entries || []).filter((e: any) => e)
        : [rawData];

      if (isPlaylist && entries.length === 1) {
        rawData = entries[0];
        isPlaylist = false;
        entries = [rawData];
      }

      if (
        isPlaylist &&
        (processUrl.startsWith("ytsearch") || entries.length > 1)
      ) {
        const results = entries.slice(0, 500).map((e: any, index: number) => {
          const raw_dur = e.duration || 0;
          const h = Math.floor(raw_dur / 3600);
          const m = Math.floor((raw_dur % 3600) / 60);
          const s = raw_dur % 60;
          const durStr =
            h > 0
              ? `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
              : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
          let thumb_url = e.thumbnail;
          if (!thumb_url && e.thumbnails?.length)
            thumb_url = e.thumbnails[e.thumbnails.length - 1].url;
          if (!thumb_url && rawData) {
            thumb_url = rawData.thumbnail;
            if (!thumb_url && rawData.thumbnails?.length) {
              thumb_url = rawData.thumbnails[rawData.thumbnails.length - 1].url;
            }
          }

          // Parse Season details
          let seasonVal: string | null = null;
          let rawSeason = e.season_number ?? e.season ?? null;
          if (rawSeason !== null && rawSeason !== undefined) {
            const numMatch = String(rawSeason).match(/\d+/);
            if (numMatch) {
              seasonVal = `Season ${parseInt(numMatch[0])}`;
            } else {
              seasonVal = String(rawSeason);
            }
          } else {
            const sMatch = String(e.title || "").match(/S(\d+)/i) || 
                           String(e.title || "").match(/Season\s*(\d+)/i) ||
                           String(e.title || "").match(/Chapter\s*(\d+)/i) ||
                           String(e.title || "").match(/Ch\s*(\d+)/i);
            if (sMatch) {
              seasonVal = `Season ${parseInt(sMatch[1])}`;
            }
          }

          // Parse Episode details
          let episodeVal: string | null = null;
          let rawEpisode = e.episode_number ?? e.episode ?? null;
          if (rawEpisode !== null && rawEpisode !== undefined) {
            const parsed = parseInt(String(rawEpisode));
            if (!isNaN(parsed)) {
              episodeVal = `Episode ${parsed}`;
            } else {
              const numMatch = String(rawEpisode).match(/\d+/);
              if (numMatch) {
                episodeVal = `Episode ${parseInt(numMatch[0])}`;
              } else {
                episodeVal = String(rawEpisode);
              }
            }
          } else {
            const eMatch = String(e.title || "").match(/E(\d+)/i) || 
                           String(e.title || "").match(/Episode\s*(\d+)/i) ||
                           String(e.title || "").match(/Ep\s*(\d+)/i);
            if (eMatch) {
              episodeVal = `Episode ${parseInt(eMatch[1])}`;
            }
          }

          let episodeUrl = e.url || e.webpage_url || "";
          if (isHotstarUrl && episodeUrl) {
            if (/^\d+$/.test(episodeUrl)) {
              episodeUrl = `https://www.hotstar.com/${episodeUrl}`;
            } else if (!episodeUrl.startsWith("http")) {
              if (episodeUrl.startsWith("/")) {
                episodeUrl = `https://www.hotstar.com${episodeUrl}`;
              } else {
                episodeUrl = `https://www.hotstar.com/${episodeUrl}`;
              }
            }
          }

          return {
            title: String(cleanTitle(e.title || "Unknown", episodeUrl)),
            url: String(episodeUrl),
            thumbnail: String(thumb_url || ""),
            duration: String(durStr),
            uploader: String(e.uploader || e.channel || "Unknown"),
            views: String(e.view_count || "0"),
            season: seasonVal,
            episode: episodeVal,
            playlistIndex: e.playlist_index ?? (index + 1)
          };
        });

        // Normalize seasons if at least one item has a season
        const hasAnySeason = results.some(r => r.season !== null);
        if (hasAnySeason) {
          results.forEach(r => {
            if (!r.season) r.season = "Season 1";
          });
        }

        setMediaList(results);
        setMediaListUrl(
          String(rawData.original_url || rawData.webpage_url || processUrl),
        );
        setMediaInfo(null);
        setIsFetching(false);
        return;
      }

      const fmts = rawData.formats || [];
      // Merge web-client (H264) formats for Hotstar if we have them
      const allFmts = [...fmts];
      if (webClientFmts.length > 0) {
        const existingIds = new Set(fmts.map((f: any) => f.format_id));
        for (const wf of webClientFmts) {
          if (!existingIds.has(wf.format_id)) {
            allFmts.push(wf);
          }
        }
      }

      const resSet = new Set<string>();
      allFmts.forEach((f: any) => {
        let r = f.resolution;
        if ((!r || !r.includes("x")) && f.width && f.height) {
          r = `${f.width}x${f.height}`;
        }
        if (f.vcodec !== "none" && r && r.includes("x")) {
          resSet.add(r);
          f.resolution = r;
        }
      });
      const sortedRes = Array.from(resSet).sort(
        (a, b) => parseInt(b.split("x")[1]) - parseInt(a.split("x")[1]),
      );
      const resolutions: { label: string; value: string }[] = [
        { label: "Best Available", value: "best" }
      ];

      sortedRes.forEach((r) => {
        const fmtsAtRes = allFmts.filter((f: any) => f.resolution === r && f.vcodec !== "none" && f.vcodec);
        
        // Group by codec display name
        const codecMap = new Map<string, any>();
        fmtsAtRes.forEach((f: any) => {
          const codecName = getCodecDisplay(f.vcodec) || "Unknown";
          const existing = codecMap.get(codecName);
          if (!existing || (f.vbr || f.tbr || 0) > (existing.vbr || existing.tbr || 0)) {
            codecMap.set(codecName, f);
          }
        });

        // Sort codecs: AV1 > VP9 > HEVC > AVC
        const sortedCodecs = Array.from(codecMap.values()).sort((a, b) => {
          const scoreA = getCodecScore(a.vcodec);
          const scoreB = getCodecScore(b.vcodec);
          if (scoreB !== scoreA) return scoreB - scoreA;
          return (b.vbr || b.tbr || 0) - (a.vbr || a.tbr || 0);
        });

        sortedCodecs.forEach((fmt) => {
          const codec = getCodecDisplay(fmt.vcodec);
          const br = fmt.vbr || fmt.tbr || 0;
          const brStr = br > 1000 ? `${(br / 1000).toFixed(1)} Mbps` : br > 0 ? `${br.toFixed(0)} kbps` : "";
          const parts = [codec, brStr].filter(p => p !== "");
          const desc = parts.length > 0 ? ` (${parts.join(" • ")})` : "";
          resolutions.push({
            label: `${r}${desc}`,
            value: `vid:${fmt.format_id}:${r}`
          });
        });
      });

      const cleanLangs = new Set<string>();
      allFmts.forEach((f: any) => {
        if (f.acodec !== "none" && f.language && f.language !== "none") {
          const lang = LANG_MAP[f.language] || f.language;
          cleanLangs.add(lang.charAt(0).toUpperCase() + lang.slice(1));
        }
      });
      const availableAudio = Array.from(cleanLangs)
        .sort()
        .map((l) => {
          const fmtsAtLang = allFmts.filter((f: any) => {
            if (f.acodec === "none") return false;
            const fLang = f.language ? (LANG_MAP[f.language] || f.language) : "";
            return fLang.toLowerCase() === l.toLowerCase();
          });
          const bestAudioFmt = fmtsAtLang.sort((a: any, b: any) => (b.abr || b.tbr || 0) - (a.abr || a.tbr || 0))[0];
          let desc = "";
          if (bestAudioFmt) {
            let codec = getCodecDisplay(bestAudioFmt.acodec);
            let br = bestAudioFmt.abr || bestAudioFmt.tbr || 0;
            let brStr = br > 0 ? `${br.toFixed(0)} kbps` : "";
            let ch = getAudioChannels(bestAudioFmt);
            const parts = [codec, ch, brStr].filter(p => p !== "");
            if (parts.length > 0) {
              desc = ` (${parts.join(" • ")})`;
            }
          }
          return { label: `${l}${desc}`, value: String(l) };
        });

      const normSubs = Object.keys(rawData.subtitles || {}).sort();
      const autoSubs = Object.keys(rawData.automatic_captions || {}).sort();
      const availableSubs = normSubs.map((s) => ({
        label: String(s),
        value: String(s),
      }));
      let origAdded = false;
      autoSubs.forEach((s) => {
        if (s.endsWith("-orig")) {
          availableSubs.push({
            label: `${s.replace("-orig", "")} (Auto)`,
            value: String(s),
          });
          origAdded = true;
        }
      });
      if (!origAdded) {
        if (rawData.language && autoSubs.includes(rawData.language))
          availableSubs.push({
            label: `${rawData.language} (Auto)`,
            value: String(rawData.language),
          });
        else if (autoSubs.includes("en"))
          availableSubs.push({ label: "en (Auto)", value: "en" });
      }

      const raw_dur = resolvedMetadata.duration || rawData.duration || 0;
      const h = Math.floor(raw_dur / 3600);
      const m = Math.floor((raw_dur % 3600) / 60);
      const s = raw_dur % 60;
      const formatted_dur =
        h > 0
          ? `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
          : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;

      const streamStats = parseStreamStats(allFmts);
      const premiumCodec = ["HEVC", "AV1", "VP9"].includes(streamStats.videoCodec) || ["E-AC3", "AC3"].includes(streamStats.audioCodec);
      if (premiumCodec) {
        setContainer("mkv");
      } else {
        setContainer("mp4");
      }

      const isHotstar = processUrl.includes("hotstar.com") || processUrl.includes("jiohotstar.com");
      const resolvedExt = isHotstar ? "Hotstar" : resolvedMetadata.title ? "Vaplayer" : String(rawData.extractor_key || "Web");

      let rawThumb = rawData.thumbnail || "";
      if (!rawThumb && rawData.thumbnails && rawData.thumbnails.length > 0) {
        rawThumb = rawData.thumbnails[rawData.thumbnails.length - 1].url || "";
      }

      setMediaInfo({
        original_url: String(rawData.webpage_url || processUrl),
        title: cleanTitle(resolvedMetadata.title || String(rawData.title || "Unknown Title"), targetUrl),
        extractor: resolvedExt,
        duration: String(formatted_dur),
        views: String(rawData.view_count || "0"),
        uploader: String(rawData.uploader || rawData.channel || "Unknown"),
        thumbnail: String(resolvedMetadata.thumbnail || rawThumb || ""),
        resolutions: resolutions,
        containers: [
          { label: "MKV", value: "mkv" },
          { label: "MP4", value: "mp4" },
        ],
        audioFormats: [
          { label: "MP3", value: "mp3" },
          { label: "FLAC", value: "flac" },
          { label: "M4A", value: "m4a" },
          { label: "WAV", value: "wav" },
          { label: "OPUS", value: "opus" },
          { label: "AAC", value: "aac" },
        ],
        availableAudio: availableAudio,
        availableSubs: availableSubs,
        _rawFormats: allFmts,
        videoBitrate: streamStats.videoBitrate,
        videoCodec: streamStats.videoCodec,
        audioBitrate: streamStats.audioBitrate,
        audioCodec: streamStats.audioCodec,
        audioChannels: streamStats.audioChannels,
        _raw: rawData,
      });

      setActiveTab("video");
    } catch (e: any) {
      const errStr =
        typeof e === "string"
          ? e
          : e?.message || JSON.stringify(e) || "Unknown error";
      setGlobalError(parseDetailedError(errStr));
      setMediaInfo(null);
      setMediaList(null);
    } finally {
      setIsFetching(false);
      setFetchingUrl(null);
    }
  };

  const handleDownload = async (mode: "video" | "audio", isBulk = false) => {
    const finalUrl = isBulk
      ? mediaListUrl || url.trim()
      : mediaInfo?.original_url || url.trim();
    if (!finalUrl) return;

    const dlId = Date.now().toString();
    const dlTitle = isBulk
      ? "Bulk/Playlist"
      : mediaInfo?.title || "Unknown Download";
    const newDl = {
      id: dlId,
      title: String(dlTitle),
      url: String(finalUrl),
      progress: 0,
      status: "Starting Engine...",
      mode: String(mode),
      format: mode === "video" ? String(container) : String(audioOnlyFormat),
      speed: "",
      eta: "",
      size: "",
      isError: false,
      errorMsg: "",
      isSuccess: false,
      createdFiles: [] as string[],
    };

    const tempPath = (savePath && join) ? await join(savePath, `4444_temp_${dlId}`) : undefined;
    let createdFilesList: string[] = [];
    let downloadSucceeded = false;
    let resolvedFinalFilename = "";

    setActiveDownloads((prev) => [newDl, ...prev]);
    setGlobalError(null);

    try {
      let ffmpegPath = "ffmpeg";
      let aria2cPath = "";
      if (invoke) {
        try {
          const rawPath: string = await invoke("get_ffmpeg_path");
          let normalized = rawPath.replace(/\//g, "\\");
          if (normalized.toLowerCase().endsWith("ffmpeg.exe")) {
            normalized = normalized.slice(0, -10);
          }
          if (normalized.endsWith("\\") && normalized.length > 3) {
            normalized = normalized.slice(0, -1);
          }
          ffmpegPath = normalized;
        } catch (e) {
          console.warn(
            "Failed to retrieve absolute FFmpeg path from Rust engine.",
          );
        }
        try {
          const rawAria: string = await invoke("get_aria2c_path");
          aria2cPath = rawAria.replace(/\//g, "\\");
        } catch (e) {
          console.warn(
            "Failed to retrieve absolute Aria2c path from Rust engine.",
          );
        }
      }

      // Keep native Windows backslash path separators to prevent argument parsing failures in subprocess execution

      // ─── Multi-rotating TV client profiles per domain ───────────────────────
      // Built from the exact client identities used by DRMLAB / Unshackle.
      //
      // YouTube:
      //   Stage 0 — android_vr (Quest 3, clientVersion 1.61.48)
      //             This is precisely the client DRMLAB's youtube.py uses in
      //             _fetch_player_data(). It exposes 4K AV1/VP9 without
      //             sign-in checks and bypasses bot-detection.
      //   Stage 1 — tv_embedded + tvhtml5  (HTML5 TV; widest 4K/HDR coverage)
      //   Stage 2 — web_embedded + web     (desktop DASH fallback)
      //   Stage 3 — android + ios          (mobile last resort)
      //
      // JioHotstar:
      //   Stage 0 — androidtv              Matches DRMLAB jiohotstar.py's
      //             x-hs-platform=androidtv and UA
      //             "Disney+;in.startv.hotstar.dplus.tv/23.08.14.4.2915"
      //             which is what unlocks the HD/4K ladder:tv manifest.
      //   Stage 1 — web                    Desktop fallback.
      //
      // Zee5 / SonyLiv / Voot / MXPlayer:
      //   TV-app API variant first, web API fallback.
      const TV_CLIENT_MAP: Record<string, string[]> = {
        // ── YouTube ────────────────────────────────────────────────────────────
        "youtube.com": [
          "youtube:player_client=android_vr",
          "default",
        ],
        "youtu.be": [
          "youtube:player_client=android_vr",
          "default",
        ],
        // ── JioHotstar ─────────────────────────────────────────────────────────
        // Mirrors jiohotstar.py: platform=androidtv, app_id=in.startv.hotstar.dplus.tv
        // app_version=23.08.14.4 — this exact identity unlocks the TV/4K ladder.
        "hotstar.com": [
          "hotstar:player_client=androidtv",   // Stage 0: TV app → HD/4K manifest
          "hotstar:player_client=web",          // Stage 1: Desktop fallback
        ],
        // ── Zee5 ───────────────────────────────────────────────────────────────
        "zee5.com": [
          "zee5:country=IN,platform=tv",        // Stage 0: Smart TV (HD)
          "zee5:country=IN,platform=web",       // Stage 1: Web
        ],
        // ── SonyLiv ────────────────────────────────────────────────────────────
        "sonyliv.com": [
          "sonyliv:platform=tv",                // Stage 0: TV app
          "sonyliv:platform=web",               // Stage 1: Web
        ],
        // ── Voot / MXPlayer ────────────────────────────────────────────────────
        "voot.com":    ["voot:platform=tv",    "voot:platform=web"],
        "mxplayer.in": ["mxplayer:platform=tv", "mxplayer:platform=web"],
      };

      /**
       * Resolve the TV-client rotation array for the current URL.
       * Returns null if the domain has no known TV-client profile.
       */
      const getTvClientProfiles = (): string[] | null => {
        try {
          const hostname = new URL(finalUrl).hostname.toLowerCase();
          const urlLower = finalUrl.toLowerCase();
          if (urlLower.includes(".mpd") || urlLower.includes(".m3u8") || urlLower.includes("apix.") || urlLower.includes(".cdn.")) {
            return null;
          }
          for (const [key, profiles] of Object.entries(TV_CLIENT_MAP)) {
            if (hostname.includes(key)) return profiles;
          }
        } catch {}
        return null;
      };

      const tvClientProfiles = getTvClientProfiles();

      /**
       * Build yt-dlp argument array for a given client rotation stage.
       * @param clientStage 0 = best client (proactive), 1+ = fallback rotation.
       */
      const buildArgs = (clientStage = 0) => {
        let args = [
          "--no-warnings",
          "--no-colors",
          "--newline",
          "--encoding", "utf-8",
          "--restrict-filenames",
          "--no-check-certificate",
          "--ignore-errors",
          "--js-runtimes", "deno,node"
        ];

        // Auto-inject or use custom headers
        const { userAgent: autoUa, referer: autoReferer } = getBestHeadersForUrl(finalUrl);
        const finalReferer = customReferer.trim() || autoReferer;
        const finalUa = customUserAgent.trim() || autoUa;

        if (finalReferer) {
          args.push("--add-header", `Referer:${finalReferer}`);
        }
        if (finalUa) {
          args.push("--user-agent", finalUa);
        }

        const sanitizedProxy = getSanitizedProxy(customProxy);
        if (sanitizedProxy) {
          args.push("--proxy", sanitizedProxy);
        }

        if (hasCookie) args.push("--cookies", selectedCookieName);

        // ── Proactive TV client injection ─────────────────────────────────────
        // Always apply the appropriate TV-client profile at the correct stage.
        // Stage 0 = best/preferred; subsequent stages = rotation fallbacks.
        if (tvClientProfiles && tvClientProfiles.length > 0) {
          const stage = Math.min(clientStage, tvClientProfiles.length - 1);
          const profile = tvClientProfiles[stage];
          if (profile !== "default") {
            args.push("--extractor-args", profile);
          }
        }

        let isFragile = false;
        try {
          const domain = new URL(finalUrl).hostname.toLowerCase();
          const fragileSites = [
            "pinterest",
            "tiktok",
            "reddit",
            "instagram",
            "facebook",
            "twitter",
            "x.com",
            "hotstar",
            "jiocinema",
            "zee5",
            "sonyliv"
          ];
          isFragile = fragileSites.some(site => domain.includes(site));
          const isYouTube = domain.includes("youtube.com") || domain.includes("youtu.be");
          
          if (isYouTube) {
            args.push("--concurrent-fragments", "12");
            args.push("--buffer-size", "64K");
          } else if (isFragile) {
            // Fragile sites: rate limits and anti-bot checks block aggressive parallel segment downloaders.
            args.push("--concurrent-fragments", "2");
            args.push("--buffer-size", "32K");
          } else if (aria2cPath) {
            args.push("--external-downloader", aria2cPath);
            args.push("--external-downloader-args", "aria2c:-x 16 -j 16 -s 16 -k 1M -c");
          } else {
            args.push("--concurrent-fragments", "6");
            args.push("--buffer-size", "64K");
          }
        } catch (err) {}

        args.push(
          "--retries",
          "10",
          "--fragment-retries",
          "10",
          "--retry-sleep",
          "fragment:exp=1:20",
          "--ffmpeg-location",
          ffmpegPath,
          "--format-sort",
          "res,fps,tbr,vcodec,acodec,asr",
        );

        let mergeContainer = container;
        if (mode === "video") {
          let vFmt = "bestvideo";
          if (resolution !== "best") {
            if (resolution.startsWith("vid:")) {
              vFmt = resolution.split(":")[1];
            } else {
              vFmt = `bestvideo[height<=?${resolution.split("x")[1]}]`;
            }
          }
          let aFmt = "bestaudio";

          if (selectedAudioTracks.length > 0 && mediaInfo?._rawFormats) {
            const selectedIds: string[] = [];
            selectedAudioTracks.forEach((lang) => {
              const track = mediaInfo._rawFormats.find((f: any) => {
                const fLang = LANG_MAP[f.language] || f.language;
                return (
                  fLang &&
                  fLang.toLowerCase() === lang.toLowerCase() &&
                  f.acodec !== "none"
                );
              });
              if (track) selectedIds.push(track.format_id);
            });
            if (selectedIds.length > 0) {
              aFmt = selectedIds.join("+");
              args.push("--audio-multistreams");
            }
          }

          if (resolution === "best") {
            args.push("-f", `(${vFmt}+${aFmt})/best`);
          } else {
            if (resolution.startsWith("vid:")) {
              const parts = resolution.split(":");
              const formatId = parts[1];
              const h = (parts[2] || "1920x1080").split("x")[1] || "1080";
              args.push("-f", `(${formatId}+${aFmt})/(bestvideo[height<=?${h}]+${aFmt})/best`);
            } else {
              const h = resolution.split("x")[1] || "1080";
              args.push("-f", `(${vFmt}+${aFmt})/(bestvideo+${aFmt})/best`);
            }
          }

          // ── Smart merge-format selection ──────────────────────────────────────
          mergeContainer = container;
          try {
            const mergeHostname = new URL(finalUrl).hostname.toLowerCase();
            const isYouTube = mergeHostname.includes("youtube.com") || mergeHostname.includes("youtu.be");
            let selectedIsWebm = false;
            if (resolution.startsWith("vid:")) {
              const selFmtId = resolution.split(":")[1];
              const selFmt = mediaInfo?._rawFormats?.find((f: any) => f.format_id === selFmtId);
              if (selFmt) {
                const vc = (selFmt.vcodec || "").toLowerCase();
                selectedIsWebm = vc.includes("vp9") || vc.includes("vp09") ||
                                 vc.includes("av01") || vc.includes("av1");
              }
            }
            if ((isYouTube || selectedIsWebm) && mergeContainer !== "mkv") {
              mergeContainer = "mkv";
            }
          } catch {}
          args.push("--merge-output-format", mergeContainer, "--no-keep-video");
          if (options.hdrToSdr)
            args.push(
              "--postprocessor-args",
              "ffmpeg:-vf tonemap=hable:desat=0,format=yuv420p -c:v libx264 -preset slow -crf 16",
            );
        } else if (mode === "audio") {
          args.push(
            "-f",
            "bestaudio/best",
            "--extract-audio",
            "--audio-format",
            audioOnlyFormat.toLowerCase(),
          );
          if (audioQuality !== "lossless")
            args.push("--audio-quality", audioQuality + "K");
        }

        if (options.saveThumbnailFile) {
          args.push("--write-thumbnail", "--convert-thumbnails", "png");
        }

        if (options.sponsorBlock) args.push("--sponsorblock-remove", "all");

        if (options.trim && !isBulk) {
          const s = trimStart.h * 3600 + trimStart.m * 60 + trimStart.s;
          const e = trimEnd.h * 3600 + trimEnd.m * 60 + trimEnd.s;
          if (e > s) args.push("--download-sections", `*${s}-${e}`);
        }

        if (selectedSubtitles.length > 0 && mode === "video") {
          args.push(
            "--write-subs",
            "--write-auto-subs",
            "--sub-langs",
            selectedSubtitles.join(","),
          );
          if (embedSubtitles) {
            args.push("--embed-subs");
          }
        }

        if (isBulk) {
          if (isSelectMode && selectedIndices.length > 0) {
            const indices = selectedIndices.map((i) => i + 1).join(",");
            args.push("--playlist-items", indices);
          } else if (selectedSeason !== "All" && mediaList) {
            const indices: number[] = [];
            mediaList.forEach((item, i) => {
              if (item.season === selectedSeason) {
                indices.push(i + 1);
              }
            });
            if (indices.length > 0) {
              args.push("--playlist-items", indices.join(","));
            }
          }
        }

        // DRMLAB-style output filename:
        let outputFilenameTemplate = "";

        if (isBulk || !mediaInfo) {
          if (mode === "video") {
            outputFilenameTemplate = `%(title)s.%(height)sp.%(extractor_key)s.WEB-DL%(ext)s`;
          } else {
            outputFilenameTemplate = `%(title)s.%(extractor_key)s.WEB-DL.%(ext)s`;
          }
        } else {
          try {
            let vFmtObj: any = null;
            if (resolution.startsWith("vid:")) {
              const selFmtId = resolution.split(":")[1];
              vFmtObj = mediaInfo?._rawFormats?.find((f: any) => f.format_id === selFmtId);
            } else if (resolution === "best") {
              vFmtObj = mediaInfo?._rawFormats
                ?.filter((f: any) => f.vcodec !== "none" && f.vcodec)
                .sort((a: any, b: any) => {
                  const aHeight = a.height || 0;
                  const bHeight = b.height || 0;
                  if (bHeight !== aHeight) return bHeight - aHeight;
                  const aScore = getCodecScore(a.vcodec);
                  const bScore = getCodecScore(b.vcodec);
                  if (bScore !== aScore) return bScore - aScore;
                  return (b.vbr || b.tbr || 0) - (a.vbr || a.tbr || 0);
                })[0];
            } else {
              const targetH = parseInt(resolution.split("x")[1] || "1080");
              vFmtObj = mediaInfo?._rawFormats
                ?.filter((f: any) => f.vcodec !== "none" && f.vcodec && f.height === targetH)
                .sort((a: any, b: any) => {
                  const aScore = getCodecScore(a.vcodec);
                  const bScore = getCodecScore(b.vcodec);
                  if (bScore !== aScore) return bScore - aScore;
                  return (b.vbr || b.tbr || 0) - (a.vbr || a.tbr || 0);
                })[0] || mediaInfo?._rawFormats
                ?.filter((f: any) => f.vcodec !== "none" && f.vcodec)
                .sort((a: any, b: any) => (b.height || 0) - (a.height || 0))[0];
            }

            let aFmtObj: any = null;
            if (selectedAudioTracks.length > 0) {
              const lang = selectedAudioTracks[0];
              const fmtsAtLang = mediaInfo?._rawFormats?.filter((f: any) => {
                if (f.acodec === "none") return false;
                const fLang = f.language ? (LANG_MAP[f.language] || f.language) : "";
                return fLang.toLowerCase() === lang.toLowerCase();
              });
              if (fmtsAtLang && fmtsAtLang.length > 0) {
                aFmtObj = fmtsAtLang.sort((a: any, b: any) => (b.abr || b.tbr || 0) - (a.abr || a.tbr || 0))[0];
              }
            }
            if (!aFmtObj) {
              aFmtObj = mediaInfo?._rawFormats
                ?.filter((f: any) => f.acodec !== "none" && f.acodec)
                .sort((a: any, b: any) => (b.abr || b.tbr || 0) - (a.abr || a.tbr || 0))[0];
            }

            const safeTitle = (mediaInfo.title || "Unknown_Title")
              .replace(/[\\/:*?"<>|]/g, "_")
              .replace(/\s+/g, ".")
              .trim();

            let source = "WEB";
            const extKey = (mediaInfo.extractor || "").toLowerCase();
            if (extKey.includes("hotstar")) source = "JHS";
            else if (extKey.includes("youtube")) source = "YT";
            else if (extKey.includes("zee5")) source = "ZEE5";
            else if (extKey.includes("sonyliv")) source = "LIV";

            if (mode === "video") {
              const height = vFmtObj ? (vFmtObj.height || 1080) : 1080;
              const quality = `${height}p`;

              let videoCodec = "AVC";
              if (vFmtObj) {
                const vc = (vFmtObj.vcodec || "").toLowerCase();
                if (vc.includes("av01") || vc.includes("av1")) videoCodec = "AV1";
                else if (vc.includes("vp09") || vc.includes("vp9")) videoCodec = "VP9";
                else if (vc.includes("hev") || vc.includes("h265") || vc.includes("265")) videoCodec = "HEVC";
                else if (vc.includes("avc") || vc.includes("h264") || vc.includes("264")) videoCodec = "AVC";
              }

              let audioCodec = "AAC";
              if (aFmtObj) {
                const ac = (aFmtObj.acodec || "").toLowerCase();
                if (ac.includes("ec-3") || ac.includes("eac3")) audioCodec = "EAC3";
                else if (ac.includes("ac-3") || ac.includes("ac3")) audioCodec = "AC3";
                else if (ac.includes("mp4a") || ac.includes("aac")) audioCodec = "AAC";
                else if (ac.includes("opus")) audioCodec = "OPUS";
                else if (ac.includes("flac")) audioCodec = "FLAC";
                else if (ac.includes("mp3")) audioCodec = "MP3";
              }

              let audioChannels = "2.0";
              if (aFmtObj) {
                const ch = aFmtObj.audio_channels || aFmtObj.channels;
                if (ch === 6) audioChannels = "5.1";
                else if (ch === 2) audioChannels = "2.0";
                else if (ch === 1) audioChannels = "1.0";
                else if (ch) audioChannels = `${ch}.0`;
                else {
                  const name = String(aFmtObj.format_note || aFmtObj.format_id || "").toLowerCase();
                  if (name.includes("5.1") || name.includes("6ch")) audioChannels = "5.1";
                }
              }

              outputFilenameTemplate = `${safeTitle}.${quality}.${source}.WEB-DL.${audioCodec}.${audioChannels}.${videoCodec}.${mergeContainer}`;
            } else {
              let audioCodec = "MP3";
              const af = audioOnlyFormat.toLowerCase();
              if (af === "mp3") audioCodec = "MP3";
              else if (af === "flac") audioCodec = "FLAC";
              else if (af === "m4a" || af === "aac") audioCodec = "AAC";
              else if (af === "wav") audioCodec = "WAV";
              else if (af === "opus") audioCodec = "OPUS";

              let audioChannels = "2.0";
              if (aFmtObj) {
                const ch = aFmtObj.audio_channels || aFmtObj.channels;
                if (ch === 6) audioChannels = "5.1";
                else if (ch === 2) audioChannels = "2.0";
                else if (ch === 1) audioChannels = "1.0";
                else if (ch) audioChannels = `${ch}.0`;
              }

              outputFilenameTemplate = `${safeTitle}.${source}.WEB-DL.${audioCodec}.${audioChannels}.${audioOnlyFormat.toLowerCase()}`;
            }






































          } catch (err) {
            console.warn("Failed to generate precise DRMLabs filename:", err);
            if (mode === "video") {
              outputFilenameTemplate = `%(title)s.%(height)sp.WEB-DL.%(ext)s`;
            } else {
              outputFilenameTemplate = `%(title)s.WEB-DL.%(ext)s`;
            }
          }
        }
        resolvedFinalFilename = outputFilenameTemplate;

        let absoluteOutputPath = "";
        if (tempPath) {
          if (isBulk) {
            absoluteOutputPath = `${tempPath}/download_%(playlist_index)s_%(vcodec)s.%(ext)s`;
          } else {
            absoluteOutputPath = `${tempPath}/download_${dlId}_%(vcodec)s.%(ext)s`;
          }
        } else {
          absoluteOutputPath = savePath ? `${savePath}/${outputFilenameTemplate}` : outputFilenameTemplate;
        }
        args.push("-o", absoluteOutputPath);
        args.push("--no-part");
        args.push(finalUrl);
        return args;
      };

      createdFilesList = [];
      downloadSucceeded = false;
      let outputBuffer = "";
      let lastRenderTime = 0;
      let latestProgress = 0;
      let currentDownloadType = "Media";
      let currentStatus = "Starting...";
      let currentSpeed = "--";
      let currentEta = "--";
      let currentSize = "--";
      let localErrorTriggered = false;
      let totalBytesEstimate = 0;   // total bytes of current segment
      let downloadedBytes = 0;      // bytes downloaded so far (current segment)
      let segmentStartTime = 0;     // timestamp when current segment started
      let isMerging = false;        // true while [Merger] is active
      let phase1Done = false;       // true after first segment (video) completes
      let destinationCount = 0;     // number of Destination files started

      const handleChunk = (chunk: string) => {
        outputBuffer += chunk;
        const parts = outputBuffer.split(/[\r\n]+/);
        outputBuffer = parts.pop() || "";
        let shouldUpdate = false;

        for (const p of parts) {
          const cleanLine = p.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "").trim();
          if (!cleanLine) continue;

          // Track generated files by matching paths in output
          const pathMatch = cleanLine.match(/(?:Destination:|into|in)\s+["']?([^"'\r\n]+)/i);
          if (pathMatch) {
            const fname = pathMatch[1].trim();
            if (fname.includes(".") && (fname.includes("/") || fname.includes("\\") || fname.length > 3)) {
              if (!createdFilesList.includes(fname)) {
                createdFilesList.push(fname);
                setActiveDownloads((prev) =>
                  prev.map((dl) =>
                    dl.id === dlId
                      ? { ...dl, createdFiles: [...createdFilesList] }
                      : dl,
                  ),
                );
              }
            }
          }

          if (
            cleanLine.toLowerCase().includes("ffmpeg is not installed") ||
            cleanLine.toLowerCase().includes("ffmpeg not found") ||
            cleanLine.toLowerCase().includes("ffprobe is not installed") ||
            cleanLine.toLowerCase().includes("ffprobe not found")
          ) {
            currentStatus = "Error: FFmpeg/FFprobe missing!";
            localErrorTriggered = true;
            shouldUpdate = true;
          }

          if (cleanLine.startsWith("[download]") && cleanLine.includes("Destination:")) {
            const destMatch = cleanLine.match(/Destination:\s*(.+)/);
            if (destMatch && !localErrorTriggered) {
              destinationCount++;
              const fname = destMatch[1].trim();
              const ext = fname.split(".").pop()?.toLowerCase() || "";
              
              // Reset segment tracking for each new file
              segmentStartTime = Date.now();
              downloadedBytes = 0;
              totalBytesEstimate = 0;
              isMerging = false;
              
              // Extract basename
              const lastSlash = Math.max(fname.lastIndexOf("/"), fname.lastIndexOf("\\"));
              const basename = lastSlash !== -1 ? fname.substring(lastSlash + 1) : fname;
              
              const isAudioStream = ["m4a", "mp3", "aac", "ogg", "opus", "flac", "wav"].includes(ext) || 
                                    fname.includes(".f251.") || fname.includes(".f140.") ||
                                    fname.toLowerCase().includes("audio") ||
                                    fname.toLowerCase().includes(".faudio") ||
                                    destinationCount > 1;
              if (isAudioStream) {
                currentDownloadType = `Audio (${basename})`;
                phase1Done = true;
              } else {
                currentDownloadType = `Video (${basename})`;
              }
              currentStatus = `Downloading ${currentDownloadType}...|${currentSpeed}|${currentEta}|${currentSize}`;
              shouldUpdate = true;
            }
          } else if (cleanLine.startsWith("[download]") && cleanLine.includes("%")) {
            const pctMatch = cleanLine.match(/(\d+\.?\d*)%/);
            const sizeMatch = cleanLine.match(/of\s+~?\s*([\d\.]+)([GMKk]i?B)/i);
            const spdMatch = cleanLine.match(/at\s+([\d\.]+[a-zA-Z]+\/s)/i);
            const etaMatch = cleanLine.match(/ETA\s+([\d:]+)/i);

            if (pctMatch) {
              const val = parseFloat(pctMatch[1]);
              if (val >= 0 && val <= 100) {
                if (mode === "video") {
                  latestProgress = phase1Done ? 45 + val * 0.45 : val * 0.45;
                } else {
                  latestProgress = val;
                }
              }
            }

            // Parse total size for rolling ETA
            if (sizeMatch && totalBytesEstimate === 0) {
              const num = parseFloat(sizeMatch[1]);
              const unit = sizeMatch[2].toUpperCase();
              if (unit.startsWith("G")) totalBytesEstimate = num * 1024 * 1024 * 1024;
              else if (unit.startsWith("M")) totalBytesEstimate = num * 1024 * 1024;
              else if (unit.startsWith("K")) totalBytesEstimate = num * 1024;
              if (segmentStartTime === 0) segmentStartTime = Date.now();
            }

            // Rolling ETA: compute from pct + elapsed time
            if (pctMatch && totalBytesEstimate > 0 && segmentStartTime > 0) {
              const pct = parseFloat(pctMatch[1]) / 100;
              const elapsed = (Date.now() - segmentStartTime) / 1000;
              if (pct > 0.05 && elapsed > 1) {
                const totalEstSec = elapsed / pct;
                const remSec = Math.max(0, Math.round(totalEstSec - elapsed));
                const mm = Math.floor(remSec / 60).toString().padStart(2, "0");
                const ss = (remSec % 60).toString().padStart(2, "0");
                currentEta = `${mm}:${ss}`;
              }
            } else if (etaMatch) {
              currentEta = etaMatch[1];
            }

            if (spdMatch) currentSpeed = spdMatch[1];
            if (sizeMatch) currentSize = `${sizeMatch[1]}${sizeMatch[2]}`;

            if (!localErrorTriggered) {
              currentStatus = `Downloading ${currentDownloadType}...|${currentSpeed}|${currentEta}|${currentSize}`;
            }
            shouldUpdate = true;
          } else if (
            cleanLine.includes("[Merger]") ||
            cleanLine.includes("Merging formats")
          ) {
            isMerging = true;
            const mergeMatch = cleanLine.match(/into\s+["']?(.+?)["']?$/i) || cleanLine.match(/Destination:\s*(.+)/);
            let mergeDest = "";
            if (mergeMatch) {
              const fname = mergeMatch[1].trim();
              const lastSlash = Math.max(fname.lastIndexOf("/"), fname.lastIndexOf("\\"));
              mergeDest = lastSlash !== -1 ? fname.substring(lastSlash + 1) : fname;
            }
            currentStatus = mergeDest ? `Merging: ${mergeDest}...|⚡|--|--|merging` : "Merging Video & Audio...|⚡|--|--|merging";
            latestProgress = 90;
            shouldUpdate = true;
          } else if (isMerging && (cleanLine.toLowerCase().includes("progress:") || cleanLine.toLowerCase().includes("muxing:"))) {
            const progMatch = cleanLine.match(/(?:progress|muxing):\s*(\d+)/i);
            if (progMatch) {
              const mergeVal = parseInt(progMatch[1]);
              if (mergeVal >= 0 && mergeVal <= 100) {
                latestProgress = 90 + mergeVal * 0.1;
                currentStatus = `Merging formats (${mergeVal}%)...|⚡|--|--|merging`;
                shouldUpdate = true;
              }
            }
          } else if (cleanLine.includes("[ExtractAudio]")) {
            const destMatch = cleanLine.match(/Destination:\s*(.+)/);
            let audioDest = "";
            if (destMatch) {
              const fname = destMatch[1].trim();
              const lastSlash = Math.max(fname.lastIndexOf("/"), fname.lastIndexOf("\\"));
              audioDest = lastSlash !== -1 ? fname.substring(lastSlash + 1) : fname;
            }
            currentStatus = audioDest ? `Extracting Audio: ${audioDest}...|||` : "Extracting High-Quality Audio...|||";
            latestProgress = 100;
            shouldUpdate = true;
          } else if (
            cleanLine.includes("[VideoConvertor]") ||
            cleanLine.includes("tonemap")
          ) {
            currentStatus = "Applying HDR to SDR Conversion...|||";
            latestProgress = 100;
            shouldUpdate = true;
          } else if (cleanLine.includes("[Metadata]")) {
            currentStatus = "Finalizing File...|||";
            latestProgress = 100;
            shouldUpdate = true;
          }
        }

        const now = Date.now();
        if (
          shouldUpdate &&
          (now - lastRenderTime > 250 ||
            latestProgress === 100 ||
            localErrorTriggered)
        ) {
          const parts = currentStatus.split("|");
          setActiveDownloads((prev) =>
            prev.map((dl) =>
              dl.id === dlId
                ? {
                    ...dl,
                    progress: latestProgress,
                    status: parts[0] || currentStatus,
                    speed: parts[1] || "",
                    eta: parts[2] || "",
                    size: parts[3] || "",
                    isError: localErrorTriggered ? true : dl.isError,
                    errorMsg: localErrorTriggered
                      ? "Dependency Missing: Ensure both executables are inside your src-tauri/bin folder."
                      : dl.errorMsg,
                  }
                : dl,
            ),
          );
          lastRenderTime = now;
        }
      };

      // ── Silent multi-rotating TV client download loop ──────────────────────
      // Stage 0: proactive best client (DRMLAB identity). On any recoverable
      // failure, quietly rotate through fallback stages — no UI messages.
      const maxStages = tvClientProfiles ? tvClientProfiles.length : 1;
      if (tempPath && createDir && exists && !(await exists(tempPath))) {
        await createDir(tempPath, { recursive: true });
      }
      let res = await runYtDlp(buildArgs(0), handleChunk, dlId);

      // Recoverable: server-side refusals that a different client identity can fix.
      // Non-recoverable errors (network timeout, missing file, etc.) bail immediately.
      const isRecoverableFailure = (r: { code: number; stderr: string }) => {
        if (r.code === 0) return false;
        const e = r.stderr.toLowerCase();
        return (
          e.includes("403") ||
          e.includes("http error 403") ||
          e.includes("bot") ||
          e.includes("sign in") ||
          e.includes("age-restricted") ||
          e.includes("not available") ||
          e.includes("requested format is not available") ||
          e.includes("this video is not available") ||
          e.includes("members only") ||
          e.includes("private video") ||
          e.includes("premium") ||
          e.includes("content not available") ||
          e.includes("geo restriction")
        );
      };

      // Rotate silently through remaining stages
      for (let stage = 1; stage < maxStages && isRecoverableFailure(res); stage++) {
        res = await runYtDlp(buildArgs(stage), handleChunk, dlId);
      }

      // Final silent fallback for unknown domains: try android_vr (DRMLAB default)
      if (isRecoverableFailure(res) && !tvClientProfiles) {
        res = await runYtDlp(
          [...buildArgs(0), "--extractor-args", "youtube:player_client=android_vr"],
          handleChunk,
          dlId
        );
      }

      // If still blocked, automatically clear cache and run the modern impersonation bypass
      if (isRecoverableFailure(res)) {
        try {
          console.log("Recoverable download error hit. Performing silent engine cache clear...");
          await runYtDlp(["--rm-cache-dir"]);
        } catch (cacheErr) {
          console.warn("Failed to clear yt-dlp cache:", cacheErr);
        }

        let bypassArgs = buildArgs(0);
        // Remove existing player_client configurations if any
        bypassArgs = bypassArgs.filter(arg => !arg.includes("player_client"));
        // Force the modern web player client and disable legacy SDKless APIs
        bypassArgs.push("--extractor-args", "youtube:player_client=default,-android_sdkless");
        // Impersonate Chrome TLS fingerprint
        if (!customUserAgent.trim()) {
          bypassArgs.push("--impersonate", "chrome");
        }
        res = await runYtDlp(bypassArgs, handleChunk, dlId);
      }

      const activeDl = activeDownloads.find((d) => d.id === dlId);
      const stdoutLower = (res.stdout || "").toLowerCase();
      const stderrLower = (res.stderr || "").toLowerCase();
      const combinedOutput = `${stdoutLower}\n${stderrLower}`;
      const dependencyFailed =
        (combinedOutput.includes("ffmpeg") || combinedOutput.includes("ffprobe")) &&
        (combinedOutput.includes("not found") ||
          combinedOutput.includes("is not recognized") ||
          combinedOutput.includes("no such file or directory") ||
          combinedOutput.includes("postprocessing:") ||
          combinedOutput.includes("does not exist") ||
          combinedOutput.includes("not installed"));

      if (
        res.code === 0 &&
        !activeDl?.isError &&
        !localErrorTriggered &&
        !dependencyFailed
      ) {
        if (tempPath && savePath && readDir && renameFile) {
          try {
            const entries = await readDir(tempPath);
            let movedMedia = false;
            const isSubtitleFile = (nameStr: string) => {
              const l = nameStr.toLowerCase();
              return l.endsWith(".vtt") || l.endsWith(".srt") || l.endsWith(".ass") || l.endsWith(".lrc");
            };
            const isThumbnailFile = (nameStr: string) => {
              const l = nameStr.toLowerCase();
              return l.endsWith(".webp") || l.endsWith(".jpg") || l.endsWith(".jpeg") || l.endsWith(".png");
            };

            for (const entry of entries) {
              const name = entry.name || "";
              const lower = name.toLowerCase();
              if (lower.endsWith(".part") || lower.endsWith(".ytdl") || lower.endsWith(".temp") || /\.f\d+\./.test(lower)) {
                continue;
              }
              if (isSubtitleFile(name) && !saveSubtitlesFile) {
                continue;
              }
              const isMedia = !isSubtitleFile(name) && !isThumbnailFile(name);

              if (isBulk) {
                let match = name.match(/^download_(\d+)_(.*?)([\.\r\n].*)$/);
                let playlistIndex = -1;
                let rawVcodec = "";
                let suffix = "";
                if (match) {
                  playlistIndex = parseInt(match[1]);
                  rawVcodec = match[2];
                  suffix = match[3];
                } else {
                  const fallbackMatch = name.match(/^download_(\d+)(.*)$/);
                  if (fallbackMatch) {
                    playlistIndex = parseInt(fallbackMatch[1]);
                    suffix = fallbackMatch[2];
                  }
                }

                if (playlistIndex !== -1 && mediaList && mediaList[playlistIndex - 1]) {
                  const item = mediaList[playlistIndex - 1];
                  const safeTitle = cleanTitle(item.title || "video", item.url);
                  let source = "WEB";
                  if (item.url.includes("youtube.com") || item.url.includes("youtu.be")) {
                    source = "YT";
                  }

                  let vcDisplay = "";
                  if (mode === "video" && rawVcodec && rawVcodec !== "none") {
                    const vc = rawVcodec.toLowerCase();
                    if (vc.includes("av01") || vc.includes("av1")) vcDisplay = ".AV1";
                    else if (vc.includes("vp09") || vc.includes("vp9")) vcDisplay = ".VP9";
                    else if (vc.includes("hvc") || vc.includes("hev") || vc.includes("h265") || vc.includes("265")) vcDisplay = ".HEVC";
                    else if (vc.includes("avc") || vc.includes("h264") || vc.includes("264")) vcDisplay = ".H264";
                    else vcDisplay = ".AVC";
                  }

                  const finalName = `${safeTitle}.${source}.WEB-DL${vcDisplay}${suffix}`;
                  await renameFile(entry.path, `${savePath}/${finalName}`);
                  if (isMedia) movedMedia = true;
                }
              } else {
                let match = name.match(new RegExp(`^download_${dlId}_(.*?)([\\.\\r\\n].*)$`));
                let rawVcodec = "";
                let suffix = "";
                if (match) {
                  rawVcodec = match[1];
                  suffix = match[2];
                } else {
                  const fallbackMatch = name.match(new RegExp(`^download_${dlId}(.*)$`));
                  if (fallbackMatch) {
                    suffix = fallbackMatch[1];
                  }
                }

                if (suffix) {
                  let finalName = "";
                  if (resolvedFinalFilename) {
                    const getExtractor = (urlStr: string) => {
                      const lowerStr = urlStr.toLowerCase();
                      if (lowerStr.includes("hotstar")) return "JHS";
                      if (lowerStr.includes("youtube") || lowerStr.includes("youtu.be")) return "YT";
                      if (lowerStr.includes("zee5")) return "ZEE5";
                      if (lowerStr.includes("sonyliv")) return "LIV";
                      return "WEB";
                    };
                    let cleanedTemplate = resolvedFinalFilename
                      .replace(/%\(title\)s/g, cleanTitle(dlTitle, finalUrl))
                      .replace(/%\(height\)sp/g, "1080p")
                      .replace(/%\(extractor_key\)s/g, getExtractor(finalUrl));
                    
                    const lastDot = cleanedTemplate.lastIndexOf(".");
                    const baseName = lastDot !== -1 ? cleanedTemplate.substring(0, lastDot) : cleanedTemplate;
                    finalName = `${baseName}${suffix}`;
                  } else {
                    let vcDisplay = "";
                    if (mode === "video" && rawVcodec && rawVcodec !== "none") {
                      const vc = rawVcodec.toLowerCase();
                      if (vc.includes("av01") || vc.includes("av1")) vcDisplay = ".AV1";
                      else if (vc.includes("vp09") || vc.includes("vp9")) vcDisplay = ".VP9";
                      else if (vc.includes("hvc") || vc.includes("hev") || vc.includes("h265") || vc.includes("265")) vcDisplay = ".HEVC";
                      else if (vc.includes("avc") || vc.includes("h264") || vc.includes("264")) vcDisplay = ".H264";
                      else vcDisplay = ".AVC";
                    }
                    finalName = mediaInfo?.title
                      ? `${cleanTitle(mediaInfo.title, finalUrl)}${vcDisplay}${suffix}`
                      : `${cleanTitle(dlTitle, finalUrl)}${vcDisplay}${suffix}`;
                  }
                  await renameFile(entry.path, `${savePath}/${finalName}`);
                  if (isMedia) movedMedia = true;
                }
              }
            }
            if (!movedMedia) {
              const filesList = entries.map((e: any) => e.name || "").join(", ");
              const errSnippet = res.stderr ? ` Stderr: ${res.stderr.slice(-10000)}` : "";
              const outSnippet = res.stdout ? ` Stdout: ${res.stdout.slice(-10000)}` : "";
              throw new Error(`No completed downloaded/merged media files found in temporary directory (only subtitles, thumbnails, or partial split files exist). Files found: [${filesList}].${errSnippet}${outSnippet}`);
            }

            // ── MKVToolNix post-remux (lossless, DRMLAB-style track metadata) ────
            // Only runs for .mkv output. Adds proper title/language tags and
            // verifies the container is clean. Skip gracefully if mkvmerge not found.
            if (mode === "video" && !isBulk && invoke) {
              try {
                const mkvPath: string = await invoke("get_mkvmerge_path");
                // Find the moved .mkv file
                const destEntries = await readDir(savePath);
                for (const de of destEntries) {
                  const dn = de.name || "";
                  if (dn.toLowerCase().endsWith(".mkv") && dn.includes(cleanTitle(dlTitle, finalUrl).slice(0, 15))) {
                    const inputMkv = `${savePath}/${dn}`;
                    const outputMkv = `${savePath}/${dn.replace(/\.mkv$/i, ".remux.mkv")}`;
                    setActiveDownloads((prev) => prev.map((dl) =>
                      dl.id === dlId ? { ...dl, status: "Remuxing (MKVToolNix)...", progress: 99 } : dl
                    ));
                    const [mkvCode, , mkvErr]: [number, string, string] = await invoke("run_mkvmerge", {
                      mkvmergePath: mkvPath,
                      args: [
                        "--output", outputMkv,
                        "--title", dlTitle,
                        inputMkv
                      ]
                    });
                    // mkvmerge exit code 0=success, 1=warning (still OK), 2=error
                    if (mkvCode <= 1) {
                      if (renameFile) {
                        try { await renameFile(outputMkv, inputMkv); } catch {}
                      }
                    } else {
                      console.warn("mkvmerge remux failed:", mkvErr);
                      // Remove failed .remux.mkv if it exists
                      try { if (exists && removeFile && await exists(outputMkv)) await removeFile(outputMkv); } catch {}
                    }
                    break;
                  }
                }
              } catch (mkvErr) {
                // mkvmerge not found or remux failed — skip silently, original file is intact
                console.warn("MKVToolNix remux skipped:", mkvErr);
              }
            }
          } catch (err) {
            console.error("Failed to rename/move merged files:", err);
            throw new Error("Failed to finalize download files: " + String(err));
          }
        }
        downloadSucceeded = true;
        finishDownload(dlId, dlTitle, mode, isBulk);
      } else {
        const baseError =
          res.stderr || "Download failed. Check URL and try again.";
        const enrichedError = dependencyFailed
          ? `${baseError}\n\nTip: Ensure both executables are installed and available.`
          : baseError;
        throw new Error(enrichedError);
      }
    } catch (e: any) {
      const errStr =
        typeof e === "string"
          ? e
          : e?.message || JSON.stringify(e) || "Unknown error";
      setActiveDownloads((prev) =>
        prev.map((dl) =>
          dl.id === dlId
            ? {
                ...dl,
                isError: true,
                errorMsg: parseEngineError(errStr),
                status: "Failed",
              }
            : dl,
        ),
      );
    } finally {
      if (!downloadSucceeded) {
        for (const filePath of createdFilesList) {
          try {
            if (exists && removeFile && await exists(filePath)) {
              await removeFile(filePath);
            }
          } catch (err) {
            console.warn("Cleanup failed for file:", filePath, err);
          }
        }
      }
      if (tempPath && removeDir) {
        try {
          await removeDir(tempPath, { recursive: true });
        } catch (err) {
          // Ignore cleanup errors if the directory was already cleared natively
        }
      }
    }
  };

  const finishDownload = (
    id: string,
    title: string,
    mode: string,
    isBulk: boolean,
  ) => {
    setActiveDownloads((prev) =>
      prev.map((dl) =>
        dl.id === id
          ? { ...dl, isSuccess: true, progress: 100, status: "Complete" }
          : dl,
      ),
    );
    setHistory((prev) => [
      {
        id: id,
        title: String(title),
        date: new Date().toLocaleString(),
        type: String(mode).toUpperCase(),
        format:
          mode === "video"
            ? String(container).toUpperCase()
            : String(audioOnlyFormat).toUpperCase(),
        url: String(url),
      },
      ...prev,
    ]);
    setTimeout(() => {
      setActiveDownloads((prev) => prev.filter((dl) => dl.id !== id));
    }, 5000);
  };

  const toggleOption = (key: keyof typeof options) =>
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));

  const currentTheme = THEMES[theme] || THEMES.dark;

  return (
    <div
      className="min-h-screen w-full font-sans overflow-y-auto text-[12px] md:text-[13px]"
      style={
        {
          "--bg": currentTheme.bg,
          "--surface": currentTheme.surface,
          "--border": currentTheme.border,
          "--text": currentTheme.text,
          "--text-muted": currentTheme.textMuted,
          "--accent": currentTheme.accent,
          "--accent-hover": currentTheme.accentHover,
          "--card-bg": currentTheme.cardBg,
          "--dropdown-bg": currentTheme.dropdownBg,
          backgroundColor: "var(--bg)",
          color: "var(--text)",
        } as React.CSSProperties
      }
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        html, body {
          scrollbar-gutter: stable;
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; } 
        ::-webkit-scrollbar-track { background: transparent; } 
        ::-webkit-scrollbar-thumb { background: rgba(120, 120, 120, 0.3); border-radius: 10px; } 
        ::-webkit-scrollbar-thumb:hover { background: rgba(120, 120, 120, 0.6); }
        ::view-transition-old(root), ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }
        ::view-transition-old(root) { z-index: 1; }
        ::view-transition-new(root) { z-index: 9999; }
      `,
        }}
      />

      <div className="fixed inset-[0px] pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[var(--accent)] opacity-[0.05] blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[var(--accent)] opacity-[0.03] blur-[150px] mix-blend-screen" />
        {theme === "dark" && (
          <div className="absolute top-[30%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-blue-500 opacity-[0.03] blur-[100px] mix-blend-screen" />
        )}
      </div>

      {showThumbModal && mediaInfo && (
        <div
          className="fixed inset-[0px] z-[999999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-[16px] animate-in fade-in duration-200"
          onClick={() => setShowThumbModal(false)}
        >
          <div className="relative max-w-[768px] w-full flex flex-col items-center">
            <button
              className="absolute top-[-48px] right-[0px] text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-[10px] rounded-[8px] transition-all duration-200"
              onClick={() => setShowThumbModal(false)}
            >
              <X className="h-[24px] w-[24px]" />
            </button>
            <div className="w-full aspect-video bg-black rounded-[12px] shadow-2xl border border-white/10 overflow-hidden relative flex items-center justify-center">
              <Film className="absolute h-[64px] w-[64px] text-white/10 pointer-events-none" />
              <img
                src={String(mediaInfo.thumbnail)}
                alt="Thumbnail"
                referrerPolicy="no-referrer"
                className="absolute inset-[0px] w-full h-full object-contain"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  e.currentTarget.style.opacity = "0";
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[768px] mx-auto px-[20px] py-[20px] relative z-10 pb-[48px] flex flex-col min-h-screen">
        <div className="text-center mb-[28px] pt-[32px] flex flex-col items-center" data-tauri-drag-region>
          <div className="relative inline-block">
            <h1 
              className="text-[24px] md:text-[32px] font-extrabold tracking-tight mb-[6px] text-[var(--text)] cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.location.reload()}
              title="Reload Application"
            >
              4444 <span className="text-[var(--accent)]">Downloader</span>
            </h1>
            <AnimatePresence>
              {activeDownloads.length > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute top-[-12px] right-[-24px] flex h-[24px] w-[24px] pointer-events-none"
                >
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-[24px] w-[24px] bg-[var(--accent)] text-white text-[10px] items-center justify-center font-bold shadow-lg">
                    {
                      activeDownloads.filter(
                        (dl) => !dl.isSuccess && !dl.isError,
                      ).length
                    }
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="text-[var(--text-muted)] text-[12px] mb-[12px] font-medium pointer-events-none">
            Chakkaga aadu, RunOut Avvaku
          </p>
          <button
            className="mx-auto mb-[20px] inline-flex items-center gap-[6px] rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-[10px] py-[2px] text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--text)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
            onClick={() => {
              const tauriShell = (window as any).__TAURI__?.shell;
              const url = "https://bhargaveditz.live";
              if (tauriShell?.open) {
                tauriShell.open(url);
              } else {
                window.open(url, "_blank");
              }
            }}
          >
            <Earth className="h-[12px] w-[12px]"/>
            <span>Crafted by Bhargaveditz</span>
          </button>

          <div className="flex flex-wrap justify-center gap-x-[24px] gap-y-[12px] text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-widest relative z-50">
            <span
              onClick={() => setView("home")}
              className={`cursor-pointer transition-colors flex items-center gap-[6px] ${view === "home" ? "text-[var(--text)]" : "hover:text-[var(--text)]"}`}
            >
              <Home className="h-[14px] w-[14px]" /> Home
            </span>
            <span
              onClick={() => setView("stats")}
              className={`cursor-pointer transition-colors flex items-center gap-[6px] ${view === "stats" ? "text-[var(--text)]" : "hover:text-[var(--text)]"}`}
            >
              <BarChart3 className="h-[14px] w-[14px]" /> Stats
            </span>
            <span
              onClick={() => setView("history")}
              className={`cursor-pointer transition-colors flex items-center gap-[6px] ${view === "history" ? "text-[var(--text)]" : "hover:text-[var(--text)]"}`}
            >
              <History className="h-[14px] w-[14px]" /> History
            </span>
            <span
              onClick={() => setView("help")}
              className={`cursor-pointer transition-colors flex items-center gap-[6px] ${view === "help" ? "text-[var(--text)]" : "hover:text-[var(--text)]"}`}
            >
              <BookOpen className="h-[14px] w-[14px]" /> Manual
            </span>
            <span
              onClick={() => setView("updates")}
              className={`cursor-pointer transition-colors flex items-center gap-[6px] relative ${view === "updates" ? "text-[var(--text)]" : "hover:text-[var(--text)]"}`}
            >
              <Cpu className="h-[14px] w-[14px]" /> Updates
              {engineVersion.includes("Restart") && (
                <div className="absolute -top-1 -right-2 h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
              )}
            </span>
            <span className="w-[1px] h-[16px] bg-[var(--border)] hidden sm:block pointer-events-none"></span>
            <span
              onClick={handleThemeToggle}
              className="cursor-pointer hover:text-[var(--text)] flex items-center gap-[6px]"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-[14px] w-[14px]" /> Light
                </>
              ) : (
                <>
                  <Moon className="h-[14px] w-[14px]" /> Dark
                </>
              )}
            </span>
          </div>
        </div>

        <AnimatePresence>
          {globalError && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mb-[20px] rounded-2xl border border-red-500/25 bg-red-950/15 backdrop-blur-md p-[16px] md:p-[20px] shadow-[0_12px_30px_rgba(239,68,68,0.08)] relative overflow-hidden flex flex-col gap-[14px]"
            >
              <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] rounded-full bg-red-500/10 blur-[80px] pointer-events-none" />

              <div className="flex items-start justify-between gap-[12px] relative z-10">
                <div className="flex gap-[12px] items-start">
                  <div className="bg-red-500/10 p-[8px] rounded-[10px] border border-red-500/20">
                    <AlertTriangle className="h-[20px] w-[20px] text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-red-200">
                      {globalError.title}
                    </h4>
                    <p className="text-[12px] text-red-300/80 leading-relaxed mt-[4px]">
                      {globalError.message}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setGlobalError(null)}
                  className="text-red-400/40 hover:text-red-400 hover:bg-white/5 p-[6px] rounded-[8px] transition-all"
                >
                  <X className="h-[14px] w-[14px]" />
                </button>
              </div>

              {globalError.resolution && globalError.resolution.length > 0 && (
                <div className="bg-red-950/30 rounded-[12px] border border-red-500/10 p-[12px] text-[11px] leading-relaxed text-red-300/70 relative z-10 space-y-[6px]">
                  <div className="font-semibold text-red-400 uppercase tracking-wider text-[9px]">
                    Actionable Resolution Steps:
                  </div>
                  <ul className="list-disc pl-[14px] space-y-[4px]">
                    {globalError.resolution.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              <ErrorRawLog raw={globalError.raw} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 w-full relative">
          <AnimatePresence mode="wait">
            {view === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{
                  opacity: 0,
                  scale: 0.98,
                  filter: "blur(10px)",
                  transition: { duration: 0.2 },
                }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full relative min-h-[calc(100vh-140px)]"
              >
                <div className="mb-[20px] relative z-[100] w-full">
                  <Accordion
                    title="Authentication & Proxy Settings"
                    icon={Shield}
                    isActive={hasCookie || Boolean(customProxy)}
                  >
                    <div className="py-[8px] space-y-[20px]">
                      <div>
                        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed mb-[12px]">
                          To download restricted or premium content, upload and select a valid cookies file (.txt):
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px] relative z-[100]">
                          <div>
                            <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-[6px] block">
                              Active Profile
                            </label>
                            <CustomSelect
                              value={selectedCookieName}
                              onChange={setSelectedCookieName}
                              options={[
                                { label: "None (Public Access)", value: "none" },
                                ...savedCookies.map((c: any) => ({
                                  ...c,
                                  meta: cookiesMeta[c.value],
                                })),
                              ]}
                              onDeleteOption={handleDeleteCookie}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-[6px] block">
                              Upload New Profile
                            </label>
                            <div className="relative">
                              <input
                                type="file"
                                accept=".txt"
                                onChange={handleFileUpload}
                                className="absolute inset-[0px] w-full h-full opacity-0 cursor-pointer z-[10]"
                                title="Upload Cookie"
                              />
                              <Button
                                variant="secondary"
                                className="w-full h-[38px] relative z-[0] pointer-events-none"
                              >
                                <FileText className="h-[14px] w-[14px] mr-[8px]" /> Select Cookie file
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[var(--border)] pt-[16px]">
                        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed mb-[12px]">
                          Specify a custom network proxy address to bypass geo-restrictions or IP-based limits:
                        </p>
                        <div>
                          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-[6px] block">
                            Network Proxy Address
                          </label>
                          <Input
                            value={customProxy}
                            onChange={(e) => setCustomProxy(e.target.value)}
                            placeholder="e.g. http://127.0.0.1:8080 or socks5://127.0.0.1:1080"
                          />
                        </div>
                      </div>
                    </div>
                  </Accordion>
                </div>

                <div className="mb-[28px] relative z-[90] w-full">
                  {hasCookie && (() => {
                    const theme = getServiceTheme();
                    return (
                      <div className="flex items-center justify-start mb-[12px] ml-[2px] animate-in fade-in slide-in-from-bottom-2">
                        <span
                          className="inline-flex items-center rounded-full"
                          style={{
                            background: theme.bg,
                            border: `1px solid ${theme.border}`,
                            boxShadow: `0 1px 8px ${theme.border}`,
                            padding: "4px 10px 4px 8px",
                            gap: "0",
                          }}
                        >
                          {/* Live dot */}
                          <span className="relative flex shrink-0 mr-[7px]" style={{ width: 7, height: 7 }}>
                            <span
                              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70"
                              style={{ background: theme.dotPing }}
                            />
                            <span
                              className="relative inline-flex rounded-full"
                              style={{ width: 7, height: 7, background: theme.dot }}
                            />
                          </span>

                          {/* Shield icon */}
                          <Shield
                            className="shrink-0 mr-[5px]"
                            style={{ width: 11, height: 11, color: theme.icon }}
                          />

                          {/* "AUTH ACTIVE" label */}
                          <span
                            className="text-[9.5px] font-extrabold tracking-[0.12em] uppercase shrink-0"
                            style={{
                              background: theme.label,
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                            }}
                          >
                            Auth Active
                          </span>

                          {/* Divider */}
                          <span
                            className="shrink-0 mx-[8px]"
                            style={{
                              width: 1,
                              height: 12,
                              background: theme.border,
                              display: "inline-block",
                              borderRadius: 1,
                            }}
                          />

                          {/* Profile name */}
                          <span
                            className="text-[10.5px] font-semibold tracking-wide truncate"
                            style={{ maxWidth: 130, color: theme.name, letterSpacing: "0.03em" }}
                          >
                            {getActiveAuthDisplay()}
                          </span>

                          {/* Dismiss */}
                          <button
                            onClick={() => setSelectedCookieName("none")}
                            className="shrink-0 ml-[8px] rounded-full p-[2px] transition-all cursor-pointer hover:scale-110"
                            style={{
                              color: theme.dismiss,
                              background: "transparent",
                              lineHeight: 0,
                            }}
                            title="Clear Auth"
                          >
                            <X style={{ width: 9, height: 9 }} />
                          </button>
                        </span>
                      </div>
                    );
                  })()}


                  <div className={`relative flex flex-col md:flex-row gap-[12px] z-[90] w-full`}>
                    <div className="relative flex-1">
                      <Input
                        id="search-input"
                        autoComplete="off"
                        value={url.replace(/^ytsearch\d+:/, "")}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleFetchInfo(undefined, false)
                        }
                        placeholder="Paste URL, Playlist, or Search Keywords..."
                        className="pl-[44px] h-[50px] shadow-sm text-[14px] rounded-2xl"
                      />
                      <Search className="absolute left-[16px] top-[15px] h-[20px] w-[20px] text-[var(--text-muted)]" />
                    </div>
                    <Button
                      onClick={() => handleFetchInfo(undefined, false)}
                      disabled={!url}
                      className="md:w-[130px] h-[50px] shadow-sm text-[14px] rounded-2xl font-semibold"
                    >
                      {isFetching ? (
                        <div className="flex items-center gap-[8px] animate-pulse">
                          <Loader2 className="animate-spin h-[20px] w-[20px] text-white" />
                        </div>
                      ) : (
                        "Search"
                      )}
                    </Button>
                  </div>

                  <AnimatePresence>
                    {searchHint && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="mt-[12px] mx-auto md:mx-[0px] flex items-center gap-[8px] px-[14px] py-[4px] rounded-full border border-[var(--border)] bg-[var(--surface)]/50 text-[12px] font-medium text-[var(--text)] w-fit shadow-sm"
                      >
                        {searchHint.includes("Target") ? (
                          <Link2 className="h-[12px] w-[12px] text-[var(--text-muted)]" />
                        ) : (
                          <Search className="h-[12px] w-[12px] text-[var(--text-muted)]" />
                        )}
                        <span className="truncate max-w-[280px] md:max-w-md">
                          {String(searchHint)}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isFetching && (mediaInfo || mediaList) && (
                    <div className="w-full h-[3px] bg-[var(--border)] overflow-hidden rounded-full mt-[16px] relative z-[100]">
                      <div className="h-full bg-[var(--accent)] animate-loading-bar rounded-full" style={{ width: "30%" }}></div>
                    </div>
                  )}
                </div>

                {isFetching && !mediaInfo && !mediaList && (
                  <div className="flex flex-col items-center justify-center py-[80px] animate-in fade-in duration-300">
                    <Loader2 className="h-[40px] w-[40px] text-[var(--accent)] animate-spin mb-[16px]" />
                    <p className="text-[14px] font-semibold text-[var(--text)]">Analyzing & Resolving Media...</p>
                    <p className="text-[12px] text-[var(--text-muted)] mt-[4px] mb-[16px]">Fetching formats and metadata streams</p>
                    <Button
                      variant="ghost"
                      onClick={cancelMetadataFetch}
                      className="h-[32px] text-[12px] bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--border)] hover:text-red-500 transition-colors rounded-xl px-[16px] font-medium"
                    >
                      Cancel Search
                    </Button>
                  </div>
                )}

                {!mediaInfo &&
                  !mediaList &&
                  !isFetching &&
                  !globalError &&
                  activeDownloads.length === 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] opacity-70 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-[40px] pointer-events-none">
                      <div className="p-[10px] text-center">
                        <div className="flex justify-center items-center gap-[8px] font-medium text-[14px] mb-[4px] text-[var(--text)]">
                          <Activity className="text-[var(--accent)] h-[16px] w-[16px]" />{" "}
                          High Quality
                        </div>
                        <p className="text-[12px] text-[var(--text-muted)]">
                          Lossless 4K & FLAC Audio Options
                        </p>
                      </div>
                      <div className="p-[10px] text-center">
                        <div className="flex justify-center items-center gap-[8px] font-medium text-[14px] mb-[4px] text-[var(--text)]">
                          <Zap className="text-blue-500 h-[16px] w-[16px]" /> Pro Tools
                        </div>
                        <p className="text-[12px] text-[var(--text-muted)]">
                          Trim, SponsorBlock & HDR Map
                        </p>
                      </div>
                      <div className="p-[10px] text-center">
                        <div className="flex justify-center items-center gap-[8px] font-medium text-[14px] mb-[4px] text-[var(--text)]">
                          <Globe className="text-purple-500 h-[16px] w-[16px]" />{" "}
                          Universal
                        </div>
                        <p className="text-[12px] text-[var(--text-muted)]">
                          1000+ Platforms & DRM Support
                        </p>
                      </div>
                    </div>
                  )}

                <AnimatePresence>
                  {activeDownloads.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="relative z-[70] mb-[24px] overflow-hidden w-full"
                    >
                      <Card className="p-[0px] border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-visible">
                        <div className="flex items-center justify-between px-[20px] py-[12px] border-b border-[var(--border)] bg-black/10 relative z-20">
                          <span className="flex items-center gap-[8px] text-[13px] font-bold uppercase tracking-widest text-[var(--accent)]">
                            <Activity className="h-[16px] w-[16px] text-[var(--accent)] animate-pulse" />
                            Download Queue
                          </span>
                          <span className="text-[12px] font-medium text-[var(--text-muted)]">
                            {
                              activeDownloads.filter(
                                (dl) => !dl.isSuccess && !dl.isError,
                              ).length
                            }{" "}
                            active
                          </span>
                        </div>
                        <div className="divide-y divide-[var(--border)] max-h-[350px] overflow-y-auto custom-scrollbar">
                          <AnimatePresence initial={false}>
                            {activeDownloads.map((dl) => {
                              const isProcessing = dl.progress === 100 && !dl.isSuccess && !dl.isError;
                              return (
                              <motion.div
                                key={dl.id}
                                initial={{
                                  opacity: 0,
                                  backgroundColor: "rgba(0,0,0,0)",
                                }}
                                animate={{
                                  opacity: 1,
                                  backgroundColor: "rgba(0,0,0,0)",
                                }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="p-[14px]"
                              >
                                <div className="flex items-center justify-between gap-[16px] mb-[6px]">
                                  <div className="flex items-center gap-[10px] min-w-0 flex-1">
                                    {dl.isSuccess ? (
                                      <CheckCircle2 className="h-[20px] w-[20px] text-green-500 shrink-0" />
                                    ) : dl.isError ? (
                                      <AlertTriangle className="h-[20px] w-[20px] text-red-500 shrink-0" />
                                    ) : (
                                      <Loader2 className="h-[20px] w-[20px] text-[var(--accent)] shrink-0 animate-spin" />
                                    )}
                                    <h4 className="font-semibold text-[13px] text-[var(--text)] truncate">
                                      {String(dl.title)}
                                    </h4>
                                  </div>
                                  <div className="flex items-center gap-[10px] shrink-0">
                                    {!dl.isSuccess && !dl.isError && (
                                      <span className="text-[13px] font-bold tabular-nums text-[var(--accent)] w-[50px] text-right tracking-tighter">
                                        {Math.round(Number(dl.progress))}%
                                      </span>
                                    )}
                                    <button
                                      onClick={async () => {
                                        if (!dl.isSuccess && !dl.isError) {
                                          try {
                                            await invoke("kill_engine", { downloadId: dl.id });
                                            const tempDir = (savePath && join) ? await join(savePath, `4444_temp_${dl.id}`) : undefined;
                                            if (tempDir && removeDir) {
                                              try {
                                                if (exists && await exists(tempDir)) {
                                                  await removeDir(tempDir, { recursive: true });
                                                }
                                              } catch (err) {
                                                console.warn("Cleanup of temp directory failed during cancellation:", tempDir, err);
                                              }
                                            }
                                          } catch (err) {
                                            console.warn("Failed to kill engine:", err);
                                          }
                                          if (dl.createdFiles && dl.createdFiles.length > 0) {
                                            for (const filePath of dl.createdFiles) {
                                              try {
                                                if (exists && removeFile && await exists(filePath)) {
                                                  await removeFile(filePath);
                                                }
                                              } catch (err) {
                                                console.warn("Cleanup failed during cancellation:", filePath, err);
                                              }
                                            }
                                          }
                                        }
                                        setActiveDownloads((prev) =>
                                          prev.filter((d) => d.id !== dl.id),
                                        );
                                      }}
                                      className="text-[var(--text-muted)] hover:text-red-400 transition-colors p-[4px]"
                                    >
                                      <X className="h-[14px] w-[14px]" />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex flex-col pl-[30px]">
                                  {dl.isError ? (
                                    <p className="text-[12px] text-red-400 font-normal whitespace-pre-wrap leading-relaxed">
                                      {String(dl.errorMsg)}
                                    </p>
                                  ) : dl.isSuccess ? (
                                    <p className="text-[12px] text-green-400 font-medium">
                                      Saved to {String(truncatePath(savePath))}
                                    </p>
                                  ) : (
                                    <>
                                      <div className="w-full bg-black/30 rounded-full h-[6px] mb-[6px] overflow-hidden shadow-inner flex border border-white/5 relative">
                                        <motion.div
                                          className={cn("h-full bg-[var(--accent)] rounded-full", isProcessing && "animate-pulse opacity-80")}
                                          animate={{
                                            width: `${Math.max(2, Number(dl.progress))}%`,
                                          }}
                                          transition={{
                                            duration: 0.35,
                                            ease: "easeOut",
                                          }}
                                        />
                                      </div>
                                      <div className="flex justify-between items-center text-[10px] font-mono font-normal tracking-tight text-[var(--text-muted)] pt-[2px]">
                                        <span className="truncate pr-[16px] flex-1">
                                          {String(dl.status).replace(
                                            "|||",
                                            "",
                                          ) || "Processing..."}
                                        </span>
                                        <div className="flex items-center gap-[16px] shrink-0">
                                          <span className="flex items-center gap-[6px] shrink-0">
                                            <Activity className="h-[12px] w-[12px] text-blue-400 shrink-0" />
                                            <span className="tabular-nums">{dl.speed && dl.speed !== "N/A" ? String(dl.speed) : "--"}</span>
                                          </span>
                                          <span className="flex items-center gap-[6px] shrink-0">
                                            <Clock className="h-[12px] w-[12px] text-yellow-500 shrink-0" />
                                            <span className="tabular-nums">{dl.eta && dl.eta !== "N/A" ? String(dl.eta) : "--"}</span>
                                          </span>
                                          <span className="flex items-center gap-[6px] shrink-0">
                                            <HardDrive className="h-[12px] w-[12px] text-purple-400 shrink-0" />
                                            <span className="tabular-nums">
                                              {dl.size && dl.size !== "N/A" && dl.size !== "Unknown" ? String(dl.size) : "--"}
                                            </span>
                                          </span>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </motion.div>
                            )})}
                          </AnimatePresence>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                {mediaList && !mediaInfo && !globalError && (
                  <div className="animate-in fade-in duration-300 relative z-20 w-full">
                    <Card className="p-[12px] mb-[16px] flex flex-col gap-[12px] sticky top-[0px] z-[60] shadow-md backdrop-blur-xl bg-[var(--card-bg)]/95 border border-[var(--border-color)]/50 rounded-[12px]">
                      {/* Row 1: Series Navigation & Bulk Selection */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-[10px] w-full pb-[8px] border-b border-[var(--border-color)]/30">
                        <div className="flex items-center gap-[10px]">
                          <Button
                            variant={isSelectMode ? "default" : "secondary"}
                            size="sm"
                            onClick={() => {
                              setIsSelectMode(!isSelectMode);
                              setSelectedIndices([]);
                            }}
                            className="h-[34px] px-[12px] text-[12px]"
                          >
                            <MousePointer2 className="h-[13px] w-[13px] mr-[6px]" />
                            {isSelectMode ? "Cancel Select" : "Bulk Select"}
                          </Button>
                          {isSelectMode && (
                            <span className="text-[11px] font-semibold text-[var(--accent)] bg-[var(--accent)]/10 px-[8px] py-[3px] rounded-[6px] border border-[var(--accent)]/20">
                              {Number(selectedIndices.length)} Selected
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-[10px] w-full sm:w-auto">
                          {uniqueSeasons.length > 0 && (
                            <CustomSelect
                              value={selectedSeason}
                              onChange={(val: string) => {
                                setSelectedSeason(val);
                                setSelectedIndices([]);
                                setSelectedEpisodeUrl("All");
                              }}
                              options={[
                                { label: "All Seasons", value: "All" },
                                ...uniqueSeasons.map(s => ({ label: `Season ${s}`, value: s }))
                              ]}
                              className="min-w-[120px] w-full sm:w-auto shrink-0"
                              placeholder="Season"
                            />
                          )}
                          {mediaList && mediaList.length > 0 && (
                            <CustomSelect
                              value={selectedEpisodeUrl}
                              onChange={(val: string) => {
                                setSelectedEpisodeUrl(val);
                                if (val !== "All") {
                                  handleFetchInfo(val, true);
                                }
                              }}
                              options={[
                                { label: "Select Episode (Direct)", value: "All" },
                                ...displayedMediaList.map(item => ({
                                  label: `${item.episode ? `Ep ${item.episode}` : `Ep ${item.playlistIndex}`}: ${item.title.length > 25 ? `${item.title.substring(0, 25)}...` : item.title}`,
                                  value: item.url
                                }))
                              ]}
                              className="max-w-[220px] min-w-[160px] w-full sm:w-auto shrink-0"
                              placeholder="Episode"
                            />
                          )}
                        </div>
                      </div>

                      {/* Row 2: Format & Download Actions */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-[10px] w-full">
                        <div className="flex items-center gap-[8px] w-full sm:w-auto">
                          <CustomSelect
                            value={activeTab}
                            onChange={setActiveTab}
                            options={[
                              { label: "Video Mode", value: "video" },
                              { label: "Audio Only", value: "audio" },
                            ]}
                            className="min-w-[110px] w-full sm:w-auto shrink-0"
                          />
                          <CustomSelect
                            value={
                              activeTab === "video" ? resolution : audioOnlyFormat
                            }
                            onChange={
                              activeTab === "video"
                                ? setResolution
                                : setAudioOnlyFormat
                            }
                            options={
                              activeTab === "video"
                                ? [
                                    { label: "Best Quality", value: "best" },
                                    { label: "1080p FHD", value: "1920x1080" },
                                    { label: "720p HD", value: "1280x720" },
                                  ]
                                : [
                                    { label: "MP3 Audio", value: "mp3" },
                                    { label: "FLAC Lossless", value: "flac" },
                                  ]
                            }
                            className="min-w-[130px] w-full sm:w-auto shrink-0"
                          />
                        </div>

                        <Button
                          onClick={() =>
                            handleDownload(activeTab as "video" | "audio", true)
                          }
                          disabled={
                            !savePath ||
                            (isSelectMode && selectedIndices.length === 0) ||
                            isDownloading
                          }
                          className="h-[36px] px-[20px] w-full sm:w-auto flex-shrink-0 whitespace-nowrap text-[12px] font-semibold"
                        >
                          <DownloadIcon className="h-[14px] w-[14px] mr-[6px] shrink-0" />
                          <span className="whitespace-nowrap">
                            {isSelectMode && selectedIndices.length > 0
                              ? `Download Selected (${Number(selectedIndices.length)})`
                              : "Download All Season Episodes"}
                          </span>
                        </Button>
                      </div>
                    </Card>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[16px] pb-[16px]">
                      {paginatedMediaList.map((item) => {
                        const idx = item.originalIndex;
                        return (
                          <Card
                            key={idx}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                              duration: 0.2,
                              delay: Math.min(idx * 0.02, 0.3),
                              ease: "easeOut",
                            }}
                            className={`p-[10px] transition-all cursor-pointer group flex flex-col h-full overflow-hidden ${selectedIndices.includes(idx) ? "border-[var(--accent)] bg-[var(--accent)]/5 ring-[1px] ring-[var(--accent)]" : "hover:border-[var(--text-muted)] border border-[var(--border)]"}`}
                            onClick={() => {
                              if (isSelectMode)
                                setSelectedIndices((prev) =>
                                  prev.includes(idx)
                                    ? prev.filter((i) => i !== idx)
                                    : [...prev, idx],
                                );
                              else handleFetchInfo(item.url, true);
                            }}
                          >
                            <div className="relative w-full aspect-video bg-[var(--surface)] shrink-0 overflow-hidden rounded-[12px] mb-[10px] flex items-center justify-center z-[0]" style={{ transform: "translateZ(0)" }}>
                              <div className="absolute inset-[0px] rounded-[12px] border border-[var(--border)] pointer-events-none z-[20]"></div>
                              
                              <Film className="absolute h-[32px] w-[32px] text-[var(--border)] opacity-50 z-[5]" />
                              <img
                                src={String(item.thumbnail)}
                                alt="Thumb"
                                referrerPolicy="no-referrer"
                                className="absolute inset-[0px] w-full h-full object-cover transition-transform duration-[250ms] ease-out group-hover:scale-[1.08] opacity-90 group-hover:opacity-60 z-[10]"
                                onError={(e) => {
                                  e.currentTarget.style.opacity = "0";
                                }}
                              />
                              {fetchingUrl === item.url && (
                                <div className="absolute inset-[0px] bg-black/75 backdrop-blur-[2px] flex flex-col items-center justify-center z-[30] rounded-[12px]">
                                  <Loader2 className="h-[24px] w-[24px] text-[var(--accent)] animate-spin mb-[6px]" />
                                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Loading...</span>
                                </div>
                              )}
                              {!isSelectMode && (
                                <div className="absolute inset-[0px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[15]">
                                  <div className="bg-[var(--accent)] p-[10px] rounded-full text-white shadow-xl">
                                    <PlayCircle className="h-[20px] w-[20px]" />
                                  </div>
                                </div>
                              )}
                              {isSelectMode && (
                                <div className="absolute top-[8px] left-[8px] z-[15]">
                                  <div
                                    className={`h-[24px] w-[24px] rounded-full border-[2px] flex items-center justify-center transition-colors ${selectedIndices.includes(idx) ? "bg-[var(--accent)] border-[var(--accent)]" : "bg-black/60 border-white/50 backdrop-blur-md"}`}
                                  >
                                    {selectedIndices.includes(idx) && (
                                      <CheckCircle2 className="h-[14px] w-[14px] text-white" />
                                    )}
                                  </div>
                                </div>
                              )}
                              <div className="absolute bottom-[6px] right-[6px] bg-black/80 backdrop-blur-md px-[6px] py-[2px] rounded-[4px] text-[10px] font-mono font-medium text-white shadow-sm pointer-events-none z-[15] border border-white/10">
                                {String(item.duration)}
                              </div>
                            </div>
                            <h4 className="text-[12px] font-semibold text-[var(--text)] leading-snug line-clamp-2 mb-[4px] flex-1 group-hover:text-[var(--accent)] transition-colors duration-200">
                              {String(item.title)}
                            </h4>
                            {item.episode && (
                              <div className="text-[9px] font-bold tracking-wide text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/10 px-[6px] py-[2px] rounded-[4px] w-fit mb-[8px] uppercase select-none">
                                {item.season ? `${item.season} • ` : ""}{item.episode}
                              </div>
                            )}
                            <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] font-medium mt-auto border-t border-[var(--border)] pt-[8px]">
                              <span className="truncate pr-[8px]">
                                {String(item.uploader)}
                              </span>
                              {item.views && item.views !== "0" && (
                                <span className="shrink-0 bg-[var(--surface)] px-[6px] py-[2px] rounded-[4px] border border-[var(--border)]">
                                  {String(formatCount(item.views))} views
                                </span>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex justify-between items-center bg-[var(--surface)] border border-[var(--border)] rounded-[12px] p-[10px] mb-[32px] select-none">
                        <Button
                          variant="ghost"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className="h-[32px] w-[32px] p-0 flex items-center justify-center border border-[var(--border)] rounded-[8px]"
                        >
                          <ChevronLeft className="h-[16px] w-[16px]" />
                        </Button>
                        
                        <div className="flex items-center gap-[6px]">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                            const shouldShow =
                              totalPages <= 6 ||
                              p === 1 ||
                              p === totalPages ||
                              Math.abs(p - currentPage) <= 1;

                            if (!shouldShow) {
                              if (p === 2 && currentPage > 3) {
                                return <span key={p} className="text-[12px] text-[var(--text-muted)] px-[4px]">...</span>;
                              }
                              if (p === totalPages - 1 && currentPage < totalPages - 2) {
                                return <span key={p} className="text-[12px] text-[var(--text-muted)] px-[4px]">...</span>;
                              }
                              return null;
                            }

                            return (
                              <Button
                                key={p}
                                variant={currentPage === p ? "default" : "ghost"}
                                onClick={() => setCurrentPage(p)}
                                className={`h-[28px] min-w-[28px] px-[8px] text-[11px] font-semibold rounded-[6px] transition-all ${currentPage === p ? "bg-[var(--accent)] text-white shadow-sm" : "hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"}`}
                              >
                                {p}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          variant="ghost"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          className="h-[32px] w-[32px] p-0 flex items-center justify-center border border-[var(--border)] rounded-[8px]"
                        >
                          <ChevronRight className="h-[16px] w-[16px]" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {mediaInfo && (
                  <div className="animate-in fade-in duration-300 relative z-20 w-full">
                    {mediaList && (
                      <Button
                        variant="ghost"
                        onClick={() => setMediaInfo(null)}
                        className="mb-[16px] ml-[0px] relative z-50 h-[32px] text-[12px] bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--border)] transition-colors"
                      >
                        ← Back to Search Results
                      </Button>
                    )}

                    <Card className="p-[0px] mb-[20px] overflow-hidden relative border border-[var(--border)] shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
                      <div className="absolute inset-[0px] z-[0]">
                        <img
                          src={String(mediaInfo.thumbnail)}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover opacity-20 blur-3xl scale-110 pointer-events-none"
                        />
                        <div className="absolute inset-[0px] bg-gradient-to-t from-[var(--surface)] via-[var(--surface)]/80 to-transparent pointer-events-none"></div>
                      </div>

                      <div className="relative z-[10] p-[16px] md:p-[20px] flex flex-col md:flex-row gap-[20px] items-start">
                        <div className="group relative w-full md:w-[200px] aspect-video shrink-0 rounded-[14px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.3)] bg-[var(--surface)] flex items-center justify-center z-[0]" style={{ transform: "translateZ(0)" }}>
                          <div className="absolute inset-[0px] rounded-[14px] border border-[var(--border)] pointer-events-none z-[20]"></div>

                          <Film className="absolute h-[36px] w-[36px] text-[var(--border)] pointer-events-none z-[5]" />
                          <img
                            src={String(mediaInfo.thumbnail)}
                            alt="Thumbnail"
                            referrerPolicy="no-referrer"
                            className="absolute inset-[0px] w-full h-full object-cover transition-transform duration-[250ms] ease-out group-hover:scale-[1.08] pointer-events-none z-[10]"
                            onError={(e) => {
                              e.currentTarget.style.opacity = "0";
                            }}
                          />

                          <div className="absolute inset-[-10px] flex items-center justify-center gap-[10px] opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/60 backdrop-blur-md z-[15] pointer-events-auto">
                            <button
                              onClick={() => {
                                const tauriShell = (window as any).__TAURI__
                                  ?.shell;
                                if (tauriShell?.open) {
                                  tauriShell.open(
                                    mediaInfo.original_url || url,
                                  );
                                } else {
                                  window.open(
                                    mediaInfo.original_url || url,
                                    "_blank",
                                  );
                                }
                              }}
                              className="bg-[var(--accent)] p-[8px] rounded-full text-white shadow-[0_0_20px_var(--accent)] transform hover:scale-110 transition-transform duration-200 cursor-pointer"
                            >
                              <ExternalLink className="h-[14px] w-[14px]" />
                            </button>
                            <button
                              onClick={() => setShowThumbModal(true)}
                              className="bg-white/20 p-[8px] rounded-full text-white border border-white/30 backdrop-blur-xl shadow-[0_0_20px_rgba(255,255,255,0.4)] transform hover:scale-110 transition-transform duration-200 cursor-pointer"
                            >
                              <Maximize2 className="h-[14px] w-[14px]" />
                            </button>
                          </div>

                          <div className="absolute bottom-[6px] right-[6px] bg-black/80 backdrop-blur-lg px-[6px] py-[2px] rounded-[6px] text-[10px] font-mono font-medium text-white shadow-sm pointer-events-none z-[15] border border-white/10">
                            {String(mediaInfo.duration)}
                          </div>
                        </div>

                        <div className="flex flex-col justify-start min-w-0 flex-1 w-full mt-[8px] md:mt-[0px]">
                          <div className="flex items-center justify-between mb-[10px]">
                            <span className="inline-flex items-center gap-[6px] px-[8px] py-[4px] bg-[var(--surface)] rounded-[6px] text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase shadow-sm border border-[var(--border)]">
                              <Film className="w-[12px] h-[12px]" />
                              {String(mediaInfo.extractor)}
                            </span>
                            <button
                              onClick={() => setShowNerdStats(!showNerdStats)}
                              className={`flex items-center gap-[6px] text-[10px] font-bold tracking-wider uppercase px-[8px] py-[4px] rounded-[6px] border transition-all duration-200 ${showNerdStats ? "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30" : "bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)] hover:border-[var(--text-muted)]"}`}
                            >
                              <Code className="w-[12px] h-[12px]" />{" "}
                              {showNerdStats ? "Hide Stats" : "Nerd Stats"}
                            </button>
                          </div>

                          <h3 className="text-[18px] md:text-[22px] font-bold mb-[12px] leading-snug text-[var(--text)] line-clamp-2">
                            {String(mediaInfo.title)}
                          </h3>

                          <div className="flex flex-wrap items-center gap-[10px] text-[12px] font-medium text-[var(--text-muted)]">
                            {(mediaInfo.extractor?.toLowerCase() === "youtube" || mediaInfo.original_url?.includes("youtube.com") || mediaInfo.original_url?.includes("youtu.be")) && (
                              <span className="flex items-center gap-[6px] bg-[var(--surface)] px-[8px] py-[4px] rounded-[6px] border border-[var(--border)] shadow-sm">
                                <User className="h-[12px] w-[12px] text-[var(--text-muted)]" />
                                <span className="text-[var(--text)] truncate max-w-[150px]">
                                  {String(mediaInfo.uploader)}
                                </span>
                              </span>
                            )}
                            <span className="flex items-center gap-[6px] bg-[var(--surface)] px-[8px] py-[4px] rounded-[6px] border border-[var(--border)] shadow-sm">
                              <Clock className="h-[12px] w-[12px] text-[var(--text-muted)]" />
                              <span className="text-[var(--text)]">
                                {String(mediaInfo.duration)}
                              </span>
                            </span>
                            {(mediaInfo.extractor?.toLowerCase() === "youtube" || mediaInfo.original_url?.includes("youtube.com") || mediaInfo.original_url?.includes("youtu.be")) && (
                              <span className="flex items-center gap-[6px] bg-[var(--surface)] px-[8px] py-[4px] rounded-[6px] border border-[var(--border)] shadow-sm">
                                <Eye className="h-[12px] w-[12px] text-[var(--text-muted)]" />
                                <span className="text-[var(--text)]">
                                  {String(formatCount(mediaInfo.views))}
                                </span>
                              </span>
                            )}
                            {mediaInfo.videoCodec && mediaInfo.videoCodec !== "none" && (
                              <span className="flex items-center gap-[6px] bg-[var(--surface)] px-[8px] py-[4px] rounded-[6px] border border-[var(--border)] shadow-sm text-green-400 font-semibold">
                                <Film className="h-[12px] w-[12px] text-green-500" />
                                <span>{String(mediaInfo.videoCodec).toUpperCase()} {mediaInfo.videoBitrate ? `(${mediaInfo.videoBitrate})` : ""}</span>
                              </span>
                            )}
                            {mediaInfo.audioCodec && mediaInfo.audioCodec !== "none" && (
                              <span className="flex items-center gap-[6px] bg-[var(--surface)] px-[8px] py-[4px] rounded-[6px] border border-[var(--border)] shadow-sm text-blue-400 font-semibold">
                                <Music className="h-[12px] w-[12px] text-blue-500" />
                                <span>{String(mediaInfo.audioCodec).toUpperCase()} {mediaInfo.audioBitrate ? `(${mediaInfo.audioBitrate})` : ""} {mediaInfo.audioChannels ? `• ${mediaInfo.audioChannels}` : ""}</span>
                              </span>
                            )}
                          </div>

                          <AnimatePresence>
                            {showNerdStats && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="overflow-hidden mt-[12px]"
                              >
                                {(() => {
                                  const raw = mediaInfo._raw || {};
                                  const extLower = (mediaInfo.extractor || "").toLowerCase();
                                  const isYT = extLower === "youtube" || mediaInfo.original_url?.includes("youtube.com") || mediaInfo.original_url?.includes("youtu.be");
                                  const isHotstar = extLower === "hotstar" || mediaInfo.original_url?.includes("hotstar.com") || mediaInfo.original_url?.includes("jiohotstar.com");
                                  const isZee5 = extLower === "zee5" || mediaInfo.original_url?.includes("zee5.com");
                                  
                                  const renderRow = (label: string, value: React.ReactNode, colorClass: string = "text-[var(--text)]") => (
                                    <div className="flex justify-between items-center py-[6px] border-b border-[var(--border)]/30 last:border-0" key={label}>
                                      <span className="text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[9px]">{label}:</span>
                                      <span className={cn("font-mono text-[11px] truncate max-w-[220px] text-right", colorClass)}>{value}</span>
                                    </div>
                                  );

                                  return (
                                    <div className="bg-[var(--bg)] border border-[var(--border)] rounded-[12px] p-[14px] space-y-[2px] shadow-inner relative overflow-hidden">
                                      <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-[var(--accent)]/5 rounded-full blur-xl pointer-events-none" />

                                      {isYT && (
                                        <>
                                          {renderRow("Video ID", raw.id || "N/A", "text-blue-400 font-bold")}
                                          {renderRow("Channel", raw.uploader || mediaInfo.uploader || "N/A", "text-green-400")}
                                          {renderRow("Upload Date", raw.upload_date ? `${raw.upload_date.substring(0, 4)}-${raw.upload_date.substring(4, 6)}-${raw.upload_date.substring(6, 8)}` : "N/A", "text-yellow-400")}
                                          {renderRow("Likes", raw.like_count ? formatCount(raw.like_count) : "N/A", "text-pink-400")}
                                          {renderRow("Exact Views", Number(raw.view_count || mediaInfo.views).toLocaleString(), "text-cyan-400")}
                                          {renderRow("Chapters", raw.chapters ? `${raw.chapters.length} segments` : "None", "text-purple-400")}
                                          {renderRow("Available Streams", `${mediaInfo._rawFormats?.length || 0} tracks`, "text-indigo-400")}
                                        </>
                                      )}

                                      {isHotstar && (
                                        <>
                                          {renderRow("Content ID", raw.id || "N/A", "text-blue-400 font-bold")}
                                          {renderRow("Series Name", raw.series || "Single Title", "text-green-400")}
                                          {renderRow("Season / Episode", raw.season_number ? `Season ${raw.season_number} Ep ${raw.episode_number || ""}` : "N/A", "text-yellow-400")}
                                          {renderRow("DRM Key State", "Decrypted (Clear Media)", "text-red-400 font-semibold")}
                                          {renderRow("Client Profile", "Dual-Client (AndroidTV + Web)", "text-cyan-400")}
                                          {renderRow("Total Audio Tracks", `${mediaInfo.availableAudio?.length || 0} languages`, "text-purple-400")}
                                          {renderRow("Codecs Available", "HEVC (H.265) & H264", "text-pink-400")}
                                        </>
                                      )}

                                      {isZee5 && (
                                        <>
                                          {renderRow("Content ID", raw.id || "N/A", "text-blue-400 font-bold")}
                                          {renderRow("Asset Type", raw.asset_type || "N/A", "text-green-400")}
                                          {renderRow("Age Rating", raw.age_rating || "N/A", "text-yellow-400")}
                                          {renderRow("DRM Profile", "Clear Content (Non-DRM)", "text-red-400 font-semibold")}
                                          {renderRow("Total Audio Tracks", `${mediaInfo.availableAudio?.length || 0} tracks`, "text-purple-400")}
                                        </>
                                      )}

                                      {!isYT && !isHotstar && !isZee5 && (
                                        <>
                                          {renderRow("Content ID", raw.id || "N/A", "text-blue-400 font-bold")}
                                          {renderRow("Uploader", raw.uploader || mediaInfo.uploader || "N/A", "text-green-400")}
                                          {renderRow("Core Extractor", mediaInfo.extractor || "Generic", "text-cyan-400")}
                                          {renderRow("Total Formats", `${mediaInfo._rawFormats?.length || 0} streams`, "text-purple-400")}
                                          {renderRow("Page URL", (
                                            <a href={mediaInfo.original_url} target="_blank" rel="noreferrer" className="hover:underline text-green-400">
                                              {mediaInfo.original_url}
                                            </a>
                                          ))}
                                        </>
                                      )}
                                    </div>
                                  );
                                })()}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </Card>

                    <div className="flex w-fit mx-auto mb-[20px] bg-[var(--surface)] p-[4px] rounded-full border border-[var(--border)] shadow-sm relative z-[60] overflow-x-auto">
                      {["video", "audio"].map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                              "relative flex items-center justify-center gap-[6px] px-[20px] py-[4px] rounded-full text-[12px] font-bold transition-colors duration-200 z-[10] min-w-[120px]",
                              isActive
                                ? "text-white"
                                : "text-[var(--text-muted)] hover:text-[var(--text)]",
                            )}
                          >
                            {isActive && (
                              <motion.div
                                layoutId="settings-tab-pill"
                                className="absolute inset-[0px] bg-[var(--accent)] rounded-full shadow-[0_2px_10px_rgba(217,4,41,0.25)] z-[-1]"
                                initial={false}
                                transition={{
                                  duration: 0.2, ease: "easeOut"
                                }}
                              />
                            )}
                            {tab === "video" ? (
                              <Film className="h-[12px] w-[12px]" />
                            ) : (
                              <Music className="h-[12px] w-[12px]" />
                            )}
                            {tab === "video" ? "Video Mode" : "Audio Mode"}
                          </button>
                        );
                      })}
                    </div>

                    <Card className="p-[16px] mb-[20px] relative z-[50]">
                      {activeTab === "video" ? (
                        <div
                          className={`grid grid-cols-1 ${videoGridCols} gap-[12px] relative z-[50]`}
                        >
                          <div>
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-[6px] block">
                              Resolution
                            </label>
                            <CustomSelect
                              value={resolution}
                              onChange={setResolution}
                              options={mediaInfo.resolutions}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-[6px] block">
                              Format Container
                            </label>
                            <CustomSelect
                              value={container}
                              onChange={setContainer}
                              options={mediaInfo.containers}
                            />
                          </div>
                          {hasAudioTracks && (
                            <div>
                              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-[6px] block">
                                Audio Track
                              </label>
                              <CustomSelect
                                value={selectedAudioTracks}
                                onChange={setSelectedAudioTracks}
                                options={mediaInfo.availableAudio}
                                placeholder="Highest Quality"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px] relative z-[50]">
                          <div className="relative z-[50]">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-[6px] block">
                              Audio Format
                            </label>
                            <CustomSelect
                              value={audioOnlyFormat}
                              onChange={setAudioOnlyFormat}
                              options={mediaInfo.audioFormats}
                            />
                          </div>
                          {!isLossless && (
                            <div>
                              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-[6px] block">
                                Target Bitrate
                              </label>
                              <CustomSelect
                                value={audioQuality}
                                onChange={setAudioQuality}
                                options={[
                                  { label: "320 kbps (High Quality)", value: "320" },
                                  {
                                    label: "256 kbps (Standard)",
                                    value: "256",
                                  },
                                  { label: "128 kbps (Low Size)", value: "128" },
                                ]}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </Card>

                    <div className="mb-[20px] relative z-[30]">
                      <Accordion
                        title={`Advanced Tools ${activeTab === "video" ? "(Trim, HDR, Subs)" : "(Trim, Features)"}`}
                        icon={Settings}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px] py-[2px]">
                          <div className="space-y-[12px]">
                            <Switch
                              checked={options.trim}
                              onChange={() => toggleOption("trim")}
                              label="Time Trim (Cut Segment)"
                            />
                            {options.trim && (
                              <div className="flex items-center gap-[8px] pl-[20px] animate-in fade-in">
                                <TimeInput
                                  label="Start"
                                  value={trimStart}
                                  onChange={setTrimStart}
                                />
                                <span className="text-[var(--text-muted)] mt-[16px] font-bold">
                                  -
                                </span>
                                <TimeInput
                                  label="End"
                                  value={trimEnd}
                                  onChange={setTrimEnd}
                                />
                              </div>
                            )}
                            {activeTab === "video" && (
                              <Switch
                                checked={options.hdrToSdr}
                                onChange={() => toggleOption("hdrToSdr")}
                                label="Tone-map HDR to SDR"
                                hint="Fixes washed-out colors on standard displays"
                              />
                            )}
                          </div>
                          <div className="space-y-[12px]">
                            <Switch
                              checked={options.saveThumbnailFile}
                              onChange={() => toggleOption("saveThumbnailFile")}
                              label="Save Cover Art as File (.png)"
                              hint="Downloads the highest quality cover alongside the media"
                            />
                            <Switch
                              checked={options.sponsorBlock}
                              onChange={() => toggleOption("sponsorBlock")}
                              label="Skip Sponsors (SponsorBlock)"
                              hint="Automatically skips in-video sponsors"
                            />
                             {activeTab === "video" && (
                               <div className="space-y-[12px]">
                                 <div className="pt-[2px] relative z-[60]">
                                   <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-[6px] block">
                                     Subtitles to Fetch
                                   </label>
                                   <CustomSelect
                                     value={selectedSubtitles}
                                     onChange={setSelectedSubtitles}
                                     options={mediaInfo.availableSubs || []}
                                     placeholder="No Subtitles"
                                   />
                                 </div>
                                 {selectedSubtitles.length > 0 && (
                                   <div className="pt-[4px] space-y-[12px] animate-in fade-in slide-in-from-top-1 duration-200">
                                     <Switch
                                       checked={embedSubtitles}
                                       onChange={() => setEmbedSubtitles(!embedSubtitles)}
                                       label="Embed Subtitles in Video"
                                       hint="Integrates subtitles directly inside the video container"
                                     />
                                     <Switch
                                       checked={saveSubtitlesFile}
                                       onChange={() => setSaveSubtitlesFile(!saveSubtitlesFile)}
                                       label="Save Subtitles as File (.vtt)"
                                       hint="Saves external subtitle files alongside the video"
                                     />
                                   </div>
                                 )}
                               </div>
                             )}
                          </div>
                        </div>
                      </Accordion>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-[10px] relative z-[10] pb-[24px]">
                      <div className="flex-1 w-full bg-[var(--surface)] backdrop-blur-md h-[42px] pl-[14px] pr-[6px] rounded-[12px] border border-[var(--border)] flex items-center justify-between shadow-sm min-w-0 hover:border-[var(--text-muted)] transition-colors">
                        <div className="flex items-center gap-[10px] overflow-hidden text-[var(--text-muted)] min-w-0">
                          <FolderOpen className="h-[14px] w-[14px] shrink-0" />
                          <span
                            className="text-[12px] font-medium truncate"
                            title={savePath || ""}
                          >
                            {String(truncatePath(savePath))}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={handleFolderSelect}
                          className="h-[30px] px-[12px] shrink-0 rounded-[8px] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] font-semibold border border-[var(--border)] ml-[10px] text-[11px]"
                        >
                          Change Output
                        </Button>
                      </div>

                      <Button
                        onClick={() =>
                          handleDownload(activeTab as "video" | "audio")
                        }
                        disabled={
                          isDownloading ||
                          !savePath ||
                          (!url && !mediaInfo?.original_url)
                        }
                        className="md:w-auto w-full min-w-[200px] text-[13px] shrink-0 px-[24px] h-[42px] rounded-[12px]"
                      >
                        <span className="flex items-center justify-center gap-[8px] whitespace-nowrap truncate font-bold">
                          {activeTab === "video" ? (
                            <>
                              <DownloadIcon className="h-[16px] w-[16px] shrink-0" />{" "}
                              Download Video
                            </>
                          ) : (
                            <>
                              <Music className="h-[16px] w-[16px] shrink-0" />{" "}
                              Download Audio
                            </>
                          )}
                        </span>
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {view === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="min-h-[calc(100vh-140px)] max-w-[768px] mx-auto"
              >
                <div className="flex justify-between items-center mb-[24px]">
                  <h2 className="text-[24px] font-bold text-[var(--text)]">
                    History
                  </h2>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setHistory([])}
                  >
                    <Trash2 className="h-[14px] w-[14px] mr-[6px]" /> Clear History
                  </Button>
                </div>
                {history.length === 0 ? (
                  <Card className="text-center p-[48px] text-[var(--text-muted)] border-dashed">
                    <History className="h-[32px] w-[32px] mx-auto mb-[16px] opacity-50" /> No
                    activity recorded.
                  </Card>
                ) : (
                  <div className="space-y-[8px]">
                    {history.map((item, i) => (
                      <Card
                        key={item.id || i}
                        className="flex justify-between items-center p-[16px] hover:border-[var(--text-muted)] transition-colors duration-200"
                      >
                        <div className="min-w-0 pr-[16px] flex-1">
                          <h4 className="font-semibold text-[14px] truncate text-[var(--text)] mb-[4px]">
                            {String(item.title || "Unknown")}
                          </h4>
                          <span className="text-[12px] text-[var(--text-muted)] font-medium truncate block">
                            {String(item.url || "")}
                          </span>
                        </div>
                        <div className="flex flex-col items-end shrink-0 gap-[6px]">
                          <span
                            className={`text-[10px] px-[8px] py-[2px] rounded-[6px] font-bold uppercase tracking-wider ${item.type === "VIDEO" ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "bg-blue-500/10 text-blue-500"}`}
                          >
                            {String(item.format)}
                          </span>
                          <span className="text-[11px] font-mono font-medium text-[var(--text-muted)]">
                            {String(item.date).split(",")[0]}
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {view === "stats" && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15, transition: { duration: 0.2 } }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="min-h-[calc(100vh-140px)] max-w-[768px] mx-auto pt-[16px]"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-[20px]">
                  <Card className="p-[32px] flex flex-col items-center justify-center text-center border-b-[4px] border-b-[var(--border)] hover:-translate-y-[4px] transition-transform duration-200 ease-out">
                    <div className="bg-[var(--bg)] p-[12px] rounded-[12px] mb-[12px] border border-[var(--border)] shadow-inner">
                      <HardDrive className="h-[24px] w-[24px] text-[var(--text-muted)]" />
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest font-bold mb-[4px]">
                      Total
                    </div>
                    <div className="text-[36px] font-extrabold text-[var(--text)]">
                      {history.length}
                    </div>
                  </Card>
                  <Card className="p-[32px] flex flex-col items-center justify-center text-center border-b-[4px] border-b-[var(--accent)] hover:-translate-y-[4px] transition-transform duration-200 ease-out">
                    <div className="bg-[var(--accent)]/10 p-[12px] rounded-[12px] mb-[12px] shadow-sm">
                      <Film className="h-[24px] w-[24px] text-[var(--accent)]" />
                    </div>
                    <div className="text-[11px] text-[var(--accent)] uppercase tracking-widest font-bold mb-[4px]">
                      Videos
                    </div>
                    <div className="text-[36px] font-extrabold text-[var(--text)]">
                      {history.filter((h) => h.type === "VIDEO").length}
                    </div>
                  </Card>
                  <Card className="p-[32px] flex flex-col items-center justify-center text-center border-b-[4px] border-b-blue-500 hover:-translate-y-[4px] transition-transform duration-200 ease-out">
                    <div className="bg-blue-500/10 p-[12px] rounded-[12px] mb-[12px] shadow-sm">
                      <Music className="h-[24px] w-[24px] text-blue-500" />
                    </div>
                    <div className="text-[11px] text-blue-500 uppercase tracking-widest font-bold mb-[4px]">
                      Audio
                    </div>
                    <div className="text-[36px] font-extrabold text-[var(--text)]">
                      {history.filter((h) => h.type === "AUDIO").length}
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {view === "help" && (
              <motion.div
                key="help"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="max-w-[768px] mx-auto min-h-[calc(100vh-140px)] pt-[16px] pb-[32px]"
              >
                <div className="space-y-[20px]">
                  {/* Master Guide Header */}
                  <Card className="p-[20px] md:p-[24px] border-l-[4px] border-l-[var(--accent)] bg-[var(--surface)]">
                    <div className="flex items-center gap-[12px] mb-[12px] text-[var(--text)]">
                      <div className="bg-[var(--accent)]/10 p-[8px] rounded-[10px]">
                        <BookOpen className="h-[20px] w-[20px] text-[var(--accent)]" />
                      </div>
                      <h3 className="font-bold text-[18px]">
                        4444 Downloader Master Guide
                      </h3>
                    </div>
                    <p className="text-[var(--text-muted)] text-[13px] font-normal leading-relaxed">
                      Welcome to the master manual. This application leverages optimized streaming extraction wrappers, multi-threaded connection engines, and premium authorization bypass techniques. Follow this guide to download content from any platform with peak efficiency and highest fidelity.
                    </p>
                  </Card>

                  {/* DRM Disclaimer Card */}
                  <Card className="p-[20px] md:p-[24px] border-l-[4px] border-l-red-500 bg-red-950/20">
                    <div className="flex items-center gap-[12px] mb-[12px] text-[var(--text)]">
                      <div className="bg-red-500/10 p-[8px] rounded-[10px]">
                        <AlertTriangle className="h-[20px] w-[20px] text-red-400" />
                      </div>
                      <h3 className="font-bold text-[15px] text-red-200">
                        DRM Protection Disclaimer
                      </h3>
                    </div>
                    <p className="text-red-300/80 text-[12px] font-normal leading-relaxed">
                      This application <strong>DOES NOT</strong> support downloading DRM-protected (encrypted) media (e.g. Widevine, PlayReady). It is designed exclusively for downloading, merging, and muxing <strong>non-DRM (clear/unencrypted) streams</strong>. Any attempts to download DRM-restricted URLs will result in decryption errors.
                    </p>
                  </Card>

                  {/* Cookie Extraction Guide (Critical Component) */}
                  <Card className="p-[20px] md:p-[24px] bg-[var(--surface)]">
                    <div className="flex items-center gap-[10px] mb-[16px] text-[var(--text)]">
                      <div className="bg-purple-500/10 p-[8px] rounded-[10px]">
                        <Shield className="h-[16px] w-[16px] text-purple-400" />
                      </div>
                      <h4 className="font-bold text-[15px]">1. Session Cookies & Premium Authorization</h4>
                    </div>
                    
                    <div className="text-[var(--text-muted)] text-[12px] leading-relaxed space-y-[12px]">
                      <p>
                        Some sites (e.g. YouTube Premium, and other supported platforms) require valid session authentication to fetch high-resolution streams or clear content. You can import your browser cookies to authenticate the downloader.
                      </p>
                      
                      <div className="bg-black/20 p-[12px] rounded-[10px] border border-[var(--border)] space-y-[8px]">
                        <div className="font-semibold text-[var(--text)]">Recommended Browser Extensions:</div>
                        <div className="flex flex-col sm:flex-row gap-[10px] pt-[4px]">
                          <button
                            onClick={() => openExternalLink("https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc")}
                            className="flex items-center justify-between px-[12px] py-[8px] rounded-[8px] bg-[var(--bg)] border border-[var(--border)] hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-left text-[11px] font-medium text-[var(--text)] flex-1"
                          >
                            <span>Get cookies.txt LOCALLY (Chrome/Edge)</span>
                            <ExternalLink className="h-[12px] w-[12px] text-purple-400 shrink-0 ml-[6px]" />
                          </button>
                          <button
                            onClick={() => openExternalLink("https://addons.mozilla.org/en-US/firefox/addon/get-cookies-txt-locally/")}
                            className="flex items-center justify-between px-[12px] py-[8px] rounded-[8px] bg-[var(--bg)] border border-[var(--border)] hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left text-[11px] font-medium text-[var(--text)] flex-1"
                          >
                            <span>Get cookies.txt (Firefox)</span>
                            <ExternalLink className="h-[12px] w-[12px] text-blue-400 shrink-0 ml-[6px]" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-[6px] pl-[4px]">
                        <div className="font-semibold text-[var(--text)]">How to Export and Use:</div>
                        <ol className="list-decimal pl-[16px] space-y-[4px]">
                          <li>Install the extension of your choice in your browser.</li>
                          <li>Open the target streaming site and log in to your account.</li>
                          <li>Click the extension icon, choose <strong>"Export Active Tab Cookies"</strong> (Netscape layout), and save it as a <code className="bg-black/35 px-[4px] py-[1px] rounded font-mono text-[11px] text-[var(--accent)] font-bold">.txt</code> file.</li>
                          <li>In this app, open the <strong>"Advanced Tools"</strong> panel, upload the cookie file, and select it as the active profile. The pulsing green indicator confirms successful activation.</li>
                        </ol>
                      </div>
                    </div>
                  </Card>

                  {/* Video Codec Selection Matrix */}
                  <Card className="p-[20px] md:p-[24px] bg-[var(--surface)]">
                    <div className="flex items-center gap-[10px] mb-[16px] text-[var(--text)]">
                      <div className="bg-blue-500/10 p-[8px] rounded-[10px]">
                        <Cpu className="h-[16px] w-[16px] text-blue-400" />
                      </div>
                      <h4 className="font-bold text-[15px]">2. Codecs: AV1 vs VP9 vs HEVC vs H264</h4>
                    </div>
                    
                    <div className="text-[var(--text-muted)] text-[12px] leading-relaxed space-y-[12px]">
                      <p>
                        Our downloader parses and extracts multiple codec variants. Choose the right format depending on your target playback device and available bandwidth:
                      </p>
                      
                      <div className="overflow-x-auto rounded-[10px] border border-[var(--border)]">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="bg-black/30 text-[var(--text)] border-b border-[var(--border)]">
                              <th className="p-[10px] font-semibold">Codec</th>
                              <th className="p-[10px] font-semibold">Efficiency</th>
                              <th className="p-[10px] font-semibold">Compatibility</th>
                              <th className="p-[10px] font-semibold">Best Used For</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-[var(--border)]/50">
                              <td className="p-[10px] font-semibold text-[var(--text)]">AV1 (AV01)</td>
                              <td className="p-[10px] text-green-400 font-medium">Extreme (Highest)</td>
                              <td className="p-[10px]">Moderate (Newer hardware)</td>
                              <td className="p-[10px]">Ultra HD (4K) YouTube streams, conserving data.</td>
                            </tr>
                            <tr className="border-b border-[var(--border)]/50">
                              <td className="p-[10px] font-semibold text-[var(--text)]">VP9 (VP09)</td>
                              <td className="p-[10px] text-blue-400 font-medium">High</td>
                              <td className="p-[10px]">Excellent (PCs & Android)</td>
                              <td className="p-[10px]">High-Definition YouTube playback on Chrome/Edge.</td>
                            </tr>
                            <tr className="border-b border-[var(--border)]/50">
                              <td className="p-[10px] font-semibold text-[var(--text)]">HEVC (H.265)</td>
                              <td className="p-[10px] text-blue-400 font-medium">High</td>
                              <td className="p-[10px]">Moderate (Requires GPU decoders)</td>
                              <td className="p-[10px]">Smart TV streaming, YouTube 4K/HDR, and various platforms.</td>
                            </tr>
                            <tr>
                              <td className="p-[10px] font-semibold text-[var(--text)]">AVC (H.264)</td>
                              <td className="p-[10px] text-yellow-500 font-medium">Standard (Legacy)</td>
                              <td className="p-[10px]">Universal (Plays anywhere)</td>
                              <td className="p-[10px]">Old players, Plex servers, legacy tablets.</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <p className="text-[11px] leading-relaxed text-[var(--text-muted)] italic">
                        Note: For supported platforms, the H.264 streams are retrieved from web browser clients, while HEVC streams are extracted by spoofing smart-tv profiles to unlock high bitrates.
                      </p>
                    </div>
                  </Card>

                  {/* Subtitle Management Tutorial */}
                  <Card className="p-[20px] md:p-[24px] bg-[var(--surface)]">
                    <div className="flex items-center gap-[10px] mb-[16px] text-[var(--text)]">
                      <div className="bg-green-500/10 p-[8px] rounded-[10px]">
                        <Layers className="h-[16px] w-[16px] text-green-400" />
                      </div>
                      <h4 className="font-bold text-[15px]">3. Subtitle Management (Embedded vs External)</h4>
                    </div>

                    <div className="text-[var(--text-muted)] text-[12px] leading-relaxed space-y-[12px]">
                      <p>
                        This application supports advanced subtitle parsing and multiplexing. You have two options when downloading subtitles:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
                        <div className="bg-black/20 p-[12px] rounded-[10px] border border-[var(--border)]">
                          <h5 className="font-semibold text-[var(--text)] mb-[6px]">Embed Subtitles (Default)</h5>
                          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                            Injects subtitle tracks directly inside the container (MKV/MP4). No extra files are generated. Perfect for keeping files organized.
                          </p>
                        </div>
                        <div className="bg-black/20 p-[12px] rounded-[10px] border border-[var(--border)]">
                          <h5 className="font-semibold text-[var(--text)] mb-[6px]">Save Externally</h5>
                          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                            Writes subtitle tracks as separate sidecar files alongside the media. Best if your player has issues reading multiplexed streams.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-[6px]">
                        <div className="font-semibold text-[var(--text)]">How to Load Sidecar Subtitles in Popular Players:</div>
                        <ul className="list-disc pl-[16px] space-y-[4px] text-[11px]">
                          <li><strong>VLC Media Player:</strong> Play the video, click <code>Subtitle</code> &gt; <code>Add Subtitle File...</code> and choose the downloaded <code>.vtt</code> or <code>.srt</code>. Or, keep the subtitle in the exact same folder with the same name as the video file; VLC will load it automatically.</li>
                          <li><strong>MPV Player:</strong> Drag and drop the external <code>.vtt</code> or <code>.srt</code> file directly onto the running MPV window.</li>
                          <li><strong>PotPlayer:</strong> Right-click inside the player, select <code>Subtitles</code> &gt; <code>Add Subtitle...</code> or use the shortcut key <code>Alt + O</code>.</li>
                        </ul>
                      </div>
                    </div>
                  </Card>

                  {/* Network Proxy & Geo-Bypassing */}
                  <Card className="p-[20px] md:p-[24px] bg-[var(--surface)]">
                    <div className="flex items-center gap-[10px] mb-[16px] text-[var(--text)]">
                      <div className="bg-orange-500/10 p-[8px] rounded-[10px]">
                        <Earth className="h-[16px] w-[16px] text-orange-400" />
                      </div>
                      <h4 className="font-bold text-[15px]">4. Network Proxy & Geo-Bypassing</h4>
                    </div>

                    <div className="text-[var(--text-muted)] text-[12px] leading-relaxed space-y-[12px]">
                      <p>
                        Many platforms implement strict geographic restrictions (e.g. certain regional platforms are geoblocked). You can circumvent these blocks by routing the engine traffic through a regional proxy.
                      </p>

                      <div className="space-y-[6px] pl-[4px]">
                        <div className="font-semibold text-[var(--text)]">Accepted Proxy Formats:</div>
                        <ul className="list-disc pl-[16px] space-y-[2px] font-mono text-[11px] text-orange-300">
                          <li>http://[user:pass@]proxy_ip:port</li>
                          <li>https://[user:pass@]proxy_ip:port</li>
                          <li>socks5://[user:pass@]proxy_ip:port</li>
                        </ul>
                      </div>

                      <p>
                        To activate, paste your proxy address into the <strong>Network Proxy Address</strong> field inside Advanced Tools. The downloader will apply this proxy to both metadata fetches and chunk downloads.
                      </p>
                    </div>
                  </Card>

                  {/* High-Speed segment download & MKVmerge Multiplexing */}
                  <Card className="p-[20px] md:p-[24px] bg-[var(--surface)]">
                    <div className="flex items-center gap-[10px] mb-[16px] text-[var(--text)]">
                      <div className="bg-cyan-500/10 p-[8px] rounded-[10px]">
                        <Zap className="h-[16px] w-[16px] text-cyan-400" />
                      </div>
                      <h4 className="font-bold text-[15px]">5. High-Speed Segment Fetching & MKVMerge Multiplexing</h4>
                    </div>

                    <div className="text-[var(--text-muted)] text-[12px] leading-relaxed space-y-[10px]">
                      <p>
                        To ensure zero-dependency portability, the 4444 Downloader bundles high-performance engines directly within its package:
                      </p>
                      <ul className="list-disc pl-[16px] space-y-[4px] text-[11px]">
                        <li><strong>aria2c Connection Pooling:</strong> When downloading from non-YouTube platforms, the app uses the bundled <code>aria2c</code> engine to download up to 16 fragments simultaneously. This circumvents normal HTTP speed limits and utilizes your full bandwidth capacity.</li>
                        <li><strong>mkvmerge Demultiplexing:</strong> Rather than performing slow, CPU-intensive video/audio re-encoding using FFmpeg, the app leverages the bundled <code>mkvmerge</code> to bind raw video, multiple audios, and subtitle streams together instantly without loss in quality.</li>
                      </ul>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}
            {view === "updates" && (
              <motion.div
                key="updates"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="max-w-[768px] mx-auto min-h-[calc(100vh-140px)] pt-[16px]"
              >
                <Card className="p-[32px] border-t-[4px] border-t-[var(--accent)] flex flex-col items-center text-center space-y-[24px]">
                  <div className="bg-[var(--accent)]/10 p-[16px] rounded-[16px]">
                    <Cpu className="h-[32px] w-[32px] text-[var(--accent)]" />
                  </div>
                  
                  <div>
                    <h2 className="text-[24px] font-bold text-[var(--text)] mb-[8px]">
                      Engine Updates
                    </h2>
                    <p className="text-[var(--text-muted)] text-[14px]">
                      Keep your download engine up to date for the best performance.
                    </p>
                  </div>

                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[16px] p-[24px] w-full max-w-[400px]">
                    <div className="text-[12px] text-[var(--text-muted)] uppercase tracking-widest font-bold mb-[8px]">
                      Current Version
                    </div>
                    <div className="flex items-center justify-center gap-[12px]">
                      <span className="font-mono text-[24px] font-bold text-[var(--text)]">
                        {engineVersion}
                      </span>
                      {engineVersion !== "Checking..." && engineVersion !== "Unknown" && !engineVersion.includes("Restart") && (
                        <span className="bg-green-500/10 text-green-500 px-[10px] py-[4px] rounded-full text-[11px] font-bold uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  {engineUpdateMessage && (
                    <div className={`text-[13px] font-medium px-[16px] py-[12px] rounded-[10px] border w-full max-w-[400px] ${engineUpdateMessage.toLowerCase().includes("error") ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"}`}>
                      {engineUpdateMessage}
                    </div>
                  )}

                  <Button
                    size="lg"
                    onClick={handleManualEngineUpdate}
                    disabled={isUpdatingEngine}
                    className="w-full max-w-[400px]"
                  >
                    {isUpdatingEngine ? (
                      <>
                        <RefreshCw className="h-[18px] w-[18px] mr-[8px] animate-spin" />
                        Updating Engine...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-[18px] w-[18px] mr-[8px]" />
                        Check for Updates
                      </>
                    )}
                  </Button>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Globe & Social Footer */}
        <div className="mt-[24px] mb-[8px] flex justify-center items-center gap-[16px] text-[11px] font-medium text-[var(--text-muted)]">
          <button
            className="inline-flex items-center gap-[6px] hover:text-[var(--accent)] transition-colors duration-200"
            onClick={async () => {
              const tauriShell = (window as any).__TAURI__?.shell;
              let targetUrl = "https://bhargaveditz.live";
              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);
                await fetch("https://bhargaveditz.live", {
                  method: "HEAD",
                  mode: "no-cors",
                  signal: controller.signal,
                });
                clearTimeout(timeoutId);
              } catch (e) {
                targetUrl = "https://bhargaveditz.vercel.app/";
              }
              if (tauriShell?.open) {
                tauriShell.open(targetUrl);
              } else {
                window.open(targetUrl, "_blank");
              }
            }}
          >
            <Globe className="h-[12px] w-[12px]" />
            <span>bhargaveditz</span>
          </button>

          <span className="w-[1px] h-[12px] bg-[var(--border)]"></span>

          <button
            className="inline-flex items-center gap-[6px] hover:text-pink-400 transition-colors duration-200"
            onClick={() => {
              const tauriShell = (window as any).__TAURI__?.shell;
              const targetUrl = "https://instagram.com/4444.aep";
              if (tauriShell?.open) {
                tauriShell.open(targetUrl);
              } else {
                window.open(targetUrl, "_blank");
              }
            }}
          >
            <Instagram className="h-[12px] w-[12px] text-pink-500" />
            <span>@4444.aep</span>
          </button>
        </div>
      </div>
    </div>
  );
}