# 4444 Downloader — Premium Media Extraction Engine

4444 Downloader is a high-performance, multi-threaded video and audio download utility built with a Rust-based Tauri backend and a modern React frontend. It is designed to bypass common platform limits, support high-definition video formats (such as 4K, H.264, and HEVC/H.265), and preserve lossless audio quality.

---

## Key Features

### 1. YouTube Anti-Capping Engine
* **Bypass 720p Capping:** Automatically rotates client identifiers (TV Client profiles, Web players, Web-impersonated browser client fallbacks) to prevent YouTube from capping download resolutions at 720p.
* **Automatic Cache Purging:** Silently clears local `yt-dlp` signature caches on detection of 403 Forbidden blocks, ensuring uninterrupted high-speed transfers.

### 2. Multi-Format Codec Support
* **Video Codecs:** Full support for H.264, HEVC, and H.265 video tracks across premium networks (including JioHotstar and other streaming platforms).
* **Lossless Audio:** Option to parse and extract high-bitrate and lossless audio tracks (including FLAC and AAC).
* **Auto-Tagging:** Output filenames automatically append the target video codec (e.g., `[HEVC]`, `[H.264]`) for structured local archiving.

### 3. Zero-Dependency Sidecar Bundling
* **Embedded Binaries:** All core helper tools (`yt-dlp`, `aria2c`, `ffmpeg`, `ffprobe`, `mkvmerge`) are fully bundled out-of-the-box as Tauri sidecars.
* **No Environment Setups:** No manual PATH configuration or installation of external tools is required.

### 4. Advanced Process Diagnostics
* **JS Runtime Auditing:** The application monitors the host system for Node.js or Deno runtimes. If missing, it alerts the user and provides actionable links to complete setup. Runtimes are required by yt-dlp to decrypt complex PoToken challenges on modern streams.
* **Local Muxing Progress:** Standard download bars read and display live output statistics during stream remuxing and merging, eliminating stuck indicators at 99%.

### 5. Custom Trimming & Subtitle Burn-In
* **Lossless Trimming:** Specify custom Start and End timestamps before downloading to only extract what you need.
* **Multilingual Dubs:** Extract specific audio language tracks from multi-language manifests.
* **Subtitle Merging:** Download and mux external subtitle tracks, or burn them directly into the video container locally.

---

## Setup & Usage

### Standard Downloads
1. Copy the URL of the media you wish to download.
2. Paste the link into the URL input field in 4444 Downloader.
3. Click **Analyze** to parse the manifest.
4. Select your desired video quality, audio stream, and container format.
5. Click **Download**.

### Downloading Private Content (Cookies)
To download private, member-only, or geo-restricted streams, you need to authenticate using your browser's cookies:
1. Install a browser extension that allows exporting cookies in Netscape format (e.g., *Get cookies.txt LOCALLY* or *EditThisCookie*).
2. Export your cookies for the target site as a `.txt` file.
3. In the 4444 Downloader main menu, click **Load Cookies** and select your exported `cookies.txt` file.
4. The extraction engine will automatically load these session keys to bypass restriction blocks.

---

## Troubleshooting: PoToken & Capping
If you encounter signature decryption failures or download blocks:
1. Ensure **Node.js** or **Deno** is installed on your computer. 4444 Downloader relies on these JavaScript runtimes to execute challenge responses.
2. If playback or download rates drop:
   * Go to Settings.
   * Click **Purge Cache** to manually wipe the extraction engine signature storage.
   * Restart the application to load refreshed impersonation headers.

---

## Installer Variations
* **EXE Installer (`4444-Downloader_5.1.0_x64-setup.exe`):** The standard NSIS-based standalone executable installer. Recommended for general use.
* **MSI Installer (`4444-Downloader_5.1.0_x64_en-US.msi`):** Enterprise-grade WiX installer package. Ideal for system administrators and silent deployments.

*No installation passwords or ZIP archive passwords are required for Version 5.0.0+.*
