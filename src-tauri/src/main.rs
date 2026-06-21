#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::path::PathBuf;
use tauri::Manager;
use serde::{Deserialize, Serialize};

struct ActiveProcesses(std::sync::Mutex<std::collections::HashMap<String, tauri::api::process::CommandChild>>);

#[derive(Serialize)]
struct UpdateResponse {
    status: String,
    version: String,
    message: String,
}

#[derive(Serialize, Deserialize)]
struct WindowState {
    width: f64,
    height: f64,
    x: f64,
    y: f64,
}

#[derive(Deserialize)]
struct GitHubRelease {
    tag_name: String,
    assets: Vec<GitHubAsset>,
}

#[derive(Deserialize)]
struct GitHubAsset {
    name: String,
    browser_download_url: String,
}

fn get_exe_extension() -> &'static str {
    #[cfg(target_os = "windows")]
    {
        ".exe"
    }
    #[cfg(not(target_os = "windows"))]
    {
        ""
    }
}

fn set_executable_permission(_path: &std::path::Path) {
    #[cfg(any(target_os = "macos", target_os = "linux"))]
    {
        use std::os::unix::fs::PermissionsExt;
        if let Ok(metadata) = std::fs::metadata(_path) {
            let mut perms = metadata.permissions();
            perms.set_mode(0o755);
            let _ = std::fs::set_permissions(_path, perms);
        }
    }
}

fn get_engine_path(app_handle: &tauri::AppHandle) -> Option<PathBuf> {
    let app_data = app_handle.path_resolver().app_local_data_dir()?;
    let exe_name = format!("yt-dlp{}", get_exe_extension());
    let updated_path = app_data.join("engine").join(exe_name);
    if updated_path.exists() {
        Some(updated_path)
    } else {
        None
    }
}

#[tauri::command]
fn get_engine_version(app_handle: tauri::AppHandle) -> Result<String, String> {
    let cmd = if let Some(path) = get_engine_path(&app_handle) {
        tauri::api::process::Command::new(path.to_string_lossy())
    } else {
        tauri::api::process::Command::new_sidecar("bin/yt-dlp").map_err(|e| e.to_string())?
    };

    let output = cmd.args(["--version"]).output().map_err(|e| e.to_string())?;
    
    if output.status.success() {
        Ok(output.stdout.trim().to_string())
    } else {
        Err(output.stderr)
    }
}

#[tauri::command]
fn perform_engine_update(app_handle: tauri::AppHandle) -> Result<UpdateResponse, String> {
    let current_version = get_engine_version(app_handle.clone()).unwrap_or_else(|_| "Unknown".to_string());
    
    let client = reqwest::blocking::Client::builder()
        .user_agent("4444-Downloader")
        .build()
        .map_err(|e| e.to_string())?;
        
    let release_url = "https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest";
    let release: GitHubRelease = client
        .get(release_url)
        .send()
        .map_err(|e| format!("Failed to fetch release info: {}", e))?
        .json()
        .map_err(|e| format!("Failed to parse release info: {}", e))?;
        
    let latest_version = release.tag_name;
    
    if current_version == latest_version {
        return Ok(UpdateResponse {
            status: "up_to_date".into(),
            version: current_version,
            message: "You are already on the latest engine.".into(),
        });
    }
    
    let asset_name = if cfg!(target_os = "windows") {
        "yt-dlp.exe"
    } else if cfg!(target_os = "macos") {
        "yt-dlp_macos"
    } else {
        "yt-dlp"
    };
    let asset = release.assets.iter().find(|a| a.name == asset_name)
        .ok_or_else(|| format!("Could not find {} in latest release", asset_name))?;
        
    let response = client
        .get(&asset.browser_download_url)
        .send()
        .map_err(|e| format!("Failed to download engine: {}", e))?;
        
    let bytes = response
        .bytes()
        .map_err(|e| format!("Failed to read downloaded bytes: {}", e))?;
        
    let app_data = app_handle.path_resolver().app_local_data_dir()
        .ok_or_else(|| "Could not resolve app local data directory".to_string())?;
    
    let engine_dir = app_data.join("engine");
    if !engine_dir.exists() {
        std::fs::create_dir_all(&engine_dir).map_err(|e| format!("Failed to create engine directory: {}", e))?;
    }
    
    let ext = get_exe_extension();
    let engine_path = engine_dir.join(format!("yt-dlp{}", ext));
    let engine_new = engine_dir.join(format!("yt-dlp{}.new", ext));
    
    // Try to write directly first
    if let Err(_) = std::fs::write(&engine_path, &bytes) {
        // If locked, write to .new for startup migration
        std::fs::write(&engine_new, &bytes)
            .map_err(|e| format!("Failed to write update file: {}", e))?;
        set_executable_permission(&engine_new);
            
        return Ok(UpdateResponse {
            status: "restart_required".into(),
            version: latest_version.clone(),
            message: "Update downloaded. Restarting app to apply...".into(),
        });
    }
    set_executable_permission(&engine_path);
        
    Ok(UpdateResponse {
        status: "updated".into(),
        version: latest_version.clone(),
        message: format!("Successfully updated engine to version {}", latest_version),
    })
}

#[tauri::command]
fn save_history(app_handle: tauri::AppHandle, history: String) -> Result<(), String> {
    let app_data = app_handle.path_resolver().app_local_data_dir()
        .ok_or_else(|| "Could not resolve app local data directory".to_string())?;
    
    let history_path = app_data.join("history.json");
    std::fs::write(history_path, history).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_history(app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_data = app_handle.path_resolver().app_local_data_dir()
        .ok_or_else(|| "Could not resolve app local data directory".to_string())?;
    
    let history_path = app_data.join("history.json");
    if !history_path.exists() {
        return Ok("[]".to_string());
    }
    std::fs::read_to_string(history_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn run_engine(
    app_handle: tauri::AppHandle,
    window: tauri::Window,
    args: Vec<String>,
    download_id: Option<String>,
) -> Result<(), String> {
    println!("[run_engine] Executing with args: {:?}", args);
    let mut cmd = if let Some(path) = get_engine_path(&app_handle) {
        tauri::api::process::Command::new(path.to_string_lossy())
    } else {
        tauri::api::process::Command::new_sidecar("bin/yt-dlp").map_err(|e| e.to_string())?
    };

    #[cfg(target_os = "windows")]
    {
        let mut envs = std::collections::HashMap::new();
        for var in &["SystemRoot", "SystemDrive", "PATH", "TEMP", "TMP"] {
            if let Ok(val) = std::env::var(var) {
                envs.insert(var.to_string(), val);
            }
        }
        cmd = cmd.envs(envs);
    }

    let (mut rx, child) = cmd.args(args).spawn().map_err(|e| e.to_string())?;

    if let Some(ref id) = download_id {
        let state = app_handle.state::<ActiveProcesses>();
        if let Ok(mut map) = state.0.lock() {
            map.insert(id.clone(), child);
        };
    }

    let download_id_clone = download_id.clone();
    tauri::async_runtime::spawn(async move {
        let stdout_event = download_id_clone.as_ref().map(|id| format!("engine-stdout-{}", id)).unwrap_or_else(|| "engine-stdout".to_string());
        let stderr_event = download_id_clone.as_ref().map(|id| format!("engine-stderr-{}", id)).unwrap_or_else(|| "engine-stderr".to_string());
        let close_event = download_id_clone.as_ref().map(|id| format!("engine-close-{}", id)).unwrap_or_else(|| "engine-close".to_string());

        while let Some(event) = rx.recv().await {
            match event {
                tauri::api::process::CommandEvent::Stdout(line) => {
                    let _ = window.emit(&stdout_event, line);
                }
                tauri::api::process::CommandEvent::Stderr(line) => {
                    let _ = window.emit(&stderr_event, line);
                }
                tauri::api::process::CommandEvent::Terminated(payload) => {
                    let _ = window.emit(&close_event, payload.code);
                    break;
                }
                _ => {}
            }
        }

        if let Some(ref id) = download_id_clone {
            let state = app_handle.state::<ActiveProcesses>();
            if let Ok(mut map) = state.0.lock() {
                map.remove(id);
            };
        }
    });

    Ok(())
}

#[tauri::command]
fn kill_engine(app_handle: tauri::AppHandle, download_id: String) -> Result<(), String> {
    let state = app_handle.state::<ActiveProcesses>();
    if let Ok(mut map) = state.0.lock() {
        if let Some(child) = map.remove(&download_id) {
            let _ = child.kill();
        }
    }
    Ok(())
}

#[tauri::command]
fn fetch_url(url: String, headers: std::collections::HashMap<String, String>, proxy: Option<String>) -> Result<String, String> {
    // Parse proxy list (comma-separated support with auto-failover and sanitization)
    let mut proxy_list = Vec::new();
    if let Some(ref p_str) = proxy {
        for p in p_str.split(',') {
            let mut trimmed = p.trim().to_string();
            if !trimmed.is_empty() {
                if !trimmed.contains("://") {
                    trimmed = format!("http://{}", trimmed);
                }
                proxy_list.push(trimmed);
            }
        }
    }

    if proxy_list.is_empty() {
        let client = reqwest::blocking::Client::builder()
            .build()
            .map_err(|e| e.to_string())?;
        let mut req = client.get(&url);
        for (k, v) in headers {
            req = req.header(k, v);
        }
        let response = req.send().map_err(|e| e.to_string())?;
        let status = response.status();
        if status.is_success() {
            return response.text().map_err(|e| e.to_string());
        } else {
            return Err(format!("HTTP Error {}", status));
        }
    }

    let mut last_err = String::new();
    for p in proxy_list {
        println!("[fetch_url] Attempting request via proxy: {}", p);
        match reqwest::Proxy::all(&p) {
            Ok(reqwest_proxy) => {
                match reqwest::blocking::Client::builder().proxy(reqwest_proxy).build() {
                    Ok(client) => {
                        let mut req = client.get(&url);
                        for (k, v) in &headers {
                            req = req.header(k, v);
                        }
                        match req.send() {
                            Ok(response) => {
                                let status = response.status();
                                if status.is_success() {
                                    match response.text() {
                                        Ok(txt) => return Ok(txt),
                                        Err(e) => last_err = format!("Failed to read body from proxy {}: {}", p, e),
                                    }
                                } else {
                                    last_err = format!("HTTP Error {} from proxy {}", status, p);
                                }
                            }
                            Err(e) => last_err = format!("Proxy connection failed for {}: {}", p, e),
                        }
                    }
                    Err(e) => last_err = format!("Failed to build client for proxy {}: {}", p, e),
                }
            }
            Err(e) => last_err = format!("Invalid proxy format for {}: {}", p, e),
        }
    }
    Err(format!("All proxies failed. Last error: {}", last_err))
}

#[tauri::command]
fn restart_app(app_handle: tauri::AppHandle) {
    tauri::api::process::restart(&app_handle.env());
}

#[tauri::command]
fn get_ffmpeg_path(app_handle: tauri::AppHandle) -> Result<String, String> {
    let mut search_paths: Vec<PathBuf> = Vec::new();
    let ext = get_exe_extension();
    let file_name = format!("ffmpeg{}", ext);

    // 0. Prioritize local AppData bin folder (where copied/updated ffmpeg and ffprobe live)
    if let Some(app_data) = app_handle.path_resolver().app_local_data_dir() {
        search_paths.push(app_data.join("bin").join(&file_name));
    }

    // 1. Resolve relative to the current running executable (production installation folder)
    if let Ok(exe) = std::env::current_exe() {
        if let Some(parent) = exe.parent() {
            search_paths.push(parent.join("bin").join(&file_name));
            search_paths.push(parent.join(&file_name));
            search_paths.push(parent.join("resources").join("bin").join(&file_name));
            search_paths.push(parent.join("_up_").join("bin").join(&file_name));
            
            // Traverse up in case of target/debug or target/release dev structures
            let mut curr = parent.to_path_buf();
            for _ in 0..4 {
                if let Some(p) = curr.parent() {
                    search_paths.push(p.join("src-tauri").join("bin").join(&file_name));
                    search_paths.push(p.join("bin").join(&file_name));
                    curr = p.to_path_buf();
                } else {
                    break;
                }
            }
        }
    }

    // 2. Fallback to Tauri's resource resolver
    let resource_path = format!("bin/ffmpeg{}", ext);
    if let Some(res) = app_handle.path_resolver().resolve_resource(&resource_path) {
        search_paths.push(res);
    }

    // 3. Fallback to current working directory (development execution)
    if let Ok(cwd) = std::env::current_dir() {
        search_paths.push(cwd.join("src-tauri").join("bin").join(&file_name));
        search_paths.push(cwd.join("bin").join(&file_name));
    }

    for path in search_paths {
        if path.exists() {
            if let Some(parent) = path.parent() {
                let clean_path = parent.to_string_lossy().to_string()
                    .replace("\\\\?\\", "")
                    .replace("\\", "/");
                return Ok(clean_path);
            }
        }
    }

    Err(format!("CRITICAL ERROR: '{}' not found. Please place it inside the installation folder or 'src-tauri/bin/' folder!", file_name))
}

#[tauri::command]
fn get_mkvmerge_path(app_handle: tauri::AppHandle) -> Result<String, String> {
    let mut search_paths: Vec<PathBuf> = Vec::new();
    let ext = get_exe_extension();
    let file_name = format!("mkvmerge{}", ext);

    // 0. Prioritize local AppData bin folder
    if let Some(app_data) = app_handle.path_resolver().app_local_data_dir() {
        search_paths.push(app_data.join("bin").join(&file_name));
    }

    // 1. Relative to current executable
    if let Ok(exe) = std::env::current_exe() {
        if let Some(parent) = exe.parent() {
            search_paths.push(parent.join("bin").join(&file_name));
            search_paths.push(parent.join(&file_name));
            let mut curr = parent.to_path_buf();
            for _ in 0..4 {
                if let Some(p) = curr.parent() {
                    search_paths.push(p.join("src-tauri").join("bin").join(&file_name));
                    curr = p.to_path_buf();
                } else { break; }
            }
        }
    }

    // 2. Tauri resource resolver
    let resource_path = format!("bin/mkvmerge{}", ext);
    if let Some(res) = app_handle.path_resolver().resolve_resource(&resource_path) {
        search_paths.push(res);
    }

    // 3. Common install locations
    #[cfg(target_os = "windows")]
    {
        search_paths.push(PathBuf::from(r"C:\Program Files\MKVToolNix\mkvmerge.exe"));
        search_paths.push(PathBuf::from(r"C:\Program Files (x86)\MKVToolNix\mkvmerge.exe"));
    }

    // 4. CWD
    if let Ok(cwd) = std::env::current_dir() {
        search_paths.push(cwd.join("src-tauri").join("bin").join(&file_name));
    }

    for path in search_paths {
        if path.exists() {
            return Ok(path.to_string_lossy().replace("\\\\\\\\", "").replace("\\\\\\\\\\\\\\\\", "").replace("\\\\?\\\\" , "").to_string());
        }
    }

    Err(format!("'{}' not found. Bundle it in src-tauri/bin/ or install MKVToolNix.", file_name))
}

#[tauri::command]
fn get_aria2c_path(app_handle: tauri::AppHandle) -> Result<String, String> {
    let mut search_paths: Vec<PathBuf> = Vec::new();
    let ext = get_exe_extension();
    let file_name = format!("aria2c{}", ext);

    // 0. Prioritize local AppData bin folder
    if let Some(app_data) = app_handle.path_resolver().app_local_data_dir() {
        search_paths.push(app_data.join("bin").join(&file_name));
    }

    // 1. Relative to current executable
    if let Ok(exe) = std::env::current_exe() {
        if let Some(parent) = exe.parent() {
            search_paths.push(parent.join("bin").join(&file_name));
            search_paths.push(parent.join(&file_name));
            let mut curr = parent.to_path_buf();
            for _ in 0..4 {
                if let Some(p) = curr.parent() {
                    search_paths.push(p.join("src-tauri").join("bin").join(&file_name));
                    curr = p.to_path_buf();
                } else { break; }
            }
        }
    }

    // 2. Tauri resource resolver
    let resource_path = format!("bin/aria2c{}", ext);
    if let Some(res) = app_handle.path_resolver().resolve_resource(&resource_path) {
        search_paths.push(res);
    }

    // 3. CWD
    if let Ok(cwd) = std::env::current_dir() {
        search_paths.push(cwd.join("src-tauri").join("bin").join(&file_name));
        search_paths.push(cwd.join("bin").join(&file_name));
    }

    for path in search_paths {
        if path.exists() {
            let clean_path = path.to_string_lossy().to_string()
                .replace("\\\\?\\", "")
                .replace("\\", "/");
            return Ok(clean_path);
        }
    }

    Err(format!("'{}' not found. Bundle it in src-tauri/bin/.", file_name))
}

#[tauri::command]
async fn run_mkvmerge(
    mkvmerge_path: String,
    args: Vec<String>,
) -> Result<(i32, String, String), String> {
    let output = std::process::Command::new(&mkvmerge_path)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to run mkvmerge: {}", e))?;

    let code = output.status.code().unwrap_or(-1);
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    Ok((code, stdout, stderr))
}

#[tauri::command]
async fn query_engine(app_handle: tauri::AppHandle, args: Vec<String>) -> Result<(i32, String, String), String> {
    println!("[query_engine] Executing with args: {:?}", args);
    let mut cmd = if let Some(path) = get_engine_path(&app_handle) {
        tauri::api::process::Command::new(path.to_string_lossy())
    } else {
        tauri::api::process::Command::new_sidecar("bin/yt-dlp").map_err(|e| e.to_string())?
    };

    #[cfg(target_os = "windows")]
    {
        let mut envs = std::collections::HashMap::new();
        for var in &["SystemRoot", "SystemDrive", "PATH", "TEMP", "TMP"] {
            if let Ok(val) = std::env::var(var) {
                envs.insert(var.to_string(), val);
            }
        }
        cmd = cmd.envs(envs);
    }

    let output = cmd.args(args).output().map_err(|e| e.to_string())?;
    let code = output.status.code().unwrap_or(-1);
    
    Ok((code, output.stdout, output.stderr))
}

fn copy_resources_to_app_data(app_handle: &tauri::AppHandle) -> Result<(), String> {
    let app_data = app_handle.path_resolver().app_local_data_dir()
        .ok_or_else(|| "Could not resolve app local data directory".to_string())?;
    
    let bin_dir = app_data.join("bin");
    if !bin_dir.exists() {
        std::fs::create_dir_all(&bin_dir).map_err(|e| format!("Failed to create bin dir: {}", e))?;
    }

    let ext = get_exe_extension();
    let ffmpeg_dest = bin_dir.join(format!("ffmpeg{}", ext));
    let ffprobe_dest = bin_dir.join(format!("ffprobe{}", ext));

    // Copy ffmpeg if missing or empty
    if !ffmpeg_dest.exists() || ffmpeg_dest.metadata().map(|m| m.len()).unwrap_or(0) == 0 {
        let resource_name = format!("bin/ffmpeg{}", ext);
        if let Some(ffmpeg_src) = app_handle.path_resolver().resolve_resource(&resource_name) {
            if ffmpeg_src.exists() {
                if let Ok(_) = std::fs::copy(&ffmpeg_src, &ffmpeg_dest) {
                    set_executable_permission(&ffmpeg_dest);
                }
            }
        }
    }

    // Copy ffprobe if missing or empty
    if !ffprobe_dest.exists() || ffprobe_dest.metadata().map(|m| m.len()).unwrap_or(0) == 0 {
        let resource_name = format!("bin/ffprobe{}", ext);
        if let Some(ffprobe_src) = app_handle.path_resolver().resolve_resource(&resource_name) {
            if ffprobe_src.exists() {
                if let Ok(_) = std::fs::copy(&ffprobe_src, &ffprobe_dest) {
                    set_executable_permission(&ffprobe_dest);
                }
            }
        }
    }

    Ok(())
}

fn main() {
    let context = tauri::generate_context!();
    let active_processes = ActiveProcesses(std::sync::Mutex::new(std::collections::HashMap::new()));

    tauri::Builder::default()
        .manage(active_processes)
        .setup(|app| {
            // Copy bundled ffmpeg/ffprobe resources to local AppData if missing
            let _ = copy_resources_to_app_data(&app.handle());

            // Startup Migration: Check for .new engine in AppData
            if let Some(app_data) = app.path_resolver().app_local_data_dir() {
                let engine_dir = app_data.join("engine");
                let ext = get_exe_extension();
                let engine_path = engine_dir.join(format!("yt-dlp{}", ext));
                let engine_new = engine_dir.join(format!("yt-dlp{}.new", ext));
                if engine_new.exists() {
                    let _ = std::fs::remove_file(&engine_path);
                    if let Ok(_) = std::fs::rename(&engine_new, &engine_path) {
                        set_executable_permission(&engine_path);
                    }
                }

                // Load saved window state if exists
                let window = app.get_window("main").unwrap();
                let state_path = app_data.join("window_state.json");
                let mut restored_ok = false;
                if let Ok(content) = std::fs::read_to_string(&state_path) {
                    if let Ok(state) = serde_json::from_str::<WindowState>(&content) {
                        // Only restore if the saved size is at least the minimum
                        if state.width >= 760.0 && state.height >= 660.0 {
                            let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
                                width: state.width,
                                height: state.height,
                             }));
                            restored_ok = true;
                        }
                    }
                }
                if !restored_ok {
                    let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
                        width: 960.0,
                        height: 780.0,
                    }));
                }
                // Center the window on startup (do not maximize)
                let _ = window.center();
            }
            Ok(())
        })
        .on_window_event(|event| {
            if let tauri::WindowEvent::Resized(_) = event.event() {
                let window = event.window();
                if let (Ok(is_maximized), Ok(is_minimized)) = (window.is_maximized(), window.is_minimized()) {
                    if !is_maximized && !is_minimized {
                        if let Ok(size) = window.inner_size() {
                            if let Ok(scale_factor) = window.scale_factor() {
                                let logical_size = size.to_logical::<f64>(scale_factor);
                                
                                if let Some(app_data) = window.app_handle().path_resolver().app_local_data_dir() {
                                    let state = WindowState {
                                        width: logical_size.width,
                                        height: logical_size.height,
                                        x: 0.0,
                                        y: 0.0,
                                    };
                                    let state_path = app_data.join("window_state.json");
                                    let _ = std::fs::create_dir_all(&app_data);
                                    if let Ok(json) = serde_json::to_string(&state) {
                                        let _ = std::fs::write(state_path, json);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_ffmpeg_path,
            get_mkvmerge_path,
            get_aria2c_path,
            run_mkvmerge,
            get_engine_version, 
            perform_engine_update, 
            restart_app,
            run_engine,
            kill_engine,
            query_engine,
            save_history,
            load_history,
            fetch_url
        ])
        .run(context)
        .expect("error while running tauri application");
}