# ============================================================================
#  4444-Downloader — Release Builder
#  Run:  .\build-release.ps1
#  What it does:
#    1. Commits & pushes your changes to GitHub
#    2. Watches the GitHub Actions build (Win + Mac) live in your terminal
#    3. Downloads the finished installers straight into .\releases\
#
#  Requirements:
#    - GitHub CLI (gh) installed: https://cli.github.com
#    - gh auth login  (run once, not needed again)
#    - git configured with remote "origin"
# ============================================================================

$ErrorActionPreference = "Stop"

# ── Colours ──────────────────────────────────────────────────────────────────
function Write-Step  { param($msg) Write-Host "`n▶  $msg" -ForegroundColor Cyan   }
function Write-Ok    { param($msg) Write-Host "✅ $msg"  -ForegroundColor Green  }
function Write-Warn  { param($msg) Write-Host "⚠️  $msg"  -ForegroundColor Yellow }
function Write-Fail  { param($msg) Write-Host "❌ $msg"  -ForegroundColor Red;  exit 1 }

# ── 0. Pre-flight: check gh CLI ──────────────────────────────────────────────
Write-Step "Checking GitHub CLI (gh)…"
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Fail "GitHub CLI not found. Install from https://cli.github.com then run: gh auth login"
}
gh auth status 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Fail "Not logged in to GitHub CLI. Run: gh auth login" }
Write-Ok "gh CLI ready"

# ── 1. Detect repo info ───────────────────────────────────────────────────────
Write-Step "Detecting repository…"
$REPO = gh repo view --json nameWithOwner -q ".nameWithOwner" 2>&1
if ($LASTEXITCODE -ne 0) { Write-Fail "Could not detect repo. Make sure 'origin' is set: git remote add origin <url>" }
$WORKFLOW = "build-release.yml"
Write-Ok "Repo: $REPO  |  Workflow: $WORKFLOW"

# ── 2. Git: stage, commit, push ───────────────────────────────────────────────
Write-Step "Staging and pushing changes…"

$status = git status --porcelain
if ($status) {
    $commitMsg = Read-Host "  Commit message (leave blank for auto)"
    if ([string]::IsNullOrWhiteSpace($commitMsg)) {
        $version = (Get-Content "package.json" | ConvertFrom-Json).version
        $shortDate = Get-Date -Format "dd-MMM-yyyy HH:mm"
        $commitMsg = "release: v$version — $shortDate"
    }
    git add -A
    git commit -m $commitMsg
    Write-Ok "Committed: $commitMsg"
} else {
    Write-Warn "No local changes — pushing as-is to trigger build"
}

git push origin HEAD
Write-Ok "Pushed to GitHub"

# ── 3. Wait a moment for Actions to pick up the push ─────────────────────────
Write-Step "Waiting for GitHub Actions to register the run…"
Start-Sleep -Seconds 8

# ── 4. Find the latest run for our workflow ───────────────────────────────────
Write-Step "Looking up the workflow run…"
$runId = $null
for ($i = 0; $i -lt 15; $i++) {
    $json = gh api "repos/$REPO/actions/workflows/$WORKFLOW/runs?per_page=1" 2>&1
    if ($LASTEXITCODE -eq 0) {
        $run = $json | ConvertFrom-Json | Select-Object -ExpandProperty workflow_runs | Select-Object -First 1
        if ($run -and $run.id) {
            $runId = $run.id
            break
        }
    }
    Start-Sleep -Seconds 5
}
if (-not $runId) { Write-Fail "Could not find a workflow run. Check GitHub Actions tab manually." }
Write-Ok "Run ID: $runId — watching live…"
Write-Host "  🔗 https://github.com/$REPO/actions/runs/$runId`n" -ForegroundColor DarkCyan

# ── 5. Watch the run until it completes ───────────────────────────────────────
Write-Step "Building (this usually takes 15–25 min)…"
gh run watch $runId --exit-status
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Build failed! Check: https://github.com/$REPO/actions/runs/$runId"
}
Write-Ok "Build completed successfully!"

# ── 6. Download artifacts ─────────────────────────────────────────────────────
Write-Step "Downloading installers to .\releases\…"

$version = (Get-Content "package.json" | ConvertFrom-Json).version
$outDir  = ".\releases\v$version"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

gh run download $runId --dir $outDir
Write-Ok "All artifacts downloaded → $outDir"

# ── 7. List what we got ───────────────────────────────────────────────────────
Write-Host "`n📦 Downloaded files:" -ForegroundColor White
Get-ChildItem $outDir -Recurse -File | ForEach-Object {
    $sizeKB = [math]::Round($_.Length / 1KB, 0)
    Write-Host "   $($_.Name)  ($sizeKB KB)" -ForegroundColor Gray
}

# ── 8. Open the releases folder ───────────────────────────────────────────────
Write-Host ""
$open = Read-Host "Open releases folder now? [Y/n]"
if ($open -ne "n" -and $open -ne "N") {
    Invoke-Item (Resolve-Path $outDir)
}

Write-Host "`n🎉 Done! Your installers are in: $outDir" -ForegroundColor Green
