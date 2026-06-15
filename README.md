# <p align="center">⚡ 4444 Downloader v5.1.0 ⚡</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-red?style=for-the-badge&logo=windows" alt="Platform" />
  <img src="https://img.shields.io/badge/Release-v5.1.0-emerald?style=for-the-badge&logo=github" alt="Release" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/Dependencies-Zero-orange?style=for-the-badge" alt="Dependencies" />
</p>

---

4444 Downloader is an elite, multi-threaded media extraction application combining a high-performance **Rust (Tauri)** backend with a fluid, responsive **React** UI. Built for media archiving enthusiasts, it provides seamless resolution-capping bypass, local audio-video container muxing, and lossless formatting profiles.

---

## 📖 Table of Contents
1. [Core Features](#-core-features)
2. [Under the Hood: Architecture](#%EF%B8%8F-under-the-hood-architecture)
3. [Deep-Dive Installation Guide](#%EF%B8%8F-deep-dive-installation-guide)
4. [Step-by-Step Operations](#-step-by-step-operations)
5. [Advanced Configuration & Settings](#%EF%B8%8F-advanced-configuration--settings)
6. [Troubleshooting Guide](#%EF%B8%8F-troubleshooting-guide)
7. [Zero ZIP Password Release Policy](#-zero-zip-password-release-policy)

---

## 🌟 Core Features

### 🛡️ YouTube Anti-Capping Engine
To counter platform throttling, the engine employs a multi-tiered fallback pipeline:
1. **Client Identity Rotation:** Automatically shifts requests between `TV_CLIENT` profiles, modern web-player agents, and web-impersonated browser states (`youtube:player_client=default,-android_sdkless`).
2. **Signature Cache Purging:** Detects HTTP 403 Forbidden blocks and automatically triggers a silent signature cache clearance (`--rm-cache-dir`) before retrying.

### 🎥 Multi-Format Codec Resolving
* **HEVC / H.265 / H.264:** Support for high-efficiency codecs, ensuring 4K/UHD streams are extracted losslessly from premium platforms (including JioHotstar).
* **Audio Extraction:** Native parsing of high-bitrate audio streams (FLAC, high-quality AAC/m4a).
* **Filename Auto-Tagging:** Automatically appends active codec tags (e.g. `[HEVC]`, `[H.264]`) to filenames.

### 📦 Embedded Sidecars (Zero Setup)
All media utility sidecars are pre-compiled and bundled inside the installers:
* `yt-dlp` (Core parser/downloader)
* `aria2c` (Multi-connection download accelerator)
* `ffmpeg` & `ffprobe` (Audio/video segment remuxing)
* `mkvmerge` (Lossless Matroska container merging)

### 📊 Real-Time Process Parsing
Reads stdout streams directly from `ffmpeg` and `mkvmerge` to report exact progress percentage values during local format merging, avoiding frozen UI bars.

---

## 🛠️ Under the Hood: Architecture

4444 Downloader operates on a secure sandboxed communication channel:

```
   ┌───────────────────────┐
   │   React Frontend UI   │
   └───────────┬───────────┘
               │
          IPC Commands
               │
               ▼
   ┌───────────────────────┐
   │    Tauri Rust Core    │
   └───────────┬───────────┘
               │
       Launches Sidecars
               │
               ▼
   ┌───────────────────────┐
   │ aria2c / yt-dlp /     │
   │ ffmpeg / mkvmerge     │
   └───────────┬───────────┘
               │
       Extracts Segments
               │
               ▼
   ┌───────────────────────┐
   │  Local Temp Storage   │
   └───────────┬───────────┘
               │
     Muxing & Containerizing
               │
               ▼
   ┌───────────────────────┐
   │   Final Output Media  │
   └───────────────────────┘
```

---

## ⚙️ Deep-Dive Installation Guide

### Windows Installation
We distribute two verified formats for Windows 10/11 (64-bit):

#### Option A: NSIS Standalone Setup (Recommended)
1. Download **`4444-Downloader_5.1.0_x64-setup.exe`** from [GitHub Releases](https://github.com/Insider4444/4444-Downloader-v5/releases).
2. Launch the setup wizard.
3. Choose your installation path (defaults to `%LocalAppData%\Programs\4444-Downloader`).
4. Select **Create Desktop Shortcut** and click **Finish**.

#### Option B: WiX Enterprise MSI Installer
1. Download **`4444-Downloader_5.1.0_x64_en-US.msi`**.
2. Run the MSI package. This is ideal for silent installation flags:
   ```cmd
   msiexec /i 4444-Downloader_5.1.0_x64_en-US.msi /qn /norestart
   ```

---

## 🚀 Step-by-Step Operations

### Basic Downloads
1. Copy the URL of your target stream.
2. Paste it into the input field and click **Analyze**.
3. Once analysis completes, pick your target **Video Stream** (quality/codec) and **Audio Track** (dubs/bitrates).
4. Click **Download** to start the acceleration loop.

### Advanced Operations: Downloading Private Content
For content locked behind paywalls, age restrictions, or region locks, you must authenticate using local session cookies:

> [!IMPORTANT]
> Cookies are processed entirely locally. They are never uploaded, shared, or sent to external servers.

1. Install a Netscape-compatible cookie exporter extension on your browser (e.g. *Get cookies.txt LOCALLY*).
2. Authenticate on your target streaming website (e.g. log in).
3. Export your cookies for that specific tab/domain as a text file (e.g., `cookies.txt`).
4. Inside 4444 Downloader, click **Load Cookies** in the upper toolbar.
5. Select your exported file. The engine will automatically pass the auth flags to all active downloads.

---

## 🎛️ Advanced Configuration & Settings

You can open the **Settings Gear** to tweak the core engines:
* **Thread Count:** Increase parallel threads (up to 32 connections) to fully saturate multi-gigabit connections.
* **Temporary Directories:** Redirect local cache folders to high-speed NVMe drives to speed up merging cycles.
* **Filename Formats:** Customize naming output strings with auto-tokens (`{title}`, `{codec}`, `{resolution}`).

---

## 🔎 Troubleshooting Guide

### 1. YouTube Decryption Fails (PoToken Challenge)
YouTube frequently rolls out client-side signature challenge updates.

> [!WARNING]
> You must have **Node.js** or **Deno** installed on your system to execute local PoToken decryption scripts.

1. Download and install [Node.js](https://nodejs.org/) or [Deno](https://deno.land/).
2. Restart 4444 Downloader. The diagnostic engine will automatically detect the runtime and resolve the token checks.

### 2. Download Rates Capped at 50-100 KB/s
This indicates platform throttling.
1. Open settings in 4444 Downloader.
2. Click **Purge Signatures Cache**.
3. Toggle the **Impersonate Chrome Client** profile.
4. Restart the download.

---

## 🔐 Zero ZIP Password Release Policy

Starting with the **v5.0.0+ Release Train**, we have retired legacy ZIP passwords.
* **v5.1.0** installers do not require any password (`None`).
* Legacy **v4.2.0** archives still require the password `4444` to extract.
