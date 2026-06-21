# 4444 Downloader — Pipeline Stabilization Walkthrough

## Root Cause: Silent Merge Failures

### The Bug
Every download was producing only split stream files (e.g. `download_*.f251.webm` + `download_*.f313.webm`) instead of a merged `.mkv`/`.mp4`. Exit code was `0`, so no error was thrown — the app just failed to find a merged file and reported "No completed downloaded/merged media files found."

### The Diagnosis
Diagnosed by running the exact yt-dlp CLI command with and without `--allow-unplayable-formats`:

**With the flag (broken — old behavior):**
```
download_diagtest.f140.m4a   (3.4 MB — audio stream, NOT merged)
download_diagtest.f313.webm  (358 MB — video stream, NOT merged)
```

**Without the flag (fixed — new behavior):**
```
[Merger] Merging formats into "download_finaltest.mkv"
Deleting original file download_finaltest.f140.m4a (pass -k to keep)
Deleting original file download_finaltest.f135.mp4 (pass -k to keep)
download_finaltest.mkv  (16.74 MB — merged ✅)
```

### The Fix
**File:** `src/App.tsx` — `buildArgs()` inside `handleDownload`

**Removed:** `--allow-unplayable-formats`

This flag instructs yt-dlp to skip all post-processors, including the FFmpeg merger. Since the app supplies `--ffmpeg-location` with a valid path (confirmed by `ffmpeg.exe` existing in `src-tauri/bin/`), removing this flag allows the merge post-processor to run normally.

---

## Other Fixes Applied This Session

| Area | Fix |
|------|-----|
| **FFmpeg Path** | `get_ffmpeg_path` returns containing **directory** (not the binary), so yt-dlp can locate `ffprobe.exe` alongside `ffmpeg.exe` |
| **Subprocess ENV** | `run_engine` and `query_engine` now propagate `SystemRoot`, `SystemDrive`, `PATH`, `TEMP`, `TMP` to child processes on Windows |
| **Async UI** | `query_engine` is `async` — prevents UI freeze during metadata fetch |
| **Accordion Jitter** | `display: flow-root` on `motion.div` + `overflow` toggled via `isAnimating` state; CSS `transition` restricted to `border-color,background-color,box-shadow` to avoid fighting Framer Motion |
| **Subtitle UX** | Replaced `CustomSelect` dropdown with `Switch` toggles (`Embed Subtitles`, `Save External File`). Removed invalid `--keep-subs` flag |
| **Error Detection** | `dependencyFailed` now parses both `stdout` and `stderr` for FFmpeg/FFprobe missing signatures |

---

## Verification

```
✅ CLI test (480p YouTube): download_finaltest.mkv (16.74 MB) — fully merged
✅ FFmpeg binary confirmed present: src-tauri/bin/ffmpeg.exe (211 MB)
✅ FFprobe binary confirmed present: src-tauri/bin/ffprobe.exe (123 MB)
✅ yt-dlp binary confirmed present: src-tauri/bin/yt-dlp-x86_64-pc-windows-msvc.exe
```
